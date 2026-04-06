import fs from 'node:fs/promises'
import path from 'node:path'

import { buildRawHwpAuditReport } from '../src/index.js'

function parseArgs(argv) {
  const args = [...argv]
  const options = {
    inputPath: '',
    format: 'json',
    outputPath: ''
  }

  while (args.length > 0) {
    const current = args.shift()

    if (!current) {
      continue
    }

    if (!options.inputPath && !current.startsWith('--')) {
      options.inputPath = current
      continue
    }

    if (current === '--format') {
      options.format = String(args.shift() || 'json').trim() || 'json'
      continue
    }

    if (current === '--output') {
      options.outputPath = String(args.shift() || '').trim()
      continue
    }
  }

  return options
}

function parseAuditInput(rawText) {
  try {
    return JSON.parse(rawText)
  } catch {
    const lines = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)

    if (lines.length === 0) {
      throw new Error('Audit input file was empty.')
    }

    try {
      return JSON.parse(lines.at(-1))
    } catch {
      throw new Error('Audit input must be JSON or JSONL.')
    }
  }
}

function renderReport(report, format) {
  if (format === 'markdown') {
    const derivedPathCount = Array.isArray(report.derivedFields?.paths)
      ? report.derivedFields.paths.filter(item => Object.values(item.derived || {}).some(Boolean)).length
      : 0
    const lines = [
      '# Raw Expansion Audit Report',
      '',
      `- Valid: ${report.valid ? 'yes' : 'no'}`,
      `- Errors: ${report.errorCount}`,
      `- Warnings: ${report.warningCount}`,
      `- Summary: ${report.summaryLine}`,
      `- Source kind: ${report.sourceKind || 'raw_hwp_payload'}`,
      `- Extraction mode: ${report.extractionMode || 'none'}`,
      `- Question: ${report.question || 'N/A'}`,
      `- Path count: ${report.pathCount}`,
      `- Branch types: ${report.branchTypes.join(', ') || 'N/A'}`,
      ''
    ]

    if (report.keyTensions.length > 0) {
      lines.push('## Key Tensions', '')
      report.keyTensions.forEach(item => lines.push(`- ${item}`))
      lines.push('')
    }

    if (report.nextQuestions.length > 0) {
      lines.push('## Next Questions', '')
      report.nextQuestions.forEach(item => lines.push(`- ${item}`))
      lines.push('')
    }

    if (Array.isArray(report.pathPreviews) && report.pathPreviews.length > 0) {
      lines.push('## Path Preview', '')
      report.pathPreviews.forEach(item => {
        lines.push(`- ${item.title || item.id} [${item.branchType || 'unknown'}]`)
        if (item.nextQuestion) {
          lines.push(`  Next: ${item.nextQuestion}`)
        }
        if (item.blindSpotHint) {
          lines.push(`  Blind spot: ${item.blindSpotHint}`)
        }
        if (item.heuristic?.rule_id) {
          const heuristicDetails = [`Rule: ${item.heuristic.rule_id}`]
          if (item.heuristic.confidence) {
            heuristicDetails.push(`confidence=${item.heuristic.confidence}`)
          }
          if (Array.isArray(item.heuristic.matched_keywords) && item.heuristic.matched_keywords.length > 0) {
            heuristicDetails.push(`keywords=${item.heuristic.matched_keywords.join(', ')}`)
          }
          lines.push(`  Heuristic: ${heuristicDetails.join(' | ')}`)
        }
      })
      lines.push('')
    }

    if (report.findings.length > 0) {
      lines.push('## Findings', '')
      report.findings.forEach(item => {
        lines.push(`- [${item.level}] ${item.field}: ${item.message}`)
      })
      lines.push('')
    }

    if (report.extractionMode === 'derived_for_audit') {
      lines.push('## Extraction Notes', '')
      lines.push(`- Derived path count: ${derivedPathCount}`)

      if (Array.isArray(report.derivedFields?.question) && report.derivedFields.question.length > 0) {
        lines.push(`- Question sources: ${report.derivedFields.question.join(', ')}`)
      }

      if (Array.isArray(report.derivedFields?.next_questions) && report.derivedFields.next_questions.length > 0) {
        lines.push(`- Next-question sources: ${report.derivedFields.next_questions.join(', ')}`)
      }

      if (Array.isArray(report.derivedFields?.paths) && report.derivedFields.paths.length > 0) {
        report.derivedFields.paths.forEach(item => {
          const derivedFlags = Object.entries(item.derived || {})
            .filter(([, value]) => value)
            .map(([key]) => key)
          if (derivedFlags.length > 0) {
            const heuristicBits = []
            if (item.heuristic?.rule_id) {
              heuristicBits.push(`rule=${item.heuristic.rule_id}`)
            }
            if (item.heuristic?.confidence) {
              heuristicBits.push(`confidence=${item.heuristic.confidence}`)
            }
            if (Array.isArray(item.heuristic?.matched_keywords) && item.heuristic.matched_keywords.length > 0) {
              heuristicBits.push(`keywords=${item.heuristic.matched_keywords.join(', ')}`)
            }
            const heuristicSuffix = heuristicBits.length > 0 ? `; ${heuristicBits.join('; ')}` : ''
            lines.push(`- ${item.id}: derived ${derivedFlags.join(', ')} (${item.branch_type_source}: ${item.branch_type}${heuristicSuffix})`)
          }
        })
      }

      lines.push('')
    }

    if (Object.keys(report.meta || {}).length > 0) {
      lines.push('## Meta', '', '```json', JSON.stringify(report.meta, null, 2), '```', '')
    }

    return `${lines.join('\n').trim()}\n`
  }

  return `${JSON.stringify(report, null, 2)}\n`
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (!options.inputPath) {
    console.error('Usage: npm run audit:raw-expansion -- <payload.json> [--format json|markdown] [--output <file>]')
    console.error('Legacy alias: npm run audit:raw-hwp -- <payload.json> [--format json|markdown] [--output <file>]')
    process.exitCode = 1
    return
  }

  const resolvedPath = path.resolve(process.cwd(), options.inputPath)
  const rawText = await fs.readFile(resolvedPath, 'utf8')
  const payload = parseAuditInput(rawText)
  const report = buildRawHwpAuditReport(payload)
  const rendered = renderReport(report, options.format)

  if (options.outputPath) {
    const resolvedOutputPath = path.resolve(process.cwd(), options.outputPath)
    await fs.writeFile(resolvedOutputPath, rendered, 'utf8')
  } else {
    process.stdout.write(rendered)
  }

  if (!report.valid) {
    process.exitCode = 2
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
