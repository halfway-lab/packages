/**
 * @halfway-lab/question-expansion
 * Normalize, validate, and audit compatible raw exploration payloads into
 * stable Question Expander objects.
 */

// ==================== Core Types ====================

/**
 * Branch type identifiers for categorizing exploration paths
 */
export type BranchType =
  | 'premise_shift'
  | 'hidden_variable'
  | 'unfinished_path'
  | 'premise_deconstruction'
  | 'premise_inversion'
  | 'premise_context'
  | 'variable_temporal'
  | 'variable_relational'
  | 'variable_threshold'
  | 'path_parallel'
  | 'path_suspension'
  | 'path_meta'
  | 'deep_action'
  | 'deep_obstacle'
  | 'deep_resource'
  | 'deep_timing'
  | 'deep_feedback'
  | 'exec_step'
  | 'exec_metric'
  | 'exec_risk'
  | 'exec_support'
  | 'core_view'
  | 'context_link'
  | 'blind_spot_probe'
  | 'branch_followup'
  | 'unknown'

/**
 * Confidence levels for heuristic inference
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'exact'

/**
 * Validation finding severity levels
 */
export type FindingLevel = 'error' | 'warning' | 'info'

/**
 * Stable string-or-number identifier used by runtime helper maps.
 */
export type PathIdentifier = string | number

/**
 * Minimal id-bearing record accepted by tree/runtime helpers.
 */
export interface PathReference {
  id: PathIdentifier
}

/**
 * Expanded/open state map keyed by path id.
 */
export type OpenPathMap = Record<string, boolean>

/**
 * Reusable raw text-ish entry shape used by tension-like fields.
 */
export type DescribedTextEntry = { description?: string } | string

/**
 * Branch type values may be registry-backed or forward-compatible custom strings.
 */
export type BranchTypeValue = BranchType | string

// ==================== Path Types ====================

/**
 * Normalized expansion path object
 */
export interface NormalizedPath {
  /** Unique identifier for the path */
  id: string
  /** Display title of the path */
  path_title: string
  /** Summary description of the path */
  path_summary: string
  /** Suggested next question for this path */
  next_question: string
  /** Categorization type of the path */
  branch_type: BranchTypeValue
  /** Score indicating how unfinished this path is (0-1) */
  unfinished_score: number
  /** Hint about potential blind spots */
  blind_spot_hint: string
  /** Hierarchical level of the path */
  level: number
  /** Associated tags */
  tags: string[]
  /** ISO timestamp of creation */
  created_at: string
}

/**
 * Raw expansion path structure from adapter/provider.
 * Legacy HWP-oriented naming is retained for compatibility.
 */
export interface RawHwpPath {
  id?: string
  path_id?: string
  pathId?: string
  title?: string
  path_title?: string
  pathTitle?: string
  summary?: string
  path_summary?: string
  pathSummary?: string
  next_question?: string
  nextQuestion?: string
  follow_up_question?: string
  continuation_hook?: string
  openQuestions?: string[]
  open_questions?: string[]
  nextSteps?: string[]
  next_steps?: string[]
  branch_type?: string
  branchType?: string
  path_type?: string
  unfinished_score?: number
  unfinishedScore?: number
  open_score?: number
  blind_spot_hint?: string
  blindSpotHint?: string
  risk_hint?: string
  level?: number
  depth?: number
  created_at?: string
  createdAt?: string
  tags?: string[]
  labels?: string[]
  parentId?: string | null
  parent_id?: string | null
  tensions?: DescribedTextEntry[]
  key_tensions?: DescribedTextEntry[]
  keyTensions?: DescribedTextEntry[]
}

/**
 * Neutral alias for raw expansion path input.
 */
export type RawExpansionPath = RawHwpPath

/**
 * Raw path shape produced during partial/streaming extraction before final payload completion.
 */
export interface PartialRawExpansionPath extends RawHwpPath {
  openQuestions?: string[]
  open_questions?: string[]
  nextSteps?: string[]
  next_steps?: string[]
  parentId?: string | null
  parent_id?: string | null
}

/**
 * Object-shaped path fragment parsed from a streamed JSON buffer.
 */
export type PartialRawExpansionObject = Record<string, unknown>

/**
 * Options for streamed partial extraction helpers.
 */
export interface PartialExpansionExtractOptions {
  alreadyExtracted?: number
  maxObjects?: number
}

/**
 * Loose-but-structured semantic group shape carried by newer raw payloads.
 */
export interface SemanticGroupLike {
  id?: string
  name?: string
  label?: string
  title?: string
  summary?: string
  description?: string
  paths?: string[]
  path_ids?: string[]
  pathIds?: string[]
  items?: string[]
  tags?: string[]
  [key: string]: unknown
}

