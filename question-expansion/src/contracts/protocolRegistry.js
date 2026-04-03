/**
 * 协议版本注册表
 *
 * 根据 HWP protocol_version 自动选择对应的字段映射和验证规则。
 * 提供版本感知能力，支持自动回退机制和外部扩展。
 *
 * @module @halfway-lab/question-expansion/contracts/protocolRegistry
 */

/**
 * @typedef {Object} ProtocolSchema
 * @property {string} version - 协议版本号
 * @property {Object.<string, string[]>} fieldAliases - 字段别名映射表
 * @property {string[]} requiredFields - 根级必填字段列表
 * @property {string[]} optionalFields - 根级可选字段列表
 * @property {string[]} pathRequiredFields - 路径级必填字段列表
 * @property {Object} features - 功能特性开关
 * @property {boolean} features.semanticGroups - 是否支持 semantic_groups
 * @property {boolean} features.protocolVersion - 是否输出 protocol_version
 */

/**
 * @typedef {Object} ProtocolCompatibility
 * @property {'exact'|'fallback'|'legacy'} status - 兼容性状态
 * @property {string} resolvedVersion - 实际解析到的版本号
 */

// ============================================
// 内置 Schema 定义
// ============================================

/**
 * Legacy Schema - 无版本号时的默认 schema
 * 与 fieldHelpers.js 中的 FIELD_ALIASES 完全一致
 *
 * @type {ProtocolSchema}
 */
const LEGACY_SCHEMA = {
  version: 'legacy',
  fieldAliases: {
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
  },
  requiredFields: ['paths'],
  optionalFields: [
    'question',
    'core_question',
    'coreQuestion',
    'key_tensions',
    'keyTensions',
    'next_questions',
    'nextQuestions',
    'meta'
  ],
  pathRequiredFields: ['path_title'],
  features: {
    semanticGroups: false,
    protocolVersion: false
  }
}

/**
 * v0.6.2 Schema - HWP v0.6.2 的 schema
 * 在 legacy 基础上新增 semantic_groups 和 protocol_version 支持
 *
 * @type {ProtocolSchema}
 */
const V062_SCHEMA = {
  version: '0.6.2',
  fieldAliases: {
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
    paths: ['paths', 'expansion_paths'],

    // v0.6.2 新增字段
    protocol_version: ['protocol_version', 'protocolVersion'],
    semantic_groups: ['semantic_groups', 'semanticGroups']
  },
  requiredFields: ['paths'],
  optionalFields: [
    'question',
    'core_question',
    'coreQuestion',
    'key_tensions',
    'keyTensions',
    'next_questions',
    'nextQuestions',
    'meta',
    'protocol_version',
    'protocolVersion',
    'semantic_groups',
    'semanticGroups'
  ],
  pathRequiredFields: ['path_title'],
  features: {
    semanticGroups: true,
    protocolVersion: true
  }
}

// ============================================
// 注册表状态
// ============================================

/**
 * 版本注册表存储
 * @type {Map<string, ProtocolSchema>}
 */
const registry = new Map([
  ['legacy', LEGACY_SCHEMA],
  ['0.6.2', V062_SCHEMA]
])

/**
 * 版本排序列表（用于回退逻辑）
 * 按版本号降序排列，最新的版本在前
 * @type {string[]}
 */
let sortedVersions = ['0.6.2', 'legacy']

// ============================================
// 内部工具函数
// ============================================

/**
 * 比较两个版本号
 * 支持语义化版本格式（major.minor.patch）
 *
 * @param {string} v1 - 版本号1
 * @param {string} v2 - 版本号2
 * @returns {number} -1: v1 < v2, 0: v1 === v2, 1: v1 > v2
 */
function compareVersions(v1, v2) {
  // legacy 总是排在最后
  if (v1 === 'legacy' && v2 === 'legacy') return 0
  if (v1 === 'legacy') return -1
  if (v2 === 'legacy') return 1

  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  const maxLen = Math.max(parts1.length, parts2.length)

  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0
    const num2 = parts2[i] || 0

    if (num1 < num2) return -1
    if (num1 > num2) return 1
  }

  return 0
}

/**
 * 重新计算排序后的版本列表
 */
function resortVersions() {
  sortedVersions = Array.from(registry.keys()).sort((a, b) => compareVersions(b, a))
}

/**
 * 规范化版本号字符串
 *
 * @param {*} version - 原始版本号
 * @returns {string|null} 规范化后的版本号或 null
 */
function normalizeVersion(version) {
  if (version === undefined || version === null) return null
  if (version === 'legacy') return 'legacy'

  const str = String(version).trim()
  if (!str) return null

  // 移除前缀 'v' 或 'V'
  return str.replace(/^v/i, '')
}

// ============================================
// 公共 API
// ============================================

/**
 * 解析协议版本，返回对应的 schema
 *
 * 解析策略：
 * 1. 精确匹配已注册版本
 * 2. 未知版本回退到最新注册版本，附带 fallback 标记
 * 3. 无版本号时使用 legacy
 *
 * @param {string} [protocolVersion] - HWP 协议版本号
 * @returns {ProtocolSchema & { _fallback?: boolean }} schema 对象，如果是回退则包含 _fallback 标记
 *
 * @example
 * // 精确匹配
 * resolveProtocolSchema('0.6.2')
 * // => { version: '0.6.2', ... }
 *
 * // 未知版本，回退到最新
 * resolveProtocolSchema('0.7.0')
 * // => { version: '0.6.2', _fallback: true, ... }
 *
 * // 无版本号，使用 legacy
 * resolveProtocolSchema()
 * // => { version: 'legacy', ... }
 */
