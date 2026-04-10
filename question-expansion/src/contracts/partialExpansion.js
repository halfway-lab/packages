import { normalizeRawHwpPath } from './rawHwp.js'

function skipWhitespaceAndCommas(text, startIndex) {
  let index = startIndex

  while (index < text.length) {
    const ch = text[index]
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t' || ch === ',') {
      index += 1
      continue
    }
    break
  }

  return index
}

/**
 * Extract complete path-shaped objects from a streamed JSON text buffer.
 * This only attempts top-level extraction inside the `"paths": [...]` array.
 *
 * @param {string} text
 * @param {object} [options]
 * @param {number} [options.alreadyExtracted=0]
 * @returns {Array<object>}
 */
export function extractPartialRawExpansionObjects(text = '', options = {}) {
  const normalizedText = String(text || '')
  const alreadyExtracted = Number(options.alreadyExtracted || 0)

  const pathsKeyIdx = normalizedText.indexOf('"paths"')
  if (pathsKeyIdx === -1) {
    return []
  }

  const bracketStart = normalizedText.indexOf('[', pathsKeyIdx)
  if (bracketStart === -1) {
    return []
  }

  const results = []
  let index = bracketStart + 1
  let objectCount = 0

  while (index < normalizedText.length && objectCount <= alreadyExtracted + 20) {
    index = skipWhitespaceAndCommas(normalizedText, index)

    if (index >= normalizedText.length || normalizedText[index] === ']') {
      break
    }

    if (normalizedText[index] !== '{') {
      index += 1
      continue
    }

    let depth = 0
    let inString = false
    let escaped = false
    const objectStart = index

    while (index < normalizedText.length) {
      const ch = normalizedText[index]

      if (escaped) {
        escaped = false
        index += 1
        continue
      }

      if (ch === '\\' && inString) {
        escaped = true
        index += 1
        continue
      }

      if (ch === '"') {
        inString = !inString
      } else if (!inString) {
        if (ch === '{') {
          depth += 1
        } else if (ch === '}') {
          depth -= 1
          if (depth === 0) {
            objectCount += 1

            if (objectCount > alreadyExtracted) {
              const objectText = normalizedText.slice(objectStart, index + 1)
              try {
                results.push(JSON.parse(objectText))
              } catch {
                // Ignore malformed partial objects.
              }
            }

            index += 1
            break
          }
        }
      }

      index += 1
    }

    if (depth > 0) {
      break
    }
  }

  return results
}

/**
 * Build a package-owned partial raw expansion path from a streamed object.
 *
 * @param {object} path
 * @param {object} [options]
 * @param {number} [options.level=1]
 * @param {number} [options.index=0]
 * @param {string} [options.idSeed='partial']
 * @returns {object}
 */
export function createPartialRawExpansionPath(path = {}, options = {}) {
  const level = Number(options.level || path.level || 1)
  const index = Number(options.index || 0)
  const idSeed = String(options.idSeed || 'partial').trim() || 'partial'
  const id = String(path.id || path.path_id || path.pathId || `${idSeed}-${level}-${index + 1}`).trim()
  const branchType = String(path.branchType || path.branch_type || path.path_type || '').trim()
  const openQuestions = Array.isArray(path.openQuestions)
    ? path.openQuestions
    : Array.isArray(path.open_questions)
      ? path.open_questions
      : path.follow_up_question
        ? [path.follow_up_question]
        : []
  const nextSteps = Array.isArray(path.nextSteps)
    ? path.nextSteps
    : Array.isArray(path.next_steps)
      ? path.next_steps
      : []
  const parentId = path.parentId ?? path.parent_id ?? null

  return {
    id,
    path_id: id,
    title: String(path.title || path.path_title || path.pathTitle || '').trim(),
    summary: String(path.summary || path.path_summary || path.pathSummary || '').trim(),
    branchType,
    branch_type: branchType,
    path_type: branchType,
    openQuestions,
    open_questions: openQuestions,
    nextSteps,
    next_steps: nextSteps,
    parentId,
    parent_id: parentId,
    follow_up_question: String(
      path.follow_up_question ||
      path.next_question ||
      path.nextQuestion ||
      openQuestions[0] ||
      nextSteps[0] ||
      ''
    ).trim(),
    open_score: typeof path.open_score === 'number'
      ? path.open_score
      : (typeof path.unfinished_score === 'number' ? path.unfinished_score : undefined),
    risk_hint: String(path.risk_hint || path.blind_spot_hint || path.blindSpotHint || '').trim(),
    labels: Array.isArray(path.labels) ? path.labels : (Array.isArray(path.tags) ? path.tags : []),
    tensions: Array.isArray(path.tensions)
      ? path.tensions
      : (Array.isArray(path.key_tensions) ? path.key_tensions : []),
    level
  }
}

/**
 * Normalize a streamed partial path into the stable product-facing path shape.
 *
 * @param {object} path
 * @param {object} [options]
 * @returns {import('./rawHwp.js').normalizeRawHwpPath extends (...args: any[]) => infer R ? R : object}
 */
export function normalizePartialExpansionPath(path = {}, options = {}) {
  const partialRawPath = createPartialRawExpansionPath(path, options)
  return normalizeRawHwpPath(partialRawPath, options)
}

/**
 * Extract and normalize newly completed partial paths from a streamed text buffer.
 *
 * @param {string} text
 * @param {object} [options]
 * @param {number} [options.alreadyExtracted=0]
 * @returns {Array<object>}
 */
export function extractPartialExpansionPaths(text = '', options = {}) {
  const objects = extractPartialRawExpansionObjects(text, options)

  return objects.map((item, index) => normalizePartialExpansionPath(item, {
    ...options,
    index: Number(options.alreadyExtracted || 0) + index
  }))
}
