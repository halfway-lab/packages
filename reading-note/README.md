# @halfway-lab/reading-note

[English](./README.en.md)

一个基于本地 HWP 协议执行链的阅读笔记处理包。

在 Halfway-Lab 工作区内，这个包的主目录是 `packages/reading-note`。

## Features

- 把一句话压缩成结构化理解结果
- 提取关键观点与延展路径
- 识别与历史记录的连接
- 生成盲点反馈
- 自动补充标签

## Usage

```ts
import { processReadingNote } from "@halfway-lab/reading-note";

const result = await processReadingNote({
  text: "人是被环境塑造的",
  history: ["选择往往受环境影响"],
  feeling: "insight",
  context: "在读书会里看到这句话",
});

console.log(result);
```

这个包会先运行本地 HWP 链路，再把链路结果压缩成稳定的 reading-note 输出结构。

## Public API

- `processReadingNote(input, options?)`：运行 HWP 链路并返回归一化后的 reading-note 结果
- `processReadingNoteFromRounds(input, rounds)`：基于已有 HWP rounds 构建 reading-note 结果
- `processReadingNoteGraph(input, options?)`：运行 HWP 链路并返回 note、graph snapshot 和 HWP analysis input
- `processReadingNoteGraphFromRounds(input, rounds)`：基于已有 HWP rounds 构建 note、graph snapshot 和 analysis input
- `buildReadingNoteGraph(input, output)`：根据 note 输入和标准化输出生成图谱快照
- `buildHwpNoteAnalysisInput(graph)`：从图谱派生后续 HWP 分析所需的输入载荷
- `createDefaultReadingNoteHwpRunner()`：创建内置 runner，用当前默认执行路径解析本地 HWP 仓库并执行
- `ReadingNoteHwpRunner`：用于注入外部 rounds provider 的稳定扩展接口
- 包根路径会导出 `src/types.ts` 中公开的 TypeScript 类型

包根路径是唯一受支持的导入面。避免使用 `@halfway-lab/reading-note/dist/hwp` 这类深层导入，或依赖工作区内源码路径，因为内部实现仍可能变化，而根导出 API 会保持稳定。

## API Stability

这个包被设计成一个可公开依赖的 API。

- 包根路径的导出面就是受支持的公开契约
- 如果你的应用已经自己掌管 HWP 执行，`processReadingNoteFromRounds(...)` 和 `processReadingNoteGraphFromRounds(...)` 是最稳定的集成点
- 如果你的应用希望由本包负责驱动 HWP 执行，`processReadingNote(...)` 和 `processReadingNoteGraph(...)` 都是受支持的公开 API
- `ReadingNoteHwpRunner` 是官方支持的扩展点，可用于接入自定义执行层
- 本地 runner 接线、日志解析、临时文件处理、仓库路径解析等内部细节不属于公开契约

实际使用时，建议只从 `@halfway-lab/reading-note` 导入，并通过语义化版本更新来获得兼容的根 API 变更。

## Versioning

这个包对根公开 API 采用语义化版本管理。

- patch 版本可能更新内部实现、文档、测试和 bug 修复，但不会改变受支持的根契约
- minor 版本可能以向后兼容的方式增加新的根导出或可选能力
- major 版本可能调整或移除公开根 API

如果你的集成依赖稳定行为，优先使用上面列出的包根 API，不要耦合任何仅限工作区使用的内部路径或深层实现路径。

## Graph Usage

```ts
import {
  buildHwpNoteAnalysisInput,
  processReadingNote,
  processReadingNoteGraph,
} from "@halfway-lab/reading-note";

const input = {
  text: "人是被环境塑造的",
  history: ["选择往往受环境影响"],
  feeling: "insight" as const,
  context: "在读书会里看到这句话",
};

const note = await processReadingNote(input);
const result = await processReadingNoteGraph({
  ...input,
});

const analysisInput = buildHwpNoteAnalysisInput(result.graph);

console.log(note.summary, result.graph.nodes.length, analysisInput.focusNoteIds);
```

## Injected Runner

`reading-note` 支持稳定的 injected runner 接口。这样像 Half Note 这类调用方就可以接入自己的 HWP 执行层，而不必依赖当前基于日志回读的默认 runner。

```ts
import type {
  HwpRoundRecord,
  ReadingNoteHwpRunner,
} from "@halfway-lab/reading-note";
import { processReadingNoteGraph } from "@halfway-lab/reading-note";

const halfNoteRunner: ReadingNoteHwpRunner = {
  async run(input): Promise<HwpRoundRecord[]> {
    const response = await fetch("http://your-stable-hwp-endpoint/run-reading-note", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`HWP request failed: ${response.status}`);
    }

    const data = (await response.json()) as { rounds: HwpRoundRecord[] };
    return data.rounds;
  },
};

const result = await processReadingNoteGraph(
  {
    text: "人是被环境塑造的",
    history: ["选择往往受环境影响"],
    feeling: "insight",
    context: "在读书会里看到这句话",
  },
  {
    hwpRunner: halfNoteRunner,
  }
);

console.log(result.analysisInput.focusNoteIds);
```

如果没有传入 `options.hwpRunner`，包内部会使用 `createDefaultReadingNoteHwpRunner()`。

## Pure Post-Processing

如果你的应用已经有稳定的 HWP rounds，可以完全跳过 runner 集成，直接使用纯后处理入口。