// ==================== Expansion Types ====================

/**
 * Raw expansion response structure.
 * Legacy HWP-oriented naming is retained for compatibility.
 */
export interface RawHwpExpansion {
  question?: string
  sessionId?: string
  session_id?: string
  core_question?: string
  coreQuestion?: string
  paths?: RawHwpPath[]
  expansion_paths?: RawHwpPath[]
  key_tensions?: DescribedTextEntry[]
  keyTensions?: DescribedTextEntry[]
  next_questions?: string[]
  nextQuestions?: string[]
  protocol_version?: string
  protocolVersion?: string
  semantic_groups?: SemanticGroupLike[]
  semanticGroups?: SemanticGroupLike[]
  group_count?: number
  groupCount?: number
  cross_domain_contamination?: number
  crossDomainContamination?: number
  meta?: RawExpansionMeta
}

/**
 * Neutral alias for raw expansion payload input.
 */
export type RawExpansionPayload = RawHwpExpansion

/**
 * Single payload entry inside an audit wrapper log object.
 */
export interface RawHwpAuditWrapperPayloadEntry {
  text?: string
  mediaUrl?: string | null
  [key: string]: unknown
}

/**
 * Neutral alias for audit wrapper payload entries.
 */
export type RawExpansionAuditWrapperPayloadEntry = RawHwpAuditWrapperPayloadEntry

/**
 * Agent metadata sometimes attached to audit wrapper inputs.
 */
export interface RawHwpAuditAgentMeta {
  sessionId?: string
  provider?: string
  model?: string
}

/**
 * Extensible agent metadata carried by audit wrappers.
 */
export type RawExpansionAuditAgentMeta = RawHwpAuditAgentMeta & Record<string, unknown>

/**
 * Neutral alias for audit wrapper agent metadata.
 */
/**
 * Wrapper metadata attached to audit payload collections.
 */
export interface RawHwpAuditWrapperMeta {
  durationMs?: number
  agentMeta?: RawExpansionAuditAgentMeta
}

/**
 * Neutral alias for audit wrapper metadata.
 */
export type RawExpansionAuditWrapperMeta = RawHwpAuditWrapperMeta & Record<string, unknown>

/**
 * Audit wrapper object extracted from chain-log style inputs.
 */
export interface RawHwpAuditWrapper {
  payloads: RawHwpAuditWrapperPayloadEntry[]
  meta?: RawHwpAuditWrapperMeta
}

/**
 * Neutral alias for audit wrapper input.
 */
export type RawExpansionAuditWrapper = RawHwpAuditWrapper & Record<string, unknown>

/**
 * Supported audit input surface: either a raw expansion payload or a chain-log wrapper.
 */
export type RawHwpAuditInput = RawHwpExpansion | RawHwpAuditWrapper

/**
 * Neutral alias for supported audit input.
 */
export type RawExpansionAuditInput = RawHwpAuditInput

/**
 * Normalized expansion result
 */
export interface ProtocolCompatibilityInfo {
  status: 'fallback'
  requestedVersion: string
  resolvedVersion: string
}

/**
 * Known product-facing metadata preserved from raw expansion payloads.
 */
export interface KnownRawExpansionMeta {
  source?: string
  source_kind?: string
  extraction_mode?: string
  provider?: string
  model?: string
  mode?: string
  level?: number
  round?: number
  round_id?: string
  node_id?: string
  parent_id?: string
  sessionId?: string
  session_id?: string
  protocol_version?: string
  semantic_groups_count?: number
  continuity_score?: number
  blind_spot_score?: number
  contractVersion?: string
  contract_version?: string
  generatedAt?: string
  generated_at?: string
  protocolCompatibility?: ProtocolCompatibilityInfo
  derived_fields?: {
    question: string[]
    core_question: string[]
    key_tensions: string[]
    next_questions: string[]
    paths: Array<{
      index: number
      id: string
      derived: {
        title: boolean
        summary: boolean
        next_question: boolean
        branch_type: boolean
      }
      branch_type_source: 'raw' | 'inferred'
      branch_type: string
      heuristic: {
        rule_id: string
        matched_keywords: string[]
        confidence: ConfidenceLevel
      }
    }>
  }
}

/**
 * Extensible product-facing metadata preserved from raw expansion payloads.
 */
export type RawExpansionMeta = KnownRawExpansionMeta & Record<string, unknown>

/**
 * Normalized expansion result
 */
export interface NormalizedExpansion {
  /** The core question being explored */
  question: string
  /** Array of normalized exploration paths */
  expansionPaths: NormalizedPath[]
  /** Core question text */
  coreQuestion: string
  /** Key tensions identified */
  keyTensions: string[]
  /** Suggested next questions */
  nextQuestions: string[]
  /** Metadata from the expansion */
  meta: RawExpansionMeta
}

