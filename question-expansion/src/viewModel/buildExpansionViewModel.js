import { buildStructuredOverview } from '../overview/structuredOverview.js'
import { buildSessionSummary } from '../session/sessionArtifacts.js'
import { FOCUS_SCOPE_LABELS } from '../constants.js'
import { findPathById } from '../utils/treeTraversal.js'

export { findPathById }

/**
 * Build the complete expansion view model for UI rendering.
 *
 * @param {Object} params - View model parameters
 * @param {string} params.question - The core question being explored
 * @param {NormalizedPath[]} params.rootPaths - Root exploration paths
 * @param {ChildPathsMap} [params.childPathsMap={}] - Map of parent IDs to child paths
 * @param {string|null} [params.focusedPathId=null] - ID of currently focused path
 * @param {boolean} [params.focusModeEnabled=true] - Whether focus mode is enabled
 * @param {ParentMap} [params.parentPathMap={}] - Map of child IDs to parent IDs
 * @param {Record<string, PauseCard>} [params.pauseCards={}] - Pause cards by path ID
 * @returns {ExpansionViewModel} Complete view model for expansion UI
 *
 * @example
 * const viewModel = buildExpansionViewModel({
 *   question: 'How do we improve?',
 *   rootPaths: [{ id: '1', path_title: 'Analyze', ... }],
 *   focusedPathId: '1'
 * })
 */
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
  // focusedChildren 只包含追问展开的子节点（不包含 focusedPath 本身）
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
      focusedChildren,
      childPathsMap
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
      badgeLabel: FOCUS_SCOPE_LABELS.GLOBAL_BADGE,
      subtitle: FOCUS_SCOPE_LABELS.GLOBAL_SUBTITLE
    }
  }

  return {
    isFocused: true,
    badgeLabel: FOCUS_SCOPE_LABELS.FOCUSED_BADGE,
    subtitle: FOCUS_SCOPE_LABELS.FOCUSED_SUBTITLE(focusedTitle)
  }
}
