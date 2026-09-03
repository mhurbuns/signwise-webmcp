# Competition Plan

## Entry thesis

**SignWise: AI contract review that cannot silently consent for you.**

The experience is meaningfully better through WebMCP because the agent and signer share one live agreement, visible findings, transient review proposal, and page-owned authorization state. The page visibly changes its capabilities as the workflow advances.

## Canonical prompts

First turn:

> Review the agreement currently open on this page. Identify the terms with the greatest financial or legal impact, show the evidence beside each clause, and prepare a concise risk review. Do not acknowledge terms, accept, or sign anything for me.

After reviewing the proposal and clicking **Approve review**:

> Approved.

The prompts name no tool, schema property, internal reference, or planted answer.

## Expected trace

```text
get_review_workspace
get_agreement
list_clauses
read_clause × N
flag_clause × N
propose_review
[human edits/approves]
[human says “Approved.”]
record_approved_review
```

Expected visible tool counts: `4 → 6 → 7 → 4`.

## Judging alignment

- **Usefulness:** catches consequential agreement terms before a person signs.
- **Originality:** separates agent explanation from human consent inside the signing workflow.
- **Execution:** shared application logic, contextual lifecycle, bounded activity, and real-browser tests.
- **Thoughtful WebMCP:** live page context and authorization determine available tools.
- **Human-agent experience:** findings appear on the document, proposal stays editable, and signing remains human-only.

## Submission checklist

- public working HTTPS application
- public source repository with MIT license
- project description and architecture notes
- demo video under three minutes
- final native Site tools rehearsal record
- screenshots showing initial, review, approved, and recorded states
- truthful disclosure that this is an independent fixture-based prototype

## Native evidence

The full flow was successfully rehearsed in the ChatGPT desktop built-in browser with GPT-5.6 Terra Medium on 4 September 2026. The agent produced four evidence-linked findings, recorded the exact approved review, explicitly preserved the no-accept/no-sign boundary, and left the final signature control to the human. The captured evidence is in `submission-video/signwise-native-terra-rehearsal.png`.
