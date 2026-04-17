import { getBranchTypeLabel } from '../branchTypes.js'
import {
  MAX_TENSIONS,
  MAX_NEXT_QUESTIONS,
  MAX_OVERVIEW_PATH_TITLES,
  OVERVIEW_DEFAULTS
} from '../constants.js'

/**
 * Build a structured overview of an expansion session.
 *
 * @param {string} question - The core question being explored
 * @param {NormalizedPath[]} rootPaths - Root exploration paths
 * @param {Object} options - Overview options
 * @param {NormalizedPath|null} [options.focusedPath] - Currently focused path
 * @param {NormalizedPath[]} [options.focusedChildren] - Children of focused path
 * @param {ChildPathsMap} [options.childPathsMap] - Child paths map for recursive collection
 * @returns {StructuredOverview} Structured overview with core question, tensions, and next questions
 *
 * @example
 * const overview = buildStructuredOverview(
 *   'How do we improve user engagement?',
 *   [{ id: '1', path_title: 'Analyze behavior', ... }]
 * )
 * // => { coreQuestion: '...', keyTensions: [...], nextQuestions: [...] }
 */
export function buildStructuredOverview(question, rootPaths = [], options = {}) {
  const normalizedQuestion = String(question || '').trim()
  const paths = Array.isArray(rootPaths) ? rootPaths.filter(Boolean) : []
  const focusedPath = options.focusedPath || null
  const focusedChildren = Array.isArray(options.focusedChildren) ? options.focusedChildren.filter(Boolean) : []
  const childPathsMap = options.childPathsMap || {}
  
  // 追问时，追加子路径到根路径（递归收集所有层级）
  const overviewPaths = focusedChildren.length > 0
    ? mergeOverviewPaths(paths, focusedChildren, childPathsMap)
    : paths

  return {
    coreQuestion: buildCoreQuestion(normalizedQuestion, overviewPaths, focusedPath),
    keyTensions: buildKeyTensions(overviewPaths, focusedPath),
    nextQuestions: buildNextQuestions(overviewPaths, focusedPath)
  }
}

/**
 * 合并根路径和追问展开的所有子路径（递归收集所有层级）
 * 
 * @param {NormalizedPath[]} rootPaths - 根路径
 * @param {NormalizedPath[]} focusedChildren - 追问展开的子路径
 * @param {ChildPathsMap} childPathsMap - 子路径映射（用于递归收集更深层级）
 * @returns {NormalizedPath[]} 合并后的路径列表
 */
function mergeOverviewPaths(rootPaths, focusedChildren, childPathsMap = {}) {
  const existingIds = new Set(rootPaths.map(p => String(p.id)))
  
  // 递归收集所有层级的子路径
  const allNewPaths = []
  const stack = [...focusedChildren]
  
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || current.id == null) {
      continue
    }
    
    const currentId = String(current.id)
    
    if (!existingIds.has(currentId)) {
      existingIds.add(currentId)
      allNewPaths.push(current)
    }
    
    // 收集当前节点的子节点，加入栈中继续遍历
    const children = childPathsMap[currentId] || []
    for (const child of children) {
      if (child && child.id != null && !existingIds.has(String(child.id))) {
        stack.push(child)
      }
    }
  }
  
  return [...rootPaths, ...allNewPaths]
}

function buildCoreQuestion(question, paths, focusedPath) {
  if (!question) {
    return OVERVIEW_DEFAULTS.EMPTY_QUESTION
  }

  const focusedTitle = String(focusedPath?.path_title || '').trim()
  if (focusedTitle && paths.length > 0) {
    const pathTitles = uniqueStrings(paths.map(path => path.path_title)).slice(0, MAX_OVERVIEW_PATH_TITLES)
    return OVERVIEW_DEFAULTS.FOCUSED_CORE_QUESTION(focusedTitle, pathTitles)
  }

  const pathTitles = uniqueStrings(paths.map(path => path.path_title)).slice(0, MAX_OVERVIEW_PATH_TITLES)
  if (pathTitles.length === 0) {
    return OVERVIEW_DEFAULTS.NO_PATHS_CORE_QUESTION(question)
  }

  return OVERVIEW_DEFAULTS.WITH_PATHS_CORE_QUESTION(question, pathTitles)
}

/**
 * 通用生成器：从 paths 中提取项目，去重、截断，并处理备选值
 *
 * @param {NormalizedPath[]} paths - 路径数组
 * @param {Function} extractFn - 从 path 中提取项目的函数
 * @param {NormalizedPath|null} focusedPath - 当前聚焦的路径
 * @param {Function} focusedFallbackFn - 从 focusedPath 中提取备选值的函数
 * @param {string[]} defaultFallback - 默认备选值
 * @param {number} maxCount - 最大项目数
 * @returns {string[]} 处理后的项目数组
 */
function buildOverviewItems(paths, extractFn, focusedPath, focusedFallbackFn, defaultFallback, maxCount) {
  const items = uniqueStrings(paths.map(extractFn)).slice(0, maxCount)

  if (items.length > 0) {
    return items
  }

  const focusedFallback = focusedFallbackFn(focusedPath)
  if (focusedFallback) {
    return [focusedFallback]
  }

  return defaultFallback
}

function buildKeyTensions(paths, focusedPath) {
  return buildOverviewItems(
    paths,
    formatTension,
    focusedPath,
    (path) => String(path?.blind_spot_hint || '').trim(),
    [OVERVIEW_DEFAULTS.NO_TENSIONS],
    MAX_TENSIONS
  )
}

function buildNextQuestions(paths, focusedPath) {
  return buildOverviewItems(
    paths,
    (path) => normalizeNextQuestion(path.next_question),
    focusedPath,
    (path) => normalizeNextQuestion(path?.next_question),
    [OVERVIEW_DEFAULTS.NO_NEXT_QUESTIONS],
    MAX_NEXT_QUESTIONS
  )
}

function uniqueStrings(values) {
  return [...new Set(
    values
      .map(value => String(value || '').trim())
      .filter(Boolean)
  )]
}

function formatTension(path) {
  const hint = String(path?.blind_spot_hint || '').trim()
  if (!hint) {
    return ''
  }

  const branchLabel = getBranchTypeLabel(path?.branch_type, String(path?.path_title || '').trim())
  if (!branchLabel) {
    return hint
  }

  return `${branchLabel}上还没看清：${hint}`
}

function normalizeNextQuestion(value) {
  const text = String(value || '').trim()
  if (!text) {
    return ''
  }

  // 移除常见前缀标签：核心观点、继续追问、补充追问、延展路径、下一步（后面可跟冒号或中文冒号）
  const prefixPattern = /^(核心观点|继续追问|补充追问|延展路径|下一步)[:：]\s*/u
  return text.replace(prefixPattern, '').trim()
}
