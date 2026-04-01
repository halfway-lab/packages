/**
 * Tree traversal utilities for path structures.
 * @module treeTraversal
 */

/**
 * Find a path by ID in the tree structure.
 *
 * @param {NormalizedPath[]} rootPaths - Root paths to search
 * @param {ChildPathsMap} childPathsMap - Map of parent IDs to child paths
 * @param {string|null|undefined} targetId - ID to search for
 * @returns {NormalizedPath|null} Found path or null
 *
 * @example
 * const path = findPathById(
 *   [{ id: '1', children: [...] }],
 *   { '1': [{ id: '2', ... }] },
 *   '2'
 * )
 * // => { id: '2', ... }
 */
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

/**
 * Flatten tree paths into a one-dimensional array.
 *
 * @param {NormalizedPath[]} rootPaths - Root paths to flatten
 * @param {ChildPathsMap} childPathsMap - Map of parent IDs to child paths
 * @returns {NormalizedPath[]} Flattened array of all paths
 *
 * @example
 * const paths = flattenPaths(
 *   [{ id: '1', ... }],
 *   { '1': [{ id: '2', ... }] }
 * )
 * // => [{ id: '1', ... }, { id: '2', ... }]
 */
export function flattenPaths(rootPaths = [], childPathsMap = {}) {
  const stack = Array.isArray(rootPaths) ? [...rootPaths] : []
  const allPaths = []

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) {
      continue
    }

    allPaths.push(current)
    const children = childPathsMap[String(current.id)] || []
    children.forEach(child => stack.push(child))
  }

  return allPaths
}

/**
 * Build a set of descendant IDs for a given path.
 *
 * @param {string} pathId - Starting path ID
 * @param {ChildPathsMap} childPathsMap - Map of parent IDs to child paths
 * @returns {Set<string>} Set of all descendant IDs including the starting path
 *
 * @example
 * const scope = buildDescendantScope('1', { '1': [{ id: '2', ... }] })
 * // => Set { '1', '2' }
 */
export function buildDescendantScope(pathId, childPathsMap = {}) {
  if (!pathId) {
    return new Set()
  }

  const scopeIds = new Set([String(pathId)])
  const stack = [String(pathId)]

  while (stack.length > 0) {
    const currentId = stack.pop()
    const children = childPathsMap[currentId] || []

    children.forEach(child => {
      const childId = String(child.id)
      if (!scopeIds.has(childId)) {
        scopeIds.add(childId)
        stack.push(childId)
      }
    })
  }

  return scopeIds
}
