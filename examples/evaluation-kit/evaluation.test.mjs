import test from "node:test";
import assert from "node:assert/strict";

import {
  auditCitationMarkers,
  authorizationAudit,
  citationMetrics,
  evaluateCase,
  retrievalMetrics,
  summarize,
  validateCaseDefinition,
} from "./metrics.mjs";

test("computes evidence recall and reciprocal rank", () => {
  const result = retrievalMetrics({
    retrievedIds: ["noise", "evidence-b", "evidence-a"],
    expectedEvidenceIds: ["evidence-a", "evidence-b"],
    k: 3,
  });

  assert.equal(result.recallAtK, 1);
  assert.equal(result.precisionAtK, 2 / 3);
  assert.equal(result.reciprocalRank, 1 / 2);
});

test("deduplicates repeated retrieval IDs", () => {
  const result = retrievalMetrics({
    retrievedIds: ["evidence", "evidence", "noise"],
    expectedEvidenceIds: ["evidence"],
    k: 2,
  });

  assert.equal(result.hits, 1);
  assert.equal(result.precisionAtK, 1 / 2);
});

test("computes citation precision, recall, and F1", () => {
  const result = citationMetrics({
    citedDocumentIds: ["evidence-a", "noise"],
    expectedEvidenceIds: ["evidence-a", "evidence-b"],
  });

  assert.equal(result.precision, 1 / 2);
  assert.equal(result.recall, 1 / 2);
  assert.equal(result.f1, 1 / 2);
});

test("detects retrieval outside the authorization scope", () => {
  const result = authorizationAudit({
    retrievedIds: ["allowed-a", "blocked-b"],
    allowedDocumentIds: ["allowed-a"],
  });

  assert.deepEqual(result.leakedDocumentIds, ["blocked-b"]);
  assert.equal(result.passed, false);
});

test("validates citation marker range and source identity", () => {
  const result = auditCitationMarkers({
    answer: "Supported claim.[^1] Unsupported marker.[^3]",
    sources: [{ id: "doc-a" }, { id: "doc-b" }],
  });

  assert.deepEqual(result.invalidMarkers, [3]);
  assert.deepEqual(result.citedDocumentIds, ["doc-a"]);
  assert.equal(result.passed, false);
});

test("flags duplicate source IDs because marker identity becomes ambiguous", () => {
  const result = auditCitationMarkers({
    answer: "A claim.[^1]",
    sources: [{ id: "doc-a" }, { id: "doc-a" }],
  });

  assert.deepEqual(result.duplicateSourceIds, ["doc-a"]);
  assert.equal(result.passed, false);
});

test("requires a citation by default and detects malformed markers", () => {
  const noCitation = auditCitationMarkers({
    answer: "A factual answer without evidence.",
    sources: [{ id: "doc-a" }],
  });
  const malformed = auditCitationMarkers({
    answer: "A claim.[^source-a]",
    sources: [{ id: "doc-a" }],
  });

  assert.equal(noCitation.passed, false);
  assert.deepEqual(malformed.malformedMarkers, ["[^source-a]"]);
  assert.equal(malformed.passed, false);
});

test("rejects expected evidence outside the authorization scope", () => {
  const result = validateCaseDefinition({
    id: "invalid-scope",
    question: "A synthetic question?",
    scope: { allowed_document_ids: ["doc-a"] },
    expected: { answerable: true, evidence_document_ids: ["doc-b"] },
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /authorization scope/);
});

test("scores correct refusal without inventing retrieval metrics", () => {
  const result = evaluateCase(
    {
      id: "unanswerable",
      question: "What is not present in the synthetic corpus?",
      scope: { allowed_document_ids: ["doc-a"] },
      expected: { answerable: false, evidence_document_ids: [] },
    },
    { retrieved_document_ids: [], cited_document_ids: [], answered: false },
  );

  assert.equal(result.refusalCorrect, true);
  assert.equal(result.retrieval, undefined);
  assert.equal(result.passed, true);
});

test("summarizes answerable and unanswerable cases separately", () => {
  const results = [
    evaluateCase(
      {
        id: "answerable",
        question: "What does the synthetic document say?",
        scope: { allowed_document_ids: ["doc-a"] },
        expected: { answerable: true, evidence_document_ids: ["doc-a"] },
      },
      {
        retrieved_document_ids: ["doc-a"],
        cited_document_ids: ["doc-a"],
        answered: true,
      },
    ),
    evaluateCase(
      {
        id: "unanswerable",
        question: "What is absent from the synthetic document?",
        scope: { allowed_document_ids: ["doc-a"] },
        expected: { answerable: false, evidence_document_ids: [] },
      },
      { retrieved_document_ids: [], cited_document_ids: [], answered: false },
    ),
  ];

  const summary = summarize(results);
  assert.equal(summary.passRate, 1);
  assert.equal(summary.retrievalRecallAtK, 1);
  assert.equal(summary.refusalAccuracy, 1);
});
