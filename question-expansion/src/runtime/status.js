export function buildStatusMessage(info = {}) {
  const parts = []

  if (info.providerMode) {
    parts.push(`模式：${info.providerMode}`)
  }

  if (info.hwpReplayChainPath) {
    parts.push('当前为 replay 结果，不随输入实时变化')
  } else if (info.llmModel) {
    parts.push(`模型：${info.llmModel}`)
  }

  if (info.provider) {
    parts.push(`provider：${info.provider}`)
  }

  return parts.join(' · ') || '后端已连接'
}
