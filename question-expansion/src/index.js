/**
 * @halfway-lab/question-expansion
 *
 * Question Expander product interpretation layer for Halfway Lab.
 * Translates lower-level HWP output into stable Question Expander objects
 * that the app can render, store, and evolve around.
 *
 * @module @halfway-lab/question-expansion
 */

// View Model
export { buildExpansionViewModel, findPathById } from './viewModel/buildExpansionViewModel.js'

// Overview
export { buildStructuredOverview } from './overview/structuredOverview.js'

// Branch Types
export { BRANCH_TYPE_LABELS, getBranchTypeLabel } from './branchTypes.js'

// Path Normalization
export { normalizeExpansionPath, normalizeExpansionResponse } from './contracts/paths.js'

// Heuristics
export { LIVE_BRANCH_TYPE_RULES, inferLiveBranchType, matchLiveBranchTypeRule } from './contracts/liveBranchTypeHeuristics.js'

// Raw HWP Contract
export {
  buildRawHwpExpandRequest,
  extractRawHwpAuditPayload,
  normalizeRawHwpPath,
  normalizeRawHwpExpansion,
  validateRawHwpExpansion,
  summarizeRawHwpValidation,
  buildRawHwpAuditReport
} from './contracts/rawHwp.js'

// Session Artifacts
export { buildPauseSummary, buildPathMarkdown, buildSessionSummary } from './session/sessionArtifacts.js'

// Session Record
export { buildSessionRecord } from './session/sessionRecord.js'

// History View Model
export { buildHistoryCardViewModel, formatSessionTimestamp } from './session/historyViewModel.js'

// Runtime Helpers
export { createSessionId, buildRootParentMap, buildChildParentMap } from './runtime/treeState.js'

// Status
export { buildStatusMessage } from './runtime/status.js'
