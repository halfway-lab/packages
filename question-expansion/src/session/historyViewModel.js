import { HISTORY_CARD_LABELS, TIMESTAMP_FORMAT } from '../constants.js'

/**
 * Build a history card view model for session list display.
 *
 * @param {Partial<SessionRecord>} [session={}] - Session record data
 * @param {HistoryCardOptions} [options={}] - Display options
 * @param {boolean} [options.isActive=false] - Whether this is the active session
 * @param {boolean} [options.isExpanded=false] - Whether the session is expanded
 * @returns {HistoryCardViewModel} View model for history card UI
 *
 * @example
 * const card = buildHistoryCardViewModel({
 *   question: 'How do we improve?',
 *   rootPathCount: 5,
 *   sessionSummary: { deepestLevel: 3, pauseCount: 2 }
 * }, { isActive: true })
 * // => { badgeLabel: '当前', timeLabel: '4/1 14:30', ... }
 */
export function buildHistoryCardViewModel(session = {}, options = {}) {
  const isActive = options.isActive === true
  const isExpanded = options.isExpanded === true
  const summary = session.sessionSummary || {}
  const rootPathCount = Number(session.rootPathCount || 0)
  const deepestLevel = Number(summary.deepestLevel || 0)
  const pauseCount = Number(summary.pauseCount || 0)
  const activeBranchTitle = String(summary.activeBranchTitle || '').trim()
  const headline = String(summary.headline || '').trim()

  return {
    badgeLabel: isActive ? HISTORY_CARD_LABELS.ACTIVE_BADGE : '',
    timeLabel: formatSessionTimestamp(session.updatedAt),
    title: String(session.question || '').trim(),
    metaItems: isActive
      ? [
          HISTORY_CARD_LABELS.PATH_COUNT(rootPathCount),
          HISTORY_CARD_LABELS.LEVEL_COUNT(deepestLevel),
          isExpanded ? HISTORY_CARD_LABELS.EXPANDABLE_STATUS : HISTORY_CARD_LABELS.SAVED_STATUS
        ]
      : [
          HISTORY_CARD_LABELS.PATH_COUNT(rootPathCount),
          HISTORY_CARD_LABELS.PAUSE_COUNT(pauseCount),
          HISTORY_CARD_LABELS.CONTINUE_PROMPT
        ],
    summaryText: isActive
      ? headline
      : (activeBranchTitle ? HISTORY_CARD_LABELS.FOCUS_PREFIX(activeBranchTitle) : headline)
  }
}

/**
 * Format a session timestamp for display.
 *
 * @param {string|number|Date|null|undefined} value - Timestamp value
 * @returns {string} Formatted timestamp in Chinese locale (e.g., '4/1 14:30')
 *
 * @example
 * formatSessionTimestamp('2024-04-01T14:30:00Z') // => '4/1 14:30'
 * formatSessionTimestamp(Date.now()) // => '4/1 14:30'
 * formatSessionTimestamp(null) // => ''
 */
export function formatSessionTimestamp(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat(TIMESTAMP_FORMAT.LOCALE, TIMESTAMP_FORMAT.OPTIONS).format(date)
}
