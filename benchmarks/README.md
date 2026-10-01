# MemoryZ Standardized Benchmark Suite (v2.0)

A reproducible, academic-grade benchmark suite for evaluating agentic memory systems, semantic vector retrieval, multi-tenant isolation, and prompt context packing efficiency.

Inspired by **LongMemEval** (ICLR 2025) and the canonical **`rohitg00/agentmemory`** evaluation methodology.

---

## 4-Level Evaluation Architecture

### Level 1: Semantic Needle-in-a-Haystack & Paraphrase Accuracy
- Evaluates the ability of MemoryZ to retrieve critical, exact engineering facts (canary abort thresholds, fallback database IPs, correlation logging tags, secret rotation cadence) hidden among distractor memories.
- Tests both **exact phrasing** and **semantic paraphrasing** queries.
- **Metrics:** Hit Rate @ 5, Recall @ 5, Precision @ 5, MRR, Latency (ms).

### Level 2: Canonical `coding-agent-life-v1` Benchmark
- Direct reproduction of the 15-session developer lifecycle dataset from `rohitg00/agentmemory`.
- Covers real-world software engineering agent workflows:
  - Single-session bug fix retrieval (`auth env var precedence`)
  - Multi-arch Docker and build troubleshooting
  - Logic refactoring (`consolidate retry backoff`)
  - Integration features (`helm chart support`)
  - Flaky test resolution (`fsevents timing on macOS`)
  - Memory leak investigations (`LruCache vs unbounded map`)
  - API rate-limiting handling
  - Database schema migrations (`zero-downtime dual-write`)
  - Multi-session causal reasoning (root-cause discovery across sessions)
  - Developer preferences & coding styles
  - Temporal queries ("what shipped on April 8?")
- **Metrics:** Precision @ 5, Recall @ 5, Hit Rate, MRR, P50/P95 Latency.

### Level 3: Multi-Tenant Security & Zero-Knowledge Isolation
- **Cross-Tenant Isolation:** Creates two isolated accounts (User A and User B). Ensures User B can never retrieve User A's confidential memories under any query conditions.
- **Cross-Namespace Isolation:** Verifies strict namespace scoping within a user account.
- **Negative / Out-of-Domain Resistance:** Tests resistance against hallucinated or unrelated queries.
- **Metric:** Leaked memory count (Must be strictly **0**).

### Level 4: Token Economics & Context Compression Footprint
- Compares context token consumption:
  - Raw session text vs
  - Standard JSON response vs
  - MemoryZ `--compact` response vs
  - MemoryZ `--summary` response
- **Metric:** Token reduction percentage and compression multiplier.

---

## Running the Benchmark

### 1. Run against Live Production (`memoryz.wino.deno.net`):
```bash
deno task bench
```
Or with custom target URL:
```bash
deno run --allow-all benchmarks/runner.ts https://memoryz.wino.deno.net
```

### 2. Run against Local Development Server:
```bash
deno run --allow-all benchmarks/runner.ts http://localhost:8000
```

### Reports Generated
Running the benchmark automatically creates:
- `benchmarks/reports/latest_benchmark.json`: Machine-readable results and raw query scores.
- `benchmarks/reports/latest_benchmark.md`: Markdown scorecard ready for documentation or publishing.
