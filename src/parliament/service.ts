import { getDb } from "../db/client.ts";
import { dispatchWebhookEvent } from "../services/webhook.ts";
import { TaskService } from "../services/task.ts";

export type Choice = "approve" | "reject" | "amend" | "abstain";
export const CHOICES: Choice[] = ["approve", "reject", "amend", "abstain"];
export type Majority = "simple" | "two_thirds";
export type ProposalStatus = "draft" | "open" | "revealed" | "closed";

const now = () => Math.floor(Date.now() / 1000);
const parse = <T>(s: unknown, fallback: T): T => {
  try { return s ? JSON.parse(String(s)) as T : fallback; } catch { return fallback; }
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function randomHex(bytes: number): string {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${randomHex(3)}`;
}

/**
 * Minimum-bar guard for the devil's advocate brief/reason. Checks form, not quality.
 * This is the Ariadne thread in code: the brief must carry a falsifiable claim and state
 * what evidence would change the advocate's mind, so the deliberation always has a way
 * back to reality. A brief without that thread fails the check.
 */
export function guardDevilsAdvocate(reason?: string, minLen = 200): string[] {
  const errs: string[] = [];
  if (!reason || reason.trim().length < minLen) errs.push(`reason must be >= ${minLen} chars`);
  const r = (reason ?? "").toLowerCase();
  if (!/(risk|خطر|مخاطر)/.test(r)) errs.push("name at least one concrete risk");
  if (!/(alternative|instead|بديل)/.test(r)) errs.push("propose a concrete alternative");
  if (!/(change my mind|would change|يغير رأيي|سأغير)/.test(r)) errs.push("state what would change your mind");
  return errs;
}

/**
 * Auditable draw. The seed is random per proposal and known only to the server until the reveal.
 * commitment = sha256(seed); draw = sha256(seed|proposalId|sortedNames) mod n.
 * After the reveal anyone holding the seed, the proposal id and the invited list can recompute
 * the pick and check sha256(seed) against the commitment, so the draw cannot be rigged after the fact.
 */
async function pickDevilsAdvocate(proposalId: string, eligible: string[]): Promise<{ name: string; seed: string; commitment: string }> {
  const names = [...eligible].sort();
  if (!names.length) throw new Error("no eligible devil's advocate");
  const seed = randomHex(16);
  const drawHash = await sha256(`${seed}|${proposalId}|${names.join(",")}`);
  const idx = Number(BigInt("0x" + drawHash.slice(0, 12)) % BigInt(names.length));
  return { name: names[idx], seed, commitment: await sha256(seed) };
}

export interface AgentRow { name: string; role: "agent" | "owner"; weight: number; tags: string[] }

export interface Attachment { type: "memory" | "r2" | "task" | "context" | "url"; ref: string; note?: string }

export interface CreateProposalParams {
  title: string;
  problem?: string;
  solution?: string;
  impact?: string;            // token/cost impact note (shown before voting)
  kind?: "vote" | "discussion" | "project_decision";
  namespace?: string;
  invited?: string[];         // empty = every registered agent at open time
  majority?: Majority;
  quorum?: number;
  deadline_hours?: number;    // default 48
  rounds?: 1 | 2;             // 1 = single sealed vote, 2 = sealed vote -> reveal+discuss -> sealed final vote
  devils_advocate?: boolean;
  attachments?: Attachment[];
  on_pass_task?: boolean;
  open?: boolean;
}

export interface Tally {
  yes: number; no: number; amend: number; abstain: number;
  cast: number; invited: number; quorum_met: boolean;
  threshold: number; result: "passed" | "rejected" | "needs_amendment" | "no_quorum";
  by_agent: Record<string, { choice: Choice; round: number; weight: number; reason?: string | null }>;
}

export class ParliamentService {
  // ---------- identity ----------

  /** Registers a voter and returns its secret token ONCE. Name is first-come, never re-registered. */
  static async registerAgent(
    userId: string,
    p: { name: string; role?: "agent" | "owner"; weight?: number; tags?: string[]; owner_key?: string },
  ): Promise<{ name: string; role: string; token: string }> {
    const name = p.name?.trim().toLowerCase();
    if (!name || !/^[a-z0-9][a-z0-9_.-]{1,39}$/.test(name)) {
      throw new Error("Invalid agent name (2-40 chars: a-z 0-9 _ . -)");
    }
    const role = p.role === "owner" ? "owner" : "agent";
    if (role === "owner") {
      const key = Deno.env.get("PARLIAMENT_OWNER_KEY");
      if (!key) throw new Error("Owner role disabled: set PARLIAMENT_OWNER_KEY on the server");
      if (p.owner_key !== key) throw new Error("Invalid owner_key");
    }
    const db = getDb();
    const exists = await db.execute({
      sql: "SELECT 1 FROM parliament_agents WHERE user_id = ? AND name = ?",
      args: [userId, name],
    });
    if (exists.rows.length) throw new Error(`Agent '${name}' is already registered (token cannot be re-issued)`);
    const token = `pz_${randomHex(24)}`;
    await db.execute({
      sql: `INSERT INTO parliament_agents (id, user_id, name, role, weight, tags, token_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [newId("pa"), userId, name, role, p.weight ?? 1, JSON.stringify(p.tags ?? []), await sha256(token), now()],
    });
    return { name, role, token };
  }

  static async auth(userId: string, name: string, token: string): Promise<AgentRow> {
    if (!name || !token) throw new Error("agent and token are required");
    const res = await getDb().execute({
      sql: "SELECT * FROM parliament_agents WHERE user_id = ? AND name = ?",
      args: [userId, name.trim().toLowerCase()],
    });
    const row = res.rows[0];
    if (!row || row.token_hash !== await sha256(token)) throw new Error("Authentication failed");
    return {
      name: String(row.name), role: String(row.role) as "agent" | "owner",
      weight: Number(row.weight), tags: parse<string[]>(row.tags, []),
    };
  }

  static async listAgents(userId: string): Promise<AgentRow[]> {
    const res = await getDb().execute({
      sql: "SELECT name, role, weight, tags FROM parliament_agents WHERE user_id = ? ORDER BY name",
      args: [userId],
    });
    return res.rows.map((r) => ({
      name: String(r.name), role: String(r.role) as "agent" | "owner",
      weight: Number(r.weight), tags: parse<string[]>(r.tags, []),
    }));
  }

  // ---------- proposals ----------

  static async createProposal(userId: string, actor: AgentRow, p: CreateProposalParams) {
    if (!p.title?.trim()) throw new Error("title is required");
    const id = newId("prop");
    const t = now();
    const rounds = p.rounds === 1 ? 1 : 2;
    const deadline = t + Math.round((p.deadline_hours ?? 48) * 3600);
    await getDb().execute({
      sql: `INSERT INTO parliament_proposals
        (id, user_id, namespace, title, problem, solution, impact, kind, status, round, rounds, invited,
         majority, quorum, deadline, attachments, on_pass_task, created_by, created_at, updated_at, devils_advocate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, userId, p.namespace ?? "default", p.title.trim(), p.problem ?? null, p.solution ?? null,
        p.impact ?? null, p.kind ?? "vote", rounds, JSON.stringify((p.invited ?? []).map((s) => s.toLowerCase())),
        p.majority === "two_thirds" ? "two_thirds" : "simple", Math.max(1, p.quorum ?? 1), deadline,
        JSON.stringify(p.attachments ?? []), p.on_pass_task ? 1 : 0, actor.name, t, t,
        p.devils_advocate ? "pending" : null,
      ],
    });
    if (p.open) return await this.openProposal(userId, actor, id);
    return { id, status: "draft" };
  }

  private static async load(userId: string, id: string) {
    const res = await getDb().execute({
      sql: "SELECT * FROM parliament_proposals WHERE user_id = ? AND id = ?",
      args: [userId, id],
    });
    if (!res.rows.length) throw new Error(`Proposal not found: ${id}`);
    return res.rows[0];
  }

  /** Opens voting. Resolves the invited list and picks the devil's advocate. */
  static async openProposal(userId: string, actor: AgentRow, id: string) {
    const p = await this.load(userId, id);
    if (p.status !== "draft") throw new Error(`Proposal is '${p.status}', only drafts can be opened`);
    if (p.created_by !== actor.name && actor.role !== "owner") throw new Error("Only the creator or owner can open it");

    let invited = parse<string[]>(p.invited, []);
    if (!invited.length) invited = (await this.listAgents(userId)).map((a) => a.name);
    if (invited.length < 1) throw new Error("No registered agents to invite");

    let da: string | null = null;
    let daCommitment: string | null = null;
    let daSeed: string | null = null;
    if (p.devils_advocate) {
      const pool = invited.filter((n) => n !== p.created_by);
      if (pool.length) {
        const pick = await pickDevilsAdvocate(id, pool);
        da = pick.name; daSeed = pick.seed; daCommitment = pick.commitment;
      }
      // No eligible advocate (only the creator was invited): no devil's advocate.
      // The creator is never picked as the advocate.
    }
    const t = now();
    await getDb().execute({
      sql: `UPDATE parliament_proposals SET status='open', round=1, invited=?, devils_advocate=?, da_commitment=?, da_seed=?, opened_at=?, updated_at=? WHERE id=?`,
      args: [JSON.stringify(invited), da, daCommitment, daSeed, t, t, id],
    });
    await dispatchWebhookEvent({
      userId, event: "parliament.proposal_opened", namespace: String(p.namespace),
      payload: { proposal_id: id, title: p.title, invited, deadline: p.deadline, devils_advocate: da },
    });
    return { id, status: "open", invited, devils_advocate: da, da_commitment: daCommitment, deadline: p.deadline };
  }

  // ---------- ballots (sealed) ----------

  static async castVote(userId: string, actor: AgentRow, id: string, choice: Choice, reason?: string) {
    await this.tick(userId);
    if (!CHOICES.includes(choice)) throw new Error(`choice must be one of ${CHOICES.join(", ")}`);
    const p = await this.load(userId, id);
    if (p.status !== "open" && p.status !== "revealed") throw new Error(`Voting is not open (status: ${p.status})`);
    const invited = parse<string[]>(p.invited, []);
    if (!invited.includes(actor.name)) throw new Error("You are not invited to vote on this proposal");
    const round = Number(p.round);
    if (round === 1 && p.devils_advocate === actor.name) {
      if (choice === "approve" || choice === "abstain") {
        throw new Error("You are this proposal's devil's advocate: in round 1 you must vote 'reject' or 'amend' and argue the opposing case");
      }
      const errs = guardDevilsAdvocate(reason);
      if (errs.length) throw new Error("Devil's advocate reason failed the guard: " + errs.join("; "));
    }
    const t = now();
    await getDb().execute({
      sql: `INSERT INTO parliament_ballots (id, proposal_id, round, agent, choice, reason, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(proposal_id, round, agent) DO UPDATE SET choice=excluded.choice, reason=excluded.reason, updated_at=excluded.updated_at`,
      args: [newId("bal"), id, round, actor.name, choice, reason ?? null, t, t],
    });
    // Webhook payload deliberately carries NO choice (sealed ballot).
    await dispatchWebhookEvent({
      userId, event: "parliament.vote_cast", namespace: String(p.namespace),
      payload: { proposal_id: id, agent: actor.name, round },
    });
    const progress = await this.progress(id, invited, round);
    let advanced: string | null = null;
    if (progress.missing.length === 0) advanced = await this.advance(userId, id, "all_voted");
    return { proposal_id: id, round, recorded: true, voted: progress.voted.length, expected: invited.length, auto_advanced: advanced };
  }

  /**
   * The devil's advocate submits the opposition brief. It is stored on the proposal and shown
   * ANONYMOUSLY in getProposal while voting is open, so the other voters read the objection
   * before they vote. The brief carries no agent name until the reveal.
   */
  static async submitDevilsBrief(userId: string, actor: AgentRow, id: string, text: string) {
    const p = await this.load(userId, id);
    if (p.status !== "open" || Number(p.round) !== 1) throw new Error("Briefs are submitted in round 1 only, while voting is open");
    if (p.devils_advocate !== actor.name) throw new Error("Only this proposal's devil's advocate can submit the brief");
    const errs = guardDevilsAdvocate(text);
    if (errs.length) throw new Error("Brief failed the guard: " + errs.join("; "));
    const t = now();
    await getDb().execute({
      sql: "UPDATE parliament_proposals SET da_brief=?, da_brief_at=?, updated_at=? WHERE id=?",
      args: [text.trim(), t, t, id],
    });
    return { proposal_id: id, brief_submitted: true };
  }

  private static async progress(id: string, invited: string[], round: number) {
    const res = await getDb().execute({
      sql: "SELECT agent FROM parliament_ballots WHERE proposal_id = ? AND round = ?",
      args: [id, round],
    });
    const voted = res.rows.map((r) => String(r.agent));
    return { voted, missing: invited.filter((n) => !voted.includes(n)) };
  }

  /** open -> revealed (if rounds=2) or closed; revealed -> closed. */
  private static async advance(userId: string, id: string, why: string): Promise<string> {
    const p = await this.load(userId, id);
    if (p.status === "open" && Number(p.rounds) === 2) {
      await this.reveal(userId, id, why);
      return "revealed";
    }
    if (p.status === "open" || p.status === "revealed") {
      await this.close(userId, id, { reason: why });
      return "closed";
    }
    return String(p.status);
  }

  static async reveal(userId: string, id: string, why = "manual") {
    const p = await this.load(userId, id);
    if (p.status !== "open") throw new Error(`Only open proposals can be revealed (status: ${p.status})`);
    const invited = parse<string[]>(p.invited, []);
    const { missing } = await this.progress(id, invited, 1);
    const t = now();
    // Non-voters are recorded as explicit abstentions (not silence).
    for (const m of missing) {
      await getDb().execute({
        sql: `INSERT OR IGNORE INTO parliament_ballots (id, proposal_id, round, agent, choice, reason, created_at, updated_at)
              VALUES (?, ?, 1, ?, 'abstain', 'no vote before reveal', ?, ?)`,
        args: [newId("bal"), id, m, t, t],
      });
    }
    // Round 2 gets a fresh deadline of the same length as the original window.
    // The status transition is guarded: only one caller can move an open proposal to revealed.
    const window = Math.max(3600, Number(p.deadline) - Number(p.opened_at ?? t));
    const upd = await getDb().execute({
      sql: "UPDATE parliament_proposals SET status='revealed', round=2, deadline=?, updated_at=? WHERE id=? AND status='open'",
      args: [t + window, t, id],
    });
    if (!upd.rowsAffected) throw new Error("Proposal was already revealed or closed");
    await dispatchWebhookEvent({
      userId, event: "parliament.revealed", namespace: String(p.namespace),
      payload: { proposal_id: id, why, abstained_by_silence: missing },
    });
    return { id, status: "revealed", round: 2, abstained_by_silence: missing, devils_advocate: p.devils_advocate, da_seed: p.da_seed };
  }

  // ---------- arguments ----------

  static async addArgument(
    userId: string, actor: AgentRow, id: string,
    a: { text: string; stance?: "for" | "against" | "amend" | "comment"; reply_to?: string },
  ) {
    const p = await this.load(userId, id);
    if (p.status !== "revealed") throw new Error("Arguments open only after the reveal (keeps round 1 independent)");
    if (!parse<string[]>(p.invited, []).includes(actor.name)) throw new Error("You are not invited to this proposal");
    if (!a.text?.trim()) throw new Error("text is required");
    const aid = newId("arg");
    await getDb().execute({
      sql: `INSERT INTO parliament_arguments (id, proposal_id, agent, stance, text, reply_to, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [aid, id, actor.name, a.stance ?? "comment", a.text.trim(), a.reply_to ?? null, now()],
    });
    return { id: aid, proposal_id: id };
  }

  // ---------- closing + tally ----------

  static computeTally(
    ballots: Array<{ agent: string; round: number; choice: Choice; reason: string | null }>,
    invited: string[], weights: Record<string, number>, majority: Majority, quorum: number,
  ): Tally {
    // Each invited agent counts once: latest round wins; missing = abstain.
    const latest: Record<string, { choice: Choice; round: number; reason: string | null }> = {};
    for (const b of ballots) {
      if (!latest[b.agent] || b.round > latest[b.agent].round) latest[b.agent] = b;
    }
    let yes = 0, no = 0, amend = 0, abstain = 0, cast = 0;
    const by_agent: Tally["by_agent"] = {};
    for (const name of invited) {
      const w = weights[name] ?? 1;
      const b = latest[name] ?? { choice: "abstain" as Choice, round: 0, reason: "no ballot" };
      by_agent[name] = { choice: b.choice, round: b.round, weight: w, reason: b.reason };
      if (b.choice === "approve") { yes += w; cast++; }
      else if (b.choice === "reject") { no += w; cast++; }
      else if (b.choice === "amend") { amend += w; cast++; }
      else abstain += w;
    }
    const threshold = majority === "two_thirds" ? 2 / 3 : 0.5;
    const decided = yes + no + amend; // abstentions don't count toward the denominator
    const quorum_met = cast >= quorum;
    let result: Tally["result"];
    if (!quorum_met || decided === 0) result = "no_quorum";
    else if (amend > yes && amend > no) result = "needs_amendment";
    else if (yes / decided > threshold || (majority === "two_thirds" && yes / decided >= threshold)) result = "passed";
    else result = "rejected";
    return { yes, no, amend, abstain, cast, invited: invited.length, quorum_met, threshold, result, by_agent };
  }

  /**
   * Closes a proposal. `override` (owner only) replaces the computed result but never hides it:
   * both the computed tally and the override reason are stored in the outcome.
   */
  static async close(
    userId: string, id: string,
    opts: { reason?: string; actor?: AgentRow; override?: { decision: "passed" | "rejected"; reason: string } } = {},
  ) {
    const p = await this.load(userId, id);
    if (p.status === "closed") throw new Error("Already closed");
    if (p.status === "draft") throw new Error("Draft proposals must be opened first");
    if (opts.actor && opts.actor.role !== "owner" && p.created_by !== opts.actor.name) {
      throw new Error("Only the creator or owner can close a proposal");
    }
    if (opts.override) {
      if (opts.actor?.role !== "owner") throw new Error("Only the owner can override");
      if (!opts.override.reason?.trim()) throw new Error("override.reason is required (it is shown in the result)");
    }
    const invited = parse<string[]>(p.invited, []);
    const agents = await this.listAgents(userId);
    const weights = Object.fromEntries(agents.map((a) => [a.name, a.weight]));
    const ballotsRes = await getDb().execute({
      sql: "SELECT agent, round, choice, reason FROM parliament_ballots WHERE proposal_id = ?",
      args: [id],
    });
    const tally = this.computeTally(
      ballotsRes.rows.map((r) => ({ agent: String(r.agent), round: Number(r.round), choice: String(r.choice) as Choice, reason: r.reason as string | null })),
      invited, weights, String(p.majority) as Majority, Number(p.quorum),
    );
    const final = opts.override ? opts.override.decision : tally.result;
    const daName = p.devils_advocate ? String(p.devils_advocate) : null;
    const daBallots = ballotsRes.rows.filter((r) => daName && String(r.agent) === daName);
    const daR1 = daBallots.find((r) => Number(r.round) === 1);
    const daR2 = daBallots.find((r) => Number(r.round) === 2);
    const outcome = {
      final, computed: tally.result, tally,
      override: opts.override ? { by: opts.actor!.name, decision: opts.override.decision, reason: opts.override.reason } : null,
      closed_reason: opts.reason ?? "manual",
      da: daName ? {
        agent: daName,
        seed: p.da_seed ?? null,
        commitment: p.da_commitment ?? null,
        brief_submitted: !!p.da_brief,
        changed_vote: daR1 && daR2 ? String(daR1.choice) !== String(daR2.choice) : null,
      } : null,
    };
    const t = now();
    // Guarded transition: only one closer wins; the loser throws before any side effect
    // (execution task, webhook), so a proposal can never be closed twice.
    const upd = await getDb().execute({
      sql: "UPDATE parliament_proposals SET status='closed', outcome=?, closed_at=?, updated_at=? WHERE id=? AND status IN ('open','revealed')",
      args: [JSON.stringify(outcome), t, t, id],
    });
    if (!upd.rowsAffected) throw new Error("Proposal was already closed");

    let task_id: string | null = null;
    if (final === "passed" && Number(p.on_pass_task) === 1) {
      const task = await TaskService.create({
        userId, namespace: String(p.namespace), title: `Execute: ${p.title}`,
        description: `Approved by parliament proposal ${id}.\n\n${p.solution ?? ""}`,
        priority: "high", metadata: { parliament_proposal: id },
      });
      task_id = task.id;
      (outcome as any).task_id = task_id;
      await getDb().execute({
        sql: "UPDATE parliament_proposals SET outcome=? WHERE id=?",
        args: [JSON.stringify(outcome), id],
      });
    }
    await dispatchWebhookEvent({
      userId, event: "parliament.closed", namespace: String(p.namespace),
      payload: { proposal_id: id, final, computed: tally.result, overridden: !!opts.override, task_id },
    });
    return { id, status: "closed", ...outcome, task_id };
  }

  // ---------- reading (sealed-aware) ----------

  /** Ballots are visible only after reveal (round 1) / close (all rounds). Open rounds show who voted, never what. */
  static async getProposal(userId: string, id: string) {
    await this.tick(userId);
    const p = await this.load(userId, id);
    const status = String(p.status) as ProposalStatus;
    const invited = parse<string[]>(p.invited, []);
    const ballotsRes = await getDb().execute({
      sql: "SELECT agent, round, choice, reason FROM parliament_ballots WHERE proposal_id = ? ORDER BY round, agent",
      args: [id],
    });
    const curRound = Number(p.round);
    const visible = ballotsRes.rows.filter((b) =>
      status === "closed" || (status === "revealed" && Number(b.round) < curRound)
    ).map((b) => ({ agent: b.agent, round: b.round, choice: b.choice, reason: b.reason }));
    const waiting = (status === "open" || status === "revealed")
      ? invited.filter((n) => !ballotsRes.rows.some((b) => b.agent === n && Number(b.round) === curRound))
      : [];
    const whoVoted = (status === "open" || status === "revealed")
      ? invited.filter((n) => !waiting.includes(n))
      : invited.filter((n) => ballotsRes.rows.some((b) => b.agent === n));
    let args: unknown[] = [];
    if (status === "revealed" || status === "closed") {
      args = (await getDb().execute({
        sql: "SELECT id, agent, stance, text, reply_to, created_at FROM parliament_arguments WHERE proposal_id = ? ORDER BY created_at",
        args: [id],
      })).rows;
    }
    const outcomeData = parse<any>(p.outcome, null);
    if (outcomeData && !outcomeData.task_id && Number(p.on_pass_task) === 1) {
      try {
        const taskRes = await getDb().execute({
          sql: "SELECT id FROM tasks WHERE user_id = ? AND metadata LIKE ?",
          args: [userId, `%"parliament_proposal":"${id}"%`],
        });
        if (taskRes.rows.length) {
          outcomeData.task_id = String(taskRes.rows[0].id);
        }
      } catch (_e) { /* ignore */ }
    }
    return {
      id, title: p.title, namespace: p.namespace, kind: p.kind, status, round: curRound, rounds: p.rounds,
      problem: p.problem, solution: p.solution, impact: p.impact,
      majority: p.majority, quorum: p.quorum, deadline: p.deadline,
      invited, devils_advocate: status === "open" ? "hidden-until-reveal" : p.devils_advocate,
      da_commitment: p.da_commitment ?? null,
      da_seed: (status === "revealed" || status === "closed") ? (p.da_seed ?? null) : null,
      opposition_brief: p.da_brief ?? null,
      brief_status: !p.devils_advocate ? "none" : (p.da_brief ? "submitted" : "pending"),
      attachments: parse(p.attachments, []), created_by: p.created_by,
      on_pass_task: Boolean(p.on_pass_task),
      created_at: p.created_at ? Number(p.created_at) : null,
      opened_at: p.opened_at ? Number(p.opened_at) : null,
      closed_at: p.closed_at ? Number(p.closed_at) : null,
      waiting_for: waiting, who_voted: whoVoted, ballots: visible, arguments: args,
      outcome: outcomeData,
    };
  }

  static async listProposals(userId: string, f: { status?: string; namespace?: string; limit?: number } = {}) {
    await this.tick(userId);
    const where = ["user_id = ?"]; const args: (string | number)[] = [userId];
    if (f.status) { where.push("status = ?"); args.push(f.status); }
    if (f.namespace) { where.push("namespace = ?"); args.push(f.namespace); }
    const res = await getDb().execute({
      sql: `SELECT id, title, namespace, kind, status, round, rounds, majority, quorum, invited, deadline, created_by, created_at, outcome FROM parliament_proposals
            WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT ?`,
      args: [...args, f.limit ?? 50],
    });
    const proposals = [];
    for (const r of res.rows) {
      const invited = parse<string[]>(r.invited, []);
      const curRound = Number(r.round ?? 1);
      const bRes = await getDb().execute({
        sql: "SELECT count(*) as c FROM parliament_ballots WHERE proposal_id = ? AND round = ?",
        args: [String(r.id), curRound],
      });
      const castCount = Number(bRes.rows[0]?.c ?? 0);
      proposals.push({
        id: String(r.id),
        title: String(r.title),
        namespace: String(r.namespace),
        kind: String(r.kind),
        status: String(r.status),
        round: curRound,
        rounds: Number(r.rounds ?? 2),
        majority: String(r.majority),
        quorum: Number(r.quorum),
        deadline: r.deadline ? Number(r.deadline) : null,
        created_by: String(r.created_by),
        created_at: r.created_at ? Number(r.created_at) : null,
        invited_count: invited.length,
        cast_count: castCount,
        quorum_met: castCount >= Number(r.quorum),
        outcome: parse(r.outcome, null),
      });
    }
    return proposals;
  }

  /**
   * Returns an AgentRow for the user (dashboard owner), creating an owner agent record if not present.
   */
  static async getOrCreateOwnerActor(userId: string, username: string): Promise<AgentRow> {
    const cleanName = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
    const name = cleanName.length >= 2 ? cleanName.slice(0, 40) : `owner_${cleanName}`;
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT name, role, weight, tags FROM parliament_agents WHERE user_id = ? AND name = ?",
      args: [userId, name],
    });
    if (res.rows.length) {
      const r = res.rows[0];
      return {
        name: String(r.name),
        role: String(r.role) as "agent" | "owner",
        weight: Number(r.weight),
        tags: parse<string[]>(r.tags, []),
      };
    }
    const dummyToken = `pz_${randomHex(24)}`;
    await db.execute({
      sql: `INSERT INTO parliament_agents (id, user_id, name, role, weight, tags, token_hash, created_at)
            VALUES (?, ?, ?, 'owner', 1, '["owner","admin"]', ?, ?)`,
      args: [newId("pa"), userId, name, await sha256(dummyToken), now()],
    });
    return { name, role: "owner", weight: 1, tags: ["owner", "admin"] };
  }

  // ---------- internal coordinator (no external watcher agent needed) ----------

  /** Lazy deadline enforcement: runs on every parliament call; can also be wired to src/services/cron.ts. */
  static async tick(userId?: string): Promise<number> {
    const t = now();
    const res = await getDb().execute({
      sql: `SELECT id, user_id FROM parliament_proposals
            WHERE status IN ('open','revealed') AND deadline IS NOT NULL AND deadline < ? ${userId ? "AND user_id = ?" : ""}`,
      args: userId ? [t, userId] : [t],
    });
    let n = 0;
    for (const r of res.rows) {
      try { await this.advance(String(r.user_id), String(r.id), "deadline"); n++; } catch (_e) { /* ignore */ }
    }
    return n;
  }
}
