# Native Site Tools Demo Runbook

## Setup

1. Run `npm run dev -- --host 127.0.0.1` or open the deployed HTTPS URL.
2. In the latest ChatGPT desktop app, enable **Browser → Permissions → Enable site tools**.
3. Use GPT-5.6 Sol or Terra. Use ChatGPT Work or Codex without Full access so the agent cannot bypass the page with terminal/filesystem tools.
4. Reload SignWise. Confirm **Awaiting your signature**, no findings, and **WebMCP ready · 4 tools**.

## Rehearsal

1. Click **Open review workspace**. Confirm the count changes to 6.
2. Send:

   > Review the agreement currently open on this page. Identify the terms with the greatest financial or legal impact, show the evidence beside each clause, and prepare a concise risk review. Do not acknowledge terms, accept, or sign anything for me.

3. Watch the activity feed and findings appear. Confirm the signature block still says signing is human-only.
4. Review the proposal. Optionally edit and save it to demonstrate approval revocation.
5. Click **Approve review**. Confirm the count changes to 7 while no signing action occurs.
6. Send `Approved.`
7. Confirm the Review record view appears, the fingerprint is visible, and the tool count returns to 4.
8. Click **Continue to signature** yourself and confirm the page explicitly describes it as a human action.

## Evidence capture

- app URL, selected model, and ChatGPT version
- count sequence `4 → 6 → 7 → 4`
- ordered in-page activity trace
- visible clause findings and proposal content
- agreement fingerprint and recorded revision
- browser console errors
- automated verification output

The injected Playwright `document.modelContext` harness proves UI behavior, tool lifecycle, and mutation timing. It is not a substitute for one final native ChatGPT Site tools run.
