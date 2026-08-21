import { readFile } from "node:fs/promises";

import { attachCitations, rrfFuse } from "./rrf.mjs";

const fixtureUrl = new URL("./synthetic-rankings.json", import.meta.url);
const fixture = JSON.parse(await readFile(fixtureUrl, "utf8"));
const fused = rrfFuse(fixture.rankedLists, { topK: 3 });
const cited = attachCitations(fused, fixture.documents);

console.log(`Query: ${fixture.query}`);
for (const item of cited) {
  const sourceSummary = item.sources
    .map((source) => `${source.name}@${source.rank}`)
    .join(", ");
  console.log(`${item.citation} ${item.title} — ${sourceSummary}`);
  console.log(`    ${item.excerpt}`);
}
