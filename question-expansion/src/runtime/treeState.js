/**
 * Create a unique session ID.
 *
 * @param {SessionIdOptions} [options={}] - Session ID options
 * @param {number} [options.timestamp] - Unix timestamp (defaults to now)
 * @param {string} [options.randomPart] - Random string component
 * @returns {string} Unique session ID in format 'session-{timestamp}-{random}'
 *
 * @example
 * createSessionId() // => 'session-1712345678901-a3f9b2'
 * createSessionId({ timestamp: 1712345678901, randomPart: 'abc123' })
 * // => 'session-1712345678901-abc123'
 */
export function createSessionId(options = {}) {
  const timestamp = Number(options.timestamp || Date.now())
  const randomPart = options.randomPart || Math.random().toString(36).slice(2, 8)

  return `session-${timestamp}-${randomPart}`
}

/**
 * Build a parent map for root paths (all map to null).
 *
 * @param {Array<{id: string|number}>} paths - Root paths
 * @returns {ParentMap} Map of path IDs to null (indicating no parent)
 *
 * @example
 * buildRootParentMap([{ id: '1' }, { id: '2' }])
 * // => { '1': null, '2': null }
 */
export function buildRootParentMap(paths = []) {
  return Object.fromEntries((paths || []).map(path => [String(path.id), null]))
}

/**
 * Build a parent map for child paths.
 *
 * @param {string|number} parentId - Parent path ID
 * @param {Array<{id: string|number}>} children - Child paths
 * @returns {ParentMap} Map of child IDs to parent ID
 *
 * @example
 * buildChildParentMap('parent-1', [{ id: 'child-1' }, { id: 'child-2' }])
 * // => { 'child-1': 'parent-1', 'child-2': 'parent-1' }
 */
export function buildChildParentMap(parentId, children = []) {
  return Object.fromEntries((children || []).map(child => [String(child.id), String(parentId)]))
}
