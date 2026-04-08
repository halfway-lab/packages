import { inferLiveBranchType } from './liveBranchTypeHeuristics.js'
import { validateRawHwpExpansion, summarizeRawHwpValidation } from './rawHwpValidation.js'
import { toArray, hasAnyField, pickFirstNonEmpty } from '../utils/fieldHelpers.js'

function parseJsonText(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function looksLikeChainState(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    (
      value.node_id ||
      value.round_id ||
      Array.isArray(value.questions) ||
      Array.isArray(value.unfinished) ||
      Array.isArray(value.blind_spot_signals)
    )
  )
}

function pickAuditPayloadFromWrapper(payloads = []) {
  const parsedEntries = payloads
    .map(item => parseJsonText(item?.text))
    .filter(Boolean)

  const chainEntries = parsedEntries.filter(looksLikeChainState)

  if (chainEntries.length > 0) {
    return chainEntries.at(-1)
  }

  return parsedEntries.at(-1) || null
}

export function extractRawHwpAuditPayload(input = {}, options = {}) {
  const hasWrapperPayloads = Array.isArray(input?.payloads)
  const parsedInner = hasWrapperPayloads
    ? pickAuditPayloadFromWrapper(input.payloads)
    : null
  const looksLikeChainEntry = Boolean(
    looksLikeChainState(parsedInner) ||
    looksLikeChainState(input)
  )

  if (!looksLikeChainEntry) {
    // For non-chain payloads, still enrich with protocol_version and semantic_groups metadata
    const sourceMeta = input?.meta && typeof input.meta === 'object' ? input.meta : {}
    return {
      ...input,
      meta: {
        ...sourceMeta,
        protocol_version: String(input?.protocol_version || '').trim(),
        semantic_groups_count: Array.isArray(input?.semantic_groups)
          ? input.semantic_groups.length
          : 0
      }
    }
  }

  const inner = parsedInner || input

  const questions = toArray(inner.questions)
  const tensions = toArray(inner.tensions)
    .map(item => String(item?.description || item).trim())
    .filter(Boolean)
  const unfinished = toArray(inner.unfinished)
    .map(item => String(item || '').trim())
    .filter(Boolean)
  const blindSpotSignals = toArray(inner.blind_spot_signals)
  const derivedFieldMap = {
    question: [],
    core_question: [],
    key_tensions: [],
    next_questions: [],
    paths: []
  }

  const paths = toArray(inner.paths).map((path, index) => {
    const blindSpot = path?.blind_spot && typeof path.blind_spot === 'object'
      ? path.blind_spot
      : {}
    const blindSpotDescription = String(
      blindSpot.description ||
      blindSpotSignals[index]?.description ||
      ''
    ).trim()
    const title = pickFirstNonEmpty([
      path?.title,
      path?.path_title,
      blindSpotDescription,
      `Exploration path ${index + 1}`
    ])
    const summary = pickFirstNonEmpty([
      path?.summary,
      path?.path_summary,
      blindSpot.impact,
      blindSpotDescription
    ])
    const nextQuestion = pickFirstNonEmpty([
      path?.next_question,
      path?.nextQuestion,
      path?.follow_up_question,
      path?.continuation_hook,
      unfinished[index],
      questions[index + 1]
    ])
    const explicitBranchType = pickFirstNonEmpty([
      path?.branch_type,
      path?.branchType,
      path?.path_type
    ])
    const inferredBranchType = inferLiveBranchType({
      title,
      summary,
      nextQuestion,
      blindSpotHint: blindSpotDescription
    })
    const branchType = explicitBranchType || inferredBranchType.branchType
    const id = pickFirstNonEmpty([
      path?.id,
      path?.path_id,
      `${inner.round_id || `round_${inner.round || 1}`}-path-${index + 1}`
    ])

    derivedFieldMap.paths.push({
      index,
      id,
      derived: {
        title: !hasAnyField(path, ['title', 'path_title', 'pathTitle']),
        summary: !hasAnyField(path, ['summary', 'path_summary', 'pathSummary']),
        next_question: !hasAnyField(path, ['next_question', 'nextQuestion', 'follow_up_question']),
        branch_type: !explicitBranchType
      },
      branch_type_source: explicitBranchType ? 'raw' : 'inferred',
      branch_type: branchType,
      heuristic: explicitBranchType
        ? {
            rule_id: 'raw_branch_type',
            matched_keywords: [],
            confidence: 'exact'
          }
        : {
            rule_id: inferredBranchType.ruleId,
            matched_keywords: inferredBranchType.matchedKeywords,
            confidence: inferredBranchType.confidence
          }
    })

    return {
      id,
      title,
      summary,
      next_question: nextQuestion,
      branch_type: branchType,
      blind_spot_hint: blindSpotDescription,
      unfinished_score: inner.blind_spot_score,
      tensions,
      tags: ['live_hwp_chain_log']
    }
  })

  const question = pickFirstNonEmpty([
    options.question,
    inner.question,
    inner.core_question,
    questions[0]
  ])
  const coreQuestion = pickFirstNonEmpty([
    inner.core_question,
    inner.question,
    questions[0]
  ])
  const nextQuestions = unfinished.slice(0, 3)

  derivedFieldMap.question = [
    options.question ? 'options.question' : '',
    inner.question ? 'inner.question' : '',
    inner.core_question ? 'inner.core_question' : '',
    questions[0] ? 'questions[0]' : ''
  ].filter(Boolean)
  derivedFieldMap.core_question = [
    inner.core_question ? 'inner.core_question' : '',
    inner.question ? 'inner.question' : '',
    questions[0] ? 'questions[0]' : ''
  ].filter(Boolean)
  derivedFieldMap.key_tensions = tensions.length > 0 ? ['tensions[].description'] : []
  derivedFieldMap.next_questions = nextQuestions.length > 0 ? ['unfinished[]'] : []

  return {
    question,
    core_question: coreQuestion,
    key_tensions: tensions,
    next_questions: nextQuestions,
    paths,
    meta: {
      source_kind: hasWrapperPayloads ? 'hwp_chain_log_entry' : 'hwp_chain_state',
      extraction_mode: 'derived_for_audit',
      derived_fields: derivedFieldMap,
      round: inner.round,
      round_id: inner.round_id || '',
      node_id: inner.node_id || '',
      parent_id: inner.parent_id || '',
      continuity_score: inner.continuity_score,
      blind_spot_score: inner.blind_spot_score,
      ...(input?.meta?.agentMeta && typeof input.meta.agentMeta === 'object'
        ? {
            provider: input.meta.agentMeta.provider,
            model: input.meta.agentMeta.model,
            sessionId: input.meta.agentMeta.sessionId,
            session_id: input.meta.agentMeta.sessionId
          }
        : {}),
      protocol_version: String(inner.protocol_version || '').trim(),
      semantic_groups_count: Array.isArray(inner.semantic_groups)
        ? inner.semantic_groups.length
        : 0,
      ...(inner.meta && typeof inner.meta === 'object' ? inner.meta : {})
    }
  }
}

