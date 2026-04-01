/**
 * Field Helpers - 字段别名规范化工具
 *
 * 提供通用的字段提取、数组转换和字段存在性检查等辅助函数，
 * 以及 HWP 契约中各字段的别名映射配置。
 */

/**
 * 字段别名映射配置
 * 定义各字段在不同格式中可能出现的别名
 */
export const FIELD_ALIASES = {
  // ID 字段
  id: ['id', 'path_id', 'pathId'],

  // 标题字段
  path_title: ['path_title', 'title', 'pathTitle'],

  // 摘要字段
  path_summary: ['path_summary', 'summary', 'pathSummary'],

  // 下一个问题字段
  next_question: ['next_question', 'nextQuestion', 'follow_up_question', 'continuation_hook'],

  // 分支类型字段
  branch_type: ['branch_type', 'branchType', 'path_type'],

  // 未完成度分数字段
  unfinished_score: ['unfinished_score', 'unfinishedScore', 'open_score'],

  // 盲点提示字段
  blind_spot_hint: ['blind_spot_hint', 'blindSpotHint', 'risk_hint'],

  // 创建时间字段
  created_at: ['created_at', 'createdAt'],

  // 层级/深度字段
  level: ['level', 'depth'],

  // 核心问题字段
  core_question: ['core_question', 'coreQuestion', 'question'],

  // 关键张力字段
  key_tensions: ['key_tensions', 'keyTensions', 'tensions'],

  // 下一个问题列表字段
  next_questions: ['next_questions', 'nextQuestions'],

  // 标签字段
  tags: ['tags', 'labels'],

  // 路径列表字段
  paths: ['paths', 'expansion_paths']
}

/**
 * 从对象中提取指定字段的第一个有效值（按别名优先级）
 *
 * @param {Object} obj - 源对象
 * @param {string} fieldName - 字段名（FIELD_ALIASES 中的键）
 * @param {*} [defaultValue] - 默认值
 * @returns {*} 提取的值或默认值
 *
 * @example
 * pickField({ title: 'Test', path_title: 'Path' }, 'path_title')
 * // => 'Path' (优先使用 path_title)
 *
 * pickField({ title: 'Test' }, 'path_title')
 * // => 'Test' (退而求其次使用 title)
 */
export function pickField(obj = {}, fieldName, defaultValue) {
  const aliases = FIELD_ALIASES[fieldName] || [fieldName]

  for (const alias of aliases) {
    const value = obj?.[alias]
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }

  return defaultValue
}

/**
 * 从多个值中选取第一个非空值
 *
 * @param {Array<*>} values - 待检查的值数组
 * @returns {string} 第一个非空字符串值，如果没有则返回空字符串
 *
 * @example
 * pickFirstNonEmpty(['', '  ', 'valid', 'other'])
 * // => 'valid'
 *
 * pickFirstNonEmpty([null, undefined, '', 'value'])
 * // => 'value'
 */
export function pickFirstNonEmpty(values = []) {
  for (const value of values) {
    const normalized = String(value || '').trim()
    if (normalized) {
      return normalized
    }
  }

  return ''
}

/**
 * 将值转为数组（过滤掉 falsy 值）
 *
 * @param {*} value - 任意值
 * @returns {Array} 如果输入是数组则返回过滤后的数组，否则返回空数组
 *
 * @example
 * toArray([1, null, 2, '', 3])
 * // => [1, 2, 3]
 *
 * toArray('not an array')
 * // => []
 */
export function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

/**
 * 检查对象是否包含指定字段中的任意一个（非空值）
 *
 * @param {Object} obj - 要检查的对象
 * @param {string[]} fields - 字段名数组
 * @returns {boolean} 如果任意字段存在且非空则返回 true
 *
 * @example
 * hasAnyField({ a: 1, b: '' }, ['a', 'c'])
 * // => true (a 存在且非空)
 *
 * hasAnyField({ a: null, b: '' }, ['a', 'b'])
 * // => false (a 为 null，b 为空字符串)
 */
export function hasAnyField(obj, fields = []) {
  return fields.some(key => {
    const value = obj?.[key]
    return value !== undefined && value !== null && value !== ''
  })
}

/**
 * 从对象中提取字符串字段值（自动 trim）
 *
 * @param {Object} obj - 源对象
 * @param {string} fieldName - 字段名（FIELD_ALIASES 中的键）
 * @param {string} [defaultValue=''] - 默认值
 * @returns {string} 提取并 trim 后的字符串值
 *
 * @example
 * pickStringField({ title: '  Test  ' }, 'path_title')
 * // => 'Test'
 */
export function pickStringField(obj = {}, fieldName, defaultValue = '') {
  const value = pickField(obj, fieldName)
  return value !== undefined && value !== null
    ? String(value).trim()
    : defaultValue
}

/**
 * 从对象中提取数值字段值
 *
 * @param {Object} obj - 源对象
 * @param {string} fieldName - 字段名（FIELD_ALIASES 中的键）
 * @param {number} [defaultValue] - 默认值
 * @returns {number|undefined} 提取的数值或默认值
 */
export function pickNumberField(obj = {}, fieldName, defaultValue) {
  const value = pickField(obj, fieldName)

  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }

  return defaultValue
}
