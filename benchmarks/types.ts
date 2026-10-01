export interface BenchmarkConfig {
  baseUrl: string;
  concurrency?: number;
  insertDelayMs?: number;
  k?: number;
}

export interface SessionData {
  id: string;
  timestamp: string;
  content: string;
}

export interface QuestionData {
  id: string;
  type: string;
  question: string;
  answer: string;
  goldSessionIds: string[];
}

export interface NeedleData {
  id: string;
  type: "note" | "skill" | "preference" | "env";
  content: string;
  query_exact: string;
  query_paraphrase: string;
  goldNeedleId: string;
}

export interface ScoreRow {
  level: string;
  id: string;
  type: string;
  query: string;
  goldIds: string[];
  retrievedIds: string[];
  scores: number[];
  k: number;
  pAtK: number;
  rAtK: number;
  hit: boolean;
  mrr: number;
  latencyMs: number;
}

export interface AggregateStats {
  n: number;
  hitCount: number;
  hitRate: number;
  pAtK: number;
  rAtK: number;
  mrr: number;
  latencyP50: number;
  latencyP95: number;
  latencyMean: number;
}

export interface LevelReport {
  level: string;
  name: string;
  description: string;
  stats: AggregateStats;
  byType?: Record<string, AggregateStats>;
  details: ScoreRow[];
}

export interface IsolationReport {
  crossTenantLeakage: number; // must be 0
  crossNamespaceLeakage: number; // must be 0
  negativeQueryMaxSim: number;
  passed: boolean;
  details: Array<{ check: string; status: "PASS" | "FAIL"; note: string }>;
}

export interface TokenFootprintReport {
  rawChars: number;
  rawTokensEstimated: number;
  fullJsonTokensEstimated: number;
  compactTokensEstimated: number;
  summaryTokensEstimated: number;
  compressionRatioCompact: string;
  tokenSavingsPercent: number;
}

export interface FullBenchmarkReport {
  timestamp: string;
  targetUrl: string;
  model: string;
  levels: {
    level1_needle: LevelReport;
    level2_coding_agent_life: LevelReport;
    level3_security_isolation: IsolationReport;
    level4_token_efficiency: TokenFootprintReport;
  };
  overallScorecard: {
    overallRecallAt5: number;
    overallPrecisionAt5: number;
    overallMRR: number;
    overallHitRate: number;
    averageLatencyMs: number;
    leakageDetected: boolean;
  };
}
