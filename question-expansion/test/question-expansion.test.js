import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import { promisify } from 'node:util'

import {
  buildRawHwpExpandRequest,
  buildChildParentMap,
  buildExpansionViewModel,
  buildHistoryCardViewModel,
  LIVE_BRANCH_TYPE_RULES,
  buildPathMarkdown,
  buildPauseSummary,
  buildRootParentMap,
  buildSessionRecord,
  buildStatusMessage,
  buildStructuredOverview,
  buildRawHwpAuditReport,
  createSessionId,
  extractRawHwpAuditPayload,
  getBranchTypeLabel,
  inferLiveBranchType,
  matchLiveBranchTypeRule,
  normalizeRawHwpExpansion,
  normalizeRawHwpPath,
  summarizeRawHwpValidation,
  validateRawHwpExpansion,
  normalizeExpansionResponse
} from '../src/index.js'

const execFileAsync = promisify(execFile)

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

test('normalizes raw HWP contract fields into Question Expander structures', () => {
  const rootRequest = buildRawHwpExpandRequest({
    question: '我要不要换工作',
    depth: 1,
    options: { max_paths: 3 }
  })
  assert.deepEqual(rootRequest, {
    question: '我要不要换工作',
    depth: 1,
    options: { max_paths: 3 }
  })

  const nestedRequest = buildRawHwpExpandRequest({
    depth: 2,
    parentPath: {
      id: 'raw-1',
      path_title: '重写问题前提',
      path_summary: '先检查问题设定方式。',
      next_question: '哪些前提还没检查？',
      level: 1
    }
  })
  assert.deepEqual(nestedRequest, {
    parent_path_id: 'raw-1',
    context: {
      parent_title: '重写问题前提',
      parent_summary: '先检查问题设定方式。',
      parent_next_question: '哪些前提还没检查？',
      parent_level: 1
    },
    depth: 2
  })

  assert.throws(
    () => buildRawHwpExpandRequest({
      depth: 2,
      parentPath: {
        path_title: '缺少 id 的父路径'
      }
    }),
    /require parent_path_id or parentPath\.id/
  )

  const path = normalizeRawHwpPath({
    path_id: 'raw-1',
    title: '重写问题前提',
    summary: '先检查问题设定方式。',
    follow_up_question: '哪些前提还没检查？',
    path_type: 'premise_shift',
    open_score: 0.82,
    risk_hint: '问题前提可能过早固定',
    labels: ['前提'],
    keyTensions: ['问题前提被过早固定']
  }, {
    level: 1,
    timestamp: '2026-03-31T00:00:00.000Z'
  })

  assert.equal(path.id, 'raw-1')
  assert.equal(path.branch_type, 'premise_shift')
  assert.deepEqual(path.tags, ['前提'])
  assert.deepEqual(path.tensions, ['问题前提被过早固定'])

  const response = normalizeRawHwpExpansion({
    question: '我要不要换工作',
    core_question: '先拆清问题真正卡住的前提',
    key_tensions: ['前提是否被说死了'],
    next_questions: ['哪些前提还没检查？'],
    paths: [path],
    meta: { provider: 'hwp_runner' }
  })

  assert.equal(response.question, '我要不要换工作')
  assert.equal(response.expansionPaths.length, 1)
  assert.equal(response.coreQuestion, '先拆清问题真正卡住的前提')
  assert.deepEqual(response.keyTensions, ['前提是否被说死了'])
  assert.deepEqual(response.nextQuestions, ['哪些前提还没检查？'])
  assert.deepEqual(response.meta, { provider: 'hwp_runner' })

  const validation = validateRawHwpExpansion({
    question: '我要不要换工作',
    paths: [path]
  })
  assert.equal(validation.valid, true)
  assert.equal(validation.normalized?.expansionPaths.length, 1)
  assert.equal(
    summarizeRawHwpValidation(validation).summaryLine,
    'Raw HWP payload valid.'
  )
  assert.equal(
    buildRawHwpAuditReport({
      question: '我要不要换工作',
      paths: [path]
    }).pathCount,
    1
  )
  assert.equal(
    buildRawHwpAuditReport({
      question: '我要不要换工作',
      paths: [path]
    }).pathPreviews[0].title,
    '重写问题前提'
  )
  assert.ok(Array.isArray(LIVE_BRANCH_TYPE_RULES))
  assert.ok(LIVE_BRANCH_TYPE_RULES.some(rule => rule.branchType === 'hidden_variable'))
  assert.equal(
    inferLiveBranchType({
      title: 'Assumes infrastructure dependencies do not matter.',
      nextQuestion: 'Which layer still holds practical control?'
    }).branchType,
    'hidden_variable'
  )
  assert.equal(
    matchLiveBranchTypeRule({
      title: 'Treats cross-border coordination as procedural rather than power-laden.',
      nextQuestion: 'Which actor can actually enforce identity standards across jurisdictions?'
    }).rule?.id,
    'context_link_keywords'
  )

  const invalid = validateRawHwpExpansion({
    paths: [{}]
  })
  assert.equal(invalid.valid, false)
  assert.ok(invalid.findings.some(item => item.level === 'error'))
  assert.match(
    summarizeRawHwpValidation(invalid).summaryLine,
    /invalid with/
  )

  const liveLogPayload = extractRawHwpAuditPayload({
    payloads: [
      {
        text: JSON.stringify({
          round: 8,
          round_id: 'round_8',
          questions: ['How should digital identity systems balance autonomy and security?'],
          paths: [
            {
              blind_spot: {
                description: 'Assumes infrastructure concentration does not matter.',
                impact: 'Leaves control dependencies underexplored.'
              },
              continuation_hook: 'Which layer still holds practical control?'
            }
          ],
          tensions: [
            { description: 'Autonomy vs. security' }
          ],
          unfinished: ['Who governs the infrastructure layer?'],
          blind_spot_score: 0.54
        })
      }
    ],
    meta: {
      agentMeta: {
        sessionId: 'hwp_live_sample_20260331',
        provider: 'bailian',
        model: 'qwen3-max-2026-01-23'
      }
    }
  })

  assert.equal(liveLogPayload.paths.length, 1)
  assert.equal(liveLogPayload.paths[0].branch_type, 'hidden_variable')
  assert.equal(liveLogPayload.meta.source_kind, 'hwp_chain_log_entry')
  assert.equal(liveLogPayload.meta.extraction_mode, 'derived_for_audit')
  assert.equal(liveLogPayload.meta.derived_fields.paths[0].branch_type_source, 'inferred')
  assert.equal(liveLogPayload.meta.derived_fields.paths[0].heuristic.rule_id, 'hidden_variable_keywords')
  assert.equal(liveLogPayload.meta.derived_fields.paths[0].heuristic.confidence, 'medium')

  const selectedLastPayload = extractRawHwpAuditPayload({
    payloads: [
      {
        text: JSON.stringify({
          round: 7,
          round_id: 'round_7',
          questions: ['First candidate'],
          paths: [
            {
              blind_spot: {
                description: 'First candidate payload should not win.',
                impact: 'This should be ignored in favor of the last payload.'
              },
              continuation_hook: 'Ignore this'
            }
          ],
          tensions: [{ description: 'First tension' }],
          unfinished: ['First unfinished']
        })
      },
      {
        text: JSON.stringify({
          round: 8,
          round_id: 'round_8',
          questions: ['Last candidate should be used'],
          paths: [
            {
              blind_spot: {
                description: 'Last payload is the relevant chain state.',
                impact: 'Audit should prefer the latest parseable chain payload.'
              },
              continuation_hook: 'Use this one'
            }
          ],
          tensions: [{ description: 'Last tension' }],
          unfinished: ['Last unfinished']
        })
      }
    ]
  })

  assert.equal(selectedLastPayload.question, 'Last candidate should be used')
  assert.equal(selectedLastPayload.meta.round_id, 'round_8')
  assert.equal(
    buildRawHwpAuditReport({
      payloads: [
        {
          text: JSON.stringify({
            round: 8,
            round_id: 'round_8',
            questions: ['How should digital identity systems balance autonomy and security?'],
            paths: [
              {
                blind_spot: {
                  description: 'Assumes infrastructure concentration does not matter.',
                  impact: 'Leaves control dependencies underexplored.'
                },
                continuation_hook: 'Which layer still holds practical control?'
              }
            ],
            tensions: [
              { description: 'Autonomy vs. security' }
            ],
            unfinished: ['Who governs the infrastructure layer?'],
            blind_spot_score: 0.54
          })
        }
      ]
    }).extractionMode,
    'derived_for_audit'
  )
  assert.equal(
    buildRawHwpAuditReport({
      payloads: [
        {
          text: JSON.stringify({
            round: 8,
            round_id: 'round_8',
            questions: ['How should digital identity systems balance autonomy and security?'],
            paths: [
              {
                blind_spot: {
                  description: 'Assumes infrastructure concentration does not matter.',
                  impact: 'Leaves control dependencies underexplored.'
                },
                continuation_hook: 'Which layer still holds practical control?'
              }
            ],
            tensions: [
              { description: 'Autonomy vs. security' }
            ],
            unfinished: ['Who governs the infrastructure layer?'],
            blind_spot_score: 0.54
          })
        }
      ]
    }).valid,
    true
  )
  assert.equal(
    buildRawHwpAuditReport({
      payloads: [
        {
          text: JSON.stringify({
            round: 8,
            round_id: 'round_8',
            questions: ['How should digital identity systems balance autonomy and security?'],
            paths: [
              {
                blind_spot: {
                  description: 'Assumes infrastructure concentration does not matter.',
                  impact: 'Leaves control dependencies underexplored.'
                },
                continuation_hook: 'Which layer still holds practical control?'
              }
            ],
            tensions: [
              { description: 'Autonomy vs. security' }
            ],
            unfinished: ['Who governs the infrastructure layer?'],
            blind_spot_score: 0.54
          })
        }
      ]
    }).pathPreviews[0].heuristic.rule_id,
    'hidden_variable_keywords'
  )
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

test('raw HWP audit CLI exits cleanly for valid fixtures and reports invalid fixtures', async () => {
  const validRun = await execFileAsync(
    process.execPath,
    ['./tools/auditRawHwp.mjs', './docs/examples/raw-hwp-sample.json'],
    { cwd: process.cwd() }
  )

  assert.match(validRun.stdout, /"valid": true/)

  const markdownRun = await execFileAsync(
    process.execPath,
    ['./tools/auditRawHwp.mjs', './docs/examples/raw-hwp-sample.json', '--format', 'markdown'],
    { cwd: process.cwd() }
  )

  assert.match(markdownRun.stdout, /# Raw HWP Audit Report/)
  assert.match(markdownRun.stdout, /Valid: yes/)
  assert.match(markdownRun.stdout, /Source kind:/)
  assert.match(markdownRun.stdout, /## Path Preview/)

  const liveLogRun = await execFileAsync(
    process.execPath,
    ['./tools/auditRawHwp.mjs', './docs/examples/raw-hwp-live-log-sample.jsonl'],
    { cwd: process.cwd() }
  )

  assert.match(liveLogRun.stdout, /"valid": true/)
  assert.match(liveLogRun.stdout, /"source_kind": "hwp_chain_log_entry"/)

  const liveLogMarkdownRun = await execFileAsync(
    process.execPath,
    ['./tools/auditRawHwp.mjs', './docs/examples/raw-hwp-live-log-sample.jsonl', '--format', 'markdown'],
    { cwd: process.cwd() }
  )

  assert.match(liveLogMarkdownRun.stdout, /## Extraction Notes/)
  assert.match(liveLogMarkdownRun.stdout, /derived path count/i)
  assert.match(liveLogMarkdownRun.stdout, /## Path Preview/)
  assert.match(liveLogMarkdownRun.stdout, /Heuristic:/)
  assert.match(liveLogMarkdownRun.stdout, /rule=/i)

  const outputPath = './test/tmp-audit-report.md'
  await execFileAsync(
    process.execPath,
    [
      './tools/auditRawHwp.mjs',
      './docs/examples/raw-hwp-sample.json',
      '--format',
      'markdown',
      '--output',
      outputPath
    ],
    { cwd: process.cwd() }
  )
  const written = await fs.readFile(outputPath, 'utf8')
  assert.match(written, /# Raw HWP Audit Report/)
  await fs.rm(outputPath, { force: true })

  await assert.rejects(
    () => execFileAsync(
      process.execPath,
      ['./tools/auditRawHwp.mjs', './docs/examples/raw-hwp-invalid-sample.json'],
      { cwd: process.cwd() }
    ),
    error => {
      assert.equal(error.code, 2)
      assert.match(error.stdout, /"valid": false/)
      return true
    }
  )
})

test('HWP v0.6.2 compatibility: handles protocol_version and semantic_groups fields', () => {
  // 测试场景 A：HWP v0.6.2 输出兼容性
  const v062Payload = {
    question: '我要不要换工作',
    protocol_version: '0.6.2',
    semantic_groups: [
      { id: 'group-1', name: '职业发展', paths: ['path-1', 'path-2'] },
      { id: 'group-2', name: '生活平衡', paths: ['path-3'] }
    ],
    paths: [
      {
        path_id: 'path-1',
        title: '考虑薪资增长',
        summary: '评估当前薪资与市场的对比',
        follow_up_question: '薪资增长对你的重要性？',
        path_type: 'variable_temporal'
      },
      {
        path_id: 'path-2',
        title: '工作环境改善',
        summary: '团队氛围和管理风格的影响',
        follow_up_question: '理想的工作环境是什么？',
        path_type: 'context_link'
      }
    ]
  }

  const validation = validateRawHwpExpansion(v062Payload)
  assert.equal(validation.valid, true, 'v0.6.2 payload should be valid')
  assert.ok(
    validation.findings.some(f => f.level === 'info' && f.field === 'protocol_version'),
    'should have info finding for protocol_version'
  )
  assert.ok(
    validation.findings.some(f => f.level === 'info' && f.field === 'semantic_groups'),
    'should have info finding for semantic_groups'
  )

  // 测试场景 B：旧版本向后兼容
  const legacyPayload = {
    question: '我要不要换工作',
    paths: [
      {
        path_id: 'legacy-path-1',
        title: '传统路径',
        summary: '没有新字段的旧格式',
        follow_up_question: '下一步是什么？',
        path_type: 'premise_shift'
      }
    ]
  }

  const legacyValidation = validateRawHwpExpansion(legacyPayload)
  assert.equal(legacyValidation.valid, true, 'legacy payload without new fields should still be valid')
  assert.ok(
    !legacyValidation.findings.some(f => f.field === 'protocol_version'),
    'should not have protocol_version finding for legacy payload'
  )
  assert.ok(
    !legacyValidation.findings.some(f => f.field === 'semantic_groups'),
    'should not have semantic_groups finding for legacy payload'
  )

  // 测试场景 C：审计报告新字段
  const auditReport = buildRawHwpAuditReport(v062Payload)
  assert.equal(auditReport.protocolVersion, '0.6.2', 'audit report should include protocolVersion')
  assert.equal(auditReport.semanticGroupsCount, 2, 'audit report should include semanticGroupsCount')
  assert.equal(auditReport.valid, true, 'audit report should mark v0.6.2 payload as valid')

  const legacyAuditReport = buildRawHwpAuditReport(legacyPayload)
  assert.equal(legacyAuditReport.protocolVersion, '', 'legacy payload should have empty protocolVersion')
  assert.equal(legacyAuditReport.semanticGroupsCount, 0, 'legacy payload should have 0 semanticGroupsCount')
})
