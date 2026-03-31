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

- early package boundary for Question Expander interpretation logic
- intended to keep product-domain transformation logic out of app-only code and out of protocol-core
