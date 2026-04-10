# Current State And Next Steps

## Snapshot

- Package: `@halfway-lab/question-expansion`
- Current version: `0.1.10`
- Published npm version: `0.1.10`
- Workspace status: package-only cleanup and contract alignment complete for this round

## What Was Strengthened In This Round

- The raw expansion contract now formally accepts neutral aliases such as:
  - `sessionId` / `session_id`
  - `openQuestions` / `open_questions`
  - `nextSteps` / `next_steps`
  - `parentId` / `parent_id`
- TypeScript exports now expose neutral public aliases alongside legacy HWP-oriented names
- Request-building types are tighter, including explicit request input, nested context, and request option surfaces
- Audit entry points now accept a clearly typed audit input surface:
  - raw expansion payloads
  - chain-log style wrapper payloads with `payloads` and optional `meta.agentMeta`
- Metadata and protocol typing now distinguish known fields from extension slots instead of relying on one broad object type
- Validator coverage now includes quality warnings for structurally usable but suspicious content
- README and contract docs now reflect the same runtime and TypeScript surface

## What Feels Stable

- Product-facing normalization into stable Question Expander path structures
- Schema-aware validation with protocol-version fallback
- Forward-compatible alias handling for raw payload fields
- Audit extraction and report building for live `chain_*.jsonl` inputs
- Public TypeScript surface for normalized payloads, audit inputs, request inputs, and runtime helper maps
- Package self-tests

## What Is Still Intentionally Provisional

- Audit-time derivation from live chain logs
- Heuristic branch-type inference when live logs do not expose explicit `branch_type`
- Expansion-protocol evolution beyond the currently documented `legacy` and `0.6.2` schema assumptions
- Some metadata and wrapper shapes still keep extension slots for forward compatibility

## Current Boundary

This package should continue to own:

- raw-to-product contract normalization
- Question Expander path semantics
- validation and audit helpers
- session/view-model shaping helpers that belong to the package boundary

This package should not grow into:

- app UI ownership
- protocol execution ownership
- transport-specific adapter logic
- direct dependency on upstream repository internals

## Recommended Next Steps

1. Observe real adapter payload drift and only widen the runtime contract when a concrete upstream payload requires it.
2. Keep release notes current when public package surface changes.
3. If a new protocol version appears, add it through `registerProtocolVersion(...)` plus fixture coverage before widening the default schema.
4. Treat live audit heuristics as evidence-driven: only change the rule table when real payloads show a repeatable mismatch.
5. Prefer documentation or release-quality cleanup over more type tightening unless a real consumer pain point appears.

## Good Pause Point

This is a reasonable place to stop active surface expansion for now.

The package already has:

- a published npm release
- a clearer neutral raw-expansion contract
- stronger typed package APIs
- better validator diagnostics
- an audit story for real live inputs
- aligned README and contract documentation

The next work should be driven by real upstream drift, release needs, or downstream consumer feedback rather than speculative surface growth.