export function resolveProtocolSchema(protocolVersion) {
  const normalizedVersion = normalizeVersion(protocolVersion)

  // 无版本号时使用 legacy
  if (normalizedVersion === null) {
    return { ...LEGACY_SCHEMA }
  }

  // 精确匹配已注册版本
  if (registry.has(normalizedVersion)) {
    return { ...registry.get(normalizedVersion) }
  }

  // 未知版本回退到最新注册版本
  const latestVersion = sortedVersions.find(v => v !== 'legacy') || 'legacy'
  const fallbackSchema = registry.get(latestVersion)

  return {
    ...fallbackSchema,
    _fallback: true,
    _requestedVersion: normalizedVersion
  }
}

/**
 * 注册新的协议版本
 *
 * 允许外部注册新版本 schema，扩展协议支持。
 *
 * @param {string} version - 版本号（如 '0.7.0'）
 * @param {Object} schemaConfig - Schema 配置
 * @param {Object.<string, string[]>} schemaConfig.fieldAliases - 字段别名映射表
 * @param {string[]} [schemaConfig.requiredFields=['paths']] - 根级必填字段
 * @param {string[]} [schemaConfig.optionalFields=[]] - 根级可选字段
 * @param {string[]} [schemaConfig.pathRequiredFields=['path_title']] - 路径级必填字段
 * @param {Object} [schemaConfig.features={}] - 功能特性开关
 * @param {boolean} [schemaConfig.features.semanticGroups=false] - 是否支持 semantic_groups
 * @param {boolean} [schemaConfig.features.protocolVersion=false] - 是否输出 protocol_version
 * @throws {Error} 如果版本号无效或已存在
 *
 * @example
 * registerProtocolVersion('0.7.0', {
 *   fieldAliases: { ... },
 *   requiredFields: ['paths'],
 *   optionalFields: ['semantic_groups'],
 *   features: { semanticGroups: true, protocolVersion: true }
 * })
 */
export function registerProtocolVersion(version, schemaConfig) {
  if (!version || typeof version !== 'string') {
    throw new Error('Protocol version must be a non-empty string')
  }

  const normalizedVersion = normalizeVersion(version)

  if (normalizedVersion === null || normalizedVersion === 'legacy') {
    throw new Error(`Cannot register reserved version: ${version}`)
  }

  if (registry.has(normalizedVersion)) {
    throw new Error(`Protocol version already registered: ${normalizedVersion}`)
  }

  // 构建完整的 schema 对象
  const schema = {
    version: normalizedVersion,
    fieldAliases: schemaConfig.fieldAliases || {},
    requiredFields: schemaConfig.requiredFields || ['paths'],
    optionalFields: schemaConfig.optionalFields || [],
    pathRequiredFields: schemaConfig.pathRequiredFields || ['path_title'],
    features: {
      semanticGroups: schemaConfig.features?.semanticGroups || false,
      protocolVersion: schemaConfig.features?.protocolVersion || false
    }
  }

  registry.set(normalizedVersion, schema)
  resortVersions()
}

/**
 * 获取所有支持的协议版本列表
 *
 * 返回按版本号降序排列的版本列表（最新的在前），
 * 'legacy' 始终排在最后。
 *
 * @returns {string[]} 支持的版本号数组
 *
 * @example
 * getSupportedProtocolVersions()
 * // => ['0.6.2', 'legacy']
 */
export function getSupportedProtocolVersions() {
  return [...sortedVersions]
}

/**
 * 获取协议兼容性信息
 *
 * 检查指定版本号的兼容性状态，返回解析结果。
 *
 * @param {string} [version] - 要检查的版本号
 * @returns {ProtocolCompatibility} 兼容性信息
 *
 * @example
 * // 精确匹配
 * getProtocolCompatibility('0.6.2')
 * // => { status: 'exact', resolvedVersion: '0.6.2' }
 *
 * // 未知版本，将回退
 * getProtocolCompatibility('0.7.0')
 * // => { status: 'fallback', resolvedVersion: '0.6.2' }
 *
 * // 无版本号，使用 legacy
 * getProtocolCompatibility()
 * // => { status: 'legacy', resolvedVersion: 'legacy' }
 */
export function getProtocolCompatibility(version) {
  const normalizedVersion = normalizeVersion(version)

  // 无版本号时使用 legacy
  if (normalizedVersion === null) {
    return {
      status: 'legacy',
      resolvedVersion: 'legacy'
    }
  }

  // 精确匹配
  if (registry.has(normalizedVersion)) {
    return {
      status: 'exact',
      resolvedVersion: normalizedVersion
    }
  }

  // 未知版本，将回退到最新版本
  const latestVersion = sortedVersions.find(v => v !== 'legacy') || 'legacy'
  return {
    status: 'fallback',
    resolvedVersion: latestVersion
  }
}

// ============================================
// 导出内置 schema（用于测试和参考）
// ============================================

/**
 * Legacy schema 引用（只读）
 * @type {ProtocolSchema}
 */
export { LEGACY_SCHEMA }

/**
 * v0.6.2 schema 引用（只读）
 * @type {ProtocolSchema}
 */
export { V062_SCHEMA }
