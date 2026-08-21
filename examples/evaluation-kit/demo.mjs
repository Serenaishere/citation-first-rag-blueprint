import { readFile } from "node:fs/promises";

import { evaluateCase, summarize } from "./metrics.mjs";

async function readJsonLines(url) {
  const text = await readFile(url, "utf8");
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const cases = await readJsonLines(
  new URL("./fixtures/cases.synthetic.jsonl", import.meta.url),
);
const runs = await readJsonLines(
  new URL("./fixtures/runs.synthetic.jsonl", import.meta.url),
);
const runByCaseId = new Map(runs.map((run) => [run.case_id, run]));
const results = cases.map((caseDefinition) => {
  const run = runByCaseId.get(caseDefinition.id);
  if (!run) throw new Error(`Missing synthetic run for ${caseDefinition.id}`);
  return evaluateCase(caseDefinition, run, { k: 5 });
});

console.log(JSON.stringify({ results, summary: summarize(results) }, null, 2));
