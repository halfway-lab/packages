import { RAW_HWP_DEFAULTS } from '../constants.js'

/**
 * Check if text includes any of the given patterns (case-insensitive).
 * @param {string} text - Text to search in
 * @param {string[]} patterns - Patterns to search for
 * @returns {boolean} True if any pattern is found
 */
function includesAny(text, patterns = []) {
  const haystack = String(text || '').toLowerCase()
  return patterns.some(pattern => haystack.includes(pattern))
}

/**
 * Heuristic rules for inferring branch types from live HWP chain logs.
 * These rules are used when explicit branch_type is not provided.
 * @type {HeuristicRule[]}
 */
export const LIVE_BRANCH_TYPE_RULES = [
  {
    id: 'premise_shift_keywords',
    branchType: 'premise_shift',
    keywords: ['assumption', 'premise', '前提', '假设'],
    confidence: 'medium'
  },
  {
    id: 'hidden_variable_keywords',
    branchType: 'hidden_variable',
    keywords: ['dependency', 'dependencies', 'variable', 'hidden', '忽略', '变量'],
    confidence: 'medium'
  },
  {
    id: 'context_link_keywords',
    branchType: 'context_link',
    keywords: ['context', 'jurisdiction', 'cross-border', 'coordination', '情境', '上下文'],
    confidence: 'medium'
  },
  {
    id: 'variable_temporal_keywords',
    branchType: 'variable_temporal',
    keywords: ['timeline', 'temporal', 'future', 'timing', '时间'],
    confidence: 'medium'
  },
  {
    id: 'blind_spot_probe_keywords',
    branchType: 'blind_spot_probe',
    keywords: ['risk', 'blind spot', 'underexplored', 'oversight', '盲点', '风险'],
    confidence: 'low'
  }
]

/**
 * Infer branch type from path content using keyword heuristics.
 *
 * @param {Object} input - Path content to analyze
 * @param {string} [input.title=''] - Path title
 * @param {string} [input.summary=''] - Path summary
 * @param {string} [input.nextQuestion=''] - Next question text
 * @param {string} [input.blindSpotHint=''] - Blind spot hint
 * @returns {InferredBranchType} Inferred branch type with confidence
 *
 * @example
 * inferLiveBranchType({
 *   title: 'What assumptions are we making?',
 *   summary: 'The premise needs examination'
 * })
 * // => { branchType: 'premise_shift', ruleId: 'premise_shift_keywords', ... }
 */
export function inferLiveBranchType({ title = '', summary = '', nextQuestion = '', blindSpotHint = '' } = {}) {
  const combinedText = [title, summary, nextQuestion, blindSpotHint]
    .map(value => String(value || '').toLowerCase())
    .join(' ')

  for (const rule of LIVE_BRANCH_TYPE_RULES) {
    const matchedKeywords = rule.keywords.filter(keyword => combinedText.includes(keyword))
    if (matchedKeywords.length > 0) {
      return {
        branchType: rule.branchType,
        ruleId: rule.id,
        matchedKeywords,
        confidence: rule.confidence
      }
    }
  }

  return {
    branchType: RAW_HWP_DEFAULTS.FALLBACK_BRANCH_TYPE,
    ruleId: RAW_HWP_DEFAULTS.FALLBACK_RULE_ID,
    matchedKeywords: [],
    confidence: 'low'
  }
}

/**
 * Match input against heuristic rules and return the matched rule.
 *
 * @param {Object} input - Path content to analyze
 * @param {string} [input.title=''] - Path title
 * @param {string} [input.summary=''] - Path summary
 * @param {string} [input.nextQuestion=''] - Next question text
 * @param {string} [input.blindSpotHint=''] - Blind spot hint
 * @returns {MatchedBranchType} Inference result with matched rule reference
 */
export function matchLiveBranchTypeRule(input = {}) {
  const inferred = inferLiveBranchType(input)
  const rule = LIVE_BRANCH_TYPE_RULES.find(item => item.id === inferred.ruleId) || null

  return {
    ...inferred,
    rule
  }
}
