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
  normalizeExpansionResponse,
  resolveProtocolSchema,
  registerProtocolVersion,
  getSupportedProtocolVersions,
  getProtocolCompatibility
} from '../src/index.js'

// Import utils modules directly for testing
import {
  pickFirstNonEmpty,
  toArray,
  hasAnyField,
  pickStringField,
  pickNumberField,
  pickField,
  FIELD_ALIASES
} from '../src/utils/fieldHelpers.js'

import {
  findPathById,
  flattenPaths,
  buildDescendantScope
} from '../src/utils/treeTraversal.js'

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

// ============================================================================
// Field Helpers Tests
// ============================================================================

test('pickFirstNonEmpty handles various input scenarios', () => {
  // 空数组
  assert.equal(pickFirstNonEmpty([]), '')
  
  // 全 null/undefined
  assert.equal(pickFirstNonEmpty([null, undefined, null]), '')
  
  // 混合值 - 返回第一个非空值
  assert.equal(pickFirstNonEmpty(['', '  ', 'valid', 'other']), 'valid')
  assert.equal(pickFirstNonEmpty([null, undefined, '', 'value']), 'value')
  assert.equal(pickFirstNonEmpty([0, false, 'truthy', 'other']), 'truthy')
  
  // 数字会被转为字符串
  assert.equal(pickFirstNonEmpty([0, 42, 100]), '42')
  
  // 第一个值就是有效值
  assert.equal(pickFirstNonEmpty(['first', 'second']), 'first')
  
  // 空白字符会被 trim 后检查
  assert.equal(pickFirstNonEmpty(['  ', 'trimmed']), 'trimmed')
  assert.equal(pickFirstNonEmpty(['  valid-with-spaces  ', 'other']), 'valid-with-spaces')
})

test('toArray handles boundary cases', () => {
  // null 和 undefined
  assert.deepEqual(toArray(null), [])
  assert.deepEqual(toArray(undefined), [])
  
  // 已是数组 - 过滤 falsy 值 (false, 0, '', null, undefined 都会被过滤)
  assert.deepEqual(toArray([1, null, 2, '', 3, false, 0]), [1, 2, 3])
  
  // 空数组
  assert.deepEqual(toArray([]), [])
  
  // 单值（非数组）
  assert.deepEqual(toArray('single'), [])
  assert.deepEqual(toArray(123), [])
  assert.deepEqual(toArray({ key: 'value' }), [])
  
  // 包含各种类型 - 注意 false 会被 filter(Boolean) 过滤掉
  assert.deepEqual(toArray(['a', 'b', 'c']), ['a', 'b', 'c'])
  assert.deepEqual(toArray([true, false, true]), [true, true])
})

test('hasAnyField checks field existence correctly', () => {
  const obj = { a: 1, b: '', c: null, d: undefined, e: 'value' }
  
  // 存在且非空
  assert.equal(hasAnyField(obj, ['a']), true)
  assert.equal(hasAnyField(obj, ['e']), true)
  assert.equal(hasAnyField(obj, ['a', 'e']), true)
  
  // 存在但为空
  assert.equal(hasAnyField(obj, ['b']), false) // 空字符串
  assert.equal(hasAnyField(obj, ['c']), false) // null
  assert.equal(hasAnyField(obj, ['d']), false) // undefined
  
  // 不存在的字段
  assert.equal(hasAnyField(obj, ['nonexistent']), false)
  
  // 混合情况 - 只要有一个存在且非空就返回 true
  assert.equal(hasAnyField(obj, ['b', 'c', 'a']), true)
  assert.equal(hasAnyField(obj, ['b', 'c', 'nonexistent']), false)
  
  // 空字段数组
  assert.equal(hasAnyField(obj, []), false)
  
  // 空对象
  assert.equal(hasAnyField({}, ['a']), false)
  
  // null/undefined 对象
  assert.equal(hasAnyField(null, ['a']), false)
  assert.equal(hasAnyField(undefined, ['a']), false)
})

