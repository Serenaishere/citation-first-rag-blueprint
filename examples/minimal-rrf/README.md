# Minimal reciprocal rank fusion example

This dependency-free example fuses synthetic vector and lexical rankings, then assigns citation labels after the final order is known. It performs no network requests and contains no production data.

Requirements: Node.js 20 or later.

```bash
npm test
npm run demo
```

The implementation intentionally accepts only ranked document IDs. In a real system, apply authorization filters inside each retriever before passing candidates to fusion.
