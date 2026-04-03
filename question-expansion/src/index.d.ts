/**
 * @halfway-lab/question-expansion
 * Question Expander product interpretation layer for Halfway Lab.
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
  branch_type: BranchType | string
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
 * Raw HWP path structure from adapter/provider
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
  tensions?: Array<{ description?: string } | string>
  key_tensions?: Array<{ description?: string } | string>
  keyTensions?: Array<{ description?: string } | string>
}

// ==================== Expansion Types ====================

/**
 * Raw HWP expansion response structure
 */
export interface RawHwpExpansion {
  question?: string
  core_question?: string
  coreQuestion?: string
  paths?: RawHwpPath[]
  expansion_paths?: RawHwpPath[]
  key_tensions?: Array<{ description?: string } | string>
  keyTensions?: Array<{ description?: string } | string>
  next_questions?: string[]
  nextQuestions?: string[]
  meta?: Record<string, unknown>
}

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
  meta: Record<string, unknown>
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
  branchType: BranchType | string
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
  meta: {
    source_kind: string
    extraction_mode: string
    derived_fields: {
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
    round?: number
    round_id?: string
    node_id?: string
    parent_id?: string
    continuity_score?: number
    blind_spot_score?: number
    provider?: string
    model?: string
    session_id?: string
    protocol_version?: string
    semantic_groups_count?: number
  }
}

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
  meta: Record<string, unknown>
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
  childPathsMap?: Record<string, NormalizedPath[]>
  focusedPathId?: string | null
  focusModeEnabled?: boolean
  parentPathMap?: Record<string, string | null>
  pauseCards?: Record<string, PauseCard>
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
  childPathsMap: Record<string, NormalizedPath[]>
  openPathIds: Record<string, boolean>
  pauseCards: Record<string, PauseCard>
  parentPathMap: Record<string, string | null>
  focusedPathId: string | null
  rootPathCount: number
  updatedAt: string
  sessionSummary: SessionSummary
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
  features: Record<string, boolean>
  /** Fallback marker for unknown versions */
  _fallback?: boolean
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
export function normalizeExpansionPath(rawPath: RawHwpPath, options?: NormalizeOptions): NormalizedPath
export function normalizeExpansionResponse(
  apiData: { paths?: RawHwpPath[] } | RawHwpPath[],
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

// Raw HWP
export function buildRawHwpExpandRequest(payload: {
  depth?: number
  question?: string
  options?: Record<string, unknown>
  parentPath?: { id?: string; path_title?: string; path_summary?: string; next_question?: string; level?: number }
  context?: Record<string, unknown>
  parent_path_id?: string
}): {
  question?: string
  parent_path_id?: string
  context: Record<string, unknown>
  depth: number
  options?: Record<string, unknown>
}

export function extractRawHwpAuditPayload(
  input: Record<string, unknown>,
  options?: AuditOptions
): AuditPayload | Record<string, unknown>

export function normalizeRawHwpPath(rawPath: RawHwpPath, options?: NormalizeOptions): NormalizedPath & { tensions: string[]; source: string }

export function normalizeRawHwpExpansion(
  rawHwp: RawHwpExpansion | RawHwpExpansion[],
  options?: NormalizeOptions
): NormalizedExpansion

export function validateRawHwpExpansion(
  rawHwp: RawHwpExpansion | RawHwpExpansion[],
  options?: ValidateOptions
): ValidationResult

export function summarizeRawHwpValidation(validation: {
  valid?: boolean
  findings?: ValidationFinding[]
}): ValidationSummary

export function buildRawHwpAuditReport(
  rawHwp: Record<string, unknown>,
  options?: AuditOptions
): AuditReport

// Session Artifacts
export function buildPauseSummary(
  path: NormalizedPath,
  level?: number,
  options?: { timestamp?: string }
): PauseCard

export function buildPathMarkdown(options: {
  path: NormalizedPath
  level?: number
  pauseCards?: Record<string, PauseCard>
  childPathsMap?: ChildPathsMap
  openPathIds?: Record<string, boolean>
}): string

export function buildSessionSummary(options: {
  question?: string
  rootPaths?: NormalizedPath[]
  childPathsMap?: ChildPathsMap
  pauseCards?: Record<string, PauseCard>
  focusedPath?: NormalizedPath | null
  focusedChildren?: NormalizedPath[]
}): SessionSummary

// Session Record
export function buildSessionRecord(
  options: {
    id: string
    question: string
    rootPaths?: NormalizedPath[]
    childPathsMap?: ChildPathsMap
    openPathIds?: Record<string, boolean>
    pauseCards?: Record<string, PauseCard>
    parentPathMap?: ParentMap
    focusedPathId?: string | null
  },
  recordOptions?: SessionRecordOptions
): SessionRecord

// History View Model
export function buildHistoryCardViewModel(
  session: Partial<SessionRecord>,
  options?: HistoryCardOptions
): HistoryCardViewModel

export function formatSessionTimestamp(value: string | number | Date | null | undefined): string

// Runtime
export function createSessionId(options?: SessionIdOptions): string
export function buildRootParentMap(paths: Array<{ id: string | number }>): ParentMap
export function buildChildParentMap(parentId: string | number, children: Array<{ id: string | number }>): ParentMap

// Status
export function buildStatusMessage(info?: StatusInfo): string

// Protocol Registry
export function resolveProtocolSchema(protocolVersion?: string): ProtocolSchema
export function registerProtocolVersion(version: string, schemaConfig: Partial<ProtocolSchema>): void
export function getSupportedProtocolVersions(): string[]
export function getProtocolCompatibility(version?: string): ProtocolCompatibility
