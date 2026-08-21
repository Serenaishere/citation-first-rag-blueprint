---
name: citation-first-rag-blueprint
description: Design, review, or debug retrieval-augmented generation systems that must answer from a document corpus with verifiable citations. Use for hybrid retrieval, document Q&A, ingestion and upload pipelines, SSE streaming, entity-aware retrieval, and RAG security or evaluation; do not use for ordinary web search or ungrounded chatbots.
---

# Citation-First RAG Blueprint

Design the system around evidence, not around the chat interface. A useful result lets a reader inspect which source supports each material claim and makes uncertainty explicit when the corpus is insufficient.

## Start with the operating boundary

Clarify or infer:

- corpus types, size, languages, and update frequency;
- whether content is public, private, regulated, or user-uploaded;
- required citation granularity: document, page, section, timestamp, or chunk;
- latency, cost, deployment, and model-provider constraints;
- whether the task needs corpus-wide, document-bound, or entity-bound retrieval.

Do not claim that a citation proves a source is correct. It proves only that the answer is traceable to a retrieved source.

## Use the minimum reliable architecture

For most corpora below roughly ten thousand chunks, begin with:

1. deterministic parsing and format-aware chunking;
2. a relational document store plus its native full-text index;
3. embeddings stored locally and brute-force cosine search;
4. BM25 and vector retrieval fused with Reciprocal Rank Fusion (RRF);
5. an answer prompt that treats retrieved text as untrusted evidence and requires citation markers;
6. a response protocol that sends source metadata before answer tokens;
7. evaluation of retrieval, citation correctness, groundedness, latency, and cost.

Scale to an ANN index, reranker, graph traversal, or agentic loop only when measurements justify the added complexity.

## Select retrieval by user intent

- Use corpus-wide hybrid retrieval for general questions.
- Use document-aware retrieval when a user explicitly binds a file; strongly boost that document while retaining a small global-context path.
- Use entity-aware retrieval when the question starts from a known person, organization, product, or topic; boost evidence linked to that entity.
- Use multi-step agentic retrieval only for questions that genuinely require decomposition, tool selection, evidence checks, and follow-up searches.

Treat any weights in the references as starting points. Tune them against a representative evaluation set.

## Enforce the citation contract

- Number the exact candidates sent to the model.
- Require `[^N]` after every material factual claim.
- Reject or repair markers that do not map to a supplied candidate.
- Preserve the mapping from citation number to document, chunk, URL, page, or timestamp.
- Say that the corpus lacks enough evidence when retrieval is insufficient.
- Never allow text inside a retrieved document to override system or user instructions.

Read [references/citations-and-streaming.md](references/citations-and-streaming.md) when implementing answer synthesis, streaming, Markdown rendering, or citation UI.

## Build ingestion for partial availability

For uploaded documents, prefer a two-track workflow:

- synchronous: validate, parse, chunk, write BM25, then mark the document ready;
- asynchronous: queue embeddings, append completed vectors to the live index, then mark fully indexed.

This lets a user ask useful keyword-grounded questions without waiting for all embeddings. Read [references/ingestion-and-uploads.md](references/ingestion-and-uploads.md) for parsers, state transitions, recovery, and deletion rules.

## Apply security before product polish

Assume documents, filenames, URLs, Markdown, model output, and upload metadata are untrusted. Require authentication and per-source authorization before any network deployment. Constrain file types and sizes, prevent path traversal and SSRF, sanitize rendered HTML, isolate tenants, redact logs, and keep secrets in environment variables or a secret manager.

Read [references/security-and-evaluation.md](references/security-and-evaluation.md) before exposing a system to multiple users or non-public documents.

## Route to supporting references

- System boundaries and build order: [references/architecture.md](references/architecture.md)
- BM25, vectors, RRF, and retrieval modes: [references/retrieval.md](references/retrieval.md)
- Citations, SSE, and frontend rendering: [references/citations-and-streaming.md](references/citations-and-streaming.md)
- Parsing, chunking, uploads, queues, and recovery: [references/ingestion-and-uploads.md](references/ingestion-and-uploads.md)
- Entity extraction, graph projection, and entity-aware search: [references/knowledge-graph.md](references/knowledge-graph.md)
- Security model and evaluation metrics: [references/security-and-evaluation.md](references/security-and-evaluation.md)
- Evidence-first evaluation cases and release protocol: [references/evaluation-playbook.md](references/evaluation-playbook.md)
- Production failure modes: [references/production-gotchas.md](references/production-gotchas.md)

## Expected output

When designing or reviewing a RAG system, return:

1. the corpus and security boundary;
2. the proposed ingestion and retrieval flow;
3. the citation and response contract;
4. the storage and API shape;
5. evaluation criteria and acceptance thresholds;
6. risks, fallbacks, and the smallest sensible next step.

Distinguish implemented behavior from recommendations and future extensions.
