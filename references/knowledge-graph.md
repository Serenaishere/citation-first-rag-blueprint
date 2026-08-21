# Knowledge graph: optional, evidence-backed, and small

A knowledge graph can improve entity navigation and disambiguation, but it should not become a second source of truth. Documents remain the evidence layer; every graph fact must point back to one or more document chunks.

## Start with a narrow schema

Use only entities and relations that serve a real question pattern. A practical starting point is:

- entities: `Person`, `Organization`, `Project`, `Product`, `Topic`;
- document links: `MENTIONED_IN` with chunk identifiers and character offsets;
- domain relations: a small allowlist such as `OWNS`, `DEPENDS_ON`, or `PART_OF`;
- provenance: extraction method, source document, source chunk, confidence, and extraction version.

Assign stable canonical IDs independently of display names. Store aliases separately so a renamed entity does not fragment its history.

## Three-pass extraction

1. **Deterministic pass** — extract IDs, dates, headings, tags, and known vocabulary with rules.
2. **Model-assisted pass** — propose entities and relations in a strict JSON schema. Treat the output as untrusted input.
3. **Derived pass** — compute graph-only relations such as co-occurrence or shared-document strength.

Validate all model-assisted output against an enum of allowed types and relations. Reject unknown fields, missing provenance, self-loops where they are invalid, and relations whose endpoints cannot be resolved.

## A bounded projection

For entity navigation, a simple document projection is often enough:

1. connect two entities when they occur in the same document;
2. weight the edge by the number of distinct shared documents;
3. drop edges below `minSharedDocuments`;
4. keep only the strongest `K` neighbors per entity;
5. record the document IDs that justify each edge.

The bounds prevent a dense hairball and make the graph explainable. They also keep traversal latency predictable.

## Use the graph to retrieve, not to invent evidence

Entity-aware retrieval can expand a query to canonical names and aliases, find related document IDs, and add those documents as candidates. The answer must still cite the underlying chunks. A graph edge without retrievable provenance is navigation metadata, not answer evidence.

Apply tenant and authorization filters before graph traversal. Filtering only after traversal can leak the existence of protected entities through counts, labels, or timing.

## Evaluate independently

Track:

- entity precision and recall on a labeled sample;
- alias-resolution accuracy;
- relation precision, including direction;
- provenance coverage: percentage of edges with valid source chunks;
- retrieval lift over the non-graph baseline;
- cross-tenant leakage tests.

Do not keep a graph feature merely because it looks sophisticated. Keep it only when it improves a measured user task.
