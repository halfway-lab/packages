# Raw HWP Audit Report

- Valid: yes
- Errors: 0
- Warnings: 0
- Summary: Raw HWP payload valid.
- Source kind: hwp_chain_log_entry
- Extraction mode: derived_for_audit
- Question: How do digital identity sovereignty models challenge centralized state authority?
- Path count: 3
- Branch types: hidden_variable, branch_followup

## Key Tensions

- Digital identity autonomy vs. state security imperatives
- Climate migration protection vs. border sovereignty claims
- Algorithmic efficiency vs. meaningful human oversight

## Next Questions

- Developing enforceable transnational corporate accountability mechanisms
- Reconciling indigenous knowledge systems with scientific policy frameworks
- Designing democratic oversight for autonomous weapons systems

## Path Preview

- Assumes digital identity sovereignty can be achieved without addressing underlying infrastructure dependencies [hidden_variable]
  Next: Analyze material foundations of digital identity sovereignty
  Blind spot: Assumes digital identity sovereignty can be achieved without addressing underlying infrastructure dependencies
  Heuristic: Rule: hidden_variable_keywords | confidence=high | keywords=dependencies
- Neglects informal protection networks that operate outside formal climate migration frameworks [branch_followup]
  Next: Map hybrid formal-informal protection ecosystems for climate migrants
  Blind spot: Neglects informal protection networks that operate outside formal climate migration frameworks
  Heuristic: Rule: fallback_branch_followup | confidence=low
- Treats multispecies justice as additive rather than transformative of policy epistemology [branch_followup]
  Next: Develop epistemic frameworks for non-human perspective integration
  Blind spot: Treats multispecies justice as additive rather than transformative of policy epistemology
  Heuristic: Rule: fallback_branch_followup | confidence=low

## Extraction Notes

- Derived path count: 3
- Question sources: questions[0]
- Next-question sources: unfinished[]
- round_8-path-1: derived title, summary, next_question, branch_type (inferred: hidden_variable; rule=hidden_variable_keywords; confidence=high; keywords=dependencies)
- round_8-path-2: derived title, summary, next_question, branch_type (inferred: branch_followup; rule=fallback_branch_followup; confidence=low)
- round_8-path-3: derived title, summary, next_question, branch_type (inferred: branch_followup; rule=fallback_branch_followup; confidence=low)

## Meta

```json
{
  "source_kind": "hwp_chain_log_entry",
  "extraction_mode": "derived_for_audit",
  "derived_fields": {
    "question": [
      "questions[0]"
    ],
    "core_question": [
      "questions[0]"
    ],
    "key_tensions": [
      "tensions[].description"
    ],
    "next_questions": [
      "unfinished[]"
    ],
    "paths": [
      {
        "index": 0,
        "id": "round_8-path-1",
        "derived": {
          "title": true,
          "summary": true,
          "next_question": true,
          "branch_type": true
        },
        "branch_type_source": "inferred",
        "branch_type": "hidden_variable",
        "heuristic": {
          "rule_id": "hidden_variable_keywords",
          "matched_keywords": [
            "dependencies"
          ],
          "confidence": "high"
        }
      },
      {
        "index": 1,
        "id": "round_8-path-2",
        "derived": {
          "title": true,
          "summary": true,
          "next_question": true,
          "branch_type": true
        },
        "branch_type_source": "inferred",
        "branch_type": "branch_followup",
        "heuristic": {
          "rule_id": "fallback_branch_followup",
          "matched_keywords": [],
          "confidence": "low"
        }
      },
      {
        "index": 2,
        "id": "round_8-path-3",
        "derived": {
          "title": true,
          "summary": true,
          "next_question": true,
          "branch_type": true
        },
        "branch_type_source": "inferred",
        "branch_type": "branch_followup",
        "heuristic": {
          "rule_id": "fallback_branch_followup",
          "matched_keywords": [],
          "confidence": "low"
        }
      }
    ]
  },
  "round": 8,
  "round_id": "round_8",
  "node_id": "n_20260302_r8",
  "parent_id": "n_20260302_r7",
  "continuity_score": 0.6666666666666666,
  "blind_spot_score": 0.54,
  "provider": "bailian",
  "model": "qwen3-max-2026-01-23",
  "session_id": "hwp_1772451330_20939"
}
```
