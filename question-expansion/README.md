# @halfway-lab/question-expansion

Normalize raw exploration output into stable path data.

Validate, normalize, and audit HWP-style payloads before they hit your UI.

```bash
npm install @halfway-lab/question-expansion
```

```js
import { validateRawHwpExpansion } from '@halfway-lab/question-expansion'

const result = validateRawHwpExpansion({
  question: 'Should we expand internationally this year?',
  paths: [
    {
      path_id: 'path-1',
      title: 'Reframe the market-entry assumption',
      follow_up_question: 'Which constraint matters more than market size?'
    }
  ]
})

if (result.valid) {
  console.log(result.normalized.expansionPaths)
}
```

Why use it:

- Stable output contract for Question Expander-style path exploration
- Tolerant validation with schema-aware fallback and unknown-field findings
- Built-in helpers for overviews, session artifacts, view models, and payload audits

## 3-Step Start

1. Install the package.

```bash
npm install @halfway-lab/question-expansion
```

2. Validate and normalize raw payloads.

```js
import { validateRawHwpExpansion } from '@halfway-lab/question-expansion'

const result = validateRawHwpExpansion({
  question: 'Should we expand internationally this year?',
  paths: [
    {
      path_id: 'path-1',
      title: 'Reframe the market-entry assumption',
      follow_up_question: 'Which constraint matters more than market size?'
    }
  ]
})

if (result.valid) {
  console.log(result.normalized.expansionPaths)
}
```

3. Feed the stable output into your UI or product logic.

```js
import { buildStructuredOverview } from '@halfway-lab/question-expansion'

const normalized = result.normalized
const overview = buildStructuredOverview(normalized.question, normalized.expansionPaths)

console.log(normalized.expansionPaths[0].path_title)
console.log(overview.nextQuestions)
```

## Best For

- apps that render exploration trees, branches, or follow-up question paths
- adapters that need to normalize unstable provider output before it reaches product logic
- audit workflows that compare live protocol output against a stable app contract
- teams evolving a reasoning or question-expansion protocol while keeping downstream UI stable

## Input To Output

Raw input:

```json
{
  "question": "Should we expand internationally this year?",
  "paths": [
    {
      "path_id": "path-1",
      "title": "Reframe the market-entry assumption",
      "follow_up_question": "Which constraint matters more than market size?",
      "path_type": "premise_shift"
    }
  ]
}
```

Normalized output:

```json
{
  "question": "Should we expand internationally this year?",
  "expansionPaths": [
    {
      "id": "path-1",
      "path_title": "Reframe the market-entry assumption",
      "next_question": "Which constraint matters more than market size?",
      "branch_type": "premise_shift"
    }
  ]
}
```

That means upstream payloads can evolve, while your UI and product logic keep depending on one stable shape.

## Version

Current local package version: `0.1.7`

## License

MIT

## Verification

- package self-test: `npm test`
- raw payload audit: `npm run audit:raw-hwp -- ./path/to/payload.json`
- live chain-log audit: `npm run audit:raw-hwp -- /path/to/chain_*.jsonl`
- raw payload audit as markdown: `npm run audit:raw-hwp -- ./path/to/payload.json --format markdown`
- downstream integration check: run the Question Expander app tests from `apps/question-expander`
- heuristic rule notes: `docs/HEURISTICS.md`
- release readiness notes: `docs/RELEASE_READINESS.md`

## Core Capabilities

- Raw HWP request shaping with `buildRawHwpExpandRequest(...)`
- Raw HWP normalization for object or top-level array payloads
- Schema-aware validation with protocol-version fallback
- Unknown-field auditing at both top-level and path-level
- Overview and session artifact generation for Question Expander-style UX

## Owns

- Question Expander path contract normalization
- branch-type labels and product-facing path semantics
- structured overview generation
- view-model assembly for focused branch exploration
- session artifacts such as pause summaries, markdown export content, and session summaries
- session record and history-card view model shaping
- pure runtime helpers for tree-state maps, session ids, and status copy

## Does Not Own

- app UI and interaction rendering
- browser-local persistence implementation
- protocol/HWP execution authority
- adapter transport details
- app state management

## Package Surface

```js
import {
  buildRawHwpExpandRequest,
  extractRawHwpAuditPayload,
  LIVE_BRANCH_TYPE_RULES,
  inferLiveBranchType,
  matchLiveBranchTypeRule,
  normalizeExpansionPath,
  normalizeExpansionResponse,
  normalizeRawHwpPath,
  normalizeRawHwpExpansion,
  validateRawHwpExpansion,
  summarizeRawHwpValidation,
  buildRawHwpAuditReport,
  getBranchTypeLabel,
  buildStructuredOverview,
  buildExpansionViewModel,
  buildPauseSummary,
  buildPathMarkdown,
  buildSessionSummary,
  buildSessionRecord,
  buildHistoryCardViewModel,
  formatSessionTimestamp,
  createSessionId,
  buildRootParentMap,
  buildChildParentMap,
  buildStatusMessage
} from '@halfway-lab/question-expansion'
```

## Common Workflows

Validate and normalize a provider payload:

```js
import { validateRawHwpExpansion } from '@halfway-lab/question-expansion'

const result = validateRawHwpExpansion(payload)

if (result.valid) {
  console.log(result.normalized.expansionPaths)
} else {
  console.log(result.findings)
}
```

Audit a real payload from the CLI:

```bash
npm run audit:raw-hwp -- ./payload.json
npm run audit:raw-hwp -- ./payload.json --format markdown
npm run audit:raw-hwp -- ./chain_2026-03-31.jsonl
```

Build a product-facing expansion view model:

```js
import {
  normalizeRawHwpExpansion,
  buildExpansionViewModel
} from '@halfway-lab/question-expansion'

const normalized = normalizeRawHwpExpansion(payload)
const viewModel = buildExpansionViewModel({
  question: normalized.question,
  rootPaths: normalized.expansionPaths,
  focusedPathId: normalized.expansionPaths[0]?.id
})

console.log(viewModel.structuredOverview)
```

## What Makes It Different

- It is tolerant by default: unknown fields become findings instead of hard failures.
- It is product-oriented: outputs are shaped for apps, not raw protocol internals.
- It is practical for real migrations: you can audit live chain logs before you trust a new upstream contract.

## Current Structure

```text
src/
  branchTypes.js
  contracts/
    liveBranchTypeHeuristics.js
    paths.js
    rawHwp.js
  overview/
    structuredOverview.js
  runtime/
    status.js
    treeState.js
  session/
    historyViewModel.js
    sessionArtifacts.js
    sessionRecord.js
  viewModel/
    buildExpansionViewModel.js
  index.js
```

## Boundary

The intended long-term flow is:

1. `protocol/HWP` provides raw chain capability
2. `packages/question-expansion` interprets raw HWP output into Question Expander structures
3. `apps/question-expander` owns input, rendering, interaction, revisit flows, and mobile UX

This package is a standalone product-domain package. It should not be described as an interpretation layer for any other package.

## Upstream

The real upstream protocol repository is `halfway-lab/HWP`.

This package should depend only on the raw HWP contract shape. It should not depend on HWP repository-internal file layout, scripts, or module structure.

For audit and alignment only, the CLI can also read a real HWP `chain_*.jsonl` log entry and extract a contract-shaped payload before validation. That extraction path is intentionally audit-only, reports which fields were derived or inferred, and does not change the runtime product contract.
