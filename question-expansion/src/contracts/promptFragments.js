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
