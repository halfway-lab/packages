import { STATUS_DEFAULTS } from '../constants.js'

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
    parts.push(`${STATUS_DEFAULTS.MODE_PREFIX}${info.providerMode}`)
  }

  if (info.hwpReplayChainPath) {
    parts.push(STATUS_DEFAULTS.REPLAY_NOTICE)
  } else if (info.llmModel) {
    parts.push(`${STATUS_DEFAULTS.MODEL_PREFIX}${info.llmModel}`)
  }

  if (info.provider) {
    parts.push(`${STATUS_DEFAULTS.PROVIDER_PREFIX}${info.provider}`)
  }

  return parts.join(' · ') || STATUS_DEFAULTS.DEFAULT_MESSAGE
}
