import { getBranchTypeLabel } from '../branchTypes.js'

/** Maximum number of tensions to include in overview */
const MAX_TENSIONS = 3
/** Maximum number of next questions to include in overview */
const MAX_NEXT_QUESTIONS = 3

/**
 * Build a structured overview of an expansion session.
 *
 * @param {string} question - The core question being explored
 * @param {NormalizedPath[]} rootPaths - Root exploration paths
 * @param {Object} options - Overview options
 * @param {NormalizedPath|null} [options.focusedPath] - Currently focused path
 * @param {NormalizedPath[]} [options.focusedChildren] - Children of focused path
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
  const overviewPaths = focusedChildren.length > 0 ? focusedChildren : paths

  return {
    coreQuestion: buildCoreQuestion(normalizedQuestion, overviewPaths, focusedPath),
    keyTensions: buildKeyTensions(overviewPaths, focusedPath),
    nextQuestions: buildNextQuestions(overviewPaths, focusedPath)
  }
}

function buildCoreQuestion(question, paths, focusedPath) {
  if (!question) {
    return '这个问题还需要先被说清。'
  }

  const focusedTitle = String(focusedPath?.path_title || '').trim()
  if (focusedTitle && paths.length > 0) {
    const pathTitles = uniqueStrings(paths.map(path => path.path_title)).slice(0, 3)
    return `围绕「${focusedTitle}」，这次继续拆清 ${pathTitles.join('、')} 这几块，看看这条分支接下来该往哪里追。`
  }

  const pathTitles = uniqueStrings(paths.map(path => path.path_title)).slice(0, 3)
  if (pathTitles.length === 0) {
    return `当前先围绕「${question}」把问题打开，而不是急着给结论。`
  }

  return `围绕「${question}」，这次先拆清 ${pathTitles.join('、')} 这几块，再决定问题真正卡在哪里。`
}

function buildKeyTensions(paths, focusedPath) {
  const tensions = uniqueStrings(paths.map(formatTension)).slice(0, MAX_TENSIONS)

  if (tensions.length > 0) {
    return tensions
  }

  const focusedHint = String(focusedPath?.blind_spot_hint || '').trim()
  if (focusedHint) {
    return [focusedHint]
  }

  return ['这个问题里最关键的拉扯还没有完全显形。']
}

function buildNextQuestions(paths, focusedPath) {
  const questions = uniqueStrings(paths.map(path => normalizeNextQuestion(path.next_question))).slice(0, MAX_NEXT_QUESTIONS)

  if (questions.length > 0) {
    return questions
  }

  const focusedNextQuestion = normalizeNextQuestion(focusedPath?.next_question)
  if (focusedNextQuestion) {
    return [focusedNextQuestion]
  }

  return ['如果先不急着判断，这个问题下一步最值得继续追问什么？']
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

  return text
    .replace(/^(核心观点|继续追问|补充追问|延展路径|下一步)[:：]\s*/u, '')
    .trim()
}
