# @halfway-lab/question-expansion

`question-expansion` is the product interpretation layer for Question Expander.

Its job is to translate lower-level HWP output into stable Question Expander objects that the app can render, store, and evolve around.

## Version

Current local package version: `0.1.0`

## Verification

- package self-test: `npm test`
- downstream integration check: run the Question Expander app tests from `apps/question-expander`

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
  normalizeExpansionPath,
  normalizeExpansionResponse,
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

## Current Structure

```text
src/
  branchTypes.js
  contracts/
    paths.js
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
2. `packages/question-expansion` interprets raw output into Question Expander structures
3. `apps/question-expander` owns input, rendering, interaction, revisit flows, and mobile UX

`packages/question-expansion` and `packages/reading-note` are parallel product-domain packages. Neither package should be described as the interpretation layer for the other.