// ==================== Options Types ====================

/**
 * Options for normalization functions
 */
export interface NormalizeOptions {
  /** Index of the path in the array */
  index?: number
  /** Hierarchical level */
  level?: number
  /** ISO timestamp */
  timestamp?: string
  /** Seed for generating fallback IDs */
  idSeed?: string
  /** Allow empty results without throwing */
  allowEmpty?: boolean
  /** Source question for context */
  question?: string
}

/**
 * Options for validation functions
 */
export interface ValidateOptions {
  /** Allow empty paths array */
  allowEmpty?: boolean
  /** Source question for context */
  question?: string
}

/**
 * Parent-path context used for nested raw expansion requests.
 */
export interface RawHwpParentPath {
  id?: string
  path_title?: string
  path_summary?: string
  next_question?: string
  level?: number
}

/**
 * Neutral alias for nested parent-path request input.
 */
export type RawExpansionParentPath = RawHwpParentPath

/**
 * Nested raw expansion request context.
 */
export interface RawHwpExpandContext {
  parent_title?: string
  parent_summary?: string
  parent_next_question?: string
  parent_level?: number
  [key: string]: unknown
}

/**
 * Neutral alias for raw expansion request context.
 */
export type RawExpansionRequestContext = RawHwpExpandContext

/**
 * Input payload for building a raw HWP expand request.
 */
export interface RawHwpExpandRequestInput {
  depth?: number
  question?: string
  options?: RawHwpExpandRequestOptions
  parentPath?: RawHwpParentPath
  context?: RawHwpExpandContext
  parent_path_id?: string
}

/**
 * Neutral alias for build-request input.
 */
export type RawExpansionRequestInput = RawHwpExpandRequestInput

/**
 * Known option keys accepted by raw expansion request builders.
 * Additional adapter-specific keys are preserved for compatibility.
 */
export interface RawHwpExpandRequestOptions {
  max_paths?: number
  maxPaths?: number
  [key: string]: unknown
}

/**
 * Neutral alias for raw expansion request options.
 */
export type RawExpansionRequestOptions = RawHwpExpandRequestOptions

/**
 * Root-level raw HWP expansion request.
 */
export interface RawHwpRootExpandRequest {
  question: string
  depth: 1
  options?: RawHwpExpandRequestOptions
}

/**
 * Neutral alias for root-level raw expansion request.
 */
export type RawExpansionRootRequest = RawHwpRootExpandRequest

/**
 * Nested raw HWP expansion request.
 */
export interface RawHwpNestedExpandRequest {
  question?: string
  parent_path_id: string
  context: RawHwpExpandContext
  depth: number
}

/**
 * Neutral alias for nested raw expansion request.
 */
export type RawExpansionNestedRequest = RawHwpNestedExpandRequest

/**
 * Options for audit payload extraction
 */
export interface AuditOptions {
  /** Source question for context */
  question?: string
}

// ==================== Validation Types ====================

/**
 * Single validation finding
 */
export interface ValidationFinding {
  /** Severity level */
  level: FindingLevel
  /** Field path that has the issue */
  field: string
  /** Human-readable description */
  message: string
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the payload is valid (no errors) */
  valid: boolean
  /** Array of all findings */
  findings: ValidationFinding[]
  /** Normalized result if valid, null otherwise */
  normalized: NormalizedExpansion | null
}

/**
 * Validation summary
 */
export interface ValidationSummary {
  /** Whether the payload is valid */
  valid: boolean
  /** Number of errors */
  errorCount: number
  /** Number of warnings */
  warningCount: number
  /** Human-readable summary line */
  summaryLine: string
  /** Fields with errors */
  errorFields: string[]
  /** Fields with warnings */
  warningFields: string[]
}

// ==================== Heuristic Types ====================

/**
 * Heuristic rule for branch type inference
 */
export interface HeuristicRule {
  /** Unique rule identifier */
  id: string
  /** Target branch type */
  branchType: BranchType
  /** Keywords to match */
  keywords: string[]
  /** Confidence level for matches */
  confidence: ConfidenceLevel
}

/**
 * Result of branch type inference
 */
export interface InferredBranchType {
  /** Inferred branch type */
  branchType: BranchTypeValue
  /** Rule ID that matched */
  ruleId: string
  /** Keywords that were matched */
  matchedKeywords: string[]
  /** Confidence level */
  confidence: ConfidenceLevel
}

/**
 * Extended inference result with rule reference
 */
export interface MatchedBranchType extends InferredBranchType {
  /** The matched rule object */
  rule: HeuristicRule | null
}

