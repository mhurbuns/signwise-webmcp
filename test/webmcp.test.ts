import { describe, expect, it } from "vitest";
import { SignWiseApp } from "../src/application/signWiseApp";
import { fixtureAgreement } from "../src/data/fixtureAgreement";
import { createDesiredToolDefinitions } from "../src/webmcp/toolDefinitions";

const names = (app: SignWiseApp) => createDesiredToolDefinitions(app, app.getSnapshot(), () => 10).map(({ name }) => name);

describe("WebMCP tool contract", () => {
  it("changes from stable to review to exact-approval tools", () => {
    const app = new SignWiseApp(fixtureAgreement);
    expect(names(app)).toEqual(["get_agreement", "list_clauses", "read_clause", "get_review_workspace"]);
    app.setView("review");
    expect(names(app)).toEqual(["get_agreement", "list_clauses", "read_clause", "get_review_workspace", "flag_clause", "propose_review"]);
  });

  it("never exposes signing or signer acknowledgment tools", () => {
    const app = new SignWiseApp(fixtureAgreement);
    app.setView("review");
    expect(names(app).join(" ")).not.toMatch(/sign|acknowledge|accept|consent/i);
  });

  it("returns a continuation reference and records only stored approved content", async () => {
    const app = new SignWiseApp(fixtureAgreement, () => new Date("2026-09-04T00:00:00.000Z"));
    app.setView("review");
    const tools = createDesiredToolDefinitions(app, app.getSnapshot(), () => 10);
    const flag = tools.find(({ name }) => name === "flag_clause")!;
    const flagged = await flag.execute({ clauseId: "indemnity", severity: "critical", title: "One-sided indemnity", explanation: "Customer covers claims even when the supplier contributed.", recommendation: "Request balanced, fault-based language." }, { signal: new AbortController().signal }) as { result: { finding: { id: string } } };
    const propose = tools.find(({ name }) => name === "propose_review")!;
    const proposed = await propose.execute({ summary: "A consequential indemnity risk requires review.", recommendation: "Request changes before signing.", findingIds: [flagged.result.finding.id] }, { signal: new AbortController().signal }) as { result: { draft: { id: string }, continuation: { proposalReference: string } } };
    expect(proposed.result.continuation.proposalReference).toBe(proposed.result.draft.id);
    app.approveReview({ draftId: proposed.result.draft.id });
    expect(names(app)).toContain("record_approved_review");
    const complete = createDesiredToolDefinitions(app, app.getSnapshot(), () => 10).find(({ name }) => name === "record_approved_review")!;
    const result = await complete.execute({ reviewId: proposed.result.continuation.proposalReference }, { signal: new AbortController().signal });
    expect(result).toMatchObject({ ok: true, result: { signatureReadiness: "ready_for_human_signature" } });
    expect(app.getSnapshot().workspace.view).toBe("certificate");
    expect(names(app)).toEqual(["get_agreement", "list_clauses", "read_clause", "get_review_workspace"]);
  });

  it("marks contract outputs untrusted and read tools read-only", () => {
    const app = new SignWiseApp(fixtureAgreement);
    const tools = createDesiredToolDefinitions(app, app.getSnapshot(), () => 10);
    for (const tool of tools) expect(tool.annotations).toMatchObject({ untrustedContentHint: true, readOnlyHint: true });
  });
});
