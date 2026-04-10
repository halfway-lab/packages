# @halfway-lab/question-expansion

Normalize raw exploration output into stable path data.

Validate, normalize, and audit compatible raw exploration payloads, including HWP-style payloads, before they hit your UI, storage, or product logic.

- Normalize unstable provider output into one stable contract
- Surface unknown fields as findings instead of silently missing them
- Build product-ready overviews and path artifacts on top of normalized data

```bash
npm install @halfway-lab/question-expansion
```

```js
import { validateRawExpansion } from '@halfway-lab/question-expansion'

const result = validateRawExpansion({
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
- Content-quality warnings for suspicious-but-usable payloads
- Built-in helpers for overviews, session artifacts, view models, and payload audits

## Next Step

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

The raw-input side is intentionally tolerant: besides HWP-style fields, it also accepts neutral aliases such as `sessionId`, `openQuestions`, `nextSteps`, and `parentId` for adapter-facing payload alignment.

For TypeScript consumers, the package now also exposes neutral type aliases such as `RawExpansionPath`, `RawExpansionPayload`, and `RawExpansionRequestInput`, while keeping legacy `RawHwp*` names for compatibility.

The package is also protocol-version aware. When compatible payloads include fields such as `protocol_version` and `semantic_groups`, validation will select the matching schema when available and fall back safely when the version is unknown.

## Version

Current local package version: `0.1.10`

## License

MIT

## Verification

- package self-test: `npm test`
- raw payload audit: `npm run audit:raw-expansion -- ./path/to/payload.json`
- live chain-log audit: `npm run audit:raw-expansion -- /path/to/chain_*.jsonl`
- raw payload audit as markdown: `npm run audit:raw-expansion -- ./path/to/payload.json --format markdown`
- legacy CLI alias still supported: `npm run audit:raw-hwp -- ...`
- downstream integration check: run the Question Expander app tests from `apps/question-expander`
- heuristic rule notes: `docs/HEURISTICS.md`
- release readiness notes: `docs/RELEASE_READINESS.md`

## Core Capabilities

- Raw expansion request shaping with `buildRawHwpExpandRequest(...)`
- Raw exploration payload normalization for object or top-level array payloads
- Schema-aware validation with protocol-version fallback
- Content-quality warning surfacing for blank-but-present fields, empty next-question arrays, unknown branch types, and version-metadata mismatches
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
  buildRawExpansionAuditReport,
  normalizeRawExpansion,
  summarizeRawExpansionValidation,
  validateRawExpansion,
  buildRawHwpExpandRequest,
  buildRawHwpAuditReport,
  buildChildParentMap,
  buildExpansionViewModel,
  buildHistoryCardViewModel,
  buildPathMarkdown,
  buildPauseSummary,
  buildRootParentMap,
  buildSessionRecord,
  buildSessionSummary,
  buildStatusMessage,
  buildStructuredOverview,
  createSessionId,
  extractRawHwpAuditPayload,
  formatSessionTimestamp,
  getBranchTypeLabel,
  inferLiveBranchType,
  LIVE_BRANCH_TYPE_RULES,
  matchLiveBranchTypeRule,
  normalizeExpansionPath,
  normalizeExpansionResponse,
  normalizeRawHwpExpansion,
  normalizeRawHwpPath,
  summarizeRawHwpValidation,
  validateRawHwpExpansion
} from '@halfway-lab/question-expansion'
```

## Common Workflows

Validate and normalize a provider payload:

```js
import { validateRawExpansion } from '@halfway-lab/question-expansion'

const result = validateRawExpansion(payload)

if (result.valid) {
  console.log(result.normalized.expansionPaths)
} else {
  console.log(result.findings)
}
```

Build a typed raw expansion request in TypeScript:

```ts
import {
  buildRawHwpExpandRequest,
  type RawExpansionPayload,
  type RawExpansionRequestInput
} from '@halfway-lab/question-expansion'

const request: RawExpansionRequestInput = {
  question: 'Should we expand internationally this year?',
  depth: 1,
  options: {
    max_paths: 3
  }
}

const payload: RawExpansionPayload = {
  question: 'Should we expand internationally this year?',
  sessionId: 'session-42',
  paths: [
    {
      pathId: 'path-1',
      title: 'Reframe the market-entry assumption',
      openQuestions: ['Which constraint matters more than market size?'],
      parentId: null
    }
  ]
}

const rawRequest = buildRawHwpExpandRequest(request)
console.log(rawRequest)
console.log(payload.paths?.[0]?.openQuestions)
```

