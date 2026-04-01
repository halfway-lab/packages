/**
 * Build a status message from provider information.
 *
 * @param {StatusInfo} [info={}] - Status information
 * @param {string} [info.providerMode] - Provider mode (e.g., 'live', 'replay')
 * @param {string} [info.hwpReplayChainPath] - Path to replay chain file
 * @param {string} [info.llmModel] - LLM model name
 * @param {string} [info.provider] - Provider name
 * @returns {string} Formatted status message
 *
 * @example
 * buildStatusMessage({ providerMode: 'live', llmModel: 'gpt-4' })
 * // => '模式：live · 模型：gpt-4'
 *
 * buildStatusMessage({ hwpReplayChainPath: '/path/to/chain.jsonl' })
 * // => '当前为 replay 结果，不随输入实时变化'
 */
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
