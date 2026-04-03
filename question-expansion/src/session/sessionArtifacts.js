import { getBranchTypeLabel } from '../branchTypes.js'
import { buildStructuredOverview } from '../overview/structuredOverview.js'
import { flattenPaths } from '../utils/treeTraversal.js'
import {
  LEVEL_NAMES,
  MAX_LEVEL_NAME_INDEX,
  MAX_MARKDOWN_HEADING_LEVEL,
  PAUSE_SUMMARY_DEFAULTS,
  PATH_DEFAULTS,
  SESSION_SUMMARY_DEFAULTS
} from '../constants.js'

/**
 * Build a pause summary card for a path.
 *
 * @param {NormalizedPath} [path={}] - Path to pause on
 * @param {number} [level=1] - Hierarchical level
 * @param {Object} [options={}] - Options
 * @param {string} [options.timestamp] - Override timestamp
 * @param {NormalizedPath[]} [options.rootPaths] - Root paths for exploration context
 * @param {Record<string, NormalizedPath[]>} [options.childPathsMap] - Child paths map for exploration context
 * @param {string|null} [options.focusedPathId] - Currently focused path ID
 * @param {Record<string, string|null>} [options.parentPathMap] - Parent path mapping
 * @param {Record<string, boolean>} [options.openPathIds] - Expanded path IDs
 * @param {Record<string, object>} [options.pauseCards] - Pause cards by path ID
 * @param {string} [options.question] - Core question text
 * @returns {PauseCard} Pause card data with optional explorationContext
 *
 * @example
 * buildPauseSummary({
 *   id: '1',
 *   blind_spot_hint: 'Key insight here',
 *   next_question: 'What next?'
 * }, 2)
 * // => { id: 'pause-1', title: '分析层面的阶段性思考', ... }
 *
 * @example
 * buildPauseSummary({ id: '1', ... }, 2, {
 *   rootPaths: [{ id: '1', ... }],
 *   childPathsMap: { '1': [...] },
 *   question: 'How do we improve?'
 * })
 * // => { ..., explorationContext: { question, exploredPaths, treeStats, ... } }
 */
export function buildPauseSummary(path = {}, level = 1, options = {}) {
  const normalizedLevel = Number(level || path.level || 1)
  const timestamp = options.timestamp || new Date().toISOString()

  // Build exploration context if rootPaths is provided
  let explorationContext = null
  if (options.rootPaths && Array.isArray(options.rootPaths)) {
    explorationContext = buildExplorationContext(
      options.rootPaths,
      options.childPathsMap || {},
      {
        focusedPathId: options.focusedPathId ?? null,
        parentPathMap: options.parentPathMap || {},
        openPathIds: options.openPathIds || {},
        pauseCards: options.pauseCards || {},
        question: options.question || ''
      }
    )
  }

  return {
    id: `pause-${path.id}`,
    title: `${LEVEL_NAMES[Math.min(normalizedLevel, MAX_LEVEL_NAME_INDEX)] || `第${normalizedLevel}层`}的阶段性思考`,
    keyInsight: path.blind_spot_hint || PAUSE_SUMMARY_DEFAULTS.KEY_INSIGHT,
    nextAction: path.next_question || PAUSE_SUMMARY_DEFAULTS.NEXT_ACTION,
    level: normalizedLevel,
    created_at: timestamp,
    explorationContext
  }
}

/**
 * Build Markdown representation of a path and its children.
 *
 * @param {Object} options - Markdown options
 * @param {NormalizedPath} options.path - Path to render
 * @param {number} [options.level=1] - Starting heading level
 * @param {Record<string, PauseCard>} [options.pauseCards={}] - Pause cards by path ID
 * @param {ChildPathsMap} [options.childPathsMap={}] - Child paths map
 * @param {Record<string, boolean>} [options.openPathIds={}] - Expanded path IDs
 * @returns {string} Markdown string
 *
 * @example
 * buildPathMarkdown({
 *   path: { id: '1', path_title: 'Analysis', ... },
 *   level: 1
 * })
 * // => "# Analysis\n\n- 层级：第1层\n..."
 */
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

