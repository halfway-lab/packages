export function createSessionId(options = {}) {
  const timestamp = Number(options.timestamp || Date.now())
  const randomPart = options.randomPart || Math.random().toString(36).slice(2, 8)

  return `session-${timestamp}-${randomPart}`
}

export function buildRootParentMap(paths = []) {
  return Object.fromEntries((paths || []).map(path => [String(path.id), null]))
}

export function buildChildParentMap(parentId, children = []) {
  return Object.fromEntries((children || []).map(child => [String(child.id), String(parentId)]))
}