test('pickStringField resolves field aliases correctly', () => {
  // 测试别名解析 - path_title 的别名
  assert.equal(pickStringField({ path_title: 'Exact Match' }, 'path_title'), 'Exact Match')
  assert.equal(pickStringField({ title: 'Title Alias' }, 'path_title'), 'Title Alias')
  assert.equal(pickStringField({ pathTitle: 'CamelCase Alias' }, 'path_title'), 'CamelCase Alias')
  
  // 优先级测试 - 优先使用主字段名
  assert.equal(pickStringField({ path_title: 'Primary', title: 'Secondary' }, 'path_title'), 'Primary')
  
  // 自动 trim
  assert.equal(pickStringField({ title: '  Trimmed  ' }, 'path_title'), 'Trimmed')
  
  // 默认值
  assert.equal(pickStringField({}, 'path_title'), '')
  assert.equal(pickStringField({}, 'path_title', 'Default Value'), 'Default Value')
  
  // 测试 next_question 的别名
  assert.equal(pickStringField({ next_question: 'Q1' }, 'next_question'), 'Q1')
  assert.equal(pickStringField({ nextQuestion: 'Q2' }, 'next_question'), 'Q2')
  assert.equal(pickStringField({ follow_up_question: 'Q3' }, 'next_question'), 'Q3')
  assert.equal(pickStringField({ continuation_hook: 'Q4' }, 'next_question'), 'Q4')
  
  // 测试 branch_type 的别名
  assert.equal(pickStringField({ branch_type: 'premise_shift' }, 'branch_type'), 'premise_shift')
  assert.equal(pickStringField({ branchType: 'hidden_variable' }, 'branch_type'), 'hidden_variable')
  assert.equal(pickStringField({ path_type: 'context_link' }, 'branch_type'), 'context_link')
})

test('pickNumberField resolves numeric fields correctly', () => {
  // 正常数字
  assert.equal(pickNumberField({ unfinished_score: 0.75 }, 'unfinished_score'), 0.75)
  assert.equal(pickNumberField({ open_score: 0.82 }, 'unfinished_score'), 0.82)
  
  // 整数
  assert.equal(pickNumberField({ level: 3 }, 'level'), 3)
  
  // 默认值
  assert.equal(pickNumberField({}, 'unfinished_score'), undefined)
  assert.equal(pickNumberField({}, 'unfinished_score', 0.5), 0.5)
  
  // 非数字值返回默认值
  assert.equal(pickNumberField({ unfinished_score: 'not a number' }, 'unfinished_score'), undefined)
  assert.equal(pickNumberField({ unfinished_score: NaN }, 'unfinished_score'), undefined)
  assert.equal(pickNumberField({ unfinished_score: null }, 'unfinished_score'), undefined)
  assert.equal(pickNumberField({ unfinished_score: undefined }, 'unfinished_score'), undefined)
  
  // 数字字符串不会自动转换
  assert.equal(pickNumberField({ unfinished_score: '0.75' }, 'unfinished_score'), undefined)
})

test('FIELD_ALIASES contains expected field mappings', () => {
  // 验证关键字段别名存在
  assert.ok(Array.isArray(FIELD_ALIASES.id))
  assert.ok(FIELD_ALIASES.id.includes('path_id'))
  assert.ok(FIELD_ALIASES.id.includes('pathId'))
  
  assert.ok(Array.isArray(FIELD_ALIASES.path_title))
  assert.ok(FIELD_ALIASES.path_title.includes('title'))
  
  assert.ok(Array.isArray(FIELD_ALIASES.next_question))
  assert.ok(FIELD_ALIASES.next_question.includes('follow_up_question'))
  assert.ok(FIELD_ALIASES.next_question.includes('continuation_hook'))
  
  assert.ok(Array.isArray(FIELD_ALIASES.branch_type))
  assert.ok(FIELD_ALIASES.branch_type.includes('path_type'))
})

// ============================================================================
// Tree Traversal Tests
// ============================================================================