/**
 * Build a summary of the current session state.
 *
 * @param {Object} options - Summary options
 * @param {string} [options.question] - Core question
 * @param {NormalizedPath[]} [options.rootPaths=[]] - Root paths
 * @param {ChildPathsMap} [options.childPathsMap={}] - Child paths map
 * @param {Record<string, PauseCard>} [options.pauseCards={}] - Pause cards
 * @param {NormalizedPath|null} [options.focusedPath] - Currently focused path
 * @param {NormalizedPath[]} [options.focusedChildren=[]] - Children of focused path
 * @returns {SessionSummary} Session summary data
 *
 * @example
 * buildSessionSummary({
 *   question: 'How do we improve?',
 *   rootPaths: [{ id: '1', ... }],
 *   childPathsMap: { '1': [{ id: '2', ... }] }
 * })
 * // => { title: 'How do we improve?', rootPathCount: 1, ... }
 */
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
    title: String(question || '').trim() || SESSION_SUMMARY_DEFAULTS.DEFAULT_TITLE,
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
  const headingLevel = Math.min(normalizedLevel + 1, MAX_MARKDOWN_HEADING_LEVEL)
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

/**
 * 将当前探索树状态整理为结构化上下文。
 * 这是通用的数据准备函数，输出可直接供应用层发送给 HWP FastAPI 的暂停总结端点。
 *
 * @param {NormalizedPath[]} rootPaths - 根路径数组
 * @param {Record<string, NormalizedPath[]>} childPathsMap - 子路径映射
 * @param {Object} [options={}]
 * @param {string|null} [options.focusedPathId] - 当前聚焦路径ID
 * @param {Record<string, string|null>} [options.parentPathMap] - 父节点映射
 * @param {Record<string, boolean>} [options.openPathIds] - 展开状态映射
 * @param {Record<string, object>} [options.pauseCards] - 暂停卡片映射
 * @param {string} [options.question] - 核心问题文本
 * @returns {ExplorationContext}
 */
