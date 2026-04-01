import { normalizeRawHwpExpansion } from './rawHwp.js'
import { hasAnyField } from '../utils/fieldHelpers.js'

/**
 * Validate a raw HWP expansion payload.
 *
 * @param {RawHwpExpansion|RawHwpExpansion[]} rawHwp - Raw HWP data to validate
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
  const rawPaths = Array.isArray(rawHwp)
    ? rawHwp
    : (rawHwp.paths || rawHwp.expansion_paths || [])

  if (!Array.isArray(rawPaths)) {
    findings.push({
      level: 'error',
      field: 'paths',
      message: 'Missing paths array in raw HWP payload.'
    })
  } else if (rawPaths.length === 0 && options.allowEmpty !== true) {
    findings.push({
      level: 'error',
      field: 'paths',
      message: 'Raw HWP payload contains an empty paths array.'
    })
  }

  if (!hasAnyField(rawHwp, ['question', 'core_question', 'coreQuestion']) && !options.question) {
    findings.push({
      level: 'warning',
      field: 'question',
      message: 'Raw HWP payload does not expose question or core question context.'
    })
  }

  if (Array.isArray(rawPaths)) {
    rawPaths.forEach((path, index) => {
      if (!hasAnyField(path, ['id', 'path_id', 'pathId'])) {
        findings.push({
          level: 'warning',
          field: `paths[${index}].id`,
          message: 'Path is missing an explicit id field.'
        })
      }

      if (!hasAnyField(path, ['title', 'path_title', 'pathTitle'])) {
        findings.push({
          level: 'error',
          field: `paths[${index}].title`,
          message: 'Path is missing title/path_title.'
        })
      }

      if (!hasAnyField(path, ['next_question', 'nextQuestion', 'follow_up_question'])) {
        findings.push({
          level: 'warning',
          field: `paths[${index}].next_question`,
          message: 'Path is missing next question / follow-up question.'
        })
      }

      if (!hasAnyField(path, ['branch_type', 'branchType', 'path_type'])) {
        findings.push({
          level: 'warning',
          field: `paths[${index}].branch_type`,
          message: 'Path is missing branch type / path type.'
        })
      }
    })
  }

  if (hasAnyField(rawHwp, ['protocol_version'])) {
    findings.push({
      level: 'info',
      field: 'protocol_version',
      message: 'Detected protocol_version field: ' + String(rawHwp.protocol_version)
    })
  }

  if (Array.isArray(rawHwp.semantic_groups)) {
    findings.push({
      level: 'info',
      field: 'semantic_groups',
      message: `Detected semantic_groups data with ${rawHwp.semantic_groups.length} group(s).`
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
          ? `Raw HWP payload valid with ${warnings.length} warning(s).`
          : 'Raw HWP payload valid.')
      : `Raw HWP payload invalid with ${errors.length} error(s) and ${warnings.length} warning(s).`,
    errorFields: errors.map(item => item.field),
    warningFields: warnings.map(item => item.field)
  }
}
