function clampUnfinishedScore(value, fallback = 0.5) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }

  return Math.max(0, Math.min(1, value))
}

function buildFallbackId(idSeed, level, index) {
  const normalizedSeed = String(idSeed || 'path')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-_:/]/g, '')

  return `${normalizedSeed || 'path'}-${level}-${index + 1}`
}

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
