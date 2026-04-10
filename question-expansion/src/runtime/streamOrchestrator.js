import { dispatchRawExpansionStreamEvent } from '../contracts/streamEvents.js'

/**
 * 创建流式事件编排器。
 * 封装定时队列、竞态保护、批处理防护，app 层只需传回调。
 *
 * @param {RawExpansionStreamCallbacks} callbacks - 事件回调
 * @param {Object} [options={}]
 * @param {number} [options.interval=100] - 批处理间隔（ms）
 * @param {number} [options.batchSize=10] - 每批最多处理事件数
 * @param {boolean} [options.raceGuard=false] - 启用竞态保护（同 pathId 去重/合并）
 * @param {Function} [options.onCancel] - 取消时回调
 * @param {Function} [options.onError] - 错误回调
 * @returns {StreamOrchestrator}
 */
export function createStreamOrchestrator(callbacks = {}, options = {}) {
  const {
    interval = 100,
    batchSize = 10,
    raceGuard = false,
    onCancel,
    onError
  } = options

  // 内部状态
  let queue = []           // 事件队列
  let timer = null         // 定时器 ID
  let cancelled = false    // 是否已取消
  let finished = false     // 是否已收到 final_payload
  let stats = { pushed: 0, dispatched: 0, dropped: 0, batches: 0 }

  // 定时处理队列
  function scheduleDrain() {
    if (timer !== null || cancelled || queue.length === 0) return
    timer = setTimeout(() => {
      timer = null
      drainBatch()
    }, interval)
  }

  // 批处理分发
  function drainBatch() {
    if (cancelled || queue.length === 0) return
    const batch = queue.splice(0, batchSize)
    stats.batches++
    for (const event of batch) {
      try {
        dispatchRawExpansionStreamEvent(callbacks, event)
        stats.dispatched++
      } catch (err) {
        if (typeof onError === 'function') onError(err, event)
      }
    }
    // 如果队列还有剩余，继续调度
    if (queue.length > 0 && !cancelled) {
      scheduleDrain()
    }
  }

  // 竞态保护：同一 pathId 的 partial_path 事件去重
  function applyRaceGuard(event) {
    if (!raceGuard || event.kind !== 'partial_path') return false
    const pathId = event.path?.id
    if (!pathId) return false
    // 移除队列中同 pathId 的旧事件，保留最新
    const oldLength = queue.length
    queue = queue.filter(e => 
      !(e.kind === 'partial_path' && e.path?.id === pathId)
    )
    const removed = oldLength - queue.length
    stats.dropped += removed
    return removed > 0
  }

  return {
    /**
     * 推入一个事件到队列。
     * final_payload 事件会触发立即 flush。
     */
    push(event) {
      if (cancelled || finished) return
      if (!event || typeof event.kind !== 'string') return
      
      stats.pushed++
      
      // final_payload 立即 flush
      if (event.kind === 'final_payload') {
        finished = true
        if (timer !== null) { clearTimeout(timer); timer = null }
        // 先 drain 队列中积压的事件
        while (queue.length > 0) {
          const batch = queue.splice(0, batchSize)
          stats.batches++
          for (const e of batch) {
            try { dispatchRawExpansionStreamEvent(callbacks, e); stats.dispatched++ }
            catch (err) { if (typeof onError === 'function') onError(err, e) }
          }
        }
        // 再分发 final_payload 本身
        try { dispatchRawExpansionStreamEvent(callbacks, event); stats.dispatched++ }
        catch (err) { if (typeof onError === 'function') onError(err, event) }
        return
      }

      applyRaceGuard(event)
      queue.push(event)
      scheduleDrain()
    },

    /**
     * 立即清空并分发所有队列中的事件。
     */
    flush() {
      if (cancelled) return
      if (timer !== null) { clearTimeout(timer); timer = null }
      while (queue.length > 0) {
        const batch = queue.splice(0, batchSize)
        stats.batches++
        for (const e of batch) {
          try { dispatchRawExpansionStreamEvent(callbacks, e); stats.dispatched++ }
          catch (err) { if (typeof onError === 'function') onError(err, e) }
        }
      }
    },

    /**
     * 取消编排器，清空队列。
     */
    cancel() {
      cancelled = true
      if (timer !== null) { clearTimeout(timer); timer = null }
      const dropped = queue.length
      stats.dropped += dropped
      queue = []
      if (typeof onCancel === 'function') onCancel()
    },

    /**
     * 获取编排器统计信息。
     */
    getStats() {
      return { ...stats, pending: queue.length, cancelled, finished }
    }
  }
}
