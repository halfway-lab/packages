import { normalizeRawHwpExpansion } from './rawHwp.js'
import { hasAnyField, pickFieldWithSchema } from '../utils/fieldHelpers.js'
import { resolveProtocolSchema } from './protocolRegistry.js'

const PATH_KNOWN_FIELD_NAMES = [
  'id',
  'path_title',
  'path_summary',
  'next_question',
  'branch_type',
  'unfinished_score',
  'blind_spot_hint',
  'created_at',
  'level',
  'key_tensions',
  'tags',
  'parent_id'
]

/**
 * Validate a raw expansion payload.
 *
 * @param {RawHwpExpansion|RawHwpExpansion[]} rawHwp - Raw exploration data to validate
 * @param {ValidateOptions} options - Validation options
 * @returns {ValidationResult} Validation result with findings and normalized data
 *
 * @example
 * validateRawHwpExpansion({
 *   question: 'How?',
 *   paths: [{ title: 'Analysis' }]
 * })
 * // => { valid: false, findings: [...], normalized: null }
 */
export function validateRawHwpExpansion(rawHwp = {}, options = {}) {
  const findings = []
  const isArrayPayload = Array.isArray(rawHwp)

  // 检测 protocol_version 并解析对应的 schema
  const protocolVersion = pickFieldWithSchema(rawHwp, 'protocol_version', null, null)
  const schema = resolveProtocolSchema(protocolVersion)

  // 使用 schema 的 fieldAliases 构建字段检查列表
  const rawPaths = Array.isArray(rawHwp)
    ? rawHwp
    : (pickFieldWithSchema(rawHwp, 'paths', schema, null) || [])

  // 验证根级必填字段（使用 schema.requiredFields）
  const requiredFields = schema.requiredFields || ['paths']
  if (!isArrayPayload) {
    for (const field of requiredFields) {
      const value = pickFieldWithSchema(rawHwp, field, schema, null)
      if (value === null || value === undefined ||
          (Array.isArray(value) && value.length === 0)) {
        findings.push({
          level: 'error',
          field,
          message: `Missing required field: ${field}`
        })
      }
    }
  }

  if (!Array.isArray(rawPaths)) {
    findings.push({
      level: 'error',
      field: 'paths',
      message: 'Missing paths array in raw expansion payload.'
    })
  } else if (rawPaths.length === 0 && options.allowEmpty !== true) {
    findings.push({
      level: 'error',
      field: 'paths',
      message: 'Raw expansion payload contains an empty paths array.'
    })
  }

  // 检查核心问题字段（使用 schema 的 fieldAliases）
  const coreQuestionValue = pickFieldWithSchema(rawHwp, 'core_question', schema, null)
  if (!coreQuestionValue && !options.question) {
    findings.push({
      level: 'warning',
      field: 'question',
      message: 'Raw expansion payload does not expose question or core question context.'
    })
  }

  // 验证路径级字段（使用 schema.pathRequiredFields）
  const pathRequiredFields = schema.pathRequiredFields || ['path_title', 'title', 'pathTitle']
  if (Array.isArray(rawPaths)) {
    rawPaths.forEach((path, index) => {
      // 检查路径 ID
      const pathId = pickFieldWithSchema(path, 'id', schema, null)
      if (!pathId) {
        findings.push({
          level: 'warning',
          field: `paths[${index}].id`,
          message: 'Path is missing an explicit id field.'
        })
      }

      // 检查路径级必填字段
      for (const field of pathRequiredFields) {
        const aliases = schema.fieldAliases?.[field] || [field]
        if (!hasAnyField(path, aliases)) {
          // 使用 'title' 作为报告字段名（如果可用），保持与现有测试的兼容性
          const reportField = aliases.includes('title') ? 'title' : (aliases[0] || field)
          findings.push({
            level: 'error',
            field: `paths[${index}].${reportField}`,
            message: `Path is missing ${reportField}.`
          })
        }
      }

      // 检查其他可选字段（使用 schema.fieldAliases）
      const nextQuestion = pickFieldWithSchema(path, 'next_question', schema, null)
      if (!nextQuestion) {
        findings.push({
          level: 'warning',
          field: `paths[${index}].next_question`,
          message: 'Path is missing next question / follow-up question.'
        })
      }

      const branchType = pickFieldWithSchema(path, 'branch_type', schema, null)
      if (!branchType) {
        findings.push({
          level: 'warning',
          field: `paths[${index}].branch_type`,
          message: 'Path is missing branch type / path type.'
        })
      }
    })
  }

  // 协议版本信息
  if (protocolVersion) {
    findings.push({
      level: 'info',
      field: 'protocol_version',
      message: `Detected protocol_version field: ${protocolVersion} (resolved to ${schema.version}${schema._fallback ? ' [fallback]' : ''})`
    })

    // 版本回退警告
    if (schema._fallback) {
      findings.push({
        level: 'warning',
        field: 'protocol_version',
        message: `Protocol version '${protocolVersion}' is not explicitly supported. Falling back to version '${schema.version}'. Some fields may not be correctly validated.`
      })
    }
  }

  // 检测未知字段（顶层字段不在 schema 的 requiredFields 或 optionalFields 中）
  const allKnownFields = new Set([
    ...(schema.requiredFields || []),
    ...(schema.optionalFields || [])
  ])

  // 添加 schema.fieldAliases 中的所有别名到已知字段集合
  if (schema.fieldAliases) {
    Object.values(schema.fieldAliases).forEach(aliases => {
      aliases.forEach(alias => allKnownFields.add(alias))
    })
  }

  const allKnownPathFields = new Set(
    PATH_KNOWN_FIELD_NAMES.flatMap(fieldName => schema.fieldAliases?.[fieldName] || [fieldName])
  )

  // 检查顶层字段
  if (rawHwp && typeof rawHwp === 'object' && !Array.isArray(rawHwp)) {
    Object.keys(rawHwp).forEach(fieldName => {
      if (!allKnownFields.has(fieldName)) {
        findings.push({
          level: 'info',
          field: fieldName,
          message: `Unknown field '${fieldName}' detected. This may be a new upstream or adapter field not yet supported by this package version.`
        })
      }
    })
  }

  // 检查路径级未知字段
  if (Array.isArray(rawPaths)) {
    rawPaths.forEach((path, index) => {
      if (!path || typeof path !== 'object' || Array.isArray(path)) {
        return
      }

      Object.keys(path).forEach(fieldName => {
        if (!allKnownPathFields.has(fieldName)) {
          findings.push({
            level: 'info',
            field: `paths[${index}].${fieldName}`,
            message: `Unknown path field '${fieldName}' detected. This may be a new upstream or adapter path field not yet supported by this package version.`
          })
        }
      })
    })
  }

  // 语义组信息（如果 schema 支持）
  const semanticGroups = pickFieldWithSchema(rawHwp, 'semantic_groups', schema, null)
  if (Array.isArray(semanticGroups)) {
    findings.push({
      level: 'info',
      field: 'semantic_groups',
      message: `Detected semantic_groups data with ${semanticGroups.length} group(s).`
    })
  }

  const errors = findings.filter(item => item.level === 'error')

  return {
    valid: errors.length === 0,
    findings,
    normalized: errors.length === 0
      ? normalizeRawHwpExpansion(rawHwp, options)
      : null
  }
}