test('findPathById finds paths in multi-level nested tree', () => {
  const rootPaths = [
    { id: 'root-1', title: 'Root 1' },
    { id: 'root-2', title: 'Root 2' }
  ]
  const childPathsMap = {
    'root-1': [
      { id: 'child-1-1', title: 'Child 1.1' },
      { id: 'child-1-2', title: 'Child 1.2' }
    ],
    'root-2': [
      { id: 'child-2-1', title: 'Child 2.1' }
    ],
    'child-1-1': [
      { id: 'grandchild-1-1-1', title: 'Grandchild 1.1.1' }
    ]
  }
  
  // 查找根路径
  assert.deepEqual(findPathById(rootPaths, childPathsMap, 'root-1'), { id: 'root-1', title: 'Root 1' })
  assert.deepEqual(findPathById(rootPaths, childPathsMap, 'root-2'), { id: 'root-2', title: 'Root 2' })
  
  // 查找子路径
  assert.deepEqual(findPathById(rootPaths, childPathsMap, 'child-1-1'), { id: 'child-1-1', title: 'Child 1.1' })
  assert.deepEqual(findPathById(rootPaths, childPathsMap, 'child-1-2'), { id: 'child-1-2', title: 'Child 1.2' })
  assert.deepEqual(findPathById(rootPaths, childPathsMap, 'child-2-1'), { id: 'child-2-1', title: 'Child 2.1' })
  
  // 查找孙路径
  assert.deepEqual(findPathById(rootPaths, childPathsMap, 'grandchild-1-1-1'), { id: 'grandchild-1-1-1', title: 'Grandchild 1.1.1' })
})

test('findPathById returns null for non-existent ID', () => {
  const rootPaths = [{ id: 'root-1', title: 'Root 1' }]
  const childPathsMap = { 'root-1': [{ id: 'child-1', title: 'Child 1' }] }
  
  // 不存在的 ID
  assert.equal(findPathById(rootPaths, childPathsMap, 'non-existent'), null)
  assert.equal(findPathById(rootPaths, childPathsMap, ''), null)
  
  // null/undefined ID
  assert.equal(findPathById(rootPaths, childPathsMap, null), null)
  assert.equal(findPathById(rootPaths, childPathsMap, undefined), null)
})

test('flattenPaths flattens complex tree structures', () => {
  const rootPaths = [
    { id: 'root-1', title: 'Root 1' },
    { id: 'root-2', title: 'Root 2' }
  ]
  const childPathsMap = {
    'root-1': [
      { id: 'child-1-1', title: 'Child 1.1' },
      { id: 'child-1-2', title: 'Child 1.2' }
    ],
    'root-2': [],
    'child-1-1': [
      { id: 'grandchild-1-1-1', title: 'Grandchild 1.1.1' }
    ]
  }
  
  const flattened = flattenPaths(rootPaths, childPathsMap)
  
  // 验证所有路径都被展平 (root-1, root-2, child-1-1, child-1-2, grandchild-1-1-1 = 5)
  assert.equal(flattened.length, 5)
  
  // 验证包含所有 ID
  const ids = flattened.map(p => p.id)
  assert.ok(ids.includes('root-1'))
  assert.ok(ids.includes('root-2'))
  assert.ok(ids.includes('child-1-1'))
  assert.ok(ids.includes('child-1-2'))
  assert.ok(ids.includes('grandchild-1-1-1'))
})

test('flattenPaths handles empty trees and edge cases', () => {
  // 空根路径
  assert.deepEqual(flattenPaths([], {}), [])
  
  // 只有根路径，没有子路径
  const singleRoot = [{ id: 'root-1', title: 'Root 1' }]
  assert.deepEqual(flattenPaths(singleRoot, {}), singleRoot)
  
  // 空 childPathsMap
  assert.deepEqual(flattenPaths([{ id: 'root-1' }], {}), [{ id: 'root-1' }])
  
  // null/undefined 输入
  assert.deepEqual(flattenPaths(null, {}), [])
  assert.deepEqual(flattenPaths(undefined, {}), [])
  
  // 非数组输入
  assert.deepEqual(flattenPaths('not an array', {}), [])
})

