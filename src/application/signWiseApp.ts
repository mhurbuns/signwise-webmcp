import type {
  Agreement,
  AppResult,
  ErrorCode,
  ReviewCertificate,
  Severity,
  SignWiseSnapshot,
  WorkspaceView,
} from "../domain/types";

type Listener = () => void;
type Clock = () => Date;

const success = <T>(result: T): AppResult<T> => ({ ok: true, result });
const failure = (code: ErrorCode, message: string): AppResult<never> => ({ ok: false, error: { code, message } });
const severities: readonly Severity[] = ["critical", "high", "medium", "low"];

function boundedText(value: string, name: string, max: number) {
  const text = value.trim();
  return text.length > 0 && text.length <= max
    ? success(text)
    : failure("INVALID_ARGUMENT", `${name} must contain 1 to ${max} characters.`);
}

export class SignWiseApp {
  private readonly listeners = new Set<Listener>();
  private nextFindingId = 1;
  private nextDraftId = 1;
  private nextActivityId = 1;
  private snapshot: SignWiseSnapshot = {
    workspace: { view: "agreement", activeClauseId: null },
    findings: [],
    draft: null,
    certificate: null,
    activities: [],
    webMcp: { status: "checking", discoveredToolNames: [], message: null },
  };

  constructor(private readonly agreement: Agreement, private readonly clock: Clock = () => new Date()) {}

  readonly subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = () => this.snapshot;

  private publish(next: SignWiseSnapshot) {
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }

  setView(view: WorkspaceView) {
    if (view === "certificate" && !this.snapshot.certificate) return failure("INVALID_STATE", "No review certificate has been recorded.");
    this.publish({ ...this.snapshot, workspace: { ...this.snapshot.workspace, view } });
    return success(this.snapshot.workspace);
  }

  selectClause(clauseId: string) {
    if (!this.agreement.clauses.some(({ id }) => id === clauseId)) return failure("NOT_FOUND", "Clause was not found in this agreement.");
    this.publish({ ...this.snapshot, workspace: { ...this.snapshot.workspace, activeClauseId: clauseId } });
    return success(this.snapshot.workspace);
  }

  getAgreement() {
    const { clauses, ...metadata } = this.agreement;
    return success({ ...metadata, clauseCount: clauses.length, findingCount: this.snapshot.findings.length, reviewStatus: this.snapshot.draft?.status ?? "not_started" });
  }

  listClauses() {
    return success({ clauses: this.agreement.clauses.map(({ id, number, title, page }) => ({ id, number, title, page })) });
  }

  readClause(input: { clauseId: string }) {
    const clause = this.agreement.clauses.find(({ id }) => id === input.clauseId.trim());
    return clause ? success({ clause }) : failure("NOT_FOUND", `Clause not found: ${input.clauseId}`);
  }

  getReviewWorkspace() {
    return success({
      agreementId: this.agreement.id,
      view: this.snapshot.workspace.view,
      activeClauseId: this.snapshot.workspace.activeClauseId,
      findingCount: this.snapshot.findings.length,
      draftStatus: this.snapshot.draft?.status ?? null,
      certificateRecorded: Boolean(this.snapshot.certificate),
    });
  }

  flagClause(input: { clauseId: string; severity: Severity; title: string; explanation: string; recommendation: string }) {
    if (this.snapshot.workspace.view !== "review") return failure("INVALID_STATE", "Clause findings can only be added while the Review workspace is open.");
    const clause = this.agreement.clauses.find(({ id }) => id === input.clauseId.trim());
    if (!clause) return failure("NOT_FOUND", "The referenced clause does not exist in this agreement.");
    if (!severities.includes(input.severity)) return failure("INVALID_ARGUMENT", "Severity is not supported.");
    const title = boundedText(input.title, "Title", 100);
    const explanation = boundedText(input.explanation, "Explanation", 500);
    const recommendation = boundedText(input.recommendation, "Recommendation", 500);
    if (!title.ok) return title;
    if (!explanation.ok) return explanation;
    if (!recommendation.ok) return recommendation;
    const existing = this.snapshot.findings.find(({ clauseId }) => clauseId === clause.id);
    if (existing) return failure("CONFLICT", `Clause ${clause.number} already has a finding.`);
    const finding = {
      id: `finding-${this.nextFindingId++}`,
      clauseId: clause.id,
      severity: input.severity,
      title: title.result,
      explanation: explanation.result,
      recommendation: recommendation.result,
      createdAt: this.clock().toISOString(),
    };
    this.publish({ ...this.snapshot, findings: [...this.snapshot.findings, finding], workspace: { ...this.snapshot.workspace, activeClauseId: clause.id } });
    return success({ finding, clause: { id: clause.id, number: clause.number, title: clause.title } });
  }