// ==================== Streaming Types ====================

/**
 * Streaming content lifecycle event kinds recognized by the package contract.
 */
export type StreamingEventKind =
  | 'content_chunk'
  | 'partial_path'
  | 'thinking_chunk'
  | 'final_payload'

/**
 * Content chunk emitted during streaming generation.
 */
export interface StreamingContentChunkEvent {
  kind: 'content_chunk'
  chunk: string
}

/**
 * Partial path emitted once a full top-level path object can be recovered.
 */
export interface StreamingPartialPathEvent {
  kind: 'partial_path'
  path: NormalizedPath & { tensions: string[]; source: string }
}

/**
 * Thinking/reasoning chunk emitted by a reasoner-style upstream.
 */
export interface StreamingThinkingChunkEvent {
  kind: 'thinking_chunk'
  chunk: string
}

/**
 * Final raw payload emitted once generation completes.
 */
export interface StreamingFinalPayloadEvent {
  kind: 'final_payload'
  payload: RawExpansionPayload | RawExpansionPayload[]
}

/**
 * Union of package-owned streaming lifecycle events.
 */
export type RawExpansionStreamEvent =
  | StreamingContentChunkEvent
  | StreamingPartialPathEvent
  | StreamingThinkingChunkEvent
  | StreamingFinalPayloadEvent

/**
 * Shared callback contract for streamed raw expansion generation.
 */
export interface RawExpansionStreamCallbacks {
  onContentChunk?: (chunk: string) => void
  onPartialPath?: (path: NormalizedPath & { tensions: string[]; source: string }) => void
  onThinkingChunk?: (chunk: string) => void
  onFinalPayload?: (payload: RawExpansionPayload | RawExpansionPayload[]) => void
  onEvent?: (event: RawExpansionStreamEvent) => void
}

export function createContentChunkEvent(chunk?: string): StreamingContentChunkEvent
export function createPartialPathEvent(
  path: NormalizedPath & { tensions: string[]; source: string }
): StreamingPartialPathEvent
export function createThinkingChunkEvent(chunk?: string): StreamingThinkingChunkEvent
export function createFinalPayloadEvent(
  payload: RawExpansionPayload | RawExpansionPayload[]
): StreamingFinalPayloadEvent
export function dispatchRawExpansionStreamEvent(
  callbacks: RawExpansionStreamCallbacks | undefined,
  event: RawExpansionStreamEvent
): void

// ==================== Stream Orchestrator Types ====================

export interface StreamOrchestratorOptions {
  interval?: number
  batchSize?: number
  raceGuard?: boolean
  onCancel?: () => void
  onError?: (error: Error, event: RawExpansionStreamEvent) => void
}

export interface StreamOrchestratorStats {
  pushed: number
  dispatched: number
  dropped: number
  batches: number
  pending: number
  cancelled: boolean
  finished: boolean
}

export interface StreamOrchestrator {
  push(event: RawExpansionStreamEvent): void
  flush(): void
  cancel(): void
  getStats(): StreamOrchestratorStats
}

export function createStreamOrchestrator(
  callbacks?: RawExpansionStreamCallbacks,
  options?: StreamOrchestratorOptions
): StreamOrchestrator

// ==================== Path Merge Types ====================

export type MergeStrategy = 'final_order' | 'stream_order' | 'smart'

export interface MergePathsOptions {
  strategy?: MergeStrategy
}

export function mergeStreamAndFinalPaths(
  streamPaths?: NormalizedPath[],
  finalPaths?: NormalizedPath[],
  options?: MergePathsOptions
): NormalizedPath[]

// ==================== Prompt Fragments Types ====================

export interface PathsFirstJsonSchema {
  type: 'object'
  properties: Record<string, any>
  required: string[]
  propertyOrder: string[]
}

export interface PromptFragments {
  pathsFirst: string
  jsonStructure: string
  fieldNames: string
  responseFormat: string
}

export interface DepthStageConfig {
  maxDepth: number
  pathCount: number
  label: string
}

export interface DepthStages {
  diverge: DepthStageConfig
  focus: DepthStageConfig
  dig: DepthStageConfig
  converge: DepthStageConfig
}

export interface RootAnalysisPromptFragments {
  system: string
  jsonFormat: string
}

export interface ContinueExpansionRequestOptions {
  exploredSiblings?: Array<{ title?: string; summary?: string }>
}

export interface ContinueExpansionRequestResult {
  parent_path: string
  level: number
  context: {
    explored_siblings: Array<{ title?: string; summary?: string }>
  }
}

export const DEPTH_STAGES: DepthStages

