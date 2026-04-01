import { normalizeExpansionPath } from './paths.js'
import { buildStructuredOverview } from '../overview/structuredOverview.js'
import { toArray } from '../utils/fieldHelpers.js'
import { RAW_HWP_DEFAULTS } from '../constants.js'

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
