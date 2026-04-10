function normalizePathId(value) {
  return String(value || '').trim()
}

function upsertPaths(existingPaths = [], incomingPaths = []) {
  const nextPaths = Array.isArray(existingPaths) ? [...existingPaths] : []
  const insertedPathIds = []
  const updatedPathIds = []

  for (const path of incomingPaths) {
    const pathId = normalizePathId(path?.id)
    if (!pathId) {
      continue
    }

    const existingIndex = nextPaths.findIndex(item => normalizePathId(item?.id) === pathId)
    if (existingIndex >= 0) {
      nextPaths[existingIndex] = {
        ...nextPaths[existingIndex],
        ...path
      }
      updatedPathIds.push(pathId)
      continue
    }

    nextPaths.push(path)
    insertedPathIds.push(pathId)
  }

  return {
    paths: nextPaths,
    insertedPathIds,
    updatedPathIds
  }
}

/**
 * Apply streamed partial paths into tree-state maps in a package-owned way.
 *
 * @param {object} [state]
 * @param {Array<object>} [state.rootPaths=[]]
 * @param {object} [state.childPathsMap={}]
 * @param {object} [state.parentPathMap={}]
 * @param {Array<object>} [partialPaths=[]]
 * @param {object} [options]
 * @param {string|null} [options.parentId=null]
 * @param {string|null} [options.rootParentValue=null]
 * @returns {{
 *   rootPaths: Array<object>,
 *   childPathsMap: object,
 *   parentPathMap: object,
 *   insertedPathIds: string[],
 *   updatedPathIds: string[]
 * }}
 */
export function applyPartialPathsToTreeState(
  {
    rootPaths = [],
    childPathsMap = {},
    parentPathMap = {}
  } = {},
  partialPaths = [],
  {
    parentId = null,
    rootParentValue = null
  } = {}
) {
  const normalizedParentId = parentId == null ? null : normalizePathId(parentId)
  const safePartialPaths = Array.isArray(partialPaths)
    ? partialPaths.filter(path => normalizePathId(path?.id))
    : []

  if (normalizedParentId === null) {
    const result = upsertPaths(rootPaths, safePartialPaths)
    const nextParentPathMap = { ...parentPathMap }

    for (const pathId of [...result.insertedPathIds, ...result.updatedPathIds]) {
      nextParentPathMap[pathId] = rootParentValue
    }

    return {
      rootPaths: result.paths,
      childPathsMap: { ...childPathsMap },
      parentPathMap: nextParentPathMap,
      insertedPathIds: result.insertedPathIds,
      updatedPathIds: result.updatedPathIds
    }
  }

  const existingChildren = childPathsMap?.[normalizedParentId] || []
  const result = upsertPaths(existingChildren, safePartialPaths)
  const nextChildPathsMap = {
    ...childPathsMap,
    [normalizedParentId]: result.paths
  }
  const nextParentPathMap = { ...parentPathMap }

  for (const pathId of [...result.insertedPathIds, ...result.updatedPathIds]) {
    nextParentPathMap[pathId] = normalizedParentId
  }

  return {
    rootPaths: Array.isArray(rootPaths) ? [...rootPaths] : [],
    childPathsMap: nextChildPathsMap,
    parentPathMap: nextParentPathMap,
    insertedPathIds: result.insertedPathIds,
    updatedPathIds: result.updatedPathIds
  }
}
