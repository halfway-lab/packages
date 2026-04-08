# Release Note / PR Description

## 中文

### 标题建议

`question-expansion: 收口中性 raw contract，对齐 meta 类型，并完成 0.1.10 发版`

### 摘要

这次更新主要聚焦在 Question Expander 现有 app contract 与 `@halfway-lab/question-expansion` 之间的最后一轮接口收口，并完成正式发版闭环。

- 将 `sessionId` / `session_id`、`openQuestions` / `open_questions`、`nextSteps` / `next_steps`、`parentId` / `parent_id` 纳入已知 raw contract alias
- 调整 `next_question` 的兼容归一化逻辑：当上游给出数组型候选问题时，稳定取第一项作为产品契约字段
- 将 `NormalizedExpansion.meta`、`RawHwpExpansion.meta`、`AuditPayload.meta` 从宽泛的 `Record<string, unknown>` 收紧为显式类型
- 保留并透传更稳定的元信息字段，包括 `provider`、`model`、`sessionId`、`protocolCompatibility`、`contractVersion` 等
- 更新 README 与 contract 文档，明确中性 raw alias 已被正式接受
- 发布 `@halfway-lab/question-expansion@0.1.10`，并让 `apps/question-expander` 切回 npm registry 版本进行验证

### 影响

- 对接入方更清晰：app 侧已经在使用的中性字段不再只是“兼容接受”，而是正式进入契约面
- 对 TypeScript 消费方更友好：`meta` 字段有了更明确的类型提示，不再需要大量手写断言
- 对发布流程更完整：本地联调、npm 发布、下游回切和契约测试已经形成闭环

### 验证

- `packages/question-expansion`: `npm test`
- `packages/question-expansion`: `npm_config_cache=/tmp/question-expansion-npm-cache npm pack --dry-run`
- `apps/question-expander`: `npm run test:run -- tests/path-contract.test.js tests/normalized-expansion.test.js tests/question-expansion-api-plugin.test.js tests/expansion-contracts.test.js`
- npm 发布结果：`@halfway-lab/question-expansion@0.1.10`

## English

### Suggested Title

`question-expansion: close the neutral raw-contract gap, tighten meta typing, and ship 0.1.10`

### Summary

This release focuses on the final alignment pass between the Question Expander app contract and `@halfway-lab/question-expansion`, then completes the publish-and-verify loop.

- Added first-class raw contract aliases for `sessionId` / `session_id`, `openQuestions` / `open_questions`, `nextSteps` / `next_steps`, and `parentId` / `parent_id`
- Tightened `next_question` normalization so array-shaped upstream candidates resolve to the first stable product-facing question
- Replaced broad `Record<string, unknown>` metadata typing with explicit exported meta interfaces for normalized payloads and audit payloads
- Preserved stable metadata fields such as `provider`, `model`, `sessionId`, `protocolCompatibility`, and `contractVersion`
- Updated README and contract docs to document the neutral raw aliases as supported input
- Published `@halfway-lab/question-expansion@0.1.10` and verified downstream app integration against the npm package

### Impact

- Clearer downstream contract: neutral app-facing raw fields are now part of the supported surface, not just tolerated input
- Better TypeScript ergonomics: consumers get meaningful metadata hints instead of relying on repeated narrowing or casts
- Cleaner release workflow: local alignment, npm publish, downstream reversion to registry dependency, and focused regression checks all completed

### Verification

- `packages/question-expansion`: `npm test`
- `packages/question-expansion`: `npm_config_cache=/tmp/question-expansion-npm-cache npm pack --dry-run`
- `apps/question-expander`: `npm run test:run -- tests/path-contract.test.js tests/normalized-expansion.test.js tests/question-expansion-api-plugin.test.js tests/expansion-contracts.test.js`
- npm publish result: `@halfway-lab/question-expansion@0.1.10`
