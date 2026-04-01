import { normalizeExpansionPath } from './paths.js'
import { inferLiveBranchType } from './liveBranchTypeHeuristics.js'
import { buildStructuredOverview } from '../overview/structuredOverview.js'

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function hasAnyField(target, keys = []) {
  return keys.some(key => {
    const value = target?.[key]
    return value !== undefined && value !== null && value !== ''
  })
}

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

function pickFirstNonEmpty(values = []) {
  for (const value of values) {
    const normalized = String(value || '').trim()
    if (normalized) {
      return normalized
    }
  }

  return ''
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

/**
 * Build a raw HWP expand request payload.
 *
 * @param {Object} payload - Request payload
 * @param {number} [payload.depth=1] - Expansion depth level
 * @param {string} [payload.question] - Question to expand
 * @param {Object} [payload.options] - Additional options
 * @param {Object} [payload.parentPath] - Parent path for nested expansions
 * @param {string} [payload.parentPath.id] - Parent path ID
 * @param {string} [payload.parentPath.path_title] - Parent path title
 * @param {string} [payload.parentPath.path_summary] - Parent path summary
 * @param {string} [payload.parentPath.next_question] - Parent next question
 * @param {number} [payload.parentPath.level] - Parent level
 * @param {Object} [payload.context] - Override context object
 * @param {string} [payload.parent_path_id] - Parent path ID (alternative to parentPath.id)
 * @returns {Object} Raw HWP expand request
 * @throws {Error} If depth > 1 and no parent_path_id or parentPath.id provided
 *
 * @example
 * // Root level expansion
 * buildRawHwpExpandRequest({ question: 'How do we improve?', depth: 1 })
 * // => { question: 'How do we improve?', depth: 1 }
 *
 * // Nested expansion
 * buildRawHwpExpandRequest({
 *   question: 'Dig deeper',
 *   depth: 2,
 *   parentPath: { id: 'path-1', path_title: 'Analysis' }
 * })
 * // => { question: 'Dig deeper', parent_path_id: 'path-1', context: {...}, depth: 2 }
 */
export function buildRawHwpExpandRequest(payload = {}) {
  const depth = Number(payload.depth || 1)
  const question = String(payload.question || '').trim()
  const options = payload.options && typeof payload.options === 'object'
    ? payload.options
    : undefined

  if (depth <= 1) {
    return {
      question,
      depth: 1,
      ...(options ? { options } : {})
    }
  }

  const parentPath = payload.parentPath || {}
  const context = payload.context && typeof payload.context === 'object'
    ? payload.context
    : {
        parent_title: parentPath.path_title,
        parent_summary: parentPath.path_summary,
        parent_next_question: parentPath.next_question,
        parent_level: parentPath.level ?? depth - 1
      }
  const parentPathId = String(payload.parent_path_id || parentPath.id || '').trim()

  if (!parentPathId) {
    throw new Error('Nested raw HWP expansion requests require parent_path_id or parentPath.id')
  }

  return {
    ...(question ? { question } : {}),
    parent_path_id: parentPathId,
    context,
    depth
  }
}

/**
 * Normalize a raw HWP path with additional raw-specific fields.
 *
 * @param {RawHwpPath} rawPath - Raw HWP path data
 * @param {NormalizeOptions} options - Normalization options
 * @returns {NormalizedPath & {tensions: string[], source: string}} Normalized path with tensions
 *
 * @example
 * normalizeRawHwpPath({
 *   path_id: '1',
 *   title: 'Analysis',
 *   tensions: [{ description: 'Key tension' }]
 * })
 * // => { id: '1', path_title: 'Analysis', tensions: ['Key tension'], source: 'raw_hwp', ... }
 */
export function normalizeRawHwpPath(rawPath = {}, options = {}) {
  const normalizedTags = toArray(rawPath.tags || rawPath.labels)
  const normalizedTensions = toArray(
    rawPath.tensions ||
    rawPath.key_tensions ||
    rawPath.keyTensions
  )

  return {
    ...normalizeExpansionPath({
      id: rawPath.id || rawPath.path_id || rawPath.pathId,
      path_title: rawPath.path_title || rawPath.title || rawPath.pathTitle,
      path_summary: rawPath.path_summary || rawPath.summary || rawPath.pathSummary,
      next_question: rawPath.next_question || rawPath.nextQuestion || rawPath.follow_up_question,
      branch_type: rawPath.branch_type || rawPath.branchType || rawPath.path_type,
      unfinished_score: rawPath.unfinished_score ?? rawPath.unfinishedScore ?? rawPath.open_score,
      blind_spot_hint: rawPath.blind_spot_hint || rawPath.blindSpotHint || rawPath.risk_hint,
      created_at: rawPath.created_at || rawPath.createdAt,
      level: rawPath.level ?? rawPath.depth ?? options.level,
      tags: normalizedTags
    }, options),
    tensions: normalizedTensions,
    source: 'raw_hwp'
  }
}

/**
 * Normalize a raw HWP expansion response.
 *
 * @param {RawHwpExpansion|RawHwpExpansion[]} rawHwp - Raw HWP expansion data
 * @param {NormalizeOptions} options - Normalization options
 * @returns {NormalizedExpansion} Normalized expansion result
 * @throws {Error} If response does not contain a valid paths array
 *
 * @example
 * normalizeRawHwpExpansion({
 *   question: 'How do we improve?',
 *   paths: [{ path_id: '1', title: 'Analysis' }]
 * })
 * // => { question: 'How do we improve?', expansionPaths: [...], ... }
 */
export function normalizeRawHwpExpansion(rawHwp = {}, options = {}) {
  const rawPaths = Array.isArray(rawHwp) ? rawHwp : (rawHwp.paths || rawHwp.expansion_paths || [])

  if (!Array.isArray(rawPaths)) {
    throw new Error('Raw HWP response did not contain a paths array')
  }

  const expansionPaths = rawPaths
    .filter(Boolean)
    .map((path, index) => normalizeRawHwpPath(path, {
      ...options,
      index
    }))

  if (options.allowEmpty !== true && expansionPaths.length === 0) {
    throw new Error('Raw HWP response contained an empty paths array')
  }

  const question = String(
    rawHwp.question ||
    rawHwp.core_question ||
    rawHwp.coreQuestion ||
    options.question ||
    ''
  ).trim()
  const keyTensions = toArray(rawHwp.key_tensions || rawHwp.keyTensions)
  const nextQuestions = toArray(rawHwp.next_questions || rawHwp.nextQuestions)

  return {
    question,
    expansionPaths,
    coreQuestion: String(rawHwp.core_question || rawHwp.coreQuestion || '').trim(),
    keyTensions: keyTensions.length > 0
      ? keyTensions
      : buildStructuredOverview(question, expansionPaths).keyTensions,
    nextQuestions: nextQuestions.length > 0
      ? nextQuestions
      : buildStructuredOverview(question, expansionPaths).nextQuestions,
    meta: rawHwp.meta && typeof rawHwp.meta === 'object' ? rawHwp.meta : {}
  }
}

/**
 * Validate a raw HWP expansion payload.
 *
 * @param {RawHwpExpansion|RawHwpExpansion[]} rawHwp - Raw HWP data to validate
 * @param {ValidateOptions} options - Validation options
 * @returns {ValidationResult} Validation result with findings and normalized data
 *
 * @example
 * validateRawHwpExpansion({
 *   question: 'How?',
 *   paths: [{ title: 'Analysis' }]
 * })
 * // => { valid: false, findings: [...], normalized: null }
 */
export function validateRawHwpExpansion(rawHwp = {}, options = {}) {
  const findings = []
  const rawPaths = Array.isArray(rawHwp)
    ? rawHwp
    : (rawHwp.paths || rawHwp.expansion_paths || [])

  if (!Array.isArray(rawPaths)) {
    findings.push({
      level: 'error',
      field: 'paths',
      message: 'Missing paths array in raw HWP payload.'
    })
  } else if (rawPaths.length === 0 && options.allowEmpty !== true) {
    findings.push({
      level: 'error',
      field: 'paths',
      message: 'Raw HWP payload contains an empty paths array.'
    })
  }

  if (!hasAnyField(rawHwp, ['question', 'core_question', 'coreQuestion']) && !options.question) {
    findings.push({
      level: 'warning',
      field: 'question',
      message: 'Raw HWP payload does not expose question or core question context.'
    })
  }

  if (Array.isArray(rawPaths)) {
    rawPaths.forEach((path, index) => {
      if (!hasAnyField(path, ['id', 'path_id', 'pathId'])) {
        findings.push({
          level: 'warning',
          field: `paths[${index}].id`,
          message: 'Path is missing an explicit id field.'
        })
      }

      if (!hasAnyField(path, ['title', 'path_title', 'pathTitle'])) {
        findings.push({
          level: 'error',
          field: `paths[${index}].title`,
          message: 'Path is missing title/path_title.'
        })
      }

      if (!hasAnyField(path, ['next_question', 'nextQuestion', 'follow_up_question'])) {
        findings.push({
          level: 'warning',
          field: `paths[${index}].next_question`,
          message: 'Path is missing next question / follow-up question.'
        })
      }

      if (!hasAnyField(path, ['branch_type', 'branchType', 'path_type'])) {
        findings.push({
          level: 'warning',
          field: `paths[${index}].branch_type`,
          message: 'Path is missing branch type / path type.'
        })
      }
    })
  }

  const errors = findings.filter(item => item.level === 'error')

  return {
    valid: errors.length === 0,
    findings,
    normalized: errors.length === 0
      ? normalizeRawHwpExpansion(rawHwp, options)
      : null
  }
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
    return input
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
            session_id: input.meta.agentMeta.sessionId
          }
        : {}),
      ...(inner.meta && typeof inner.meta === 'object' ? inner.meta : {})
    }
  }
}

