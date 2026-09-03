import { describe, expect, it, vi } from "vitest";
import { SignWiseApp } from "../src/application/signWiseApp";
import { fixtureAgreement } from "../src/data/fixtureAgreement";

const findingInput = {
  clauseId: "indemnity",
  severity: "critical" as const,
  title: "One-sided indemnity",
  explanation: "The customer bears claims even when the supplier contributed to the loss.",
  recommendation: "Request mutual, fault-based indemnity language before signing.",
};

function preparedApp() {
  const app = new SignWiseApp(fixtureAgreement, () => new Date("2026-09-04T00:00:00.000Z"));
  app.setView("review");
  const finding = app.flagClause(findingInput);
  if (!finding.ok) throw new Error(finding.error.message);
  const proposal = app.proposeReview({ summary: "The indemnity shifts unusually broad risk to Meridian Labs.", recommendation: "Request changes before signing.", findingIds: [finding.result.finding.id] });
  if (!proposal.ok) throw new Error(proposal.error.message);
  return { app, proposal };
}

describe("SignWiseApp", () => {
  it("returns metadata separately from untrusted clause text", () => {
    const app = new SignWiseApp(fixtureAgreement);
    const info = app.getAgreement();
    expect(info.ok && info.result.clauseCount).toBe(6);
    expect(JSON.stringify(info)).not.toContain("Customer shall defend");
    const clauses = app.listClauses();
    expect(clauses.ok && clauses.result.clauses.map(({ id }) => id)).toContain("indemnity");
    const clause = app.readClause({ clauseId: "indemnity" });
    expect(clause.ok && clause.result.clause.text).toContain("including claims caused");
    expect(app.readClause({ clauseId: "missing" })).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("allows findings only in the live review workspace and rejects duplicates", () => {
    const app = new SignWiseApp(fixtureAgreement);
    expect(app.flagClause(findingInput)).toMatchObject({ ok: false, error: { code: "INVALID_STATE" } });
    app.setView("review");
    expect(app.flagClause(findingInput)).toMatchObject({ ok: true });
    expect(app.getSnapshot().workspace.activeClauseId).toBe("indemnity");
    expect(app.flagClause(findingInput)).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
  });

  it("requires exact human approval before recording and publishes synchronously", () => {
    const { app, proposal } = preparedApp();
    const reviewId = proposal.result.draft.id;
    expect(app.recordApprovedReview({ reviewId })).toMatchObject({ ok: false, error: { code: "INVALID_STATE" } });
    const subscriber = vi.fn();
    app.subscribe(subscriber);
    expect(app.approveReview({ draftId: reviewId })).toMatchObject({ ok: true, result: { draft: { status: "approved" } } });
    const recorded = app.recordApprovedReview({ reviewId });
    expect(recorded).toMatchObject({ ok: true, result: { signatureReadiness: "ready_for_human_signature" } });
    expect(app.getSnapshot()).toMatchObject({ workspace: { view: "certificate" }, draft: { status: "recorded" }, certificate: { agreementFingerprint: fixtureAgreement.fingerprint } });
    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(app.recordApprovedReview({ reviewId })).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
  });

  it("revokes approval when the human edits the proposed review", () => {
    const { app, proposal } = preparedApp();
    const reviewId = proposal.result.draft.id;
    app.approveReview({ draftId: reviewId });
    const edited = app.editReview({ draftId: reviewId, summary: "Updated human-edited summary.", recommendation: "Escalate this clause to counsel." });
    expect(edited).toMatchObject({ ok: true, result: { draft: { revision: 2, approvedRevision: null, status: "pending" } } });
    expect(app.recordApprovedReview({ reviewId })).toMatchObject({ ok: false, error: { code: "INVALID_STATE" } });
  });

  it("bounds the visible tool activity feed", () => {
    const app = new SignWiseApp(fixtureAgreement);
    for (let index = 0; index < 45; index += 1) app.startToolActivity({ toolName: "read_clause", argumentSummary: `${index}` });
    expect(app.getSnapshot().activities).toHaveLength(40);
    expect(app.getSnapshot().activities[0].argumentSummary).toBe("44");
  });
});
