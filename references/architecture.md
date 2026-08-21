# Architecture and Build Order

## Define the boundary first

Write down the following before selecting a vector database or model:

| Decision | Questions |
|---|---|
| Corpus | Which formats, languages, sizes, and update rates? |
| Ownership | Public data, company data, personal uploads, or regulated records? |
| Citation | Document, page, section, timestamp, or exact span? |
| Deployment | Local single-user, private network, or multi-tenant service? |
| Freshness | Batch, near-real-time, or immutable snapshot? |
| Quality | Which questions must be answered, refused, or escalated? |

The security boundary and citation granularity influence the schema, retrieval filters, UI, and evaluation set. They are expensive to retrofit.

## Minimal component model

```text
ingestion
  parser -> normalizer -> chunker -> document/chunk store
                               |-> full-text index
                               `-> embedding queue -> vector index

query
  question -> scope/authorization filter
           -> BM25 + vector recall
           -> RRF fusion -> optional rerank
           -> numbered evidence bundle
           -> grounded synthesis
           -> citation validation
           -> answer + source metadata
```

Recommended logical tables:

- `documents`: source metadata, ownership, timestamps, and normalized text;
- `chunks`: stable chunk identifier, parent document, location, and text;
- `vectors`: chunk identifier, model, dimension, and vector bytes;
- `chunks_fts`: full-text fields optimized for lexical retrieval;
- `sessions/messages`: optional conversation state and saved citations;
- `entities/edges`: optional graph enrichment;
- `uploads`: optional state machine for user-supplied files.

Use stable identifiers. Re-indexing should not silently change citation targets for unchanged content.

## Build order

1. Parse a small representative corpus and inspect extracted text.
2. Implement lexical retrieval and a retrieval evaluation set.
3. Add embeddings and RRF fusion.
4. Add the strict citation contract and source viewer.
5. Add streaming only after non-streamed correctness is measurable.
6. Add uploads and recovery if users supply documents.
7. Add graph enrichment only for entity-centric use cases.
8. Add reranking or agentic retrieval only after failure analysis shows a need.

This order produces a useful, testable system at every stage.

## When simple infrastructure is enough

For a corpus of a few thousand chunks, a relational database, native full-text search, and an in-process vector array are often adequate. Advantages include:

- fewer services to secure and operate;
- transparent scoring and debugging;
- simple backups and local deployment;
- deterministic joins from chunk to citation metadata.

Move to ANN or a managed vector service when measured latency, memory, update concurrency, or availability requirements exceed the simple design. Do not infer the threshold from document count alone; measure chunk count, dimension, query rate, hardware, and target latency.

## Separation of concerns

- Retrieval decides which evidence is available.
- Synthesis writes an answer from that evidence.
- Citation validation checks that markers map to supplied evidence.
- Authorization decides which evidence may be retrieved.
- The UI helps a user inspect evidence; it does not create trust by itself.

Avoid hiding all five responsibilities behind one framework callback. Explicit seams make failures observable.
