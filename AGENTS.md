# AGENTS.md

## Project

SignWise is an independent WebMCP competition prototype for an e-signature review workflow. It uses local fixture data and is not affiliated with Adobe.

Before architectural or product changes, read:

- `docs/PRODUCT_BRIEF.md`
- `docs/WEBMCP_CONCEPT.md`
- `docs/ARCHITECTURE.md`
- `docs/COMPETITION_PLAN.md`

## Product boundary

The agent may inspect agreement data, add visible evidence-backed findings, and prepare a review. It must never sign, accept, consent to, or acknowledge contractual terms for the human. Human approval applies only to the exact current review revision; editing revokes approval.

## Architecture rules

- React and WebMCP use the same `SignWiseApp` application service.
- Experimental browser APIs stay under `src/webmcp/`.
- Contract text and agent-authored text are untrusted content.
- All mutations validate current page state in the application layer.
- State changes must be visible before a WebMCP callback resolves.
- Keep the project client-only with fixture data for the competition demo.
- Do not claim a real Adobe integration, legal advice, digital signing, or cryptographic certification.

## Verification

For substantive changes run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`, and `npm run build`. Rehearse the native Site tools flow in `docs/DEMO_RUNBOOK.md` before submission.

## Parallel agents

For a substantial release audit, delegate independent read-heavy checks to the project agents: `webmcp_reviewer`, `consent_reviewer`, and `demo_producer`. Keep concurrent code edits under the primary agent to avoid conflicts.