test('buildDescendantScope builds correct descendant sets', () => {
  const childPathsMap = {
    'root-1': [
      { id: 'child-1-1' },
      { id: 'child-1-2' }
    ],
    'child-1-1': [
      { id: 'grandchild-1-1-1' },
      { id: 'grandchild-1-1-2' }
    ],
    'grandchild-1-1-1': [
      { id: 'great-grandchild-1-1-1-1' }
    ],
    'child-1-2': [],
    'grandchild-1-1-2': [],
    'great-grandchild-1-1-1-1': []
  }
  
  // 根路径的后代 (root-1, child-1-1, child-1-2, grandchild-1-1-1, grandchild-1-1-2, great-grandchild-1-1-1-1 = 6)
  const rootScope = buildDescendantScope('root-1', childPathsMap)
  assert.equal(rootScope.size, 6)
  assert.ok(rootScope.has('root-1'))
  assert.ok(rootScope.has('child-1-1'))
  assert.ok(rootScope.has('child-1-2'))
  assert.ok(rootScope.has('grandchild-1-1-1'))
  assert.ok(rootScope.has('grandchild-1-1-2'))
  assert.ok(rootScope.has('great-grandchild-1-1-1-1'))
  
  // 子路径的后代 (child-1-1, grandchild-1-1-1, grandchild-1-1-2, great-grandchild-1-1-1-1 = 4)
  const childScope = buildDescendantScope('child-1-1', childPathsMap)
  assert.equal(childScope.size, 4)
  assert.ok(childScope.has('child-1-1'))
  assert.ok(childScope.has('grandchild-1-1-1'))
  assert.ok(childScope.has('grandchild-1-1-2'))
  assert.ok(childScope.has('great-grandchild-1-1-1-1'))
  
  // 叶子节点的后代只有自身
  const leafScope = buildDescendantScope('child-1-2', childPathsMap)
  assert.equal(leafScope.size, 1)
  assert.ok(leafScope.has('child-1-2'))
})

test('buildDescendantScope handles edge cases', () => {
  // 空 ID
  assert.deepEqual(buildDescendantScope('', {}), new Set())
  assert.deepEqual(buildDescendantScope(null, {}), new Set())
  assert.deepEqual(buildDescendantScope(undefined, {}), new Set())
  
  // 不存在的 ID 返回包含自身的集合
  const scope = buildDescendantScope('non-existent', {})
  assert.equal(scope.size, 1)
  assert.ok(scope.has('non-existent'))
  
  // 空的 childPathsMap
  const emptyMapScope = buildDescendantScope('root-1', {})
  assert.equal(emptyMapScope.size, 1)
  assert.ok(emptyMapScope.has('root-1'))
})

// ============================================================================
// Raw HWP Validation Boundary Tests
// ============================================================================

test('validateRawHwpExpansion handles completely empty input', () => {
  // 完全空的输入
  const emptyValidation = validateRawHwpExpansion({})
  assert.equal(emptyValidation.valid, false)
  assert.ok(emptyValidation.findings.some(f => f.level === 'error' && f.field === 'paths'))
  assert.equal(emptyValidation.normalized, null)
  
  // null 输入 - 验证函数有默认参数 rawHwp = {}，所以 null 会被处理
  // 但代码中使用 rawHwp.paths 会报错，需要验证实际行为
  // 这里我们主要验证空对象的行为是正确的
})

test('validateRawHwpExpansion handles missing critical fields', () => {
  // 缺少 paths 数组
  const noPaths = validateRawHwpExpansion({ question: 'Test Question' })
  assert.equal(noPaths.valid, false)
  assert.ok(noPaths.findings.some(f => f.level === 'error' && f.field === 'paths'))
  
  // 空 paths 数组
  const emptyPaths = validateRawHwpExpansion({ question: 'Test', paths: [] })
  assert.equal(emptyPaths.valid, false)
  assert.ok(emptyPaths.findings.some(f => f.level === 'error' && f.field === 'paths'))
  
  // 缺少 question 字段（应该产生 warning）
  const noQuestion = validateRawHwpExpansion({
    paths: [{ path_id: '1', title: 'Test', next_question: 'Next?' }]
  })
  assert.equal(noQuestion.valid, true) // 没有 question 不会导致 invalid
  assert.ok(noQuestion.findings.some(f => f.level === 'warning' && f.field === 'question'))
  
  // 缺少 path title（应该产生 error）
  const noTitle = validateRawHwpExpansion({
    question: 'Test',
    paths: [{ path_id: '1', next_question: 'Next?' }]
  })
  assert.equal(noTitle.valid, false)
  assert.ok(noTitle.findings.some(f => f.level === 'error' && f.field.includes('title')))
})