export function buildPathsFirstJsonSchema(): PathsFirstJsonSchema
export function getExpansionPromptFragments(): PromptFragments
export function getStageForDepth(depth: number): 'diverge' | 'focus' | 'dig' | 'converge'
export function getDepthAwareSystemHint(depth: number): string
export function getDepthAwareUserInstruction(depth: number): string
export function buildSiblingDedupeHint(exploredSiblings?: Array<{ title?: string }>): string
export function getRootAnalysisPromptFragments(): RootAnalysisPromptFragments
export function buildContinueExpansionRequest(
  parentPath: string,
  level: number,
  options?: ContinueExpansionRequestOptions
): ContinueExpansionRequestResult

// ==================== Audit Types ====================

/**
 * Audit payload extracted from chain log
 */
export interface AuditPayload {
  question: string
  core_question: string
  key_tensions: string[]
  next_questions: string[]
  paths: Array<{
    id: string
    title: string
    summary: string
    next_question: string
    branch_type: string
    blind_spot_hint: string
    unfinished_score?: number
    tensions: string[]
    tags: string[]
  }>
  meta: RawExpansionMeta & {
    source_kind: string
    extraction_mode: string
    derived_fields: NonNullable<RawExpansionMeta['derived_fields']>
  }
}

/**
 * Path map of pause cards keyed by path id.
 */
export type PauseCardMap = Record<string, PauseCard>

/**
 * Path preview in audit report
 */
export interface PathPreview {
  id: string
  title: string
  branchType: string
  nextQuestion: string
  blindSpotHint: string
  heuristic: {
    rule_id: string
    matched_keywords: string[]
    confidence: ConfidenceLevel
  } | null
}

/**
 * Complete audit report
 */
export interface AuditReport extends ValidationSummary {
  sourceKind: string
  extractionMode: string
  findings: ValidationFinding[]
  question: string
  pathCount: number
  branchTypes: string[]
  nextQuestions: string[]
  keyTensions: string[]
  pathPreviews: PathPreview[]
  derivedFields: AuditPayload['meta']['derived_fields']
  protocolVersion: string
  semanticGroupsCount: number
  meta: RawExpansionMeta
}

// ==================== Overview Types ====================

/**
 * Structured overview of an expansion
 */
export interface StructuredOverview {
  /** Core question text */
  coreQuestion: string
  /** Key tensions identified */
  keyTensions: string[]
  /** Suggested next questions */
  nextQuestions: string[]
}

/**
 * Overview scope information
 */
export interface OverviewScope {
  isFocused: boolean
  badgeLabel: string
  subtitle: string
}

// ==================== View Model Types ====================

/**
 * Expansion view model for UI rendering
 */
export interface ExpansionViewModel {
  /** Currently focused path */
  focusedPath: NormalizedPath | null
  /** Children of focused path */
  focusedChildren: NormalizedPath[]
  /** Set of IDs in current focus scope */
  focusedScopeIds: Set<string> | null
  /** Scope information for display */
  overviewScope: OverviewScope
  /** Structured overview */
  structuredOverview: StructuredOverview
  /** Session summary */
  sessionSummary: SessionSummary
}

/**
 * Options for building expansion view model
 */
export interface ExpansionViewModelOptions {
  question: string
  rootPaths: NormalizedPath[]
  childPathsMap?: ChildPathsMap
  focusedPathId?: string | null
  focusModeEnabled?: boolean
  parentPathMap?: ParentMap
  pauseCards?: PauseCardMap
}

// ==================== Exploration Context Types ====================

/**
 * Explored path summary in exploration context
 */
export interface ExploredPathSummary {
  id: string
  title: string
  branchType: string
  level: number
  unfinishedScore: number
  blindSpotHint: string
  nextQuestion: string
}

/**
 * Tree statistics in exploration context
 */
export interface TreeStats {
  totalPathCount: number
  rootPathCount: number
  deepestLevel: number
  averageDepth: number
  branchTypeDistribution: Record<string, number>
}

/**
 * Focus direction in exploration context
 */
export interface FocusDirection {
  focusedPathId: string
  focusedPathTitle: string
  focusedBranchType: string
  ancestry: string[]
  childCount: number
}

/**
 * Unexplored area in exploration context
 */
export interface UnexploredArea {
  id: string
  title: string
  branchType: string
  reason: 'not_expanded' | 'high_unfinished_score'
}

/**
 * Pause history entry in exploration context
 */
export interface PauseHistoryEntry {
  pathId: string
  title: string
  keyInsight: string
  createdAt: string
}

/**
 * Exploration context for pause summary
 */
export interface ExplorationContext {
  question: string
  exploredPaths: ExploredPathSummary[]
  treeStats: TreeStats
  focusDirection: FocusDirection | null
  unexploredAreas: UnexploredArea[]
  keyTensions: string[]
  nextQuestions: string[]
  pauseHistory: PauseHistoryEntry[]
}

