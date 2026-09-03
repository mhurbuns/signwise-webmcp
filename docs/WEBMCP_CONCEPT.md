# WebMCP Concept

WebMCP lets the page expose structured tools to an agent alongside the interface a person is already using. SignWise registers imperative JavaScript tools on `document.modelContext` in the top-level page and keeps browser-specific behavior isolated in `src/webmcp/`.

## Tool surface

Stable read-only tools:

- `get_agreement`
- `list_clauses`
- `read_clause`
- `get_review_workspace`

Only while the Review workspace is open:

- `flag_clause`
- `propose_review`

Only while the exact current review revision is human-approved:

- `record_approved_review`

There is intentionally no tool for signing, accepting, consent, clause acknowledgment, or clicking **Continue to signature**.

## Trust model

Agreement text and agent-authored findings are untrusted data. Tool annotations communicate that fact, React renders text with normal escaping, and the activity feed stores bounded summaries rather than contract contents.

Tool visibility is not authorization. Every mutation revalidates live application state. Approval stores the current proposal revision; any edit clears it. `record_approved_review` accepts only a machine-facing reference and reads the approved content from application state. It rejects missing approval and duplicate execution.

## Current browser contract

The implementation follows the official Site tools guidance checked on 4 September 2026:

- feature-detect `document.modelContext.registerTool`
- register JavaScript tools in the top-level page
- use narrow JSON Schemas and explicit side-effect descriptions
- preserve the ordinary interface when WebMCP is unavailable
- use the application’s existing validation and permissions

The adapter also uses `getTools()` to verify the page-observed contextual surface and abort signals to remove tools as state changes.

Official references:

- <https://learn.chatgpt.com/docs/webmcp>
- <https://openai.com/webmcp-challenge/>
