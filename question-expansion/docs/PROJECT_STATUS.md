# Question Expansion Package Status

## Basic Info

- Project name: question-expansion
- Current path: `/Users/mac/Documents/Halfway-Lab/packages/question-expansion`
- Repo type: package inside the Halfway-Lab workspace
- Maintainer role: product-domain package
- Current package version:
  - `0.1.0`
- Relationship to HWP:
  - downstream interpretation layer for Question Expander
  - not a protocol source of truth

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
  - working `v0.1.0` package boundary

## Entry Points

- Main README: `README.md`
- Main package entry:
  - `src/index.js`
  - `package.json`
- Main test entry:
  - `npm test`

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
- Verify:
  - package self-test plus downstream integration checks in `apps/question-expander`

## Current Risks

- Known issues:
  - package remains close to the app and does not yet have a dedicated raw HWP contract
- Migration risks:
  - Question Expander logic could drift back into app-only code if this package boundary is not maintained
- Path or config coupling:
  - current package direction still assumes close coordination with `apps/question-expander`
  - raw HWP-oriented contract shaping is still incomplete

## Next Development Step

- Highest-priority next task:
  - define a dedicated raw HWP interpretation contract for Question Expander
- What should happen right after package-boundary changes:
  - confirm Question Expander app integration still matches the package contract

## Notes

- This package belongs in the root `packages/` area, not under `protocol/HWP/packages`.
