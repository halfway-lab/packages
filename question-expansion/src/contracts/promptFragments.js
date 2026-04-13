/**
 * Prompt fragments — 可拼接的 LLM 输出约束片段。
 *
 * 设计原则：
 * - 不生成完整 prompt，只提供可拼接的片段
 * - 包仍是数据适配层，prompt 拼装由 adapter 层决定
 * - 片段是纯字符串，零依赖
 */

/**
 * @typedef {Object} PromptFragments
 * @property {string} pathsFirst - paths 字段优先的约束说明
 * @property {string} jsonStructure - JSON 结构说明
 * @property {string} fieldNames - 字段名称说明
 * @property {string} responseFormat - 完整响应格式要求
 */

/**
 * 获取要求 paths 在 JSON 最前的 schema 约束对象。
 * 适用于支持 JSON Schema 的 LLM API（如 OpenAI structured output）。
 *
 * @returns {Object} JSON Schema 约束对象
 */
export function buildPathsFirstJsonSchema() {
  return {
    type: 'object',
    properties: {
      paths: {
        type: 'array',
        description: 'Exploration paths. MUST be the first field in the output.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            path_title: { type: 'string', description: 'Short title for this exploration path' },
            path_summary: { type: 'string', description: 'Brief summary of this path direction' },
            next_question: { type: 'string', description: 'Follow-up question for deeper exploration' },
            branch_type: { type: 'string', description: 'Classification of this path branch' },
            unfinished_score: { type: 'number', minimum: 0, maximum: 1, description: 'How unfinished this path is (0=complete, 1=unexplored)' },
            blind_spot_hint: { type: 'string', description: 'Potential blind spot or tension in this direction' },
            tags: { type: 'array', items: { type: 'string' } },
            tensions: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' } } } }
          },
          required: ['path_title', 'next_question']
        }
      },
      question: { type: 'string', description: 'The core question being explored' },
      core_question: { type: 'string', description: 'Alias for question' },
      key_tensions: { type: 'array', items: { type: 'string' } },
      protocol_version: { type: 'string' },
      semantic_groups: { type: 'array' }
    },
    required: ['paths'],
    propertyOrder: ['paths', 'question', 'core_question', 'key_tensions', 'protocol_version', 'semantic_groups']
  }
}

/**
 * 获取系统提示片段集合。
 * adapter 层可选择性拼接这些片段到自己的 system prompt 中。
 *
 * @returns {PromptFragments}
 */
export function getExpansionPromptFragments() {
  return {
    pathsFirst: [
      'CRITICAL: In your JSON response, the "paths" array MUST be the VERY FIRST field.',
      'Do NOT output "question", "core_question", or any other field before "paths".',
      'This is required for streaming performance — the client needs path data as early as possible.',
      'Example: {"paths": [...], "question": "...", ...}'
    ].join('\n'),

    jsonStructure: [
      'Your response must be a single JSON object with these fields:',
      '- paths (array, REQUIRED, MUST BE FIRST): exploration path objects',
      '- question (string, optional): the core question',
      '- core_question (string, optional): alias for question',
      '- key_tensions (array of strings, optional): key tensions identified',
      '- protocol_version (string, optional): protocol version identifier',
      '- semantic_groups (array, optional): semantic grouping of paths'
    ].join('\n'),

    fieldNames: [
      'Each path object should use these field names:',
      '- path_title: short descriptive title',
      '- path_summary: brief explanation of this direction',
      '- next_question: the follow-up question to explore deeper',
      '- branch_type: classification (e.g., premise_shift, hidden_variable, unfinished_path)',
      '- unfinished_score: number 0-1 indicating exploration completeness',
      '- blind_spot_hint: what might be overlooked in this direction',
      '- tags: array of relevant tags',
      '- tensions: array of {text: string} tension objects'
    ].join('\n'),

    responseFormat: [
      'RESPONSE FORMAT REQUIREMENTS:',
      '',
      '1. Output a single valid JSON object.',
      '2. The "paths" array MUST be the FIRST field in the JSON (before question, core_question, etc.).',
      '3. Each path in the array must have at least "path_title" and "next_question".',
      '4. Use snake_case field names (path_title, not pathTitle).',
      '5. unfinished_score must be a number between 0 and 1.',
      '6. Do not wrap the JSON in markdown code fences.',
      '',
      'Example structure:',
      '{',
      '  "paths": [',
      '    {',
      '      "path_title": "...",',
      '      "path_summary": "...",',
      '      "next_question": "...",',
      '      "branch_type": "premise_shift",',
      '      "unfinished_score": 0.7,',
      '      "blind_spot_hint": "...",',
      '      "tags": ["..."],',
      '      "tensions": [{"text": "..."}]',
      '    }',
      '  ],',
      '  "question": "...",',
      '  "key_tensions": ["..."]',
      '}'
    ].join('\n')
  }
}

