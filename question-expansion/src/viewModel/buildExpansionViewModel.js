import { buildStructuredOverview } from '../overview/structuredOverview.js'
import { buildSessionSummary } from '../session/sessionArtifacts.js'

export function buildExpansionViewModel({
  question,
  rootPaths = [],
  childPathsMap = {},
  focusedPathId = null,
  focusModeEnabled = true,
  parentPathMap = {},
  pauseCards = {}
}) {
  const focusedPath = findPathById(rootPaths, childPathsMap, focusedPathId)
  const focusedChildren = focusedPathId ? (childPathsMap[String(focusedPathId)] || []) : []
  const focusedScopeIds = buildFocusedScopeIds({
    focusedPathId,
    focusModeEnabled,
    parentPathMap,
    childPathsMap
  })

  return {
    focusedPath,
    focusedChildren,
    focusedScopeIds,
    overviewScope: buildOverviewScope(focusedPath),
    structuredOverview: buildStructuredOverview(question, rootPaths, {
      focusedPath,
      focusedChildren
    }),
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

export function findPathById(rootPaths = [], childPathsMap = {}, targetId) {
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

function buildFocusedScopeIds({ focusedPathId, focusModeEnabled, parentPathMap, childPathsMap }) {
  if (!focusModeEnabled || !focusedPathId) {
    return null
  }

  const scopeIds = new Set([String(focusedPathId)])
  let currentId = String(focusedPathId)

  while (parentPathMap[currentId]) {
    currentId = String(parentPathMap[currentId])
    scopeIds.add(currentId)
  }

  const stack = [String(focusedPathId)]
  while (stack.length > 0) {
    const pathId = stack.pop()
    const children = childPathsMap[pathId] || []

    children.forEach(child => {
      const childId = String(child.id)
      if (scopeIds.has(childId)) {
        return
      }

      scopeIds.add(childId)
      stack.push(childId)
    })
  }

  return scopeIds
}

function buildOverviewScope(focusedPath) {
  const focusedTitle = String(focusedPath?.path_title || '').trim()

  if (!focusedTitle) {
    return {
      isFocused: false,
      badgeLabel: '当前问题全局',
      subtitle: '先抓住问题、张力和下一步，再进入具体路径。'
    }
  }

  return {
    isFocused: true,
    badgeLabel: '当前聚焦分支',
    subtitle: `总览会优先跟随「${focusedTitle}」这条分支。`
  }
}
