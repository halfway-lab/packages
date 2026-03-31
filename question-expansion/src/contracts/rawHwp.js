import { normalizeExpansionPath } from './paths.js'
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

  return {
    ...(question ? { question } : {}),
    parent_path_id: String(payload.parent_path_id || parentPath.id || '').trim(),
    context,
    depth
  }
}

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
    ? input.payloads
        .map(item => parseJsonText(item?.text))
        .find(Boolean)
    : null
  const looksLikeChainEntry = Boolean(
    parsedInner ||
    input?.node_id ||
    input?.round_id ||
    Array.isArray(input?.questions) ||
    Array.isArray(input?.unfinished) ||
    Array.isArray(input?.blind_spot_signals)
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

    return {
      id: pickFirstNonEmpty([
        path?.id,
        path?.path_id,
        `${inner.round_id || `round_${inner.round || 1}`}-path-${index + 1}`
      ]),
      title,
      summary,
      next_question: nextQuestion,
      branch_type: pickFirstNonEmpty([
        path?.branch_type,
        path?.branchType,
        path?.path_type,
        'blind_spot_probe'
      ]),
      blind_spot_hint: blindSpotDescription,
      unfinished_score: inner.blind_spot_score,
      tensions,
      tags: ['live_hwp_chain_log']
    }
  })

  return {
    question: pickFirstNonEmpty([
      options.question,
      inner.question,
      inner.core_question,
      questions[0]
    ]),
    core_question: pickFirstNonEmpty([
      inner.core_question,
      inner.question,
      questions[0]
    ]),
    key_tensions: tensions,
    next_questions: unfinished.slice(0, 3),
    paths,
    meta: {
      source_kind: hasWrapperPayloads ? 'hwp_chain_log_entry' : 'hwp_chain_state',
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

  return {
    ...summary,
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
    meta: normalized?.meta || (auditPayload?.meta && typeof auditPayload.meta === 'object' ? auditPayload.meta : {})
  }
}