// ============================================================================
// A1.1 深度阶段映射
// ============================================================================

export const DEPTH_STAGES = {
  diverge:  { maxDepth: 2, pathCount: 3, label: '发散' },
  focus:    { maxDepth: 3, pathCount: 3, label: '聚焦' },
  dig:      { maxDepth: 4, pathCount: 2, label: '深挖' },
  converge: { maxDepth: Infinity, pathCount: 2, label: '收敛' }
}

export function getStageForDepth(depth) {
  if (depth <= 2) return 'diverge'
  if (depth === 3) return 'focus'
  if (depth === 4) return 'dig'
  return 'converge'
}

// ============================================================================
// A1.2 深度感知 system prompt 片段
// ============================================================================

export function getDepthAwareSystemHint(depth) {
  const stage = getStageForDepth(depth)
  const hints = {
    diverge: '你正在初步展开阶段，优先打开多样化的思考方向。',
    focus: '你已进入聚焦阶段。不要重复上层已有方向，而是在选定方向上找到更具体的切入点。',
    dig: '你已进入深挖阶段。寻找具体机制、证据、前提假设或反例，不要再发散新方向。',
    converge: '你已进入收敛阶段。找出这条路径真正揭示了什么、还缺什么关键信息、最大盲点在哪里。'
  }
  return hints[stage] || hints.diverge
}

// ============================================================================
// A1.3 深度感知 user prompt 尾部指令
// ============================================================================

export function getDepthAwareUserInstruction(depth) {
  const stage = getStageForDepth(depth)
  const instructions = {
    diverge: '请展开成 3 条多样化的思考方向。',
    focus: '请从这个方向深入，找到 3 条更具体的切入点。不要重复已探索方向。',
    dig: '请找出 2 条关键的具体机制、证据或前提假设。',
    converge: '请找出 1-2 个最关键的盲点或未被检验的前提。'
  }
  return instructions[stage] || instructions.diverge
}

// ============================================================================
// A1.4 兄弟路径去重提示
// ============================================================================

export function buildSiblingDedupeHint(exploredSiblings = []) {
  if (!exploredSiblings.length) return ''
  const titles = exploredSiblings.map(s => s.title).filter(Boolean)
  if (!titles.length) return ''
  return `该层级已探索的方向：${titles.join('、')}。请避免与这些方向重复，必须探索新的角度。`
}

// ============================================================================
// A3 初步分析 prompt 片段
// ============================================================================

export function getRootAnalysisPromptFragments() {
  return {
    system: [
      '你是 Question Expander 的初步分析引擎。',
      '用户提出了一个问题，在展开成多个方向之前，先给出一个简短的初步判断。',
      '你的回答必须：',
      '1. 用一句话点明这个问题的核心在于什么',
      '2. 列出 2-3 个这个问题涉及的关键维度或隐含假设',
      '3. 简短说明当前对问题的理解还缺少什么信息',
      '不要展开新方向，不要给长篇回答，不要给最终结论。'
    ].join('\n'),
    jsonFormat: '{"core_insight": "...", "dimensions": ["..."], "missing": "..."}'
  }
}
