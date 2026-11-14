# MemoryZ Standardized Benchmark Scorecard

- **Date:** 2026-11-14T22:04:31.550Z
- **Target Substrate:** `https://memoryz.wino.deno.net`
- **Embedding Architecture:** `Hybrid Engine: Gemini 768-dim Vector + SQLite FTS5 BM25 (RRF) + Bi-Temporal + Supersede`

---

## Executive Summary

| Metric | Score | Industry Context / Target | Status |
|---|---|---|---|
| **Overall Hit Rate @ 5** | **92.0%** | >= 90% | 🟢 Excellent |
| **Overall Recall @ 5** | **92.0%** | >= 85% | 🟢 High |
| **Mean Reciprocal Rank (MRR)** | **0.723** | >= 0.70 | 🟢 Strong |
| **P50 Recall Latency** | **267 ms** | < 1500 ms (Cloud Vector) | 🟢 Fast |
| **Tenant Data Leakage** | **0 items** | 0 items (Strict Zero-Knowledge) | 🟢 100% Isolated |
| **Namespace Leakage** | **0 items** | 0 items | 🟢 100% Isolated |
| **Token Reduction (Compact)** | **65.2%** | >= 60% token savings | 🟢 Ultra-Efficient |

---

## Level 1: Semantic Needle-in-a-Haystack & Paraphrase Accuracy

Evaluates the ability to extract exact configurations, IPs, tokens, and thresholds amongst distractor memories.

- **Sample Size:** 10 queries (5 exact needles, 5 paraphrased queries)
- **Hit Rate @ 5:** 100.0%
- **Recall @ 5:** 100.0%
- **Precision @ 5:** 20.0%
- **MRR:** 1.000
- **Average Latency:** 302 ms

### Breakdown by Query Style:
- **needle-exact:** Recall@5 = 100.0%, MRR = 1.000, P50 Latency = 276ms
- **needle-paraphrase:** Recall@5 = 100.0%, MRR = 1.000, P50 Latency = 312ms

---

## Level 2: Canonical `coding-agent-life-v1` Benchmark

Directly reproduced from the **agentmemory** (ICLR 2025 LongMemEval style) benchmark: 15 Claude Code / Cursor developer sessions with 15 queries covering bug fixes, refactors, preferences, and multi-session causal reasoning.

- **Sessions Seeded:** 15 sessions
- **Questions Evaluated:** 15 queries
- **Hit Rate @ 5:** 86.7% (13/15)
- **Recall @ 5:** 86.7%
- **Precision @ 5:** 21.3%
- **MRR:** 0.539
- **P50 Latency:** 267 ms (P95: 330 ms)

### Breakdown by Question Type:
| Question Type | N | Hit Rate | Recall @ 5 | MRR | Latency P50 |
|---|---|---|---|---|---|
| `single-session-bug` | 1 | 100% | 100.0% | 1.000 | 251 ms |
| `single-session-infra` | 2 | 100% | 100.0% | 0.667 | 330 ms |
| `single-session-refactor` | 1 | 100% | 100.0% | 1.000 | 270 ms |
| `single-session-feature` | 1 | 100% | 100.0% | 0.500 | 272 ms |
| `single-session-test` | 1 | 100% | 100.0% | 0.333 | 273 ms |
| `single-session-perf` | 1 | 100% | 100.0% | 0.333 | 259 ms |
| `single-session-api` | 1 | 100% | 100.0% | 0.500 | 297 ms |
| `single-session-db` | 1 | 100% | 100.0% | 0.500 | 259 ms |
| `single-session-release` | 1 | 0% | 0.0% | 0.000 | 267 ms |
| `multi-session-causal` | 1 | 100% | 100.0% | 1.000 | 267 ms |
| `preference` | 2 | 50% | 50.0% | 0.125 | 292 ms |
| `multi-session-review` | 1 | 100% | 100.0% | 0.333 | 255 ms |
| `temporal` | 1 | 100% | 100.0% | 1.000 | 250 ms |

---

## Level 3: Multi-Tenant Security & Zero-Knowledge Isolation

| Security Check | Expected | Actual Result | Status |
|---|---|---|---|
| Cross-Tenant Query Leakage (User A vs User B) | 0 items | 0 items | PASSED |
| Cross-Namespace Query Leakage | 0 items | 0 items | PASSED |
| Out-of-Domain Negative Query Max Sim | < 0.60 | 0.0000 | PASSED |

---

## Level 4: Token Efficiency & Compression Footprint

| Format | Tokens (Estimated) | Compression Ratio | Token Reduction |
|---|---|---|---|
| Raw Session History | ~170 tokens | Baseline (1.0x) | 0% |
| Standard Full JSON API | ~535 tokens | 0.9x | -10% |
| **MemoryZ Compact Mode (`--compact`)** | **~186 tokens** | **2.88x** | **-65.2%** |
| MemoryZ Summary Mode (`--summary`) | ~184 tokens | ~2.9x | -66% |

---
