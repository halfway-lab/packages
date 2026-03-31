# Question Expansion Package Status

## Basic Info

- Project name: question-expansion
- Current path: `/Users/mac/Documents/Halfway-Lab/packages/question-expansion`
- Repo type: package inside the Halfway-Lab workspace
- Maintainer role: product-domain package
- Current package version:
  - `0.1.1`
- Relationship to HWP:
  - downstream interpretation layer for Question Expander
  - not a protocol source of truth
  - real upstream protocol repo is `halfway-lab/HWP`

## Purpose

- What this project is for:
  - package-oriented Question Expander interpretation logic
- Primary users:
  - `apps/question-expander`
  - future package or app consumers that need Question Expander domain contracts
- Why it exists separately:
  - product-domain transformation logic should stay out of app-only UI code and out of protocol-core

## Current Scope

- Main features:
  - package exports in `src/index.js`
  - branch-type helpers
  - early package boundary for expansion-oriented shaping
- Out-of-scope items:
  - protocol-core execution ownership
  - app UI
- Current maturity:
  - working `v0.1.1` package boundary
  - raw HWP contract scaffold is now used by the app HWP client and mock adapter
  - app adapters now return raw payloads while `hwpClient` owns raw-to-product normalization
  - first live HWP benchmark chain-log audit path is now implemented
  - live branch-type heuristics are now isolated into a dedicated strategy module and documented separately

## Entry Points

- Main README: `README.md`
- Main package entry:
  - `src/index.js`
  - `package.json`
- Main test entry:
  - `npm test`
- Main contract doc:
  - `docs/HWP_CONTRACT.md`
- Main audit doc:
  - `docs/AUDIT_WORKFLOW.md`

## Directory Notes

- Important directories:
  - `src/`
  - `docs/`
- Generated directories:
  - none confirmed in current quick scan
- Sensitive/local-only files:
  - none confirmed in current quick scan

## Current Commands

- Install:
  - no lockfile-driven install flow documented yet
- Dev:
  - no dedicated script declared in `package.json`
- Build:
  - no dedicated build script declared in `package.json`
- Test:
  - `npm test`
- Audit:
  - `npm run audit:raw-hwp -- ./path/to/payload.json`
  - `npm run audit:raw-hwp -- ./path/to/chain_*.jsonl`
- Verify:
  - package self-test plus downstream integration checks in `apps/question-expander`

## Current Risks

- Known issues:
  - runtime app integration still depends on adapter-shaped raw payloads rather than direct live chain-log ingestion
- Migration risks:
  - Question Expander logic could drift back into app-only code if this package boundary is not maintained
- Path or config coupling:
  - current package direction still assumes close coordination with `apps/question-expander`
  - live audit extraction intentionally knows about chain-log shape, but only inside the audit path

## Next Development Step

- Highest-priority next task:
  - prepare the next release cut, including MIT license metadata and a tighter release-quality pass
- What should happen right after package-boundary changes:
  - confirm Question Expander app integration still matches the package contract

## Notes

- This package belongs in the root `packages/` area, not under `protocol/HWP/packages`.