export function buildRawHwpAuditReport(rawHwp = {}, options = {}) {
  const auditPayload = extractRawHwpAuditPayload(rawHwp, options)
  const validation = validateRawHwpExpansion(auditPayload, options)
  const summary = summarizeRawHwpValidation(validation)
  const normalized = validation.normalized
  const pathPreviews = (normalized?.expansionPaths || []).slice(0, 5).map(path => ({
    id: path.id,
    title: path.path_title,
    branchType: path.branch_type,
    nextQuestion: path.next_question,
    blindSpotHint: path.blind_spot_hint,
    heuristic: auditPayload?.meta?.derived_fields?.paths?.find(item => item.id === path.id)?.heuristic || null
  }))

  return {
    ...summary,
    sourceKind: auditPayload?.meta?.source_kind || 'raw_hwp_payload',
    extractionMode: auditPayload?.meta?.extraction_mode || 'none',
    findings: validation.findings,
    question: normalized?.question || String(auditPayload?.question || auditPayload?.core_question || '').trim(),
    pathCount: normalized?.expansionPaths?.length || 0,
    branchTypes: Array.from(new Set(
      (normalized?.expansionPaths || [])
        .map(path => String(path.branch_type || '').trim())
        .filter(Boolean)
    )),
    nextQuestions: (normalized?.nextQuestions || []).slice(0, 3),
    keyTensions: (normalized?.keyTensions || []).slice(0, 3),
    pathPreviews,
    derivedFields: auditPayload?.meta?.derived_fields || {},
    protocolVersion: auditPayload?.meta?.protocol_version || '',
    semanticGroupsCount: auditPayload?.meta?.semantic_groups_count || 0,
    meta: normalized?.meta || (auditPayload?.meta && typeof auditPayload.meta === 'object' ? auditPayload.meta : {})
  }
}
