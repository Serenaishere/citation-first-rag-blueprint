# RAG evaluation plan

## 1. Decision this evaluation supports

- Release or change under review: `<name and version>`
- Decision owner: `<role, not personal contact information>`
- Evaluation window: `<start and end>`
- Rollback trigger: `<measurable condition>`

## 2. Corpus boundary

- Corpus snapshot: `<immutable version>`
- Included source types and languages: `<list>`
- Excluded sources: `<list and rationale>`
- Authorization model: `<public, single-user, tenant, role, document ACL>`
- Citation granularity: `<document, page, section, timestamp, chunk>`

## 3. Evaluation slices

| Slice | Cases | Risk addressed | Minimum gate |
| --- | ---: | --- | ---: |
| Exact identifiers | `<n>` | lexical miss | `<Recall@K>` |
| Semantic paraphrases | `<n>` | vector miss | `<Recall@K>` |
| Multi-evidence | `<n>` | incomplete synthesis | `<citation recall>` |
| Unanswerable | `<n>` | hallucinated answer | `<refusal accuracy>` |
| Authorization probes | `<n>` | data leakage | `zero failures` |
| Deletion and freshness | `<n>` | stale evidence | `zero stale hits` |

## 4. Metrics and gates

- Retrieval: `<Recall@K, Precision@K, MRR, latency>`
- Citations: `<validity, precision, recall, entailment>`
- Answers: `<groundedness, refusal, completeness, contradictions>`
- Operations: `<p50/p95 latency, cost, error rate, index lag>`
- Blocking conditions: `<conditions that cannot be averaged away>`

## 5. Execution protocol

1. Freeze corpus, case set, code revision, configuration, and model versions.
2. Run deterministic ingestion and retrieval checks.
3. Run synthesis with retries disabled or explicitly recorded.
4. Preserve ranked IDs, citation mappings, outcomes, latency, and errors.
5. Review failed cases by slice and failure layer.
6. Compare against the prior accepted baseline.

## 6. Result

- Outcome: `<pass, conditional pass, fail>`
- Blocking failures: `<case IDs and owner roles>`
- Accepted regressions: `<rationale and expiry>`
- Follow-up experiment: `<smallest useful next test>`
