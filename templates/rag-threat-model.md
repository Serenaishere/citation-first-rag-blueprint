# RAG threat model

## 1. System and data boundary

- Users and roles: `<roles>`
- Data owners and tenants: `<ownership model>`
- Trust boundaries: `<browser, API, parser, queue, indexes, model provider>`
- Sensitive assets: `<documents, metadata, prompts, credentials, audit logs>`
- Retention and deletion promise: `<policy>`

## 2. Data flow

```text
upload/source -> validation -> parser -> chunk store -> lexical/vector/graph indexes
question -> authorization -> retrieval -> evidence bundle -> model -> validator -> UI
```

Mark where data crosses a process, network, provider, tenant, or privilege boundary.

## 3. Abuse cases and controls

| Abuse case | Observable impact | Preventive control | Detection | Verification |
| --- | --- | --- | --- | --- |
| Malicious upload | parser compromise or resource exhaustion | type/signature allowlist, size and time limits, isolation | parser and resource alerts | malformed-file suite |
| Document prompt injection | model follows corpus instructions | evidence delimiters, instruction hierarchy, tool restrictions | injection case telemetry | adversarial corpus tests |
| Cross-scope retrieval | protected document existence or content leaks | authorization predicate inside every retriever | leaked-ID counter | tenant and ACL probes |
| Forged citation | unsupported claim looks grounded | candidate-ID allowlist and marker validation | invalid-marker metric | citation contract tests |
| Stale deletion | removed content remains searchable | shared deletion contract and index reconciliation | orphan-index scan | replacement/deletion tests |
| Unsafe rendering | script or malicious link executes | Markdown sanitization and URL policy | client security reporting | rendering payload suite |
| Sensitive logging | private evidence enters logs | structured redaction and minimum logging | log sampling | seeded canary test |

## 4. Failure behavior

- Fail closed for: `<authorization, tenant identity, citation identity>`
- Safe degradation: `<for example, vector unavailable -> authorized lexical retrieval>`
- User-visible error classes: `<safe codes>`
- Operator-only diagnostics: `<restricted metadata>`

## 5. Release evidence

- Security tests and revision: `<links or artifact IDs>`
- Known residual risks: `<risk, owner role, expiry>`
- Incident and rollback path: `<procedure>`
- Reviewer decision: `<accepted or blocked>`
