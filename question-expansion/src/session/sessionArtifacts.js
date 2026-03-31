import { getBranchTypeLabel } from '../branchTypes.js'
import { buildStructuredOverview } from '../overview/structuredOverview.js'

const LEVEL_NAMES = [
  '',
  '问题层面',
  '分析层面',
  '行动层面',
  '执行层面',
  '细化层面',
  '验证层面',
  '优化层面',
  '固化层面',
  '迭代层面'
]

export function buildPauseSummary(path = {}, level = 1, options = {}) {
  const normalizedLevel = Number(level || path.level || 1)
  const timestamp = options.timestamp || new Date().toISOString()

  return {
    id: `pause-${path.id}`,
    title: `${LEVEL_NAMES[Math.min(normalizedLevel, 9)] || `第${normalizedLevel}层`}的阶段性思考`,
    keyInsight: path.blind_spot_hint || '这条路径仍有继续展开的空间',
    nextAction: path.next_question || '继续澄清这条路径的关键问题',
    level: normalizedLevel,
    created_at: timestamp
  }
}

export function buildPathMarkdown({
  path,
  level = 1,
  pauseCards = {},
  childPathsMap = {},
  openPathIds = {}
} = {}) {
  const lines = []
  appendPathMarkdown(lines, path, level, pauseCards, childPathsMap, openPathIds)
  return lines.join('\n').trim()
}

export function buildSessionSummary({
  question,
  rootPaths = [],
  childPathsMap = {},
  pauseCards = {},
  focusedPath = null,
  focusedChildren = []
} = {}) {
  const overview = buildStructuredOverview(question, rootPaths, {
    focusedPath,
    focusedChildren
  })
  const allPaths = flattenPaths(rootPaths, childPathsMap)
  const pauseCount = Object.keys(pauseCards || {}).length
  const mostExpandedPath = allPaths.reduce((best, current) => {
    if (!best) {
      return current
    }

    return (Number(current.level || 0) > Number(best.level || 0)) ? current : best
  }, null)

  return {
    title: String(question || '').trim() || '未命名问题链',
    activeBranchTitle: String(focusedPath?.path_title || '').trim(),
    rootPathCount: Array.isArray(rootPaths) ? rootPaths.length : 0,
    expandedPathCount: allPaths.length,
    pauseCount,
    deepestLevel: mostExpandedPath?.level || 0,
    deepestPathTitle: String(mostExpandedPath?.path_title || '').trim(),
    headline: overview.coreQuestion,
    keyTensions: overview.keyTensions,
    nextQuestions: overview.nextQuestions
  }
}

function appendPathMarkdown(lines, path, level, pauseCards, childPathsMap, openPathIds) {
  if (!path) {
    return
  }

  const pathId = String(path.id)
  const normalizedLevel = Number(level || path.level || 1)
  const headingLevel = Math.min(normalizedLevel + 1, 6)
  const headingPrefix = '#'.repeat(headingLevel)

  lines.push(`${headingPrefix} ${path.path_title}`)
  lines.push('')
  lines.push(`- 层级：第${normalizedLevel}层`)
  lines.push(`- 类型：${getBranchTypeLabel(path.branch_type, path.branch_type || 'unknown')}`)
  lines.push(`- 未完成度：${Math.round((path.unfinished_score || 0) * 100)}%`)

  if (path.blind_spot_hint) {
    lines.push(`- 盲点提示：${path.blind_spot_hint}`)
  }

  lines.push('')
  lines.push(path.path_summary || '暂无摘要')
  lines.push('')
  lines.push('**下一步问题**')
  lines.push('')
  lines.push(path.next_question || '暂无下一步问题')
  lines.push('')

  const pauseCard = pauseCards[pathId]
  if (pauseCard) {
    lines.push('**停一下**')
    lines.push('')
    lines.push(`- 标题：${pauseCard.title || '阶段性思考'}`)
    lines.push(`- 核心洞察：${pauseCard.keyInsight || '暂无'}`)
    lines.push(`- 下一步：${pauseCard.nextAction || '暂无'}`)
    lines.push('')
  }

  const children = childPathsMap[pathId] || []
  if (openPathIds[pathId] && children.length > 0) {
    lines.push('**已展开的后续分支**')
    lines.push('')
    children.forEach(child => {
      appendPathMarkdown(
        lines,
        child,
        child.level || normalizedLevel + 1,
        pauseCards,
        childPathsMap,
        openPathIds
      )
    })
  }
}

function flattenPaths(rootPaths = [], childPathsMap = {}) {
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
