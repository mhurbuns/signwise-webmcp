# Devpost Submission Draft

- Live demo: https://signwise-webmcp.mhurbuns.workers.dev
- Public repository: https://github.com/mhurbuns/signwise-webmcp

## Title

SignWise — Human-aware agreement review through WebMCP

## One-line description

A WebMCP-enabled signing workspace where an AI surfaces risky clauses in the live agreement while consent and signature authority remain explicitly human.

## Inspiration

Electronic signing optimized the final click, but not necessarily informed review. Dense renewal, indemnity, and liability terms remain easy to overlook. We wanted an agent to help where the decision happens without ever impersonating the signer.

## What it does

SignWise gives an agent structured access to the fixture agreement currently open in the page. The agent reads individual clauses, adds evidence-linked findings to the document, and prepares an editable review. The human can change, dismiss, or approve that exact revision. Only then can the agent record the approved review. The final signature action remains a direct human control with no agent tool.

## Why WebMCP

A detached API can fetch a contract, but it does not naturally own the signer’s current page, selected clause, unsaved proposal, verified tool surface, or local signature gate. SignWise exposes capabilities from that live state and makes the collaboration visible. Its tool count changes from 4 to 6 to 7 and back to 4 as context and authorization change.

## How we built it

React, TypeScript, Vite, local fixture data, a framework-independent observable application service shared by React and WebMCP, contextual `document.modelContext` registration, Vitest unit tests, and Playwright browser tests.

## Safety and trust

The agent may inspect, explain, annotate, and prepare. It may not acknowledge clauses, accept terms, or sign for the user. Agreement and agent text are untrusted; approval is exact-revision; edits revoke it; completion uses stored content and is exactly-once. The app labels its output as AI-generated and not legal advice.

## Challenges and lessons

The hardest part was separating useful agent action from legal intent. We learned that WebMCP is strongest when the webpage contributes transient context and authorization—not when it merely wraps a remote API.

## What’s next

Real document parsing, organization-specific policy checks, redline suggestions, signer-side identity, version invalidation, and an authorized e-signature sandbox integration.

## Disclosure

SignWise is an independent competition prototype using local fixture data. It is not affiliated with or endorsed by Adobe and does not connect to Acrobat Sign.
