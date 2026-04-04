# Release Readiness

## Current State

- Local package version: `0.1.7`
- Published npm version: `0.1.1`
- Package test status: passing
- Live audit workflow: implemented
- Heuristic rule table: separated into its own module
- Heuristic rule notes: documented
- Raw HWP validation coverage: includes schema-aware unknown-field auditing at top-level and path-level

## What Feels Stable

- raw HWP request shaping
- raw HWP response normalization
- schema-aware raw HWP validation
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
4. package metadata is complete for the next publish, including license

## Recommended Next Version Scope

Target next version: `0.1.7`

Suggested contents:

- publish `0.1.7`
- include validator consistency fixes for array payloads and schema aliases
- include v0.6.2 informational field alignment for `group_count` and `cross_domain_contamination`
- include path-level unknown field audit findings
- keep the current heuristic table unless new live payload evidence requires another rule split
- avoid widening the runtime contract unless the real adapter payload is ready

## Why It Is Reasonable To Pause Here

This package now has:

- a clear product-domain boundary
- a published npm package
- a real live-audit story
- stronger schema-aware validation coverage
- documented heuristic rules
- stable self-tests

That is enough structure to stop expanding surface area and move into release-quality cleanup for the next version.
