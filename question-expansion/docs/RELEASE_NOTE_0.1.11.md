# Release Note 0.1.11

## Summary

`0.1.11` extends the package beyond final-payload normalization and validation by adding a package-owned partial streaming path contract.

This release is intended to let downstream consumers move streaming path extraction logic out of app-only code and into `@halfway-lab/question-expansion`.

## Highlights

- Added partial/streaming helpers:
  - `extractPartialRawExpansionObjects(...)`
  - `createPartialRawExpansionPath(...)`
  - `normalizePartialExpansionPath(...)`
  - `extractPartialExpansionPaths(...)`
- Exported the new partial helper surface from the main package entry
- Added TypeScript declarations for partial raw path extraction and normalization
- Added package tests covering:
  - extraction of complete path objects from streamed JSON text
  - normalization of streamed partial paths into stable product-facing paths
- Updated README and contract docs to explain the new streaming helper boundary
- Added a current-state summary document for package maintainers

## Why This Matters

Before this release, downstream apps could use the package as the authority for final raw payload normalization, but partial path extraction during streaming still lived in app-local adapter code.

With `0.1.11`, the package now owns a first-class partial path contract for streaming scenarios while still leaving transport concerns such as fetch, SSE, and callback orchestration outside the package boundary.

## Verification

- `npm test`
- `npm pack --dry-run`

## Notes

- This release does not move network streaming transport into the package
- This release does not widen the runtime contract beyond the currently supported raw expansion surface
- The new helpers are intended to reduce drift between app-local streaming behavior and package-owned final normalization
