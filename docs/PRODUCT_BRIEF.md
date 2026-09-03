# Product Brief

## Working concept

SignWise is an independent agreement-review workspace inspired by e-signature products. It demonstrates how an AI agent can investigate the exact contract open in a live webpage, place evidence beside consequential clauses, and prepare a review while the human retains every consent and signing decision.

The app deliberately uses a local fixture agreement. It is not affiliated with Adobe, does not connect to Acrobat Sign, and does not provide legal advice.

## Problem

Electronic signing makes the final click easy, but consequential fine print can still be hard to notice. A general chat agent may summarize a document, but it normally does not share the signer’s live page state, selected clause, pending review, or signature gate.

## WebMCP advantage

The webpage contributes the context that makes collaboration useful:

- exact active agreement and stable fingerprint
- the review view the human opened
- the selected clause and visible findings
- an editable, unsaved review proposal
- exact-revision human approval
- immediate in-page review record and human-only next step

The agent’s activity visibly changes the same page the signer is examining. Dynamic tools make the authorization boundary legible: 4 stable tools, 6 while reviewing, 7 after exact approval, and 4 after the review is recorded.

## Canonical interaction

1. The signer opens the fixture Master Services Agreement.
2. The signer opens **Review with agent**, enabling contextual review tools.
3. The agent reads clauses, identifies substantiated risks, and adds visible findings.
4. The agent prepares a concise review proposal; nothing is signed or accepted.
5. The human may edit, dismiss, or approve the proposal.
6. Approval authorizes only the exact stored revision and exposes one completion capability.
7. After the human says “Approved,” the agent records the approved review.
8. The page shows the version-bound demonstration record and enables a human-only **Continue to signature** button.

## Non-goals

- real PDF parsing or document upload
- legal advice or automated legal scoring
- real e-signature or Adobe integration
- agent-driven acknowledgment, consent, acceptance, or signing
- production authentication, persistence, or cryptography
