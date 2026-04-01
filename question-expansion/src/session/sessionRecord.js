import { buildSessionSummary } from './sessionArtifacts.js'

/**
 * Build a complete session record for persistence.
 *
 * @param {Object} params - Session parameters
 * @param {string} params.id - Unique session ID
 * @param {string} params.question - Core question being explored
 * @param {NormalizedPath[]} [params.rootPaths=[]] - Root exploration paths
 * @param {ChildPathsMap} [params.childPathsMap={}] - Map of parent IDs to child paths
 * @param {Record<string, boolean>} [params.openPathIds={}] - Set of expanded path IDs
 * @param {Record<string, PauseCard>} [params.pauseCards={}] - Pause cards by path ID
 * @param {ParentMap} [params.parentPathMap={}] - Map of child IDs to parent IDs
 * @param {string|null} [params.focusedPathId=null] - Currently focused path ID
 * @param {SessionRecordOptions} [options={}] - Record options
 * @param {string} [options.timestamp] - Override timestamp (defaults to now)
 * @returns {SessionRecord} Complete session record
 *
 * @example
 * const record = buildSessionRecord({
 *   id: 'session-123',
 *   question: 'How do we improve?',
 *   rootPaths: [{ id: '1', path_title: 'Analyze', ... }]
 * })
 */
export function buildSessionRecord({
  id,
  question,
  rootPaths = [],
  childPathsMap = {},
  openPathIds = {},
  pauseCards = {},
  parentPathMap = {},
  focusedPathId = null
} = {}, options = {}) {
  const focusedPath = findPathById(rootPaths, childPathsMap, focusedPathId)
  const focusedChildren = focusedPathId ? (childPathsMap[String(focusedPathId)] || []) : []
  const updatedAt = options.timestamp || new Date().toISOString()

  return {
    id,
    question,
    rootPaths,
    childPathsMap,
    openPathIds,
    pauseCards,
    parentPathMap,
    focusedPathId,
    rootPathCount: Array.isArray(rootPaths) ? rootPaths.length : 0,
    updatedAt,
    sessionSummary: buildSessionSummary({
      question,
      rootPaths,
      childPathsMap,
      pauseCards,
      focusedPath,
      focusedChildren
    })
  }
}

function findPathById(rootPaths = [], childPathsMap = {}, targetId) {
  if (!targetId) {
    return null
  }

  const stack = [...rootPaths]
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) {
      continue
    }

    if (String(current.id) === String(targetId)) {
      return current
    }

    const children = childPathsMap[String(current.id)] || []
    children.forEach(child => stack.push(child))
  }

  return null
}
