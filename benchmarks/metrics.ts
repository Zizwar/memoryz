import { AggregateStats, ScoreRow } from "./types.ts";

export function computeScoreRow(params: {
  level: string;
  id: string;
  type: string;
  query: string;
  goldIds: string[];
  retrievedIds: string[];
  scores: number[];
  k: number;
  latencyMs: number;
}): ScoreRow {
  const { level, id, type, query, goldIds, retrievedIds, scores, k, latencyMs } = params;
  const topK = retrievedIds.slice(0, k);
  const goldSet = new Set(goldIds);

  const hits = topK.filter((item) => goldSet.has(item)).length;
  const pAtK = k > 0 ? hits / k : 0;
  const rAtK = goldSet.size > 0 ? hits / goldSet.size : 0;
  const hit = hits > 0;

  let mrr = 0;
  for (let i = 0; i < topK.length; i++) {
    if (goldSet.has(topK[i])) {
      mrr = 1 / (i + 1);
      break;
    }
  }

  return {
    level,
    id,
    type,
    query,
    goldIds,
    retrievedIds: topK,
    scores: scores.slice(0, k),
    k,
    pAtK,
    rAtK,
    hit,
    mrr,
    latencyMs,
  };
}

export function aggregateScores(rows: ScoreRow[]): AggregateStats {
  if (rows.length === 0) {
    return {
      n: 0,
      hitCount: 0,
      hitRate: 0,
      pAtK: 0,
      rAtK: 0,
      mrr: 0,
      latencyP50: 0,
      latencyP95: 0,
      latencyMean: 0,
    };
  }

  const n = rows.length;
  let totalP = 0;
  let totalR = 0;
  let totalMrr = 0;
  let hitCount = 0;
  let totalLatency = 0;
  const latencies: number[] = [];

  for (const r of rows) {
    totalP += r.pAtK;
    totalR += r.rAtK;
    totalMrr += r.mrr;
    if (r.hit) hitCount += 1;
    totalLatency += r.latencyMs;
    latencies.push(r.latencyMs);
  }

  latencies.sort((a, b) => a - b);
  const latencyP50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
  const latencyP95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;

  return {
    n,
    hitCount,
    hitRate: parseFloat((hitCount / n).toFixed(4)),
    pAtK: parseFloat((totalP / n).toFixed(4)),
    rAtK: parseFloat((totalR / n).toFixed(4)),
    mrr: parseFloat((totalMrr / n).toFixed(4)),
    latencyP50: Math.round(latencyP50),
    latencyP95: Math.round(latencyP95),
    latencyMean: Math.round(totalLatency / n),
  };
}

export function aggregateByType(rows: ScoreRow[]): Record<string, AggregateStats> {
  const groups: Record<string, ScoreRow[]> = {};
  for (const r of rows) {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  }
  const result: Record<string, AggregateStats> = {};
  for (const [type, groupRows] of Object.entries(groups)) {
    result[type] = aggregateScores(groupRows);
  }
  return result;
}
