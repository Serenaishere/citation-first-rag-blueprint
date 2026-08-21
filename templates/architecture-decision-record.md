# ADR: `<short decision title>`

- Status: `<proposed, accepted, superseded, rejected>`
- Date: `<YYYY-MM-DD>`
- Decision owners: `<roles>`
- Supersedes: `<ADR ID or none>`

## Context

Describe the user need, corpus, scale, security boundary, quality target, and operational constraints. Separate measured facts from assumptions.

## Decision drivers

- `<quality or evidence requirement>`
- `<security or authorization requirement>`
- `<latency, cost, operability, or portability constraint>`

## Options considered

| Option | Benefits | Costs and risks | Evidence |
| --- | --- | --- | --- |
| `<option A>` | `<benefits>` | `<costs>` | `<benchmark or experiment>` |
| `<option B>` | `<benefits>` | `<costs>` | `<benchmark or experiment>` |

## Decision

State what will be implemented, where the boundary sits, and what is explicitly deferred.

## Security and privacy consequences

- Authorization placement: `<before retrieval, inside each branch>`
- Data sent to external services: `<fields and purpose>`
- Logs and retention: `<minimum retained data>`
- Deletion behavior: `<indexes and derived artifacts>`
- New abuse cases: `<list>`

## Validation and rollback

- Acceptance metrics: `<evaluation cases and thresholds>`
- Observability: `<signals and alerts>`
- Rollback trigger: `<measurable condition>`
- Rollback procedure: `<steps>`

## Follow-up

- `<time-bounded experiment, migration, or documentation task>`
