function includesAny(text, patterns = []) {
  const haystack = String(text || '').toLowerCase()
  return patterns.some(pattern => haystack.includes(pattern))
}

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
    confidence: 'high'
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
    branchType: 'branch_followup',
    ruleId: 'fallback_branch_followup',
    matchedKeywords: [],
    confidence: 'low'
  }
}

export function matchLiveBranchTypeRule(input = {}) {
  const inferred = inferLiveBranchType(input)
  const rule = LIVE_BRANCH_TYPE_RULES.find(item => item.id === inferred.ruleId) || null

  return {
    ...inferred,
    rule
  }
}
