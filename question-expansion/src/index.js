/**
 * @halfway-lab/question-expansion
 *
 * Normalize, validate, and audit raw HWP exploration output into stable
 * Question Expander objects that apps can render, store, and build on.
 *
 * @module @halfway-lab/question-expansion
 */

// Constants
export * from './constants.js'

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
  normalizeRawHwpPath,
  normalizeRawHwpExpansion
} from './contracts/rawHwp.js'

// Raw HWP Validation
export {
  validateRawHwpExpansion,
  summarizeRawHwpValidation
} from './contracts/rawHwpValidation.js'

// Protocol Registry
export {
  resolveProtocolSchema,
  registerProtocolVersion,
  getSupportedProtocolVersions,
  getProtocolCompatibility
} from './contracts/protocolRegistry.js'

// Raw HWP Audit
export {
  extractRawHwpAuditPayload,
  buildRawHwpAuditReport
} from './contracts/rawHwpAudit.js'

// Session Artifacts
export {
  buildPauseSummary,
  buildPathMarkdown,
  buildSessionSummary,
  buildExplorationContext
} from './session/sessionArtifacts.js'

// Session Record
export { buildSessionRecord } from './session/sessionRecord.js'

// History View Model
export { buildHistoryCardViewModel, formatSessionTimestamp } from './session/historyViewModel.js'

// Runtime Helpers
export { createSessionId, buildRootParentMap, buildChildParentMap } from './runtime/treeState.js'

// Status
export { buildStatusMessage } from './runtime/status.js'

// Tree Traversal Utilities
export { flattenPaths, buildDescendantScope } from './utils/treeTraversal.js'
