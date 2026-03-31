# @halfway-lab/reading-note

[简体中文](./README.md)

A reading-note package built on top of a local HWP execution chain.

Within the Halfway-Lab workspace, the package lives at `packages/reading-note`.

## Features

- Compress a sentence into a structured reading-note result
- Extract key points and follow-up paths
- Detect connections with prior notes
- Generate blind-spot feedback
- Auto-suggest tags

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

The package runs a local HWP chain first, then compresses the chain output into a stable reading-note shape.

## Public API

- `processReadingNote(input, options?)`: run the HWP chain and return a normalized reading-note result
- `processReadingNoteFromRounds(input, rounds)`: build the reading-note result from existing HWP rounds
- `processReadingNoteGraph(input, options?)`: run the HWP chain and return the note, graph snapshot, and HWP analysis input
- `processReadingNoteGraphFromRounds(input, rounds)`: build the note, graph snapshot, and analysis input from existing HWP rounds
- `buildReadingNoteGraph(input, output)`: build a graph snapshot from a note input and normalized output
- `buildHwpNoteAnalysisInput(graph)`: derive the payload used for follow-up HWP analysis
- `createDefaultReadingNoteHwpRunner()`: create the built-in runner that resolves and executes the local HWP repository
- `ReadingNoteHwpRunner`: the stable extension point for injecting an external rounds provider
- Public TypeScript types from `src/types.ts` are exported from the package root

The package root is the only supported import surface. Avoid deep imports such as `@halfway-lab/reading-note/dist/hwp` or workspace-only source paths, because internals may continue to change while the root API stays stable.

## API Stability

This package is intended to be used as a public API.

- The package root export surface is the supported public contract
- `processReadingNoteFromRounds(...)` and `processReadingNoteGraphFromRounds(...)` are the most stable entrypoints when your app already owns HWP execution
- `processReadingNote(...)` and `processReadingNoteGraph(...)` are supported public APIs when your app wants this package to drive HWP execution
- `ReadingNoteHwpRunner` is the supported extension point for a custom execution layer
- Local runner wiring, log parsing, temp-file handling, and repo path resolution are internal details and not part of the public contract

In practice, import only from `@halfway-lab/reading-note` and rely on semver-compatible updates for the root API.

## Versioning

This package follows semantic versioning for its public root API.

- Patch releases may update internals, docs, tests, and bug fixes without changing the supported root contract
- Minor releases may add new root exports or optional capabilities in a backward-compatible way
- Major releases may change or remove public root APIs

If your integration depends on stable behavior, prefer the package root APIs listed above and avoid coupling to workspace-only or deep internal paths.

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
const result = await processReadingNoteGraph(input);
const analysisInput = buildHwpNoteAnalysisInput(result.graph);

console.log(note.summary, result.graph.nodes.length, analysisInput.focusNoteIds);
```

## Injected Runner

`reading-note` supports a stable injected runner interface. Callers such as Half Note can provide their own HWP execution layer without depending on the current log-backed default runner.

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

If you do not pass `options.hwpRunner`, the package uses `createDefaultReadingNoteHwpRunner()` internally.

## Pure Post-Processing

If your app already has stable HWP rounds, you can skip runner integration entirely and use the pure post-processing entrypoints.

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

`note.connection` summarizes the primary connection against the first history item, while each graph `link` and `relationScore` keeps evidence and rationale for its own history item.

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

Example output:

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

Graph snapshot excerpt:

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

If you install from GitHub Packages, make sure your npm auth and scoped registry are configured for `@halfway-lab`.

## HWP Setup

This package expects a local checkout of `https://github.com/halfway-lab/HWP` and runs the HWP chain runner directly.

Inside the Halfway-Lab workspace, the package can resolve the canonical protocol repo from the workspace layout. Outside that layout, set `HWP_REPO_PATH` explicitly.

Set the HWP repo path:

```bash
export HWP_REPO_PATH=/path/to/HWP
```

Then configure your provider inside that HWP repo, for example through `config/provider.env` or `HWP_PROVIDER_*` environment variables.

Typical HWP variables:

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

If the HWP provider is not configured correctly, the error comes from the underlying HWP runner or adapter.

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## Publish Notes

- The published package ships `dist/`, `README.md`, `README.en.md`, `CHANGELOG.md`, `LICENSE`, and `package.json`
- `prepublishOnly` runs build and tests before publish
- Runtime behavior depends on the external local HWP repository, so this package is not a standalone hosted API client
