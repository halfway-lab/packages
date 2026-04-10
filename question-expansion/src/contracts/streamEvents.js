function isObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export function createContentChunkEvent(chunk = '') {
  return {
    kind: 'content_chunk',
    chunk: String(chunk || '')
  }
}

export function createPartialPathEvent(path) {
  if (!isObject(path)) {
    throw new Error('createPartialPathEvent requires a normalized path object')
  }

  return {
    kind: 'partial_path',
    path
  }
}

export function createThinkingChunkEvent(chunk = '') {
  return {
    kind: 'thinking_chunk',
    chunk: String(chunk || '')
  }
}

export function createFinalPayloadEvent(payload) {
  return {
    kind: 'final_payload',
    payload
  }
}

export function dispatchRawExpansionStreamEvent(callbacks = {}, event) {
  if (!isObject(event) || typeof event.kind !== 'string') {
    throw new Error('dispatchRawExpansionStreamEvent requires a valid stream event')
  }

  if (typeof callbacks.onEvent === 'function') {
    callbacks.onEvent(event)
  }

  switch (event.kind) {
    case 'content_chunk':
      if (typeof callbacks.onContentChunk === 'function') {
        callbacks.onContentChunk(event.chunk)
      }
      break
    case 'partial_path':
      if (typeof callbacks.onPartialPath === 'function') {
        callbacks.onPartialPath(event.path)
      }
      break
    case 'thinking_chunk':
      if (typeof callbacks.onThinkingChunk === 'function') {
        callbacks.onThinkingChunk(event.chunk)
      }
      break
    case 'final_payload':
      if (typeof callbacks.onFinalPayload === 'function') {
        callbacks.onFinalPayload(event.payload)
      }
      break
    default:
      throw new Error(`Unsupported stream event kind: ${event.kind}`)
  }
}