  proposeReview(input: { summary: string; recommendation: string; findingIds: readonly string[] }) {
    if (this.snapshot.workspace.view !== "review") return failure("INVALID_STATE", "Review proposals require the Review workspace.");
    const summary = boundedText(input.summary, "Summary", 1200);
    const recommendation = boundedText(input.recommendation, "Recommendation", 500);
    if (!summary.ok) return summary;
    if (!recommendation.ok) return recommendation;
    const findingIds = [...new Set(input.findingIds)];
    if (findingIds.length === 0 || findingIds.length > 12) return failure("INVALID_ARGUMENT", "A review must reference 1 to 12 findings.");
    const known = new Set(this.snapshot.findings.map(({ id }) => id));
    if (findingIds.some((id) => !known.has(id))) return failure("INVALID_ARGUMENT", "Every referenced finding must exist in the current review.");
    const draft = {
      id: `review-${this.nextDraftId++}`,
      revision: 1,
      approvedRevision: null,
      status: "pending" as const,
      summary: summary.result,
      recommendation: recommendation.result,
      findingIds,
    };
    this.publish({ ...this.snapshot, draft });
    return success({ draft });
  }

  editReview(input: { draftId: string; summary: string; recommendation: string }) {
    const draft = this.snapshot.draft;
    if (!draft || draft.id !== input.draftId) return failure("NOT_FOUND", "The review draft is not current.");
    if (draft.status === "dismissed" || draft.status === "recorded") return failure("INVALID_STATE", `A ${draft.status} review cannot be edited.`);
    const summary = boundedText(input.summary, "Summary", 1200);
    const recommendation = boundedText(input.recommendation, "Recommendation", 500);
    if (!summary.ok) return summary;
    if (!recommendation.ok) return recommendation;
    const updated = { ...draft, revision: draft.revision + 1, approvedRevision: null, status: "pending" as const, summary: summary.result, recommendation: recommendation.result };
    this.publish({ ...this.snapshot, draft: updated });
    return success({ draft: updated });
  }

  approveReview(input: { draftId: string }) {
    const draft = this.snapshot.draft;
    if (!draft || draft.id !== input.draftId) return failure("NOT_FOUND", "The review draft is not current.");
    if (draft.status === "recorded" || draft.status === "dismissed") return failure("INVALID_STATE", `A ${draft.status} review cannot be approved.`);
    const approved = { ...draft, status: "approved" as const, approvedRevision: draft.revision };
    this.publish({ ...this.snapshot, draft: approved });
    return success({ draft: approved });
  }

  dismissReview(input: { draftId: string }) {
    const draft = this.snapshot.draft;
    if (!draft || draft.id !== input.draftId) return failure("NOT_FOUND", "The review draft is not current.");
    if (draft.status === "recorded") return failure("INVALID_STATE", "A recorded review cannot be dismissed.");
    this.publish({ ...this.snapshot, draft: { ...draft, status: "dismissed", approvedRevision: null } });
    return success({ dismissed: true });
  }

  recordApprovedReview(input: { reviewId: string }) {
    const draft = this.snapshot.draft;
    if (!draft || draft.id !== input.reviewId) return failure("NOT_FOUND", "The approved review reference is not current.");
    if (this.snapshot.certificate || draft.status === "recorded") return failure("CONFLICT", "This agreement review has already been recorded.");
    if (draft.status !== "approved" || draft.approvedRevision !== draft.revision) return failure("INVALID_STATE", "The exact current review revision requires human approval.");
    const certificate: ReviewCertificate = {
      id: `certificate-${this.agreement.id}-${draft.revision}`,
      agreementId: this.agreement.id,
      agreementFingerprint: this.agreement.fingerprint,
      reviewDraftId: draft.id,
      reviewRevision: draft.revision,
      findingIds: draft.findingIds,
      recordedAt: this.clock().toISOString(),
    };
    this.publish({
      ...this.snapshot,
      draft: { ...draft, status: "recorded" },
      certificate,
      workspace: { view: "certificate", activeClauseId: this.snapshot.workspace.activeClauseId },
    });
    return success({ certificate, signatureReadiness: "ready_for_human_signature", message: "Review recorded. The signer may now continue in the page." });
  }

  startToolActivity(input: { toolName: string; argumentSummary: string }) {
    const activity = { id: `activity-${this.nextActivityId++}`, toolName: input.toolName, argumentSummary: input.argumentSummary.slice(0, 160), status: "running" as const, outcomeSummary: null, durationMs: null };
    this.publish({ ...this.snapshot, activities: [activity, ...this.snapshot.activities].slice(0, 40) });
    return success({ activity });
  }

  finishToolActivity(input: { activityId: string; status: "succeeded" | "failed"; durationMs: number; outcomeSummary: string }) {
    this.publish({ ...this.snapshot, activities: this.snapshot.activities.map((activity) => activity.id === input.activityId ? { ...activity, status: input.status, durationMs: Math.max(0, Math.round(input.durationMs)), outcomeSummary: input.outcomeSummary.slice(0, 180) } : activity) });
  }

  setWebMcpIntegration(input: { status: SignWiseSnapshot["webMcp"]["status"]; discoveredToolNames: readonly string[]; message?: string }) {
    const next = { status: input.status, discoveredToolNames: [...input.discoveredToolNames], message: input.message ?? null };
    const current = this.snapshot.webMcp;
    if (current.status === next.status && current.message === next.message && current.discoveredToolNames.join("\0") === next.discoveredToolNames.join("\0")) return;
    this.publish({ ...this.snapshot, webMcp: next });
  }
}
