# Raw HWP Contract

## Purpose

`@halfway-lab/question-expansion` should accept raw HWP-oriented output and translate it into stable Question Expander product structures.

This contract exists so that:

- `protocol/HWP` can remain generic
- adapter code can stay thin
- Question Expander product semantics stay in `packages/question-expansion`

## Upstream Repository

The upstream protocol/execution repository is `halfway-lab/HWP`.

That repository is the source of truth for HWP execution capability. This package is not coupled to HWP repository internals. It should only depend on request and response contract shapes that an adapter exposes.

## Expected Raw Response Shape

The package now accepts a raw HWP expansion payload shaped like:

```json
{
  "question": "我要不要换工作",
  "core_question": "先拆清这个问题真正卡住的前提",
  "key_tensions": ["前提是否被说死了", "隐藏变量还没进入视野"],
  "next_questions": ["哪些前提还没检查？"],
  "paths": [
    {
      "id": "path-1",
      "title": "重写问题前提",
      "summary": "先检查问题设定方式。",
      "next_question": "哪些前提还没检查？",
      "branch_type": "premise_shift",
      "unfinished_score": 0.82,
      "blind_spot_hint": "问题前提可能过早固定",
      "tags": ["前提"],
      "tensions": ["问题前提被过早固定"]
    }
  ],
  "meta": {
    "provider": "hwp_runner"
  }
}
```

The package also accepts a top-level array of raw path objects for normalization and validation helpers that operate on response-like input:

```json
[
  {
    "title": "重写问题前提",
    "next_question": "哪些前提还没检查？"
  }
]
```

## HWP v0.6.2 Optional Fields

The following fields are optional and may be present in raw HWP responses from protocol v0.6.2 onwards:

- `protocol_version` (string): HWP protocol version identifier, e.g., "0.6.2"
- `semantic_groups` (array, optional): Semantic clustering data containing group analysis
  - Each group includes: `group_id`, `group_name`, `domain`, `nodes`, `coherence_score`, `expansion_path`, `group_metadata`
- `group_count` (number): Count of semantic groups in the response
- `cross_domain_contamination` (number): Cross-domain contamination score indicating boundary blur between semantic domains

These fields are informational and do not affect core expansion processing.

## Protocol Version Awareness

The package now supports automatic schema selection based on the `protocol_version` field in raw HWP responses:

- **Version Detection**: When `protocol_version` is present in the payload, the package automatically selects the matching validation schema
- **Built-in Support**: The package includes built-in schemas for `legacy` (no version) and `0.6.2` protocol versions
- **Extensibility**: Use `registerProtocolVersion(version, schemaConfig)` to add support for new protocol versions at runtime
- **Fallback Mechanism**: Unknown versions automatically fall back to the latest known version with a warning, ensuring forward compatibility

Example usage:

```javascript
import { registerProtocolVersion, getSupportedProtocolVersions } from '@halfway-lab/question-expansion'

// Register a new protocol version
registerProtocolVersion('0.7.0', {
  fieldAliases: { /* ... */ },
  requiredFields: ['paths'],
  optionalFields: ['new_feature'],
  features: { semanticGroups: true, protocolVersion: true }
})

// Check supported versions
console.log(getSupportedProtocolVersions()) // ['0.7.0', '0.6.2', 'legacy']
```

## Audit-Only Live Log Support

For live alignment work, the package also supports extracting an audit payload from a real HWP `chain_*.jsonl` log entry.

That path is intentionally audit-only:

- it exists to validate and align real HWP output before adapter shaping is finalized
- it does not redefine the runtime raw expansion contract
- it does not make this package depend on HWP repository internals at runtime
- it may derive titles, summaries, next questions, and branch types when the live log does not expose app-ready path fields directly

## Expected Raw Request Shape

The package can also help build the request payload that an adapter sends to HWP-facing infrastructure.

Root expansion request:

```json
{
  "question": "我要不要换工作",
  "depth": 1,
  "options": {
    "max_paths": 3
  }
}
```

Nested expansion request:

```json
{
  "parent_path_id": "path-1",
  "context": {
    "parent_title": "重写问题前提",
    "parent_summary": "先检查问题设定方式。",
    "parent_next_question": "哪些前提还没检查？",
    "parent_level": 1
  },
  "depth": 2
}
```

## Supported Field Aliases

Raw HWP payloads may currently use several equivalent field names. The package normalizer accepts:

- `paths` or `expansion_paths`
- `core_question` or `coreQuestion`
- `key_tensions` or `keyTensions`
- `next_questions` or `nextQuestions`
- path `title` or `path_title`
- path `summary` or `path_summary`
- path `next_question`, `nextQuestion`, or `follow_up_question`
- path `branch_type`, `branchType`, or `path_type`
- path `blind_spot_hint`, `blindSpotHint`, or `risk_hint`
- path `unfinished_score`, `unfinishedScore`, or `open_score`
- path `tags` or `labels`
- path `tensions`, `key_tensions`, or `keyTensions`

## Validation Notes

`validateRawHwpExpansion(...)` is intentionally tolerant of forward-compatible payloads:

- unknown top-level fields are reported as `info` findings rather than hard errors
- unknown path-level fields are also reported as `info` findings to surface possible upstream protocol additions
- unknown `protocol_version` values trigger a fallback warning while continuing validation against the latest known schema
- top-level array payloads are supported for both validation and normalization

## Package API

Use:

- `buildRawHwpExpandRequest(payload)`
- `extractRawHwpAuditPayload(input, options?)`
- `normalizeRawHwpPath(rawPath, options?)`
- `normalizeRawHwpExpansion(rawResponse, options?)`
- `validateRawHwpExpansion(rawResponse, options?)`
- `summarizeRawHwpValidation(validation)`
- `buildRawHwpAuditReport(rawResponse, options?)`

These return Question Expander-facing structures, not protocol-owned HWP structures.

`validateRawHwpExpansion(...)` is useful when auditing a real live provider payload before wiring it into product logic. It reports structural findings, including non-blocking `info` findings for unknown fields, and when valid also returns the normalized product-facing shape.

`summarizeRawHwpValidation(...)` turns that audit output into a compact report object that is easier to log, surface in tooling, or attach to adapter diagnostics.

`buildRawHwpAuditReport(...)` combines validation and summarization into one audit-ready object that can be used in scripts, CI checks, or live payload debugging.
