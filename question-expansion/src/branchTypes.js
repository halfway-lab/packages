/**
 * Mapping of branch type identifiers to human-readable Chinese labels.
 * @type {Object<string, string>}
 */
export const BRANCH_TYPE_LABELS = {
  premise_shift: '前提转移',
  hidden_variable: '隐藏变量',
  unfinished_path: '未完成路径',
  premise_deconstruction: '假设剥离',
  premise_inversion: '前提反转',
  premise_context: '情境标定',
  variable_temporal: '时间维度',
  variable_relational: '关系网络',
  variable_threshold: '临界阈值',
  path_parallel: '平行路径',
  path_suspension: '主动悬置',
  path_meta: '元层反思',
  deep_action: '行动拆解',
  deep_obstacle: '障碍预判',
  deep_resource: '资源盘点',
  deep_timing: '时机选择',
  deep_feedback: '反馈设计',
  exec_step: '具体步骤',
  exec_metric: '衡量指标',
  exec_risk: '风险备案',
  exec_support: '支持系统',
  core_view: '核心观点',
  context_link: '上下文连接',
  blind_spot_probe: '潜在盲点',
  branch_followup: '继续展开'
}

/**
 * Get the human-readable label for a branch type.
 *
 * @param {string} type - Branch type identifier
 * @param {string} [fallback=''] - Fallback value if type is empty or unknown
 * @returns {string} Human-readable label or the original type string
 *
 * @example
 * getBranchTypeLabel('premise_shift') // => '前提转移'
 * getBranchTypeLabel('unknown_type') // => 'unknown_type'
 * getBranchTypeLabel(null, '默认') // => '默认'
 */
export function getBranchTypeLabel(type, fallback = '') {
  const normalizedType = String(type || '').trim()

  if (!normalizedType) {
    return fallback
  }

  return BRANCH_TYPE_LABELS[normalizedType] || normalizedType
}
