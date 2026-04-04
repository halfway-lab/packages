# Release Note / PR Description

## 中文

### 标题建议

`question-expansion: 对齐 raw HWP 契约校验，补强 schema 审计，并完善文档说明`

### 摘要

这次更新主要聚焦在 raw HWP 契约层的一致性、可维护性和审计能力。

- 修复 `validateRawHwpExpansion(...)` 对顶层数组 payload 的误判问题，使其与 `normalizeRawHwpExpansion(...)` 的输入契约保持一致
- 修复 `normalizeExpansionPath(...)` 在 schema 模式下未正确识别 `labels` 别名的问题
- 对齐 v0.6.2 文档与实现，将 `group_count`、`cross_domain_contamination` 纳入已知字段
- 增加 path 级别 unknown field 审计提示，帮助更早发现上游协议扩展
- 重构 protocol schema 定义，减少重复并简化后续版本扩展
- 更新契约文档、项目状态和 release readiness 说明

### 影响

- 对下游更安全：未知字段现在会以 `info` 提示暴露出来，而不是悄悄被忽略
- 对接入方更稳定：数组输入、schema alias、版本回退行为现在更一致
- 对后续演进更友好：新增协议版本时更不容易漏掉 alias 或 optional field

### 验证

- `packages/question-expansion`: `npm test`
- `apps/question-expander`: `npm run test:run`
- 下游联调结果：专项契约测试通过，全量 app 测试通过

## English

### Suggested Title

`question-expansion: align raw HWP contract validation, strengthen schema auditing, and refresh docs`

### Summary

This update focuses on raw HWP contract consistency, maintainability, and auditability.

- Fixed `validateRawHwpExpansion(...)` so top-level array payloads are treated consistently with `normalizeRawHwpExpansion(...)`
- Fixed `normalizeExpansionPath(...)` so the `labels` alias is honored in schema-aware normalization
- Aligned the v0.6.2 implementation with the documented contract by recognizing `group_count` and `cross_domain_contamination`
- Added path-level unknown-field audit findings to surface upstream protocol evolution earlier
- Refactored protocol schema definitions to reduce duplication and simplify future version additions
- Updated contract docs, project status notes, and release-readiness guidance

### Impact

- Safer downstream integration: unknown fields are now surfaced as `info` findings instead of being silently missed
- More consistent consumer behavior: array inputs, schema aliases, and version fallback behavior now line up better
- Easier future maintenance: new protocol versions are less likely to miss aliases or optional fields

### Verification

- `packages/question-expansion`: `npm test`
- `apps/question-expander`: `npm run test:run`
- Downstream integration check: focused contract tests and the full app test suite both passed
