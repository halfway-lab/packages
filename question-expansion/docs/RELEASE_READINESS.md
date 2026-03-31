# Release Readiness

## Current State

- Local package version: `0.1.1`
- Published npm version: `0.1.1`
- Package test status: passing
- Live audit workflow: implemented
- Heuristic rule table: separated into its own module
- Heuristic rule notes: documented

## What Feels Stable

- raw HWP request shaping
- raw HWP response normalization
- live `chain_*.jsonl` audit extraction
- audit report generation
- markdown audit output
- branch-type heuristic table and rule explanations

## What Is Still Intentionally Provisional

- live audit extraction from HWP chain logs
- heuristic branch-type inference for paths that do not expose explicit `branch_type`
- app-side dependency on adapter-shaped raw payloads rather than direct live-provider alignment

## Pre-Release Checks For The Next Version

Before the next publish, confirm:

1. `npm test` passes in `packages/question-expansion`
2. `npm run test:run` still passes in `apps/question-expander`
3. `npm_config_cache=/tmp/question-expansion-npm-cache npm pack --dry-run` succeeds
4. package metadata is complete for the next publish

## Recommended Next Version Scope

Target next version: `0.1.2`

Suggested contents:

- add `license: "MIT"` to `package.json`
- add a `LICENSE` file
- keep the current heuristic table unless new live payload evidence requires another rule split
- avoid widening the runtime contract unless the real adapter payload is ready

## Why It Is Reasonable To Pause Here

This package now has:

- a clear product-domain boundary
- a published npm package
- a real live-audit story
- documented heuristic rules
- stable self-tests

That is enough structure to stop expanding surface area and move into release-quality cleanup for the next version.
