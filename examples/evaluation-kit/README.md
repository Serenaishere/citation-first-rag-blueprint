# Evidence-first evaluation kit

This dependency-free example scores retrieval evidence, citation selection, refusal behavior, and authorization leakage. All fixtures are synthetic, and the demo intentionally includes one cross-scope retrieval so the authorization gate fails visibly.

Requirements: Node.js 20 or later.

```bash
npm test
npm run demo
```

The metrics are deterministic signals, not a complete judgment of answer quality. Human review or a separately validated semantic evaluator is still required for claim entailment, completeness, and source interpretation.

## Case contract

Each JSONL case records:

- the question;
- document IDs that the simulated user is allowed to access;
- whether the corpus can answer the question;
- the document IDs expected to contain the evidence;
- diagnostic tags.

The case deliberately stores expected evidence rather than a single “golden answer.” This avoids penalizing harmless wording differences while keeping retrieval and citation checks reproducible.
