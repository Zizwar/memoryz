import { initDb } from "../src/db/schema.ts";
import { handleApiRoute } from "../src/routes/api.ts";
import { AuthService } from "../src/services/auth.ts";

const ok = (c: boolean, m: string) => {
  console.log(c ? "PASS" : "FAIL", m);
  if (!c) Deno.exitCode = 1;
};

await initDb();

// 1. Create a test user for API calls
const testSuffix = Date.now().toString(36);
const userSession = await AuthService.register(`parl_user_${testSuffix}`, `parl_${testSuffix}@test.com`, "password123");
const token = userSession.token;
const authHeaders = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

const callApi = async (path: string, method = "GET", body?: any) => {
  const url = new URL(`http://localhost${path}`);
  const req = new Request(url.toString(), {
    method,
    headers: authHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const res = await handleApiRoute(req, url);
  const data = await res.json();
  return { status: res.status, data };
};

console.log("--- Testing Parliament REST APIs ---");

// 2. List proposals initially empty
let r = await callApi("/api/parliament/proposals");
ok(r.status === 200 && Array.isArray(r.data.proposals), "GET /api/parliament/proposals returns 200 array");

// 3. Register a couple agents
let reg1 = await callApi("/api/parliament/agents", "POST", { name: `bot_alpha_${testSuffix}`, role: "agent", weight: 1.5, tags: ["ml"] });
let reg2 = await callApi("/api/parliament/agents", "POST", { name: `bot_beta_${testSuffix}`, role: "agent", weight: 1, tags: ["web"] });
ok(reg1.status === 201 && reg1.data.token && reg2.status === 201, "POST /api/parliament/agents registers voters and issues secret token");

let agList = await callApi("/api/parliament/agents");
ok(agList.status === 200 && agList.data.agents.length >= 2, "GET /api/parliament/agents lists registered agents");

// 4. Create an open proposal with Devil's Advocate
const createRes = await callApi("/api/parliament/proposals", "POST", {
  title: "Should we adopt strict token limits?",
  problem: "Token limits are currently unbounded.",
  solution: "Cap memory tokens at 400 per interaction.",
  impact: "Saves ~40% token costs across all agents.",
  kind: "project_decision",
  namespace: "vibzcode",
  majority: "simple",
  quorum: 1,
  rounds: 2,
  devils_advocate: true,
  on_pass_task: true,
  open: true,
  invited: [`bot_alpha_${testSuffix}`, `bot_beta_${testSuffix}`, `parl_user_${testSuffix}`],
});
ok(createRes.status === 201 && createRes.data.id && createRes.data.status === "open", "POST /api/parliament/proposals creates and opens proposal");
const propId = createRes.data.id;

// 5. Verify secrecy rule before reveal
const getRes1 = await callApi(`/api/parliament/proposals/${propId}`);
ok(getRes1.status === 200, "GET /api/parliament/proposals/:id returns proposal");
const p1 = getRes1.data.proposal;
ok(p1.status === "open", "status is open");
ok(p1.devils_advocate === "hidden-until-reveal", "Secrecy check: devils_advocate is strictly 'hidden-until-reveal'");
ok(p1.da_seed === null, "Secrecy check: da_seed is null before reveal");
ok(Array.isArray(p1.ballots) && p1.ballots.length === 0, "Secrecy check: ballots array is empty while sealed");
ok(Array.isArray(p1.who_voted) && Array.isArray(p1.waiting_for), "voter tracking lists who_voted and waiting_for");

// 6. Cast a vote
const voteRes = await callApi(`/api/parliament/proposals/${propId}/vote`, "POST", {
  choice: "approve",
  reason: "This directly addresses cost concerns and aligns with project budgeting.",
});
ok(voteRes.status === 200 && voteRes.data.recorded === true, "POST /api/parliament/proposals/:id/vote casts sealed ballot");

// 7. Verify who_voted reflects the voter without leaking the choice or reason
const getRes2 = await callApi(`/api/parliament/proposals/${propId}`);
const p2 = getRes2.data.proposal;
ok(p2.who_voted.includes(`parl_user_${testSuffix}`), "who_voted includes the voter");
ok(p2.ballots.length === 0, "ballots are STILL completely hidden (secrecy preserved)");

// 8. Reveal the proposal
const revealRes = await callApi(`/api/parliament/proposals/${propId}/reveal`, "POST");
ok(revealRes.status === 200 && revealRes.data.status === "revealed", "POST /api/parliament/proposals/:id/reveal reveals proposal");

// 9. Verify secrecy is lifted post-reveal
const getRes3 = await callApi(`/api/parliament/proposals/${propId}`);
const p3 = getRes3.data.proposal;
ok(p3.status === "revealed", "status is now revealed");
ok(p3.devils_advocate !== "hidden-until-reveal", "devils_advocate identity is now transparently revealed");
ok(p3.da_seed && p3.da_seed.length === 32, "da_seed is now revealed for cryptographic audit");
ok(p3.ballots.length > 0, "Round 1 ballots (choices & reasons) are now readable");

// 10. Add round 2 discussion argument
const argRes = await callApi(`/api/parliament/proposals/${propId}/arguments`, "POST", {
  text: "I agree with the proposal, but we must make sure maintenance cron is exempt.",
  stance: "amend",
});
ok(argRes.status === 201 && argRes.data.id, "POST /api/parliament/proposals/:id/arguments posts round-2 argument");

// 11. Close the proposal with owner determination
const closeRes = await callApi(`/api/parliament/proposals/${propId}/close`, "POST", {
  reason: "Discussion concluded and agreed upon.",
  override: {
    decision: "passed",
    reason: "Critical cost saving measure endorsed by owner.",
  },
});
ok(closeRes.status === 200 && closeRes.data.status === "closed", "POST /api/parliament/proposals/:id/close closes proposal");
ok(closeRes.data.final === "passed", "final decision recorded as passed");
ok(closeRes.data.task_id, "execution task automatically created");

// 12. Verify closed detail
const getRes4 = await callApi(`/api/parliament/proposals/${propId}`);
const p4 = getRes4.data.proposal;
ok(p4.status === "closed" && p4.outcome.final === "passed", "final proposal detail reflects closed status and passed outcome");
ok(p4.outcome.task_id, "outcome carries task_id");

console.log("All Parliament REST API and Secrecy tests completed successfully!");
