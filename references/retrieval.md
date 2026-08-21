# Hybrid Retrieval

## Why combine lexical and semantic search

Vector search handles paraphrases and conceptual similarity. Lexical search remains strong for identifiers, product names, abbreviations, error codes, dates, and exact phrases. Either one alone creates predictable blind spots.

Run both in parallel, then fuse rankings. Keep the raw rankings for diagnostics.

## Vector retrieval

For each query:

1. create an embedding with the same model and preprocessing used for document chunks;
2. compare it with indexed chunk vectors;
3. return the top candidates with scores and model metadata;
4. fail open to lexical retrieval if the embedding provider is unavailable.

Cosine similarity is:

```text
cosine(a, b) = dot(a, b) / (norm(a) * norm(b))
```

Reject or isolate vectors whose model or dimension differs from the active index.

## Lexical retrieval

Use the database's native full-text engine where possible. For languages that require segmentation, pre-tokenize both indexed text and queries consistently. Protect domain terms, identifiers, and mixed alphanumeric tokens from accidental splitting.

Keep user text out of SQL syntax. Build a safe match expression or use parameterized search APIs.

## Reciprocal Rank Fusion

RRF combines ranks without requiring incomparable raw scores to be calibrated:

```text
RRF(document) = sum(weight_i / (k + rank_i))
```

Typical starting values:

- `k = 60`;
- vector weight `0.7`;
- lexical weight `0.3`.

These are heuristics, not universal defaults. Tune on representative questions and report both effectiveness and latency.

## Retrieval modes

### Corpus-wide

Use vector and lexical rankings across all documents the user is authorized to read.

### Document-aware

When a user binds a document, add rankings for:

- chunks from the bound document;
- optionally, sibling documents with a defensible relationship;
- global vector results;
- global lexical results.

A starting blend might be `0.45 / 0.20 / 0.20 / 0.15`. Never use sibling author or folder relationships across authorization boundaries.

### Entity-aware

When a user starts from an entity node, add a ranking of chunks linked to that entity. A starting blend might be linked evidence `0.55`, vector `0.30`, lexical `0.15`.

Graph proximity is not evidence by itself. The final answer should cite the underlying document chunks.

### Agentic or multi-step

Use only when a single retrieval pass cannot answer a valuable class of questions. Define:

- allowed tools and data boundaries;
- maximum steps and cost;
- evidence sufficiency checks;
- retry and stopping rules;
- a trace suitable for evaluation and audit.

## Hydration and deduplication

Ranking usually returns chunk identifiers. Hydration should attach:

- chunk text and location;
- document title, type, author, source URL, and publication time;
- ownership and authorization fields;
- optional page, section, or timestamp;
- retrieval provenance: lexical rank, vector rank, fusion score.

Deduplicate repeated chunks and near-duplicate documents before assigning citation numbers. Preserve the final order exactly when building the model prompt and response metadata.

## Evaluation

At minimum, maintain a set of questions with expected evidence documents. Track:

- Recall@K and MRR for retrieval;
- exact identifier and date-query performance;
- performance by language and document type;
- scoped retrieval leakage outside the bound document or authorized sources;
- latency and failure rate for each retrieval branch;
- answer citation precision after synthesis.

Inspect misses. Averages can conceal complete failure for one source type or language.
