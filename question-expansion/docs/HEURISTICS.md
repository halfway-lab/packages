# Live Branch-Type Heuristics

## Purpose

These heuristics exist only for audit-time extraction of real HWP `chain_*.jsonl` logs.

They help `@halfway-lab/question-expansion` turn non-product-ready live chain output into a Question Expander-shaped audit preview, especially when the live log does not yet expose an explicit `branch_type`.

They do **not** redefine the runtime raw HWP contract.

## Current Rules

### `premise_shift_keywords`

- Target branch type: `premise_shift`
- Keywords:
  - `assumption`
  - `premise`
  - `前提`
  - `假设`
- Intended use:
  - paths that question the framing, assumptions, or premise layer of the exploration
- Typical good fit:
  - “What assumption is being smuggled in here?”
  - “Which premise makes this question look fixed?”
- Main risk:
  - may over-trigger on abstract philosophical wording that mentions assumptions without actually proposing a premise reframing

### `hidden_variable_keywords`

- Target branch type: `hidden_variable`
- Keywords:
  - `dependency`
  - `dependencies`
  - `variable`
  - `hidden`
  - `忽略`
  - `变量`
- Intended use:
  - paths that surface unseen dependencies, latent variables, or omitted control factors
- Typical good fit:
  - “Which dependency still controls the practical outcome?”
  - “What hidden variable changes the decision?”
- Main risk:
  - can absorb paths that are really about infrastructure or systems context rather than a strictly hidden variable

### `context_link_keywords`

- Target branch type: `context_link`
- Keywords:
  - `context`
  - `jurisdiction`
  - `cross-border`
  - `coordination`
  - `情境`
  - `上下文`
- Intended use:
  - paths that connect the current question to a wider institutional or situational frame
- Typical good fit:
  - “Which jurisdiction actually governs this?”
  - “How does the cross-border setting change the question?”
- Main risk:
  - may collapse governance, policy, and context-oriented paths into one bucket even when a richer branch taxonomy would later split them apart

### `variable_temporal_keywords`

- Target branch type: `variable_temporal`
- Keywords:
  - `timeline`
  - `temporal`
  - `future`
  - `timing`
  - `时间`
- Intended use:
  - paths that primarily reopen the question through time, sequencing, or future-state change
- Typical good fit:
  - “What changes three months from now?”
  - “How does timing alter the decision?”
- Main risk:
  - may miss time-sensitive paths that imply temporal change without using explicit timing language

### `blind_spot_probe_keywords`

- Target branch type: `blind_spot_probe`
- Keywords:
  - `risk`
  - `blind spot`
  - `underexplored`
  - `oversight`
  - `盲点`
  - `风险`
- Intended use:
  - paths that mostly function as generic blind-spot discovery, without clearer evidence for another branch type
- Typical good fit:
  - “What risk is underexplored here?”
  - “Which blind spot is still unexamined?”
- Main risk:
  - this is intentionally low-confidence and can become a catch-all if more precise rules are missing

### `fallback_branch_followup`

- Target branch type: `branch_followup`
- Trigger:
  - no keyword rule matched
- Intended use:
  - safe fallback when the audit path needs a product-shaped branch type but the log text is too underspecified for stronger classification
- Main risk:
  - hides ambiguity by making many unmatched paths look equally valid, even when a better branch type may exist

## Rule Ordering

Rules are evaluated in order from top to bottom.

That means earlier rules win if multiple keyword groups could apply to the same text. The current ordering favors:

1. premise reframing
2. hidden variables / dependencies
3. context / governance linkage
4. temporal change
5. generic blind-spot language
6. fallback follow-up

## Confidence Meaning

- `high`
  - the keywords are relatively specific and usually imply the intended branch type
- `medium`
  - the rule is useful, but wording overlap with nearby categories is common
- `low`
  - the rule is broad or fallback-oriented and should be treated as provisional
- `exact`
  - reserved for cases where the live input already contains an explicit raw `branch_type`

## Maintenance Guidance

- Add a new rule only when repeated live audits show a stable pattern that current rules collapse poorly.
- Prefer narrower keywords over broader ones.
- Update tests when a new rule changes the winning branch type for existing fixtures.
- Treat this file and `src/contracts/liveBranchTypeHeuristics.js` as a pair: one explains intent, the other defines execution.
