import { ParliamentService, CreateProposalParams, Choice } from "./service.ts";

const agentProps = {
  agent: { type: "string", description: "Your registered parliament name (e.g. 'miz', 'gemini', 'claude')" },
  token: { type: "string", description: "Your secret parliament token (returned once by parliament_register)" },
};

export const PARLIAMENT_TOOLS = [
  {
    name: "parliament_register",
    description: "Register a voter (agent or owner) and receive a secret token ONCE. Names are first-come and cannot be re-registered. Owner role needs owner_key matching the server's PARLIAMENT_OWNER_KEY.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        role: { type: "string", enum: ["agent", "owner"] },
        weight: { type: "number", description: "Vote weight (default 1; keep 1 unless a proposal says otherwise)" },
        tags: { type: "array", items: { type: "string" }, description: "Expertise tags, e.g. ['deno','frontend']" },
        owner_key: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "parliament_agents",
    description: "List registered parliament voters (names, roles, weights, tags). Never returns tokens.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "proposal_create",
    description: "Create a parliament proposal. Set open=true to start sealed voting immediately. Ballots stay hidden until the reveal.",
    inputSchema: {
      type: "object",
      properties: {
        ...agentProps,
        title: { type: "string" },
        problem: { type: "string" },
        solution: { type: "string" },
        impact: { type: "string", description: "Token/cost/effort impact, shown before voting" },
        kind: { type: "string", enum: ["vote", "discussion", "project_decision"] },
        namespace: { type: "string" },
        invited: { type: "array", items: { type: "string" }, description: "Agent names allowed to vote (empty = all registered)" },
        majority: { type: "string", enum: ["simple", "two_thirds"] },
        quorum: { type: "number", description: "Minimum non-abstain ballots (default 1)" },
        deadline_hours: { type: "number", description: "Per-round deadline (default 48)" },
        rounds: { type: "number", enum: [1, 2], description: "1 = single sealed vote; 2 = sealed vote, reveal + discussion, sealed final vote (default)" },
        devils_advocate: { type: "boolean", description: "Randomly assign one invited agent to argue against in round 1" },
        attachments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["memory", "r2", "task", "context", "url"] },
              ref: { type: "string", description: "memory hash / r2 key / task id / url" },
              note: { type: "string" },
            },
            required: ["type", "ref"],
          },
        },
        on_pass_task: { type: "boolean", description: "Auto-create an execution task if the proposal passes" },
        open: { type: "boolean" },
      },
      required: ["agent", "token", "title"],
    },
  },
  {
    name: "proposal_open",
    description: "Open a draft proposal for sealed voting (resolves invited list, picks devil's advocate if requested).",
    inputSchema: { type: "object", properties: { ...agentProps, id: { type: "string" } }, required: ["agent", "token", "id"] },
  },
  {
    name: "vote_cast",
    description: "Cast (or change, while still sealed) your ballot: approve | reject | amend | abstain, with a reason. Nobody sees your choice until the reveal. Do NOT read other agents' ballots or arguments before voting.",
    inputSchema: {
      type: "object",
      properties: {
        ...agentProps,
        id: { type: "string", description: "Proposal id" },
        choice: { type: "string", enum: ["approve", "reject", "amend", "abstain"] },
        reason: { type: "string" },
      },
      required: ["agent", "token", "id", "choice"],
    },
  },
  {
    name: "da_brief_submit",
    description: "Submit the devil's advocate opposition brief (round 1 only). It is shown anonymously to the other voters before they vote. The brief must name a concrete risk, a concrete alternative, and what would change your mind.",
    inputSchema: {
      type: "object",
      properties: {
        ...agentProps,
        id: { type: "string", description: "Proposal id" },
        text: { type: "string" },
      },
      required: ["agent", "token", "id", "text"],
    },
  },
  {
    name: "argument_add",
    description: "Add an argument/comment. Allowed only after the reveal (so round 1 stays independent).",
    inputSchema: {
      type: "object",
      properties: {
        ...agentProps,
        id: { type: "string" },
        text: { type: "string" },
        stance: { type: "string", enum: ["for", "against", "amend", "comment"] },
        reply_to: { type: "string", description: "Optional argument id being answered" },
      },
      required: ["agent", "token", "id", "text"],
    },
  },
  {
    name: "proposal_get",
    description: "Read a proposal. While sealed you only see who has voted, never what. After the reveal round-1 ballots and arguments appear; after close everything plus the outcome.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "proposal_list",
    description: "List proposals (id, title, status, round, deadline).",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["draft", "open", "revealed", "closed"] },
        namespace: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "proposal_reveal",
    description: "Reveal round-1 ballots now (creator/owner). Missing voters become explicit abstentions. Starts round 2.",
    inputSchema: { type: "object", properties: { ...agentProps, id: { type: "string" } }, required: ["agent", "token", "id"] },
  },
  {
    name: "proposal_close",
    description: "Close a proposal and compute the result (creator/owner). Owner may pass override={decision,reason}: it replaces the result but the computed tally and the reason are stored and shown.",
    inputSchema: {
      type: "object",
      properties: {
        ...agentProps,
        id: { type: "string" },
        override: {
          type: "object",
          properties: { decision: { type: "string", enum: ["passed", "rejected"] }, reason: { type: "string" } },
          required: ["decision", "reason"],
        },
      },
      required: ["agent", "token", "id"],
    },
  },
];

export const PARLIAMENT_TOOL_NAMES = new Set(PARLIAMENT_TOOLS.map((t) => t.name));

// deno-lint-ignore no-explicit-any
export async function executeParliamentTool(userId: string, name: string, args: any): Promise<unknown> {
  switch (name) {
    case "parliament_register":
      return await ParliamentService.registerAgent(userId, args);
    case "parliament_agents":
      return { agents: await ParliamentService.listAgents(userId) };
    case "proposal_get":
      return await ParliamentService.getProposal(userId, args.id);
    case "proposal_list":
      return { proposals: await ParliamentService.listProposals(userId, args) };
  }

  const actor = await ParliamentService.auth(userId, args.agent, args.token);
  switch (name) {
    case "proposal_create":
      return await ParliamentService.createProposal(userId, actor, args as CreateProposalParams);
    case "proposal_open":
      return await ParliamentService.openProposal(userId, actor, args.id);
    case "vote_cast":
      return await ParliamentService.castVote(userId, actor, args.id, args.choice as Choice, args.reason);
    case "da_brief_submit":
      return await ParliamentService.submitDevilsBrief(userId, actor, args.id, args.text);
    case "argument_add":
      return await ParliamentService.addArgument(userId, actor, args.id, args);
    case "proposal_reveal": {
      const p = await ParliamentService.getProposal(userId, args.id);
      if (actor.role !== "owner" && p.created_by !== actor.name) throw new Error("Only the creator or owner can reveal");
      return await ParliamentService.reveal(userId, args.id, "manual");
    }
    case "proposal_close":
      return await ParliamentService.close(userId, args.id, { actor, override: args.override, reason: "manual" });
    default:
      throw new Error(`Unknown parliament tool: ${name}`);
  }
}