Audit a real payload from the CLI:

```bash
npm run audit:raw-expansion -- ./payload.json
npm run audit:raw-expansion -- ./payload.json --format markdown
npm run audit:raw-expansion -- ./chain_2026-03-31.jsonl
```

The markdown audit output includes extraction notes and heuristic branch-type details when the input comes from a live `chain_*.jsonl` wrapper. Those heuristics are audit-only and are documented in `docs/HEURISTICS.md`.

Audit a chain-log style wrapper from code:

```js
import {
  buildRawExpansionAuditReport,
  extractRawHwpAuditPayload
} from '@halfway-lab/question-expansion'

const wrapperInput = {
  payloads: [
    {
      text: JSON.stringify({
        round_id: 'round_8',
        questions: ['How should identity systems balance autonomy and security?'],
        unfinished: ['Which infrastructure dependency still controls the outcome?'],
        paths: [
          {
            continuation_hook: 'Which layer still defines the practical terms?'
          }
        ]
      })
    }
  ],
  meta: {
    agentMeta: {
      sessionId: 'live-session-8',
      provider: 'bailian',
      model: 'qwen3-max'
    }
  }
}

const auditPayload = extractRawHwpAuditPayload(wrapperInput)
const report = buildRawExpansionAuditReport(wrapperInput)

console.log(auditPayload.meta.sessionId)
console.log(report.sourceKind)
console.log(report.derivedFields.paths)
```

Build a product-facing expansion view model:

```js
import {
  normalizeRawExpansion,
  buildExpansionViewModel
} from '@halfway-lab/question-expansion'

const normalized = normalizeRawExpansion(payload)
const viewModel = buildExpansionViewModel({
  question: normalized.question,
  rootPaths: normalized.expansionPaths,
  focusedPathId: normalized.expansionPaths[0]?.id
})

console.log(viewModel.structuredOverview)
```

The audit entry points accept either a raw expansion payload or a wrapper input with `payloads` and optional `meta.agentMeta`. For TypeScript consumers, that surface is exported as `RawExpansionAuditInput`.

If you need the full contract details for schema selection, optional `v0.6.2` fields, supported aliases, and warning behavior, see `docs/HWP_CONTRACT.md`.

Normalize partial paths from streamed JSON text:

```js
import {
  extractPartialExpansionPaths,
  normalizePartialExpansionPath
} from '@halfway-lab/question-expansion'

const streamedText = `{
  "paths": [
    {
      "path_id": "path-1",
      "title": "Reframe the market-entry assumption",
      "openQuestions": ["Which constraint matters more than market size?"]
    }
  ]
}`

const partialPaths = extractPartialExpansionPaths(streamedText, {
  level: 1,
  idSeed: 'root-question'
})

const onePath = normalizePartialExpansionPath({
  title: 'Map the hidden dependency',
  nextSteps: ['Which dependency sets the real limit?']
}, {
  level: 2,
  idSeed: 'path-1'
})

console.log(partialPaths[0].next_question)
console.log(onePath.id)
```

These partial helpers are package-owned streaming contract utilities. They are meant for extracting and normalizing path fragments during streaming, but they do not own fetch, SSE, or transport concerns.

For TypeScript consumers, the package also exports `RawExpansionStreamCallbacks` and `RawExpansionStreamEvent` so app-side adapters and UI code can share one callback vocabulary for:

- `onContentChunk`
- `onPartialPath`
- `onThinkingChunk`
- `onFinalPayload`
- `onEvent`

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
    partialExpansion.js
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

1. an upstream adapter or runtime provides a compatible raw exploration contract
2. `packages/question-expansion` validates and interprets that raw payload into stable Question Expander structures
3. `apps/question-expander` owns input, rendering, interaction, revisit flows, and mobile UX

This package is a standalone product-domain package. It should not be described as an interpretation layer for any other package.

## Upstream

`halfway-lab/HWP` is one supported upstream contract family, and an important reference implementation for this package.

This package should depend only on a compatible raw exploration contract. It should not depend on upstream repository-internal file layout, scripts, or module structure.

For audit and alignment only, the CLI can also read a real HWP `chain_*.jsonl` log entry and extract a contract-shaped payload before validation. That extraction path is intentionally audit-only, reports which fields were derived or inferred, and does not change the runtime product contract.