```ts
import type { HwpRoundRecord } from "@halfway-lab/reading-note";
import {
  processReadingNoteFromRounds,
  processReadingNoteGraphFromRounds,
} from "@halfway-lab/reading-note";

const rounds: HwpRoundRecord[] = [
  {
    questions: ["这句话如何影响人的选择？"],
    variables: ["环境塑造", "主动性", "过往经验"],
    paths: [{ continuation_hook: "把当前句子和过往记录放在一起比较" }],
    tensions: [{ description: "环境塑造 vs 主动选择" }],
    blind_spot_signals: [
      {
        description: "把人完全看成被环境推着走",
        severity: "high",
      },
    ],
  },
];

const input = {
  text: "人是被环境塑造的",
  history: ["选择往往受环境影响"],
  feeling: "insight" as const,
  context: "在读书会里看到这句话",
};

const note = processReadingNoteFromRounds(input, rounds);
const graphResult = processReadingNoteGraphFromRounds(input, rounds);

console.log(note.summary, note.blindSpot, graphResult.analysisInput.focusNoteIds);
```

## Output

```json
{
  "summary": "这句话在谈环境塑造与主动选择。",
  "points": [
    "核心观点：如何影响人的选择",
    "延展路径：当前句子和过往记录放在一起比较"
  ],
  "connection": "它和“选择往往受环境影响”能互相印证，都在谈环境塑造与主动选择。",
  "blindSpot": "可能把人完全看成被环境推着走",
  "tags": ["环境塑造", "主动性", "过往经验"]
}
```

## Connection And Feedback Example

`note.connection` 会给出面向第一条历史记录的主连接摘要；图谱里的每条 `link` 和 `relationScore` 则会保留逐条 history 对应的证据与说明。

```ts
import {
  processReadingNoteFromRounds,
  processReadingNoteGraphFromRounds,
} from "@halfway-lab/reading-note";

const input = {
  text: "人是被环境塑造的",
  history: ['"选择往往受环境影响"', "个体也会反过来改变环境"],
  feeling: "insight" as const,
  context: "在读书会里看到这句话",
};

const rounds = [
  {
    questions: ["这句话如何影响人的选择？", "人在什么条件下能反过来塑造环境？"],
    variables: ["环境塑造", "主动性", "过往经验"],
    paths: [
      {
        continuation_hook: "把当前句子和过往记录放在一起比较",
        blind_spot: { description: "没有区分不同环境对人的作用强度" },
      },
    ],
    tensions: [{ description: "环境塑造 vs 主动选择" }],
    blind_spot_signals: [
      {
        type: "assumption_conflict",
        description: "把人完全看成被环境推着走",
        severity: "high",
      },
    ],
  },
];

const note = processReadingNoteFromRounds(input, rounds);
const graphResult = processReadingNoteGraphFromRounds(input, rounds);

console.log(note.connection);
console.log(note.blindSpot);
console.log(graphResult.graph.links.map((link) => link.contextSnippet));
```

示例输出：

```json
{
  "connection": "它和“选择往往受环境影响”能互相印证，都在谈环境塑造与主动选择。",
  "blindSpot": "可能把人完全看成被环境推着走",
  "linkContextSnippets": [
    "它和“选择往往受环境影响”能互相印证，都在谈环境塑造与主动选择。",
    "它和“个体也会反过来改变环境”能互相印证，都在谈环境塑造与主动选择。"
  ]
}
```

图谱片段示例：

```json
{
  "focusNoteIds": ["note-人是被环境塑造的-1tinxu"],
  "links": [
    {
      "label": "history_context",
      "contextSnippet": "它和“选择往往受环境影响”能互相印证，都在谈环境塑造与主动选择。"
    },
    {
      "label": "history_context",
      "contextSnippet": "它和“个体也会反过来改变环境”能互相印证，都在谈环境塑造与主动选择。"
    }
  ],
  "relationScores": [
    {
      "score": 0.72,
      "basis": "content_overlap",
      "rationale": "它和“选择往往受环境影响”能互相印证，都在谈环境塑造与主动选择。"
    },
    {
      "score": 0.72,
      "basis": "content_overlap",
      "rationale": "它和“个体也会反过来改变环境”能互相印证，都在谈环境塑造与主动选择。"
    }
  ],
  "contextWindow": {
    "neighborNoteIds": [
      "history-选择往往受环境影响-1-j0a7kj",
      "history-个体也会反过来改变环境-2-106x0z"
    ],
    "selectedTags": ["环境塑造", "主动性", "过往经验"]
  }
}
```

## Requirements

- Node.js 20+
- A local checkout of `https://github.com/halfway-lab/HWP`
- A working HWP provider configuration inside that repo
- `bash` available in your runtime environment

## Install

```bash
npm install @halfway-lab/reading-note
```

If you install from GitHub Packages, make sure your npm auth and scope registry are configured for `@halfway-lab`.

## HWP Setup

This package expects a local checkout of `https://github.com/halfway-lab/HWP` and runs the HWP chain runner directly.

Inside the Halfway-Lab workspace, the package can resolve the canonical protocol repo from the workspace layout. Outside that layout, set `HWP_REPO_PATH` explicitly.

Set the HWP repo path:

```bash
export HWP_REPO_PATH=/path/to/HWP
```

Then configure your provider inside that HWP repo, for example via its `config/provider.env` or `HWP_PROVIDER_*` environment variables.

The usual HWP variables are:

```bash
export HWP_PROVIDER_TYPE=openai_compatible
export HWP_PROVIDER_NAME=deepseek
export HWP_LLM_API_KEY=your_key_here
export HWP_LLM_MODEL=your_model_here
```

If the HWP repo cannot be found, the package throws:

```text
HWP repository not found. Set HWP_REPO_PATH to your local halfway-lab/HWP checkout.
```

If the HWP provider is not configured correctly, the error will come from the underlying HWP runner or adapter.

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## Publish Notes

- The published package ships `dist/`, `README.md`, `CHANGELOG.md`, `LICENSE`, and `package.json`
- `prepublishOnly` runs build and tests before publish
- Runtime behavior depends on the external local HWP repository, so this package is not a standalone hosted API client