test('validateRawHwpExpansion handles protocol_version and semantic_groups', () => {
  // 包含 protocol_version 和 semantic_groups 的有效 payload
  const v062Payload = {
    question: 'Test Question',
    protocol_version: '0.6.2',
    semantic_groups: [
      { id: 'group-1', name: 'Group 1', paths: ['path-1'] }
    ],
    paths: [
      { path_id: 'path-1', title: 'Test Path', next_question: 'Next?' }
    ]
  }
  
  const validation = validateRawHwpExpansion(v062Payload)
  assert.equal(validation.valid, true)
  
  // 验证 protocol_version 被记录为 info
  const protocolFinding = validation.findings.find(f => f.field === 'protocol_version')
  assert.ok(protocolFinding)
  assert.equal(protocolFinding.level, 'info')
  assert.match(protocolFinding.message, /0\.6\.2/)
  
  // 验证 semantic_groups 被记录为 info
  const groupsFinding = validation.findings.find(f => f.field === 'semantic_groups')
  assert.ok(groupsFinding)
  assert.equal(groupsFinding.level, 'info')
  assert.match(groupsFinding.message, /1 group/)
})

test('validateRawHwpExpansion handles path-level validation', () => {
  const payload = {
    question: 'Test',
    paths: [
      { path_id: '1', title: 'Valid Path', next_question: 'Next?', branch_type: 'premise_shift' },
      { title: 'Missing ID' }, // 缺少 ID
      { path_id: '3' } // 缺少 title
    ]
  }
  
  const validation = validateRawHwpExpansion(payload)
  assert.equal(validation.valid, false)
  
  // 验证路径级别的 findings
  const pathFindings = validation.findings.filter(f => f.field.startsWith('paths['))
  assert.ok(pathFindings.length > 0)
  
  // 第二个路径缺少 ID（warning）
  assert.ok(pathFindings.some(f => f.field === 'paths[1].id' && f.level === 'warning'))
  
  // 第二个路径缺少 next_question（warning）
  assert.ok(pathFindings.some(f => f.field === 'paths[1].next_question' && f.level === 'warning'))
  
  // 第二个路径缺少 branch_type（warning）
  assert.ok(pathFindings.some(f => f.field === 'paths[1].branch_type' && f.level === 'warning'))
  
  // 第三个路径缺少 title（error）
  assert.ok(pathFindings.some(f => f.field === 'paths[2].title' && f.level === 'error'))
})

test('summarizeRawHwpValidation produces correct summaries', () => {
  // 完全有效的验证
  const validValidation = {
    valid: true,
    findings: []
  }
  const validSummary = summarizeRawHwpValidation(validValidation)
  assert.equal(validSummary.valid, true)
  assert.equal(validSummary.errorCount, 0)
  assert.equal(validSummary.warningCount, 0)
  assert.match(validSummary.summaryLine, /valid\.$/)
  
  // 有警告的验证
  const warningValidation = {
    valid: true,
    findings: [
      { level: 'warning', field: 'question', message: 'Missing question' }
    ]
  }
  const warningSummary = summarizeRawHwpValidation(warningValidation)
  assert.equal(warningSummary.valid, true)
  assert.equal(warningSummary.errorCount, 0)
  assert.equal(warningSummary.warningCount, 1)
  assert.match(warningSummary.summaryLine, /valid with 1 warning/)
  
  // 有错误的验证
  const errorValidation = {
    valid: false,
    findings: [
      { level: 'error', field: 'paths', message: 'Missing paths' },
      { level: 'warning', field: 'question', message: 'Missing question' }
    ]
  }
  const errorSummary = summarizeRawHwpValidation(errorValidation)
  assert.equal(errorSummary.valid, false)
  assert.equal(errorSummary.errorCount, 1)
  assert.equal(errorSummary.warningCount, 1)
  assert.match(errorSummary.summaryLine, /invalid with 1 error/)
  
  // 空输入
  const emptySummary = summarizeRawHwpValidation({})
  assert.equal(emptySummary.valid, false)
  assert.equal(emptySummary.errorCount, 0)
  assert.equal(emptySummary.warningCount, 0)
})

