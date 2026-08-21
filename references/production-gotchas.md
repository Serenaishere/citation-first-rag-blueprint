# Production gotchas

These failures are easy to miss in a demo and expensive in production.

## Network and streaming

- Configure proxies explicitly for the HTTP client used by the model or embedding SDK. Shell environment variables are not interpreted consistently by every runtime.
- Emit exactly one terminal server-sent event. Race completion, timeout, disconnect, and upstream error through a single state transition.
- Treat a client stream error as transport failure unless a valid terminal event was already received.
- Keep machine-readable event fields separate from rendered Markdown; sentinel strings can accidentally appear inside model prose.

## Storage and indexing

- Verify replacement semantics before using `REPLACE`-style database statements. Some engines implement them as delete-then-insert, which can trigger cascades.
- Delete lexical-index rows explicitly when the index is not protected by ordinary foreign keys.
- Do not insert placeholder rows that violate `NOT NULL` columns while waiting for asynchronous enrichment. Model lifecycle state directly.
- Store timestamps in one unambiguous UTC format. If a value is UTC, preserve the offset marker.
- Define date filters as half-open intervals such as `[start, nextDay)` to avoid excluding records late in the end date.
- Version embeddings and chunking settings. Re-index atomically or query only coherent versions.

## Graph and interface

- Do not initialize graph layouts inside a hidden or zero-size container. Wait until dimensions are stable, then trigger layout and fit.
- Add referenced nodes before edges, or reject dangling edges with a visible diagnostic.
- Keep selection state independent from a transient layout object so re-rendering does not silently clear context.

## Prompt behavior

- Models imitate demonstrations, including incidental wording and entities. Keep examples structurally representative but lexically diverse.
- Validate structured output after generation. Prompt instructions alone do not enforce schemas, citation IDs, or authorization.
- Record prompt, retrieval, parser, and index versions with evaluation results so regressions can be reproduced.