// ==================== Session Types ====================

/**
 * Pause card for a path
 */
export interface PauseCard {
  id: string
  title: string
  keyInsight: string
  nextAction: string
  level: number
  created_at: string
  explorationContext?: ExplorationContext | null
}

/**
 * Session summary
 */
export interface SessionSummary {
  title: string
  activeBranchTitle: string
  rootPathCount: number
  expandedPathCount: number
  pauseCount: number
  deepestLevel: number
  deepestPathTitle: string
  headline: string
  keyTensions: string[]
  nextQuestions: string[]
}

/**
 * Session record
 */
export interface SessionRecord {
  id: string
  question: string
  rootPaths: NormalizedPath[]
  childPathsMap: ChildPathsMap
  openPathIds: OpenPathMap
  pauseCards: PauseCardMap
  parentPathMap: ParentMap
  focusedPathId: string | null
  rootPathCount: number
  updatedAt: string
  sessionSummary: SessionSummary
}

/**
 * Minimal tree state owned by the package runtime helpers.
 */
export interface PartialTreeState {
  rootPaths?: NormalizedPath[]
  childPathsMap?: ChildPathsMap
  parentPathMap?: ParentMap
}

/**
 * Options for applying streamed partial paths into tree state.
 */
export interface PartialTreeApplyOptions {
  parentId?: string | null
  rootParentValue?: string | null
}

/**
 * Result of applying streamed partial paths into tree state.
 */
export interface PartialTreeApplyResult {
  rootPaths: NormalizedPath[]
  childPathsMap: ChildPathsMap
  parentPathMap: ParentMap
  insertedPathIds: string[]
  updatedPathIds: string[]
}

/**
 * Options for building session record
 */
export interface SessionRecordOptions {
  timestamp?: string
}

/**
 * History card view model
 */
export interface HistoryCardViewModel {
  badgeLabel: string
  timeLabel: string
  title: string
  metaItems: string[]
  summaryText: string
}

/**
 * Options for building history card
 */
export interface HistoryCardOptions {
  isActive?: boolean
  isExpanded?: boolean
}

// ==================== Runtime Types ====================

/**
 * Options for creating session ID
 */
export interface SessionIdOptions {
  timestamp?: number
  randomPart?: string
}

/**
 * Parent map structure
 */
export type ParentMap = Record<string, string | null>

/**
 * Child paths map structure
 */
export type ChildPathsMap = Record<string, NormalizedPath[]>

/**
 * Status message info
 */
export interface StatusInfo {
  providerMode?: string
  hwpReplayChainPath?: string
  llmModel?: string
  provider?: string
}

// ==================== Protocol Registry Types ====================

/**
 * Protocol schema definition for version-aware validation
 */
export interface ProtocolSchema {
  /** Protocol version identifier */
  version: string
  /** Field alias mappings */
  fieldAliases: Record<string, string[]>
  /** Root-level required fields */
  requiredFields: string[]
  /** Root-level optional fields */
  optionalFields: string[]
  /** Path-level required fields */
  pathRequiredFields: string[]
  /** Feature flags */
  features: ProtocolFeatureFlags
  /** Fallback marker for unknown versions */
  _fallback?: boolean
}

/**
 * Known protocol feature flags, while still allowing forward-compatible additions.
 */
export interface ProtocolFeatureFlags {
  semanticGroups?: boolean
  protocolVersion?: boolean
  [key: string]: boolean | undefined
}

/**
 * Registration input accepted by registerProtocolVersion(...).
 */
export interface ProtocolSchemaRegistration extends Partial<ProtocolSchema> {
  features?: Partial<ProtocolFeatureFlags>
}

/**
 * Protocol compatibility information
 */
export interface ProtocolCompatibility {
  /** Compatibility status */
  status: 'exact' | 'fallback' | 'legacy'
  /** Resolved version identifier */
  resolvedVersion: string
  /** Requested version identifier */
  requestedVersion?: string
}

// ==================== Constants ====================

/**
 * Maximum number of tensions to display in overview
 */
export const MAX_TENSIONS: number

/**
 * Maximum number of next questions to display in overview
 */
export const MAX_NEXT_QUESTIONS: number

/**
 * Maximum number of path titles to display in overview
 */
export const MAX_OVERVIEW_PATH_TITLES: number

/**
 * Level name mapping for pause summary titles
 */
export const LEVEL_NAMES: string[]

/**
 * Maximum level name index for boundary checking
 */
export const MAX_LEVEL_NAME_INDEX: number

/**
 * Maximum markdown heading level (limits # count)
 */