/**
 * Summarize validation results into a human-readable format.
 *
 * @param {Object} validation - Validation result
 * @param {boolean} [validation.valid] - Whether validation passed
 * @param {ValidationFinding[]} [validation.findings] - Array of findings
 * @returns {ValidationSummary} Summarized validation results
 *
 * @example
 * summarizeRawHwpValidation({
 *   valid: false,
 *   findings: [{ level: 'error', field: 'paths', message: '...' }]
 * })
 * // => { valid: false, errorCount: 1, warningCount: 0, summaryLine: '...', ... }
 */
export function summarizeRawHwpValidation(validation = {}) {
  const findings = Array.isArray(validation.findings) ? validation.findings : []
  const errors = findings.filter(item => item.level === 'error')
  const warnings = findings.filter(item => item.level === 'warning')

  return {
    valid: validation.valid === true,
    errorCount: errors.length,
    warningCount: warnings.length,
    summaryLine: validation.valid === true
      ? (warnings.length > 0
          ? `Raw HWP payload valid with ${warnings.length} warning(s).`
          : 'Raw HWP payload valid.')
      : `Raw HWP payload invalid with ${errors.length} error(s) and ${warnings.length} warning(s).`,
    errorFields: errors.map(item => item.field),
    warningFields: warnings.map(item => item.field)
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
    meta: normalized?.meta || (auditPayload?.meta && typeof auditPayload.meta === 'object' ? auditPayload.meta : {})
  }
}
