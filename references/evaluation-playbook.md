# Evidence-first evaluation playbook

Evaluate the evidence path separately from answer style. A single end-to-end score hides whether a failure came from parsing, retrieval, authorization, citation mapping, or synthesis.

## Build cases around expected evidence

Each case should contain:

- a stable case ID and natural user question;
- the corpus snapshot and authorization scope;
- whether the question is answerable from that scope;
- one or more acceptable evidence document or chunk IDs;
- tags for language, source type, intent, difficulty, and risk;
- optional notes for human entailment review.

Prefer acceptable evidence sets over a single expected prose answer. Multiple correct answers can use different wording, but they should still be traceable to defensible evidence.

## Include failure-oriented slices

Cover at least:

- exact identifiers, dates, names, and abbreviations;
- semantic paraphrases with little lexical overlap;
- multi-document synthesis;
- ambiguous entities and aliases;
- questions whose answer is absent from the corpus;
- deleted or superseded documents;
- user-bound document and entity scopes;
- cross-tenant and unauthorized-document probes;
- hostile instructions embedded inside retrieved text;
- parser failures and partially indexed uploads.

Keep a frozen regression set and a separate development set. Do not tune retrieval weights against the final acceptance set.

## Measure each layer

### Retrieval

- **Recall@K**: fraction of expected evidence found in the top K.
- **Precision@K**: fraction of top-K candidates that are labeled evidence.
- **MRR**: reciprocal rank of the first acceptable evidence item.
- **Leakage rate**: fraction of retrieved items outside the authorization scope.

### Citations

- marker validity: every marker resolves to a supplied source;
- citation precision: cited documents that are acceptable evidence;
- citation recall: expected evidence represented by citations;
- claim coverage: material factual claims with supporting markers;
- entailment: whether the cited span actually supports the claim.

Marker validity and set metrics are deterministic. Claim coverage and entailment usually require labeled spans, human review, or a carefully validated semantic evaluator.

### Answer behavior

- correct refusal when evidence is absent;
- grounded claim rate;
- contradiction and unsupported-specificity rate;
- completeness against required facts;
- stable behavior across languages and document types.

## Define gates before running the test

Example gates should be project-specific, but some failures should always block release:

- any cross-tenant or unauthorized retrieval;
- any accepted marker outside the supplied candidate list;
- stale evidence remaining after a completed deletion;
- a material regression hidden by an improved aggregate average.

Report counts and confidence intervals with averages. For small slices, show the individual failed case IDs.

## Reproduce results

Record:

- corpus and evaluation-set versions;
- parser, chunker, embedding, index, prompt, and model versions;
- retrieval parameters and authorization filters;
- complete ranked document or chunk IDs;
- cited evidence IDs and terminal answer state;
- latency, cost, and error metadata.

The runnable synthetic example is in [`examples/evaluation-kit`](../examples/evaluation-kit).