export const MAX_MARKDOWN_HEADING_LEVEL: number

/**
 * Path field default fallback values
 */
export const PATH_DEFAULTS: {
  PATH_TITLE: (index: number) => string
  PATH_SUMMARY: string
  NEXT_QUESTION: string
  BRANCH_TYPE: string
  UNFINISHED_SCORE: number
  BLIND_SPOT_HINT: string
  LEVEL: number
  ID_SEED: string
}

/**
 * Pause summary default fallback values
 */
export const PAUSE_SUMMARY_DEFAULTS: {
  KEY_INSIGHT: string
  NEXT_ACTION: string
}

/**
 * Overview default fallback texts
 */
export const OVERVIEW_DEFAULTS: {
  EMPTY_QUESTION: string
  NO_PATHS_CORE_QUESTION: (question: string) => string
  WITH_PATHS_CORE_QUESTION: (question: string, pathTitles: string[]) => string
  FOCUSED_CORE_QUESTION: (focusedTitle: string, pathTitles: string[]) => string
  NO_TENSIONS: string
  NO_NEXT_QUESTIONS: string
}

/**
 * Focus scope labels
 */
export const FOCUS_SCOPE_LABELS: {
  GLOBAL_BADGE: string
  GLOBAL_SUBTITLE: string
  FOCUSED_BADGE: string
  FOCUSED_SUBTITLE: (focusedTitle: string) => string
}

/**
 * History card labels
 */
export const HISTORY_CARD_LABELS: {
  ACTIVE_BADGE: string
  PATH_COUNT: (count: number) => string
  LEVEL_COUNT: (count: number) => string
  EXPANDABLE_STATUS: string
  SAVED_STATUS: string
  PAUSE_COUNT: (count: number) => string
  CONTINUE_PROMPT: string
  FOCUS_PREFIX: (title: string) => string
}

/**
 * Session summary defaults
 */
export const SESSION_SUMMARY_DEFAULTS: {
  DEFAULT_TITLE: string
}

/**
 * Status message defaults
 */
export const STATUS_DEFAULTS: {
  DEFAULT_MESSAGE: string
  MODE_PREFIX: string
  MODEL_PREFIX: string
  PROVIDER_PREFIX: string
  REPLAY_NOTICE: string
}

/**
 * Timestamp formatting configuration
 */
export const TIMESTAMP_FORMAT: {
  LOCALE: string
  OPTIONS: {
    month: string
    day: string
    hour: string
    minute: string
  }
}

/**
 * Raw HWP defaults
 */
export const RAW_HWP_DEFAULTS: {
  SOURCE: string
  FALLBACK_BRANCH_TYPE: string
  FALLBACK_RULE_ID: string
}

/**
 * Branch type to label mapping
 */
export const BRANCH_TYPE_LABELS: Record<BranchType, string>

/**
 * Heuristic rules for live branch type inference
 */
export const LIVE_BRANCH_TYPE_RULES: HeuristicRule[]

// ==================== Function Exports ====================

// View Model
export function buildExpansionViewModel(options: ExpansionViewModelOptions): ExpansionViewModel
export function findPathById(
  rootPaths: NormalizedPath[],
  childPathsMap: ChildPathsMap,
  targetId: string | null | undefined
): NormalizedPath | null

// Overview
export function buildStructuredOverview(
  question: string,
  rootPaths: NormalizedPath[],
  options?: { focusedPath?: NormalizedPath | null; focusedChildren?: NormalizedPath[] }
): StructuredOverview

// Branch Types
export function getBranchTypeLabel(type: string | null | undefined, fallback?: string): string

// Paths
export function normalizeExpansionPath(rawPath: RawExpansionPath, options?: NormalizeOptions): NormalizedPath
export function normalizeExpansionResponse(
  apiData: { paths?: RawExpansionPath[] } | RawExpansionPath[],
  options?: NormalizeOptions
): NormalizedPath[]

// Heuristics
export function inferLiveBranchType(input: {
  title?: string
  summary?: string
  nextQuestion?: string
  blindSpotHint?: string
}): InferredBranchType
export function matchLiveBranchTypeRule(input: {
  title?: string
  summary?: string
  nextQuestion?: string
  blindSpotHint?: string
}): MatchedBranchType

// Partial / Streaming Expansion
export function extractPartialRawExpansionObjects(
  text?: string,
  options?: PartialExpansionExtractOptions
): PartialRawExpansionObject[]

export function createPartialRawExpansionPath(
  path?: PartialRawExpansionObject,
  options?: { level?: number; index?: number; idSeed?: string }
): PartialRawExpansionPath

export function normalizePartialExpansionPath(
  path?: PartialRawExpansionObject,
  options?: NormalizeOptions
): NormalizedPath & { tensions: string[]; source: string }

