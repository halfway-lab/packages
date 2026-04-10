# Release Note 0.1.12

## Summary

`0.1.12` upgrades `@halfway-lab/question-expansion` from a final-payload normalization package into a package that also owns the core streaming contract used by Question Expander-style apps.

This release does not move transport into the package, but it does add package-owned helpers for:

- partial path extraction from streamed JSON text
- partial-path normalization aligned with final normalization
- streaming callback and event contracts
- package-owned runtime helpers for applying partial paths into tree state

## Highlights

- Added partial streaming helpers:
  - `extractPartialRawExpansionObjects(...)`
  - `createPartialRawExpansionPath(...)`
  - `normalizePartialExpansionPath(...)`
  - `extractPartialExpansionPaths(...)`
- Hardened partial extraction behavior:
  - supports `paths` and `expansion_paths`
  - exposes `maxObjects` instead of relying on an undocumented scan cap
  - preserves more raw fields to reduce drift with final normalization
- Added streaming callback and event contract types:
  - `RawExpansionStreamCallbacks`
  - `RawExpansionStreamEvent`
- Added runtime streaming event helpers:
  - `createContentChunkEvent(...)`
  - `createPartialPathEvent(...)`
  - `createThinkingChunkEvent(...)`
  - `createFinalPayloadEvent(...)`
  - `dispatchRawExpansionStreamEvent(...)`
- Added package-owned partial tree update helper:
  - `applyPartialPathsToTreeState(...)`
- Expanded tests to cover:
  - partial extraction alias handling
  - partial/final normalization consistency
  - runtime stream event dispatch
  - streamed path insertion/update into tree state

## Why This Matters

Before `0.1.12`, downstream apps could rely on the package for final raw payload normalization, but most streaming behavior still lived only in app-local code.

With `0.1.12`, the package now owns a clearer streaming contract layer while still preserving the boundary that keeps fetch/SSE/network handling outside the package.

## Verification

- `npm test`
- `npm pack --dry-run`

## Notes

- Transport remains app/adapter-owned
- This release is focused on contract and runtime helper alignment, not protocol widening
- The goal is to reduce drift between streamed partial behavior and final package normalization
