import { pickStringField, pickNumberField, pickFieldWithSchema, toArray } from '../utils/fieldHelpers.js'
import { PATH_DEFAULTS } from '../constants.js'

/**
 * Clamp an unfinished score to the valid range [0, 1].
 * @param {number} value - The score to clamp
 * @param {number} [fallback=0.5] - Default value if input is invalid
 * @returns {number} Clamped score between 0 and 1
 */
function clampUnfinishedScore(value, fallback = 0.5) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }

  return Math.max(0, Math.min(1, value))
}

/**
 * Build a fallback ID for a path based on seed, level, and index.
 * @param {string} idSeed - Seed string for the ID
 * @param {number} level - Hierarchical level
 * @param {number} index - Index in the array
 * @returns {string} Generated fallback ID
 */
function buildFallbackId(idSeed, level, index) {
  const normalizedSeed = String(idSeed || 'path')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-_:/]/g, '')

  return `${normalizedSeed || 'path'}-${level}-${index + 1}`
}

/**
 * Deduplicate path IDs by appending index to duplicates.
 * @param {Array<{id: string}>} paths - Array of paths with IDs
 * @returns {Array<{id: string}>} Paths with unique IDs
 */
function dedupePathIds(paths = []) {
  const seen = new Set()

  return paths.map((path, index) => {
    let nextId = String(path.id)

    if (seen.has(nextId)) {
      nextId = `${nextId}-${index + 1}`
    }

    seen.add(nextId)
    return { ...path, id: nextId }
  })
}

/**
 * Normalize a raw expansion path into a stable path object.
 *
 * @param {Object} rawPath - Raw path data from adapter/provider
 * @param {string} [rawPath.id] - Path identifier
 * @param {string} [rawPath.path_title] - Path title
 * @param {string} [rawPath.path_summary] - Path summary
 * @param {string} [rawPath.next_question] - Suggested next question
 * @param {string} [rawPath.branch_type] - Branch type classification
 * @param {number} [rawPath.unfinished_score] - Unfinished score (0-1)
 * @param {string} [rawPath.blind_spot_hint] - Blind spot hint
 * @param {number} [rawPath.level] - Hierarchical level
 * @param {string[]} [rawPath.tags] - Associated tags
 * @param {string} [rawPath.created_at] - Creation timestamp
 * @param {Object} options - Normalization options
 * @param {number} [options.index=0] - Index for fallback ID generation
 * @param {number} [options.level] - Override level
 * @param {string} [options.timestamp] - Override timestamp
 * @param {string} [options.idSeed='path'] - Seed for fallback ID
 * @param {Object} [options.schema] - Protocol schema for field extraction
 * @returns {NormalizedPath} Normalized path object
 *
 * @example
 * const path = normalizeExpansionPath({
 *   title: 'Explore assumptions',
 *   branch_type: 'premise_shift'
 * }, { index: 0 })
 * // => { id: 'path-1-1', path_title: 'Explore assumptions', ... }
 */
export function normalizeExpansionPath(rawPath = {}, options = {}) {
  const index = Number(options.index || 0)
  const schema = options.schema || null
  const level = Number(options.level || pickNumberField(rawPath, 'level', schema, PATH_DEFAULTS.LEVEL))
  const timestamp = options.timestamp || new Date().toISOString()
  const idSeed = options.idSeed || PATH_DEFAULTS.ID_SEED
  const normalizedTags = toArray(
    schema
      ? pickFieldWithSchema(rawPath, 'tags', schema, null)
      : (rawPath.tags ?? rawPath.labels)
  )

  // 如果有 schema，使用 schema 的 fieldAliases，否则使用硬编码的 FIELD_ALIASES
  const getField = (fieldName, defaultValue) => {
    if (schema) {
      // 对于 next_question，优先使用 next_question 别名，然后回退到 open_questions/next_steps 数组的第一个元素
      if (fieldName === 'next_question') {
        const value = pickFieldWithSchema(rawPath, fieldName, schema, null)
          ?? pickFieldWithSchema(rawPath, 'open_questions', schema, null)?.[0]
          ?? pickFieldWithSchema(rawPath, 'next_steps', schema, null)?.[0]
        if (Array.isArray(value)) {
          return value[0] ?? defaultValue
        }
        return value ?? defaultValue
      }
      return pickFieldWithSchema(rawPath, fieldName, schema, defaultValue)
    }
    // 无 schema 时，根据字段类型选择适当的函数
    if (fieldName === 'unfinished_score' || fieldName === 'level') {
      return pickNumberField(rawPath, fieldName, defaultValue)
    }
    if (fieldName === 'next_question') {
      // 优先使用 next_question 别名，然后回退到 open_questions/next_steps 数组的第一个元素
      const value = pickFieldWithSchema(rawPath, fieldName, null, null)
        ?? pickFieldWithSchema(rawPath, 'open_questions', null, null)?.[0]
        ?? pickFieldWithSchema(rawPath, 'next_steps', null, null)?.[0]
      if (Array.isArray(value)) {
        return value[0] ?? defaultValue
      }
      return value !== undefined && value !== null ? String(value).trim() : defaultValue
    }
    return pickStringField(rawPath, fieldName, defaultValue)
  }

  return {
    id: String(getField('id') || buildFallbackId(idSeed, level, index)),
    path_title: getField('path_title', PATH_DEFAULTS.PATH_TITLE(index)),
    path_summary: getField('path_summary', PATH_DEFAULTS.PATH_SUMMARY),
    next_question: getField('next_question', PATH_DEFAULTS.NEXT_QUESTION),
    branch_type: getField('branch_type', PATH_DEFAULTS.BRANCH_TYPE) || PATH_DEFAULTS.BRANCH_TYPE,
    unfinished_score: clampUnfinishedScore(
      pickNumberField(rawPath, 'unfinished_score', schema),
      PATH_DEFAULTS.UNFINISHED_SCORE
    ),
    blind_spot_hint: getField('blind_spot_hint', PATH_DEFAULTS.BLIND_SPOT_HINT),
    level,
    tags: normalizedTags,
    created_at: getField('created_at', timestamp)
  }
}

/**
 * Normalize an expansion response from an adapter.
 *
 * @param {Object|Array} apiData - Raw API response data
 * @param {Array} [apiData.paths] - Array of paths if object format
 * @param {Object} options - Normalization options
 * @param {boolean} [options.allowEmpty=false] - Allow empty results
 * @param {number} [options.level] - Default level for paths
 * @param {string} [options.timestamp] - Default timestamp
 * @param {string} [options.idSeed] - Seed for fallback IDs
 * @param {Object} [options.schema] - Protocol schema for field extraction
 * @returns {NormalizedPath[]} Array of normalized paths
 * @throws {Error} If response does not contain a paths array
 * @throws {Error} If paths array is empty and allowEmpty is false
 *
 * @example
 * const paths = normalizeExpansionResponse({
 *   paths: [{ title: 'Path 1' }, { title: 'Path 2' }]
 * })
 * // => [{ id: 'path-1-1', path_title: 'Path 1', ... }, ...]
 */
export function normalizeExpansionResponse(apiData, options = {}) {
  const list = Array.isArray(apiData) ? apiData : apiData?.paths

  if (!Array.isArray(list)) {
    throw new Error('Adapter response did not contain a paths array')
  }

  const normalized = dedupePathIds(
    list
      .filter(Boolean)
      .map((path, index) => normalizeExpansionPath(path, {
        ...options,
        index
      }))
  )

  if (options.allowEmpty === true) {
    return normalized
  }

  if (normalized.length === 0) {
    throw new Error('Adapter returned an empty paths array')
  }

  return normalized
}