export function extractPartialExpansionPaths(
  text?: string,
  options?: NormalizeOptions & PartialExpansionExtractOptions
): Array<NormalizedPath & { tensions: string[]; source: string }>

// Raw HWP
export function buildRawHwpExpandRequest(
  payload?: RawExpansionRequestInput
): RawExpansionRootRequest | RawExpansionNestedRequest

export function extractRawHwpAuditPayload(
  input: RawExpansionAuditInput,
  options?: AuditOptions
): AuditPayload

export function normalizeRawHwpPath(rawPath: RawExpansionPath, options?: NormalizeOptions): NormalizedPath & { tensions: string[]; source: string }

export function normalizeRawHwpExpansion(
  rawHwp: RawExpansionPayload | RawExpansionPayload[],
  options?: NormalizeOptions
): NormalizedExpansion
export const normalizeRawExpansion: typeof normalizeRawHwpExpansion

export function validateRawHwpExpansion(
  rawHwp: RawExpansionPayload | RawExpansionPayload[],
  options?: ValidateOptions
): ValidationResult
export const validateRawExpansion: typeof validateRawHwpExpansion

export function summarizeRawHwpValidation(validation: {
  valid?: boolean
  findings?: ValidationFinding[]
}): ValidationSummary
export const summarizeRawExpansionValidation: typeof summarizeRawHwpValidation

export function buildRawHwpAuditReport(
  rawHwp: RawExpansionAuditInput,
  options?: AuditOptions
): AuditReport
export const buildRawExpansionAuditReport: typeof buildRawHwpAuditReport

// Session Artifacts
export function buildPauseSummary(
  path: NormalizedPath,
  level?: number,
  options?: {
    timestamp?: string
    rootPaths?: NormalizedPath[]
    childPathsMap?: ChildPathsMap
    focusedPathId?: string | null
    parentPathMap?: ParentMap
    openPathIds?: OpenPathMap
    pauseCards?: PauseCardMap
    question?: string
  }
): PauseCard

export function buildPathMarkdown(options: {
  path: NormalizedPath
  level?: number
  pauseCards?: PauseCardMap
  childPathsMap?: ChildPathsMap
  openPathIds?: OpenPathMap
}): string

export function buildSessionSummary(options: {
  question?: string
  rootPaths?: NormalizedPath[]
  childPathsMap?: ChildPathsMap
  pauseCards?: PauseCardMap
  focusedPath?: NormalizedPath | null
  focusedChildren?: NormalizedPath[]
}): SessionSummary

export function buildExplorationContext(
  rootPaths?: NormalizedPath[],
  childPathsMap?: ChildPathsMap,
  options?: {
    focusedPathId?: string | null
    parentPathMap?: ParentMap
    openPathIds?: OpenPathMap
    pauseCards?: PauseCardMap
    question?: string
  }
): ExplorationContext

// Session Record
export function buildSessionRecord(
  options: {
    id: string
    question: string
    rootPaths?: NormalizedPath[]
    childPathsMap?: ChildPathsMap
    openPathIds?: OpenPathMap
    pauseCards?: PauseCardMap
    parentPathMap?: ParentMap
    focusedPathId?: string | null
  },
  recordOptions?: SessionRecordOptions
): SessionRecord

// History View Model
export type HistorySessionLike = Partial<SessionRecord>

export function buildHistoryCardViewModel(
  session: HistorySessionLike,
  options?: HistoryCardOptions
): HistoryCardViewModel

export function formatSessionTimestamp(value: string | number | Date | null | undefined): string

// Runtime
export function createSessionId(options?: SessionIdOptions): string
export function buildRootParentMap(paths: PathReference[]): ParentMap
export function buildChildParentMap(parentId: PathIdentifier, children: PathReference[]): ParentMap
export function applyPartialPathsToTreeState(
  state: PartialTreeState | undefined,
  partialPaths: NormalizedPath[],
  options?: PartialTreeApplyOptions
): PartialTreeApplyResult

// Status
export function buildStatusMessage(info?: StatusInfo): string

// Tree Traversal Utilities
export function flattenPaths(
  rootPaths: NormalizedPath[],
  childPathsMap: ChildPathsMap
): NormalizedPath[]

export function buildDescendantScope(
  pathId: string,
  childPathsMap: ChildPathsMap
): Set<string>

// Protocol Registry
export function resolveProtocolSchema(protocolVersion?: string): ProtocolSchema
export function registerProtocolVersion(version: string, schemaConfig: ProtocolSchemaRegistration): void
export function getSupportedProtocolVersions(): string[]
export function getProtocolCompatibility(version?: string): ProtocolCompatibility
