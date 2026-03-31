import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildChildParentMap,
  buildExpansionViewModel,
  buildHistoryCardViewModel,
  buildPathMarkdown,
  buildPauseSummary,
  buildRootParentMap,
  buildSessionRecord,
  buildStatusMessage,
  buildStructuredOverview,
  createSessionId,
  getBranchTypeLabel,
  normalizeExpansionResponse
} from '../src/index.js'

test('normalizes adapter responses into stable path objects', () => {
  const result = normalizeExpansionResponse({
    paths: [
      { id: 'dup', title: '路径一' },
      { id: 'dup', nextQuestion: '下一步是什么？' }
    ]
  }, {
    level: 2,
    timestamp: '2026-03-31T00:00:00.000Z'
  })

  assert.equal(result.length, 2)
  assert.equal(result[0].id, 'dup')
  assert.equal(result[1].id, 'dup-2')
  assert.equal(result[0].level, 2)
  assert.equal(result[0].created_at, '2026-03-31T00:00:00.000Z')
})

test('builds overview, session summary, and focused branch view model together', () => {
  const rootPaths = [
    {
      id: 'root-1',
      level: 1,
      path_title: '重写问题前提',
      branch_type: 'premise_shift',
      blind_spot_hint: '问题前提可能过早固定',
      next_question: '哪些前提还没检查？'
    }
  ]
  const childPathsMap = {
    'root-1': [
      {
        id: 'child-1',
        level: 2,
        path_title: '剥离假设层',
        branch_type: 'premise_deconstruction',
        blind_spot_hint: '前提的假设层尚未剥离',
        next_question: '哪些假设其实可以被拿掉？'
      }
    ]
  }

  const overview = buildStructuredOverview('我要不要换工作', rootPaths)
  assert.match(overview.coreQuestion, /重写问题前提/)

  const viewModel = buildExpansionViewModel({
    question: '我要不要换工作',
    rootPaths,
    childPathsMap,
    focusedPathId: 'root-1',
    focusModeEnabled: true,
    parentPathMap: {
      'root-1': null,
      'child-1': 'root-1'
    },
    pauseCards: {
      'root-1': { id: 'pause-root-1' }
    }
  })

  assert.equal(viewModel.focusedPath?.path_title, '重写问题前提')
  assert.equal(viewModel.sessionSummary.deepestLevel, 2)
  assert.equal(viewModel.sessionSummary.pauseCount, 1)
  assert.equal(viewModel.focusedScopeIds?.has('child-1'), true)
})

test('builds session artifacts from normalized package paths', () => {
  const path = {
    id: 'root-1',
    level: 1,
    path_title: '拉出隐藏变量',
    branch_type: 'hidden_variable',
    blind_spot_hint: '被忽略的变量尚未进入视野',
    next_question: '哪些变量会改变判断？'
  }

  assert.equal(getBranchTypeLabel(path.branch_type), '隐藏变量')

  const pauseSummary = buildPauseSummary(path, 1, {
    timestamp: '2026-03-31T01:00:00.000Z'
  })
  assert.equal(pauseSummary.created_at, '2026-03-31T01:00:00.000Z')

  const markdown = buildPathMarkdown({
    path,
    level: 1
  })
  assert.match(markdown, /下一步问题/)
})

test('builds session and history card records from package-owned helpers', () => {
  const rootPaths = [
    {
      id: 'root-1',
      level: 1,
      path_title: '拉出隐藏变量',
      branch_type: 'hidden_variable',
      blind_spot_hint: '被忽略的变量尚未进入视野',
      next_question: '哪些变量会改变判断？'
    }
  ]
  const childPathsMap = {
    'root-1': [
      {
        id: 'child-1',
        level: 2,
        path_title: '展开时间轴',
        branch_type: 'variable_temporal',
        blind_spot_hint: '时间维度被压平',
        next_question: '三个月后哪些变量更重要？'
      }
    ]
  }

  const sessionId = createSessionId({
    timestamp: 1710000000000,
    randomPart: 'abc123'
  })
  assert.equal(sessionId, 'session-1710000000000-abc123')
  assert.deepEqual(buildRootParentMap(rootPaths), { 'root-1': null })
  assert.deepEqual(buildChildParentMap('root-1', childPathsMap['root-1']), { 'child-1': 'root-1' })
  assert.match(buildStatusMessage({ providerMode: 'hwp_api', provider: 'local_hwp_runner' }), /模式：hwp_api/)

  const record = buildSessionRecord({
    id: sessionId,
    question: '我想提高工作效率',
    rootPaths,
    childPathsMap,
    openPathIds: { 'root-1': true },
    pauseCards: { 'root-1': { id: 'pause-root-1' } },
    parentPathMap: { 'root-1': null, 'child-1': 'root-1' },
    focusedPathId: 'root-1'
  }, {
    timestamp: '2026-03-31T02:00:00.000Z'
  })

  assert.equal(record.updatedAt, '2026-03-31T02:00:00.000Z')
  assert.equal(record.sessionSummary.pauseCount, 1)

  const activeCard = buildHistoryCardViewModel(record, {
    isActive: true,
    isExpanded: true
  })
  const recentCard = buildHistoryCardViewModel(record)

  assert.equal(activeCard.badgeLabel, '当前')
  assert.ok(activeCard.metaItems.includes('2 层已展开'))
  assert.ok(recentCard.metaItems.includes('1 次停一下'))
})