export function buildExplorationContext(rootPaths = [], childPathsMap = {}, options = {}) {
  const {
    focusedPathId = null,
    parentPathMap = {},
    openPathIds = {},
    pauseCards = {},
    question = ''
  } = options

  // 获取所有路径的扁平数组
  const allPaths = flattenPaths(rootPaths, childPathsMap)

  // 构建 exploredPaths - 精简版路径信息
  const exploredPaths = allPaths.map(path => ({
    id: String(path.id || ''),
    title: String(path.path_title || ''),
    branchType: String(path.branch_type || ''),
    level: Number(path.level || 1),
    unfinishedScore: Number(path.unfinished_score || 0),
    blindSpotHint: String(path.blind_spot_hint || ''),
    nextQuestion: String(path.next_question || '')
  }))

  // 构建 treeStats
  const totalPathCount = allPaths.length
  const rootPathCount = Array.isArray(rootPaths) ? rootPaths.length : 0
  const deepestLevel = allPaths.reduce((max, path) => {
    const level = Number(path.level || 1)
    return level > max ? level : max
  }, 0)
  const averageDepth = totalPathCount > 0
    ? Math.round((allPaths.reduce((sum, path) => sum + Number(path.level || 1), 0) / totalPathCount) * 10) / 10
    : 0

  // 统计 branchTypeDistribution
  const branchTypeDistribution = allPaths.reduce((dist, path) => {
    const type = String(path.branch_type || 'unknown')
    dist[type] = (dist[type] || 0) + 1
    return dist
  }, {})

  const treeStats = {
    totalPathCount,
    rootPathCount,
    deepestLevel,
    averageDepth,
    branchTypeDistribution
  }

  // 构建 focusDirection
  let focusDirection = null
  if (focusedPathId) {
    const focusedPath = allPaths.find(path => String(path.id) === String(focusedPathId))
    if (focusedPath) {
      // 构建 ancestry - 从根到聚焦点的路径 ID 链
      const ancestry = []
      let currentId = focusedPathId
      const visited = new Set()

      // 向上遍历到根
      const upwardChain = []
      while (currentId && !visited.has(currentId)) {
        visited.add(currentId)
        upwardChain.unshift(currentId)
        const parentId = parentPathMap[currentId]
        currentId = parentId
      }

      focusDirection = {
        focusedPathId: String(focusedPathId),
        focusedPathTitle: String(focusedPath.path_title || ''),
        focusedBranchType: String(focusedPath.branch_type || ''),
        ancestry: upwardChain,
        childCount: (childPathsMap[String(focusedPathId)] || []).length
      }
    }
  }

  // 构建 unexploredAreas
  const unexploredAreas = []
  const addedUnexploredIds = new Set()

  allPaths.forEach(path => {
    const pathId = String(path.id)
    const hasChildren = (childPathsMap[pathId] || []).length > 0
    const isExpanded = openPathIds[pathId] === true
    const unfinishedScore = Number(path.unfinished_score || 0)

    // 检查 not_expanded 条件
    if (hasChildren && !isExpanded && !addedUnexploredIds.has(pathId)) {
      unexploredAreas.push({
        id: pathId,
        title: String(path.path_title || ''),
        branchType: String(path.branch_type || ''),
        reason: 'not_expanded'
      })
      addedUnexploredIds.add(pathId)
    }

    // 检查 high_unfinished_score 条件
    if (unfinishedScore >= 0.7 && !addedUnexploredIds.has(pathId)) {
      unexploredAreas.push({
        id: pathId,
        title: String(path.path_title || ''),
        branchType: String(path.branch_type || ''),
        reason: 'high_unfinished_score'
      })
      addedUnexploredIds.add(pathId)
    }
  })

  // 构建 keyTensions - 从 blind_spot_hint 中提取非默认值
  const defaultBlindSpotHints = new Set([
    PAUSE_SUMMARY_DEFAULTS.KEY_INSIGHT,
    PATH_DEFAULTS.BLIND_SPOT_HINT
  ])
  const keyTensions = allPaths
    .map(path => String(path.blind_spot_hint || '').trim())
    .filter(hint => hint && !defaultBlindSpotHints.has(hint))
    .filter((hint, index, self) => self.indexOf(hint) === index) // 去重
    .slice(0, 5)

  // 构建 nextQuestions - 从 next_question 中提取非默认值
  const defaultNextQuestions = new Set([
    PAUSE_SUMMARY_DEFAULTS.NEXT_ACTION,
    PATH_DEFAULTS.NEXT_QUESTION
  ])
  const nextQuestions = allPaths
    .map(path => String(path.next_question || '').trim())
    .filter(q => q && !defaultNextQuestions.has(q))
    .filter((q, index, self) => self.indexOf(q) === index) // 去重
    .slice(0, 5)

  // 构建 pauseHistory - 从 pauseCards 中提取
  const pauseHistory = Object.entries(pauseCards || {})
    .map(([pathId, card]) => {
      const rawPathId = String(pathId).replace(/^pause-/, '')
      return {
        pathId: rawPathId,
        title: String(card.title || ''),
        keyInsight: String(card.keyInsight || ''),
        createdAt: String(card.created_at || '')
      }
    })
    .filter(item => item.pathId)
    .sort((a, b) => {
      // 按 createdAt 排序
      if (!a.createdAt && !b.createdAt) return 0
      if (!a.createdAt) return 1
      if (!b.createdAt) return -1
      return new Date(a.createdAt) - new Date(b.createdAt)
    })

  return {
    question: String(question || ''),
    exploredPaths,
    treeStats,
    focusDirection,
    unexploredAreas,
    keyTensions,
    nextQuestions,
    pauseHistory
  }
}