/**
 * Summarize validation results into a human-readable format.
 *
 * @param {Object} validation - Validation result
 * @param {boolean} [validation.valid] - Whether validation passed
 * @param {ValidationFinding[]} [validation.findings] - Array of findings
 * @returns {ValidationSummary} Summarized validation results
 *
 * @example
 * summarizeRawHwpValidation({
 *   valid: false,
 *   findings: [{ level: 'error', field: 'paths', message: '...' }]
 * })
 * // => { valid: false, errorCount: 1, warningCount: 0, summaryLine: '...', ... }
 */
export function summarizeRawHwpValidation(validation = {}) {
  const findings = Array.isArray(validation.findings) ? validation.findings : []
  const errors = findings.filter(item => item.level === 'error')
  const warnings = findings.filter(item => item.level === 'warning')

  return {
    valid: validation.valid === true,
    errorCount: errors.length,
    warningCount: warnings.length,
    summaryLine: validation.valid === true
      ? (warnings.length > 0
          ? `Raw expansion payload valid with ${warnings.length} warning(s).`
          : 'Raw expansion payload valid.')
      : `Raw expansion payload invalid with ${errors.length} error(s) and ${warnings.length} warning(s).`,
    errorFields: errors.map(item => item.field),
    warningFields: warnings.map(item => item.field)
  }
}
