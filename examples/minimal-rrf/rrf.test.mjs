import test from "node:test";
import assert from "node:assert/strict";

import { attachCitations, rrfFuse } from "./rrf.mjs";

test("promotes documents supported by more than one retriever", () => {
  const result = rrfFuse([
    { name: "vector", items: [{ id: "a" }, { id: "b" }] },
    { name: "lexical", items: [{ id: "b" }, { id: "c" }] },
  ]);

  assert.equal(result[0].id, "b");
  assert.equal(result[0].sources.length, 2);
});

test("applies retriever weights and ignores zero-weight lists", () => {
  const result = rrfFuse(
    [
      { name: "vector", weight: 0, items: [{ id: "a" }] },
      { name: "lexical", weight: 2, items: [{ id: "b" }] },
    ],
    { k: 60, topK: 1 },
  );

  assert.equal(result[0].id, "b");
});

test("counts a duplicate only once within a ranked list", () => {
  const [result] = rrfFuse([
    { name: "vector", items: [{ id: "a" }, { id: "a" }] },
  ]);

  assert.equal(result.sources.length, 1);
  assert.equal(result.bestRank, 1);
});

test("assigns citations after fusion and rejects missing metadata", () => {
  const ranked = rrfFuse([{ name: "vector", items: [{ id: "a" }] }]);
  const cited = attachCitations(ranked, [
    {
      id: "a",
      title: "Synthetic note",
      url: "https://example.invalid/note-a",
      excerpt: "A fictional excerpt.",
    },
  ]);

  assert.equal(cited[0].citation, "[^1]");
  assert.throws(() => attachCitations(ranked, []), /No document metadata/);
});
