/**
 * @halfway-lab/question-expansion
 *
 * Normalize, validate, and audit compatible raw exploration payloads into stable
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

// Partial / Streaming Expansion Helpers
export {
  extractPartialRawExpansionObjects,
  createPartialRawExpansionPath,
  normalizePartialExpansionPath,
  extractPartialExpansionPaths,
  mergeStreamAndFinalPaths
} from './contracts/partialExpansion.js'

// Streaming Event Helpers
export {
  createContentChunkEvent,
  createPartialPathEvent,
  createThinkingChunkEvent,
  createFinalPayloadEvent,
  dispatchRawExpansionStreamEvent
} from './contracts/streamEvents.js'

// Stream Orchestrator
export { createStreamOrchestrator } from './runtime/streamOrchestrator.js'

// Prompt Fragments
export {
  buildPathsFirstJsonSchema,
  getExpansionPromptFragments,
  DEPTH_STAGES,
  getStageForDepth,
  getDepthAwareSystemHint,
  getDepthAwareUserInstruction,
  buildSiblingDedupeHint,
  getRootAnalysisPromptFragments
} from './contracts/promptFragments.js'

// Raw Expansion Contract
export {
  buildRawHwpExpandRequest,
  normalizeRawHwpPath,
  normalizeRawHwpExpansion,
  normalizeRawHwpExpansion as normalizeRawExpansion
} from './contracts/rawHwp.js'

// Raw Expansion Validation
export {
  validateRawHwpExpansion,
  validateRawHwpExpansion as validateRawExpansion,
  summarizeRawHwpValidation,
  summarizeRawHwpValidation as summarizeRawExpansionValidation
} from './contracts/rawHwpValidation.js'

// Protocol Registry
export {
  resolveProtocolSchema,
  registerProtocolVersion,
  getSupportedProtocolVersions,
  getProtocolCompatibility
} from './contracts/protocolRegistry.js'

// Raw Expansion Audit
export {
  extractRawHwpAuditPayload,
  buildRawHwpAuditReport,
  buildRawHwpAuditReport as buildRawExpansionAuditReport
} from './contracts/rawHwpAudit.js'

// Session Artifacts
export {
  buildPauseSummary,
  buildPathMarkdown,
  buildSessionSummary,
  buildExplorationContext,
  buildContinueExpansionRequest
} from './session/sessionArtifacts.js'

// Session Record
export { buildSessionRecord } from './session/sessionRecord.js'

// History View Model
export { buildHistoryCardViewModel, formatSessionTimestamp } from './session/historyViewModel.js'

// Runtime Helpers
export {
  createSessionId,
  buildRootParentMap,
  buildChildParentMap
} from './runtime/treeState.js'
export { applyPartialPathsToTreeState } from './runtime/partialTreeState.js'

// Status
export { buildStatusMessage } from './runtime/status.js'

// Tree Traversal Utilities
export { flattenPaths, buildDescendantScope } from './utils/treeTraversal.js'
