# Halfway-Lab Packages

This directory is the source-of-truth home for reusable packages in the current Halfway-Lab workspace.

## Current Rule

- reusable package code lives in `/Users/mac/Documents/Halfway-Lab/packages`
- protocol-core code lives in `/Users/mac/Documents/Halfway-Lab/protocol/HWP`
- app code lives in `/Users/mac/Documents/Halfway-Lab/apps`
- demo/prototype code lives in `/Users/mac/Documents/Halfway-Lab/demos`

Do not reintroduce active package source under `protocol/HWP/packages`.

## Current Packages

### `reading-note`

- stable package boundary around HWP-backed reading-note processing
- consumed by downstream apps such as Half Note

### `question-expansion`

- `v0.1.0` product interpretation layer for Question Expander
- owns Question Expander-specific path contracts, overviews, session artifacts, and history-facing view models
- remains parallel to `reading-note`, not layered on top of it

## Monorepo Shape

- root workspace config lives in `package.json`
- package source lives in `reading-note/` and `question-expansion/`
- each package owns its own README, package metadata, and tests