// ============================================================================
// Protocol Version Registry and Version-Aware Validation Tests
// ============================================================================

test('protocol version registry and version-aware validation', () => {
  // ============================================
  // A. 注册表基础功能
  // ============================================

  // getSupportedProtocolVersions() 返回包含 'legacy' 和 '0.6.2' 的数组
  const supportedVersions = getSupportedProtocolVersions()
  assert.ok(Array.isArray(supportedVersions), 'should return an array')
  assert.ok(supportedVersions.includes('legacy'), 'should include legacy')
  assert.ok(supportedVersions.includes('0.6.2'), 'should include 0.6.2')
  assert.equal(supportedVersions[0], '0.6.2', 'latest version should be first')

  // getProtocolCompatibility('0.6.2') 返回 { status: 'exact', ... }
  const exactCompatibility = getProtocolCompatibility('0.6.2')
  assert.equal(exactCompatibility.status, 'exact')
  assert.equal(exactCompatibility.resolvedVersion, '0.6.2')

  // getProtocolCompatibility('0.7.0') 返回 { status: 'fallback', ... }
  const fallbackCompatibility = getProtocolCompatibility('0.7.0')
  assert.equal(fallbackCompatibility.status, 'fallback')
  assert.equal(fallbackCompatibility.resolvedVersion, '0.6.2')

  // getProtocolCompatibility(undefined) 返回 { status: 'legacy', ... }
  const legacyCompatibility = getProtocolCompatibility(undefined)
  assert.equal(legacyCompatibility.status, 'legacy')
  assert.equal(legacyCompatibility.resolvedVersion, 'legacy')

  // ============================================
  // B. resolveProtocolSchema
  // ============================================

  // 传入 '0.6.2' 返回 v0.6.2 schema
  const v062Schema = resolveProtocolSchema('0.6.2')
  assert.equal(v062Schema.version, '0.6.2')
  assert.ok(v062Schema.fieldAliases.semantic_groups, 'v0.6.2 schema should include semantic_groups')
  assert.ok(!v062Schema._fallback, 'exact match should not have _fallback')

  // 传入 undefined 返回 legacy schema
  const legacySchema = resolveProtocolSchema(undefined)
  assert.equal(legacySchema.version, 'legacy')
  assert.ok(!legacySchema.fieldAliases.semantic_groups, 'legacy schema should not include semantic_groups')
  assert.ok(!legacySchema._fallback, 'legacy should not have _fallback')

  // 传入未知版本返回带 _fallback 标记的 schema
  const unknownSchema = resolveProtocolSchema('0.9.0')
  assert.ok(unknownSchema._fallback, 'unknown version should have _fallback')
  assert.equal(unknownSchema._requestedVersion, '0.9.0')
  assert.equal(unknownSchema.version, '0.6.2', 'should fallback to latest known version')

  // ============================================
  // C. registerProtocolVersion
  // ============================================

  // 注册新版本后 getSupportedProtocolVersions 包含该版本
  registerProtocolVersion('0.7.0', {
    fieldAliases: {
      id: ['id'],
      path_title: ['title']
    },
    requiredFields: ['paths'],
    optionalFields: ['new_feature'],
    pathRequiredFields: ['path_title'],
    features: {
      semanticGroups: true,
      protocolVersion: true
    }
  })

  const updatedVersions = getSupportedProtocolVersions()
  assert.ok(updatedVersions.includes('0.7.0'), 'should include newly registered version')
  assert.equal(updatedVersions[0], '0.7.0', 'newer version should be first')

  // 解析新版本返回注册的 schema
  const newSchema = resolveProtocolSchema('0.7.0')
  assert.equal(newSchema.version, '0.7.0')
  assert.ok(!newSchema._fallback, 'registered version should not fallback')
  assert.equal(newSchema.features.semanticGroups, true)
  assert.equal(newSchema.features.protocolVersion, true)

  // ============================================
  // D. 版本感知验证
  // ============================================

  // 传入 protocol_version: '0.6.2' 的数据，validateRawHwpExpansion 正确使用 v0.6.2 schema
  const v062Payload = {
    question: 'Test Question',
    protocol_version: '0.6.2',
    paths: [
      { path_id: 'path-1', title: 'Test Path', next_question: 'Next?' }
    ]
  }

  const v062Validation = validateRawHwpExpansion(v062Payload)
  assert.equal(v062Validation.valid, true)
  const protocolFinding = v062Validation.findings.find(f => f.field === 'protocol_version')
  assert.ok(protocolFinding, 'should have protocol_version finding')
  assert.equal(protocolFinding.level, 'info')
  assert.match(protocolFinding.message, /0\.6\.2/)
  assert.ok(!protocolFinding.message.includes('[fallback]'), 'exact match should not have fallback marker')

  // 传入未知 protocol_version 的数据，findings 中包含 warning 级别的回退提示
  const unknownVersionPayload = {
    question: 'Test Question',
    protocol_version: '0.99.0',
    paths: [
      { path_id: 'path-1', title: 'Test Path', next_question: 'Next?' }
    ]
  }

  const unknownVersionValidation = validateRawHwpExpansion(unknownVersionPayload)
  assert.equal(unknownVersionValidation.valid, true)
  const fallbackWarning = unknownVersionValidation.findings.find(
    f => f.field === 'protocol_version' && f.level === 'warning'
  )
  assert.ok(fallbackWarning, 'should have warning for unknown version')
  assert.ok(fallbackWarning.message.toLowerCase().includes('falling back'), 'warning message should mention falling back')

  // 传入包含未知字段的数据，findings 中包含 info 级别的提示
  const unknownFieldPayload = {
    question: 'Test Question',
    protocol_version: '0.6.2',
    unknown_new_field: 'some value',
    paths: [
      { path_id: 'path-1', title: 'Test Path', next_question: 'Next?' }
    ]
  }

  const unknownFieldValidation = validateRawHwpExpansion(unknownFieldPayload)
  const unknownFieldFinding = unknownFieldValidation.findings.find(f => f.field === 'unknown_new_field')
  assert.ok(unknownFieldFinding, 'should have info finding for unknown field')
  assert.equal(unknownFieldFinding.level, 'info')
  assert.match(unknownFieldFinding.message, /Unknown field/i)

  // ============================================
  // E. 版本感知规范化
  // ============================================

  // normalizeRawHwpExpansion 处理带 protocol_version 的数据时，meta 中包含 protocolCompatibility 信息
  const fallbackPayload = {
    question: 'Test Question',
    protocol_version: '0.99.0',
    paths: [
      { path_id: 'path-1', title: 'Test Path', next_question: 'Next?' }
    ]
  }

  const normalizedWithFallback = normalizeRawHwpExpansion(fallbackPayload)
  assert.ok(normalizedWithFallback.meta.protocolCompatibility, 'should include protocolCompatibility in meta')
  assert.equal(normalizedWithFallback.meta.protocolCompatibility.status, 'fallback')
  assert.equal(normalizedWithFallback.meta.protocolCompatibility.requestedVersion, '0.99.0')
  assert.equal(normalizedWithFallback.meta.protocolCompatibility.resolvedVersion, '0.7.0')

  // 精确匹配时不应包含 protocolCompatibility
  const exactPayload = {
    question: 'Test Question',
    protocol_version: '0.6.2',
    paths: [
      { path_id: 'path-1', title: 'Test Path', next_question: 'Next?' }
    ]
  }

  const normalizedExact = normalizeRawHwpExpansion(exactPayload)
  assert.ok(!normalizedExact.meta.protocolCompatibility, 'exact match should not include protocolCompatibility')
})
