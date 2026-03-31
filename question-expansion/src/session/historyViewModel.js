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
    badgeLabel: isActive ? '当前' : '',
    timeLabel: formatSessionTimestamp(session.updatedAt),
    title: String(session.question || '').trim(),
    metaItems: isActive
      ? [
          `${rootPathCount} 条路径`,
          `${deepestLevel} 层已展开`,
          isExpanded ? '可继续展开' : '已保存'
        ]
      : [
          `${rootPathCount} 条路径`,
          `${pauseCount} 次停一下`,
          '点开继续'
        ],
    summaryText: isActive
      ? headline
      : (activeBranchTitle ? `当前聚焦：${activeBranchTitle}` : headline)
  }
}

export function formatSessionTimestamp(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
