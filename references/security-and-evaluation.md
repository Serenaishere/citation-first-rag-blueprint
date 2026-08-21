# Security and evaluation

Grounded generation is a security boundary as well as a quality feature. Uploaded documents, extracted text, metadata, retrieval results, and model output are all potentially hostile.

## Threat model

Plan for at least these cases:

- a document contains prompt injection or misleading instructions;
- a parser receives a malformed archive, oversized file, or decompression bomb;
- one tenant tries to infer another tenant's document or entity names;
- retrieved HTML or Markdown contains scriptable content or dangerous links;
- logs capture raw document text, credentials, or personal data;
- a model emits an unsupported claim with a plausible-looking citation;
- stale chunks remain searchable after replacement or deletion.

## Controls by stage

### Ingestion

- allowlist file types and validate content signatures, not only extensions;
- cap compressed size, expanded size, page count, nesting depth, and parse time;
- isolate parsers and disable outbound network access where possible;
- scan uploads according to the deployment's malware policy;
- normalize filenames and never use an uploaded name as a storage path;
- assign tenant and authorization metadata before indexing.

### Retrieval

- apply authorization predicates inside every retrieval branch;
- use parameterized queries and validated filter operators;
- keep embeddings, lexical indexes, graph edges, and source rows under the same deletion contract;
- log document IDs and scores instead of raw sensitive passages by default;
- test that unauthorized documents cannot affect rankings, counts, or timing signals.

### Synthesis and output

- mark retrieved passages as data, never as instructions;
- require citations to reference an allowlisted candidate ID;
- validate citation IDs after generation and remove or reject invalid ones;
- sanitize rendered Markdown and links;
- distinguish “no evidence” from upstream failure;
- avoid returning hidden prompts, internal traces, or provider errors to the client.

## Evaluation layers

Use a small, versioned evaluation set with expected evidence, not only expected prose.

| Layer | Useful measures |
| --- | --- |
| Ingestion | parse success, text coverage, duplicate rate, stale-chunk cleanup |
| Retrieval | Recall@K, MRR, nDCG, authorization-filter recall, latency |
| Citations | valid-ID rate, evidence coverage, citation precision, span correctness |
| Answer | grounded claim rate, refusal correctness, completeness, contradiction rate |
| Operations | p50/p95 latency, error rate, index lag, cost per answered query |

For each question, label the source document and preferably the supporting span. Include unanswerable questions, ambiguous aliases, deleted documents, hostile instructions, and cross-tenant probes.

## Release gates

A practical release gate should require:

- zero critical authorization or data-leakage failures;
- zero accepted citations outside the retrieved candidate set;
- correct refusal on the agreed unanswerable test set;
- retrieval quality and latency above explicit project thresholds;
- successful replacement and deletion tests across all indexes;
- a rollback path for schema, parser, embedding, and prompt changes.

Report retrieval and generation metrics separately. A fluent answer cannot compensate for missing evidence, and perfect retrieval cannot compensate for an answer that ignores it.
