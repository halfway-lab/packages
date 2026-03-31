import { buildSessionSummary } from './sessionArtifacts.js'

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
