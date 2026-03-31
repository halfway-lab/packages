# Raw HWP Audit Workflow

## Purpose

Use this workflow when you have a real or candidate HWP payload and want to check whether it matches the raw HWP contract expected by `@halfway-lab/question-expansion`.

The CLI accepts either:

- a Question Expander raw payload JSON file
- a real HWP `chain_*.jsonl` file, using the last non-empty entry as the audit source

## CLI

Run:

```bash
npm run audit:raw-hwp -- ./path/to/payload.json
```

Markdown output:

```bash
npm run audit:raw-hwp -- ./path/to/payload.json --format markdown
```

Write report to a file:

```bash
npm run audit:raw-hwp -- ./path/to/payload.json --format markdown --output ./audit-report.md
```

Example:

```bash
npm run audit:raw-hwp -- ./docs/examples/raw-hwp-sample.json
```

Live chain-log example:

```bash
npm run audit:raw-hwp -- ./docs/examples/raw-hwp-live-log-sample.jsonl
```

Invalid example:

```bash
npm run audit:raw-hwp -- ./docs/examples/raw-hwp-invalid-sample.json
```

The script will print a JSON report that includes:

- `valid`
- `errorCount`
- `warningCount`
- `summaryLine`
- `sourceKind`
- `extractionMode`
- `findings`
- `question`
- `pathCount`
- `branchTypes`
- `pathPreviews`
- `nextQuestions`
- `keyTensions`
- `derivedFields`
- `meta`

With `--format markdown`, it renders a human-readable report instead of JSON, including extraction notes and branch-type heuristic details when the input came from a live `chain_*.jsonl` log.

The current heuristic rules and their tradeoffs are documented in:

- `docs/HEURISTICS.md`

With `--output <file>`, it writes the rendered report to disk instead of stdout.

If the payload is invalid, the script exits with code `2`.

## Package API

If you want to audit inside another tool or test, use:

```js
import { buildRawHwpAuditReport } from '@halfway-lab/question-expansion'

const report = buildRawHwpAuditReport(payload)
```

## Suggested Use

1. Capture a real live adapter response as JSON.
2. Or point the audit script at a real HWP `chain_*.jsonl` log when the adapter payload is not yet available.
3. Run the audit script.
4. Fix adapter payload mismatches before wiring the payload into product flows.

## Included Fixture

A sample audit fixture lives at:

- `docs/examples/raw-hwp-sample.json`
- `docs/examples/raw-hwp-invalid-sample.json`
- `docs/examples/raw-hwp-live-log-sample.jsonl`

Use it to confirm the CLI is working before auditing a real payload.
