# Ingestion and User Uploads

## Parsing principles

Use deterministic parsers before asking a model to interpret a document. Record parser version, warnings, page count, extracted character count, and source hash.

Common strategies:

| Format | Approach | Important limitation |
|---|---|---|
| TXT | decode with explicit fallback policy | encoding detection is probabilistic |
| Markdown | preserve headings and lists | embedded HTML remains untrusted |
| DOCX | extract paragraphs and tables | charts, formulas, and text boxes may be lost |
| Digital PDF | extract page by page | visual reading order may be wrong |
| Scanned PDF | detect low text density | requires a separate OCR workflow |

Do not call a PDF “empty” merely because text extraction returns little data. Report that it is probably scanned or image-based.

## Chunking

Chunk by document structure before applying a character or token window:

- Markdown: headings, then bounded windows;
- DOCX: paragraphs and table rows;
- PDF: page-aware paragraphs;
- transcripts: speaker turns and timestamp ranges;
- short posts: usually one chunk.

Store stable location metadata with every chunk. Overlap can improve recall but increases duplicate evidence and cost; measure it.

## Two-track indexing

Use a fast synchronous path and a resilient asynchronous path.

```text
uploading
  -> validating
  -> parsing
  -> chunking
  -> indexing_fts
  -> ready
  -> embedding
  -> fully_indexed
```

Terminal failure states might include `error` and `scanned_pdf_blocked`.

At `ready`, lexical retrieval is available. Vector retrieval joins when embeddings complete. The UI must explain this partial state rather than implying that all indexing is finished.

## Validation and limits

Before parsing:

- enforce a conservative byte limit at the HTTP layer;
- allowlist extensions and verify binary formats using magic bytes;
- sanitize display names and ignore client-supplied paths;
- hash content for deduplication;
- cap concurrent parsing and queue embedding work;
- reject encrypted or malformed files with a safe message;
- never use an uploaded filename as a filesystem path.

If source documents contain external links, do not fetch them automatically without an SSRF-safe URL policy.

## Atomic writes

Write document, chunk, and full-text rows in transactions. Avoid `INSERT OR REPLACE` when foreign-key cascades are present: SQLite implements replacement by deleting the old row first, which may delete children unexpectedly.

Virtual full-text tables commonly have no foreign-key cascade. Delete their rows explicitly when removing a document.

## Embedding queue

For a single-process reference implementation, serialize embedding jobs or use a small bounded queue. For each batch:

1. read chunks without vectors;
2. call the embedding provider with timeouts and bounded retries;
3. reject zero, malformed, or dimension-mismatched vectors;
4. write successful rows atomically;
5. append them to the live in-memory index;
6. publish progress using persisted counts.

Persist queue state when reliability requirements exceed what a process-local queue can provide.

## Recovery

Recovery depends on what was persisted:

| Interrupted state | Safe action |
|---|---|
| upload/parse with buffer only in memory | mark failed and ask for re-upload |
| chunks persisted, FTS incomplete | backfill missing FTS rows |
| embeddings incomplete | resume chunks without vectors |
| terminal state | no recovery action |

Recovery functions must be idempotent. Test each state against an isolated database.

## Deletion

Deletion must remove:

- upload metadata;
- document and chunks;
- vector rows;
- full-text rows;
- entity links and graph projections where applicable;
- cached previews and temporary files;
- live stream subscriptions or queued work.

In a multi-user system, authorize deletion against ownership before looking up or returning document metadata.
