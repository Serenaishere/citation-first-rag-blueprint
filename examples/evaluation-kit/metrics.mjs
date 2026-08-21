function uniqueStrings(values, fieldName) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${fieldName} must be an array`);
  }
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

function harmonicMean(precision, recall) {
  return precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
}

export function retrievalMetrics({ retrievedIds, expectedEvidenceIds, k = 5 }) {
  if (!Number.isInteger(k) || k <= 0) {
    throw new RangeError("k must be a positive integer");
  }

  const retrieved = uniqueStrings(retrievedIds, "retrievedIds").slice(0, k);
  const expected = uniqueStrings(expectedEvidenceIds, "expectedEvidenceIds");
  if (expected.length === 0) {
    throw new RangeError("expectedEvidenceIds must contain at least one document ID");
  }

  const expectedSet = new Set(expected);
  const hits = retrieved.filter((id) => expectedSet.has(id));
  const firstRelevantIndex = retrieved.findIndex((id) => expectedSet.has(id));

  return {
    k,
    hits: hits.length,
    recallAtK: hits.length / expected.length,
    precisionAtK: retrieved.length === 0 ? 0 : hits.length / retrieved.length,
    reciprocalRank: firstRelevantIndex < 0 ? 0 : 1 / (firstRelevantIndex + 1),
  };
}

export function citationMetrics({ citedDocumentIds, expectedEvidenceIds }) {
  const cited = uniqueStrings(citedDocumentIds, "citedDocumentIds");
  const expected = uniqueStrings(expectedEvidenceIds, "expectedEvidenceIds");
  const citedSet = new Set(cited);
  const expectedSet = new Set(expected);
  const truePositives = cited.filter((id) => expectedSet.has(id)).length;
  const precision = cited.length === 0 ? 0 : truePositives / cited.length;
  const recall = expected.length === 0 ? 1 : expected.filter((id) => citedSet.has(id)).length / expected.length;

  return {
    cited: cited.length,
    expected: expected.length,
    truePositives,
    precision,
    recall,
    f1: harmonicMean(precision, recall),
  };
}

export function authorizationAudit({ retrievedIds, allowedDocumentIds }) {
  const retrieved = uniqueStrings(retrievedIds, "retrievedIds");
  const allowed = new Set(uniqueStrings(allowedDocumentIds, "allowedDocumentIds"));
  const leakedDocumentIds = retrieved.filter((id) => !allowed.has(id));

  return {
    checked: retrieved.length,
    leakedDocumentIds,
    leakageRate: retrieved.length === 0 ? 0 : leakedDocumentIds.length / retrieved.length,
    passed: leakedDocumentIds.length === 0,
  };
}

export function auditCitationMarkers({ answer, sources, requireAtLeastOne = true }) {
  if (typeof answer !== "string") {
    throw new TypeError("answer must be a string");
  }
  if (!Array.isArray(sources)) {
    throw new TypeError("sources must be an array");
  }

  const sourceIds = sources.map((source) => String(source?.id ?? "").trim());
  const missingSourcePositions = sourceIds
    .map((id, index) => (id ? null : index + 1))
    .filter((position) => position !== null);
  const duplicateSourceIds = sourceIds.filter(
    (id, index) => id && sourceIds.indexOf(id) !== index,
  );
  const rawMarkers = [...answer.matchAll(/\[\^([^\]]+)\]/g)].map((match) => match[0]);
  const malformedMarkers = [...new Set(rawMarkers.filter((marker) => !/^\[\^\d+\]$/.test(marker)))];
  const markers = [...answer.matchAll(/\[\^(\d+)\]/g)].map((match) => Number(match[1]));
  const invalidMarkers = [...new Set(markers.filter((number) => number < 1 || number > sources.length))];
  const citedDocumentIds = [
    ...new Set(
      markers
        .filter((number) => number >= 1 && number <= sources.length)
        .map((number) => sourceIds[number - 1])
        .filter(Boolean),
    ),
  ];

  return {
    markers,
    invalidMarkers,
    malformedMarkers,
    citedDocumentIds,
    duplicateSourceIds: [...new Set(duplicateSourceIds)],
    missingSourcePositions,
    hasCitations: markers.length > 0,
    passed:
      invalidMarkers.length === 0 &&
      malformedMarkers.length === 0 &&
      duplicateSourceIds.length === 0 &&
      missingSourcePositions.length === 0 &&
      (!requireAtLeastOne || markers.length > 0),
  };
}

export function validateCaseDefinition(caseDefinition) {
  const errors = [];
  const id = String(caseDefinition?.id ?? "").trim();
  const allowed = uniqueStrings(
    caseDefinition?.scope?.allowed_document_ids ?? [],
    "scope.allowed_document_ids",
  );
  const evidence = uniqueStrings(
    caseDefinition?.expected?.evidence_document_ids ?? [],
    "expected.evidence_document_ids",
  );
  const answerable = caseDefinition?.expected?.answerable;

  if (!id) errors.push("id is required");
  if (typeof caseDefinition?.question !== "string" || !caseDefinition.question.trim()) {
    errors.push("question is required");
  }
  if (allowed.length === 0) errors.push("authorization scope must not be empty");
  if (typeof answerable !== "boolean") errors.push("expected.answerable must be boolean");
  if (answerable === true && evidence.length === 0) {
    errors.push("answerable cases require expected evidence");
  }
  if (answerable === false && evidence.length > 0) {
    errors.push("unanswerable cases must not declare expected evidence");
  }

  const allowedSet = new Set(allowed);
  const evidenceOutsideScope = evidence.filter((documentId) => !allowedSet.has(documentId));
  if (evidenceOutsideScope.length > 0) {
    errors.push("expected evidence must be inside the authorization scope");
  }

  return { valid: errors.length === 0, errors };
}

export function evaluateCase(caseDefinition, run, { k = 5 } = {}) {
  const expected = caseDefinition?.expected;
  const scope = caseDefinition?.scope;
  if (!caseDefinition?.id || !expected || !scope) {
    throw new TypeError("caseDefinition must contain id, scope, and expected");
  }
  const validation = validateCaseDefinition(caseDefinition);
  if (!validation.valid) {
    throw new TypeError(`Invalid case ${caseDefinition.id}: ${validation.errors.join("; ")}`);
  }

  const authorization = authorizationAudit({
    retrievedIds: run?.retrieved_document_ids ?? [],
    allowedDocumentIds: scope.allowed_document_ids ?? [],
  });
  const refusalCorrect = expected.answerable
    ? Boolean(run?.answered)
    : !Boolean(run?.answered);

  if (!expected.answerable) {
    return {
      id: caseDefinition.id,
      answerable: false,
      refusalCorrect,
      authorization,
      passed: refusalCorrect && authorization.passed,
    };
  }

  const retrieval = retrievalMetrics({
    retrievedIds: run?.retrieved_document_ids ?? [],
    expectedEvidenceIds: expected.evidence_document_ids ?? [],
    k,
  });
  const citations = citationMetrics({
    citedDocumentIds: run?.cited_document_ids ?? [],
    expectedEvidenceIds: expected.evidence_document_ids ?? [],
  });

  return {
    id: caseDefinition.id,
    answerable: true,
    refusalCorrect,
    authorization,
    retrieval,
    citations,
    passed:
      refusalCorrect &&
      authorization.passed &&
      retrieval.recallAtK === 1 &&
      citations.precision === 1 &&
      citations.recall === 1,
  };
}

export function summarize(results) {
  if (!Array.isArray(results) || results.length === 0) {
    throw new RangeError("results must contain at least one evaluated case");
  }

  const answerable = results.filter((result) => result.answerable);
  const mean = (values) =>
    values.length === 0 ? null : values.reduce((total, value) => total + value, 0) / values.length;

  return {
    cases: results.length,
    passRate: mean(results.map((result) => Number(result.passed))),
    refusalAccuracy: mean(results.map((result) => Number(result.refusalCorrect))),
    authorizationPassRate: mean(
      results.map((result) => Number(result.authorization.passed)),
    ),
    retrievalRecallAtK: mean(answerable.map((result) => result.retrieval.recallAtK)),
    reciprocalRank: mean(answerable.map((result) => result.retrieval.reciprocalRank)),
    citationPrecision: mean(answerable.map((result) => result.citations.precision)),
    citationRecall: mean(answerable.map((result) => result.citations.recall)),
  };
}
