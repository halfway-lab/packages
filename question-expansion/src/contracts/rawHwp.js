import { normalizeExpansionPath } from './paths.js'
import { buildStructuredOverview } from '../overview/structuredOverview.js'
import { toArray, pickFieldWithSchema } from '../utils/fieldHelpers.js'
import { RAW_HWP_DEFAULTS } from '../constants.js'
import { resolveProtocolSchema } from './protocolRegistry.js'
import { mergeStreamAndFinalPaths } from './partialExpansion.js'

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
 * @param {Object} [options.schema] - Protocol schema for field extraction
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
  const schema = options.schema || null

  const normalizedTags = toArray(
    pickFieldWithSchema(rawPath, 'tags', schema, null) || []
  )
  const normalizedTensions = toArray(
    rawPath.tensions ||
    pickFieldWithSchema(rawPath, 'key_tensions', schema, null)
  )
  const normalizedNextQuestion = pickFieldWithSchema(rawPath, 'next_question', schema, null)

  return {
    ...normalizeExpansionPath({
      id: pickFieldWithSchema(rawPath, 'id', schema, null),
      path_title: pickFieldWithSchema(rawPath, 'path_title', schema, null),
      path_summary: pickFieldWithSchema(rawPath, 'path_summary', schema, null),
      next_question: Array.isArray(normalizedNextQuestion)
        ? (normalizedNextQuestion[0] || null)
        : normalizedNextQuestion,
      branch_type: pickFieldWithSchema(rawPath, 'branch_type', schema, null),
      unfinished_score: pickFieldWithSchema(rawPath, 'unfinished_score', schema, null),
      blind_spot_hint: pickFieldWithSchema(rawPath, 'blind_spot_hint', schema, null),
      created_at: pickFieldWithSchema(rawPath, 'created_at', schema, null),
      level: rawPath.level ?? rawPath.depth ?? options.level,
      tags: normalizedTags
    }, options),
    tensions: normalizedTensions,
    source: RAW_HWP_DEFAULTS.SOURCE
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
  // 检测 protocol_version 并解析对应的 schema
  const protocolVersion = pickFieldWithSchema(rawHwp, 'protocol_version', null, null)
  const schema = resolveProtocolSchema(protocolVersion)

  const rawPaths = Array.isArray(rawHwp)
    ? rawHwp
    : (pickFieldWithSchema(rawHwp, 'paths', schema, null) || [])

  if (!Array.isArray(rawPaths)) {
    throw new Error('Raw HWP response did not contain a paths array')
  }

  let expansionPaths = rawPaths
    .filter(Boolean)
    .map((path, index) => normalizeRawHwpPath(path, {
      ...options,
      index,
      schema
    }))

  if (options.allowEmpty !== true && expansionPaths.length === 0) {
    throw new Error('Raw HWP response contained an empty paths array')
  }

  // 优先使用直接的 question 字段，然后是 core_question 别名，最后是 options.question
  const question = String(
    rawHwp.question ||
    pickFieldWithSchema(rawHwp, 'core_question', schema, null) ||
    options.question ||
    ''
  ).trim()
  const keyTensions = toArray(
    pickFieldWithSchema(rawHwp, 'key_tensions', schema, null)
  )
  const nextQuestions = toArray(
    pickFieldWithSchema(rawHwp, 'next_questions', schema, null)
  )
  const overview = (
    keyTensions.length === 0 || nextQuestions.length === 0
  )
    ? buildStructuredOverview(question, expansionPaths)
    : null

  // 构建 meta 信息，如果 schema 是回退的则记录
  const meta = rawHwp.meta && typeof rawHwp.meta === 'object' ? { ...rawHwp.meta } : {}
  const sessionId = String(pickFieldWithSchema(rawHwp, 'session_id', schema, '') || '').trim()
  if (sessionId) {
    meta.sessionId = meta.sessionId || sessionId
    meta.session_id = meta.session_id || sessionId
  }
  if (schema._fallback) {
    meta.protocolCompatibility = {
      status: 'fallback',
      requestedVersion: schema._requestedVersion,
      resolvedVersion: schema.version
    }
  }

  // 如果提供了 streamPaths，合并流式路径和最终路径以解决卡片跳位问题
  if (Array.isArray(options.streamPaths) && options.streamPaths.length > 0) {
    expansionPaths = mergeStreamAndFinalPaths(
      options.streamPaths,
      expansionPaths,
      { strategy: options.mergeStrategy || 'final_order' }
    )
  }

  return {
    question,
    expansionPaths,
    coreQuestion: String(pickFieldWithSchema(rawHwp, 'core_question', schema, '')).trim(),
    keyTensions: keyTensions.length > 0
      ? keyTensions
      : overview.keyTensions,
    nextQuestions: nextQuestions.length > 0
      ? nextQuestions
      : overview.nextQuestions,
    meta
  }
}
