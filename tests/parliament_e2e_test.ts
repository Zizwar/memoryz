import { initDb } from "../src/db/schema.ts";
import { MCP_TOOLS } from "../src/mcp/server.ts";
import { executeParliamentTool as x, PARLIAMENT_TOOLS } from "../src/parliament/tools.ts";
import { ParliamentService as P } from "../src/parliament/service.ts";
const U = "u_test_" + Date.now();
const ok = (c: boolean, m: string) => { console.log(c ? "PASS" : "FAIL", m); if (!c) Deno.exitCode = 1; };
const rej = async (f: () => Promise<unknown>, m: string) => { try { await f(); ok(false, m); } catch (e) { ok(true, m + " -> " + (e as Error).message.slice(0, 60)); } };
const shaHex = async (s: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
// A brief/reason that passes the guard: names a risk, an alternative, and what would change the mind.
const BRIEF = "الخطر الأساسي في هذا المقترح هو أنه يمنح صلاحيات واسعة بلا رقابة واضحة، والبديل الملموس هو تقسيم القرار إلى خطوات صغيرة قابلة للتراجع مع مراجعة بعد كل خطوة. سأغير رأيي إذا ظهر دليل واضح على وجود رقابة فعالة وحدود صارمة للصلاحيات قبل التنفيذ.";
await initDb();
ok(PARLIAMENT_TOOLS.length === 11 && MCP_TOOLS.length > 20, "tools registered");
Deno.env.set("PARLIAMENT_OWNER_KEY", "k");
const T: Record<string, string> = {};
for (const n of ["miz", "gemini", "claude"]) T[n] = ((await x(U, "parliament_register", { name: n })) as any).token;
T.zizwar = ((await x(U, "parliament_register", { name: "zizwar", role: "owner", owner_key: "k" })) as any).token;
await rej(() => x(U, "parliament_register", { name: "miz" }), "re-register blocked");
await rej(() => x(U, "parliament_register", { name: "evil", role: "owner", owner_key: "bad" }), "bad owner key blocked");
// No eligible advocate: only the creator invited, the creator is never the advocate.
const c0: any = await x(U, "proposal_create", { agent: "claude", token: T.claude, title: "T0", open: true, devils_advocate: true, invited: ["claude"] });
ok(c0.devils_advocate === null, "no eligible advocate, creator never picked");
const c: any = await x(U, "proposal_create", { agent: "claude", token: T.claude, title: "T", open: true, devils_advocate: true, quorum: 2, on_pass_task: true });
const id = c.id; ok(c.status === "open" && c.invited.length === 4, "open, 4 invited");
await rej(() => x(U, "vote_cast", { agent: "miz", token: "wrong", id, choice: "approve" }), "wrong token blocked");
const da = c.devils_advocate;
const nonDa = (["miz", "gemini", "zizwar"] as string[]).find((n) => n !== da)!;
let g: any = await x(U, "proposal_get", { id });
ok(g.da_commitment && g.da_commitment.length === 64 && g.da_seed === null && g.brief_status === "pending" && g.opposition_brief === null, "commitment public, seed hidden, brief pending");
await rej(() => x(U, "da_brief_submit", { agent: nonDa, token: T[nonDa], id, text: BRIEF }), "only the advocate can brief");
await rej(() => x(U, "da_brief_submit", { agent: da, token: T[da], id, text: "too short" }), "short brief rejected");
await x(U, "da_brief_submit", { agent: da, token: T[da], id, text: BRIEF });
g = await x(U, "proposal_get", { id });
ok(g.opposition_brief === BRIEF && g.brief_status === "submitted", "brief visible anonymously before voting");
await rej(() => x(U, "vote_cast", { agent: da, token: T[da], id, choice: "approve" }), "devil's advocate can't approve");
await rej(() => x(U, "vote_cast", { agent: da, token: T[da], id, choice: "reject", reason: "no" }), "short DA reason rejected");
await x(U, "vote_cast", { agent: da, token: T[da], id, choice: "reject", reason: BRIEF });
const allInvited = ["miz", "gemini", "claude", "zizwar"];
const holdout = allInvited.find((n) => n !== da)!;
for (const n of allInvited.filter((n) => n !== da && n !== holdout)) {
  await x(U, "vote_cast", { agent: n, token: T[n], id, choice: "approve" });
}
g = await x(U, "proposal_get", { id });
ok(g.ballots.length === 0 && g.waiting_for.length === 1 && g.devils_advocate === "hidden-until-reveal", "sealed: no ballots visible, 1 waiting");
await rej(() => x(U, "argument_add", { agent: "miz", token: T.miz, id, text: "x" }), "no arguments before reveal");
await x(U, "vote_cast", { agent: holdout, token: T[holdout], id, choice: "approve" });
g = await x(U, "proposal_get", { id });
ok(g.status === "revealed" && g.round === 2 && g.ballots.length === 4, "auto-reveal when all voted");
ok(g.da_seed && (await shaHex(g.da_seed)) === g.da_commitment, "seed matches commitment");
// Verify the draw: recompute sha256(seed|id|sorted eligible) and the index.
{
  const eligible = ["miz", "gemini", "claude", "zizwar"].filter((n) => n !== "claude").sort();
  const drawHash = await shaHex(`${g.da_seed}|${id}|${eligible.join(",")}`);
  const idx = Number(BigInt("0x" + drawHash.slice(0, 12)) % BigInt(eligible.length));
  ok(eligible[idx] === da, "draw is reproducible from the seed");
}
await rej(() => x(U, "proposal_reveal", { agent: "claude", token: T.claude, id }), "double reveal blocked");
await x(U, "argument_add", { agent: "miz", token: T.miz, id, text: "point", stance: "for" });
await x(U, "vote_cast", { agent: da, token: T[da], id, choice: "approve", reason: "persuaded" });
g = await x(U, "proposal_get", { id });
ok(g.ballots.every((b: any) => b.round === 1), "round 2 ballots still sealed");
await rej(() => x(U, "proposal_close", { agent: "miz", token: T.miz, id }), "non-owner/creator can't close... (miz)");
const r: any = await x(U, "proposal_close", { agent: "claude", token: T.claude, id, override: undefined });
ok(r.final === "passed" && r.task_id, "closed passed + task created: " + JSON.stringify(r.tally.yes + "/" + r.tally.no));
ok(r.da && r.da.agent === da && r.da.brief_submitted === true && r.da.changed_vote === true, "outcome records DA brief + changed vote");
await rej(() => x(U, "proposal_close", { agent: "claude", token: T.claude, id }), "double close blocked");
// override + abstain-by-silence + two_thirds
const c2: any = await x(U, "proposal_create", { agent: "claude", token: T.claude, title: "T2", open: true, rounds: 1, majority: "two_thirds", invited: ["miz", "gemini", "claude"] });
await x(U, "vote_cast", { agent: "miz", token: T.miz, id: c2.id, choice: "approve" });
await x(U, "vote_cast", { agent: "gemini", token: T.gemini, id: c2.id, choice: "reject" });
await rej(() => x(U, "proposal_close", { agent: "claude", token: T.claude, id: c2.id, override: { decision: "passed", reason: "r" } }), "agent can't override");
const r2: any = await x(U, "proposal_close", { agent: "zizwar", token: T.zizwar, id: c2.id, override: { decision: "passed", reason: "owner sees a better plan" } });
ok(r2.computed === "rejected" && r2.final === "passed" && r2.override.reason && r2.tally.by_agent.claude.choice === "abstain", "override stored with computed=rejected, silence=abstain");
// deadline tick
const c3: any = await x(U, "proposal_create", { agent: "claude", token: T.claude, title: "T3", open: true, rounds: 1, deadline_hours: -1, invited: ["miz"] });
const n = await P.tick(U); g = await x(U, "proposal_get", { id: c3.id });
ok(g.status === "closed" && g.outcome.computed === "no_quorum", "deadline auto-close -> no_quorum");
