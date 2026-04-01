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
  const level = Number(options.level || rawPath.level || 1)
  const timestamp = options.timestamp || new Date().toISOString()
  const idSeed = options.idSeed || 'path'

  return {
    id: String(rawPath.id ?? buildFallbackId(idSeed, level, index)),
    path_title: String(rawPath.path_title || rawPath.title || `未命名路径 ${index + 1}`).trim(),
    path_summary: String(
      rawPath.path_summary ||
      rawPath.summary ||
      '当前返回缺少摘要，建议检查 provider 输出结构。'
    ).trim(),
    next_question: String(
      rawPath.next_question ||
      rawPath.nextQuestion ||
      '继续追问这个方向里最值得澄清的部分。'
    ).trim(),
    branch_type: String(rawPath.branch_type || rawPath.branchType || 'unknown').trim() || 'unknown',
    unfinished_score: clampUnfinishedScore(
      rawPath.unfinished_score ?? rawPath.unfinishedScore,
      0.5
    ),
    blind_spot_hint: String(
      rawPath.blind_spot_hint ||
      rawPath.blindSpotHint ||
      '当前返回缺少 blind spot 字段。'
    ).trim(),
    level,
    tags: Array.isArray(rawPath.tags) ? rawPath.tags.filter(Boolean) : [],
    created_at: String(rawPath.created_at || rawPath.createdAt || timestamp)
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
