/**
 * Fuse independent ranked lists with weighted reciprocal rank fusion.
 * Scores are rank-based, so incomparable vector and lexical scores do not
 * need to be normalized onto a shared scale.
 */
export function rrfFuse(rankedLists, options = {}) {
  const { k = 60, topK = 10 } = options;

  if (!Array.isArray(rankedLists)) {
    throw new TypeError("rankedLists must be an array");
  }
  if (!Number.isFinite(k) || k <= 0) {
    throw new RangeError("k must be a positive number");
  }
  if (!Number.isInteger(topK) || topK < 0) {
    throw new RangeError("topK must be a non-negative integer");
  }

  const fused = new Map();

  for (const list of rankedLists) {
    const name = String(list?.name ?? "unnamed");
    const weight = list?.weight ?? 1;
    const items = list?.items ?? [];

    if (!Number.isFinite(weight) || weight < 0) {
      throw new RangeError(`weight for ${name} must be non-negative`);
    }
    if (!Array.isArray(items)) {
      throw new TypeError(`items for ${name} must be an array`);
    }
    if (weight === 0) continue;

    const seenInList = new Set();
    items.forEach((item, index) => {
      const id = String(item?.id ?? "").trim();
      if (!id || seenInList.has(id)) return;
      seenInList.add(id);

      const rank = index + 1;
      const contribution = weight / (k + rank);
      const entry = fused.get(id) ?? {
        id,
        score: 0,
        bestRank: Number.POSITIVE_INFINITY,
        sources: [],
      };

      entry.score += contribution;
      entry.bestRank = Math.min(entry.bestRank, rank);
      entry.sources.push({ name, rank, contribution });
      fused.set(id, entry);
    });
  }

  return [...fused.values()]
    .sort(
      (a, b) =>
        b.score - a.score || a.bestRank - b.bestRank || a.id.localeCompare(b.id),
    )
    .slice(0, topK);
}

/**
 * Assign stable citation labels only after the final ranking is known.
 */
export function attachCitations(results, documents) {
  const documentMap = new Map(documents.map((document) => [document.id, document]));

  return results.map((result, index) => {
    const document = documentMap.get(result.id);
    if (!document) {
      throw new Error(`No document metadata found for result ${result.id}`);
    }
    return {
      ...result,
      citation: `[^${index + 1}]`,
      title: document.title,
      url: document.url,
      excerpt: document.excerpt,
    };
  });
}
