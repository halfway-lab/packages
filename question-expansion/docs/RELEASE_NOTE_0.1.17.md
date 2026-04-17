# Release v0.1.17

## 问题修复

### 追问功能卡片展示优化

**问题描述**：用户对根问题中的某张卡片进行追问时，根问题的其他卡片会消失，只显示被追问的1张 + 追问的3张 = 4张。

**修复方案**：
1. 修改 `buildStructuredOverview` 逻辑，保留根路径并追加追问展开的子路径
2. 新增 `mergeOverviewPaths` 函数，支持递归收集所有层级的子卡片
3. 修复空值检查潜在 bug

**修改文件**：
- `src/overview/structuredOverview.js` - 新增路径合并逻辑
- `src/viewModel/buildExpansionViewModel.js` - 传入 childPathsMap
- `src/index.d.ts` - 更新类型定义

**效果**：
- 追问后根问题的卡片不再消失
- 多次追问可以累积显示
- 例如：根问题3张 → 追问一次6张 → 再追问一次9张

## 类型定义更新

- `buildStructuredOverview` 新增 `childPathsMap` 可选参数
