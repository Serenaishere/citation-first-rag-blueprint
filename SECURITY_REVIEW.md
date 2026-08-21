# Public Release Security Review

Review date: 2026-08-21

## Scope

Reviewed all files in this repository before the first public release.

The repository was created from a clean allowlist. No source-control history, runtime database, generated feed, production log, office document, crawler state, or customer artifact was imported.

## Deterministic checks

The release gate scans for:

- private-key blocks;
- password, token, API-key, and secret assignments;
- bearer credentials and credential-bearing connection strings;
- private IPv4 ranges and identifiable internal domains;
- absolute production paths;
- email addresses and phone numbers;
- filenames or prose associated with customers, military deployments, pricing, or internal handoffs;
- high-entropy credential-like strings.

Placeholders such as `${API_KEY}` are permitted only when clearly documented as environment variables and contain no real value.

## Content and provenance checks

- Examples use fictional documents and deterministic rankings.
- No third-party source code is vendored.
- No benchmark or universal-accuracy claim is made.
- Retrieval weights are described as starting points that require evaluation.
- The documentation distinguishes citation traceability from source truth.
- The documentation warns that retrieved text is untrusted and may contain prompt injection.
- The only example URLs use the reserved `.invalid` top-level domain.
- GitHub Actions are pinned to full commit hashes and Dependabot watches action updates.

## Executed release checks

All checks below passed on 2026-08-21:

```text
node scripts/security-scan.mjs
npm test --prefix examples/minimal-rrf
python <skill-creator>/scripts/quick_validate.py <repository>
```

The algorithm suite contains four passing tests. The skill validator reports a valid skill package. A separate semantic denylist review found no local product names, restricted business context, customer identifiers, or collaboration-system references.

The standalone `SKILL.md` review result is recorded in [`skill-review.json`](skill-review.json).

## Result

Safe for the first public review. This conclusion covers only the files and revision reviewed here; it is not a security certification. Any later contribution must satisfy the same gate.
