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
    const lines = [
      '# Raw HWP Audit Report',
      '',
      `- Valid: ${report.valid ? 'yes' : 'no'}`,
      `- Errors: ${report.errorCount}`,
      `- Warnings: ${report.warningCount}`,
      `- Summary: ${report.summaryLine}`,
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

    if (report.findings.length > 0) {
      lines.push('## Findings', '')
      report.findings.forEach(item => {
        lines.push(`- [${item.level}] ${item.field}: ${item.message}`)
      })
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
    console.error('Usage: npm run audit:raw-hwp -- <payload.json> [--format json|markdown] [--output <file>]')
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
