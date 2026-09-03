export type Severity = "critical" | "high" | "medium" | "low";
export type ReviewStatus = "pending" | "approved" | "dismissed" | "recorded";
export type WorkspaceView = "agreement" | "review" | "certificate";
export type WebMcpStatus = "checking" | "ready" | "unavailable" | "failed";
export type ErrorCode = "INVALID_ARGUMENT" | "INVALID_STATE" | "NOT_FOUND" | "CONFLICT";

export interface AgreementClause {
  id: string;
  number: string;
  title: string;
  page: number;
  text: string;
}

export interface Agreement {
  id: string;
  filename: string;
  title: string;
  parties: readonly string[];
  sender: string;
  recipient: string;
  dueDate: string;
  pageCount: number;
  fingerprint: string;
  clauses: readonly AgreementClause[];
}

export interface RiskFinding {
  id: string;
  clauseId: string;
  severity: Severity;
  title: string;
  explanation: string;
  recommendation: string;
  createdAt: string;
}

export interface ReviewDraft {
  id: string;
  revision: number;
  approvedRevision: number | null;
  status: ReviewStatus;
  summary: string;
  recommendation: string;
  findingIds: readonly string[];
}

export interface ReviewCertificate {
  id: string;
  agreementId: string;
  agreementFingerprint: string;
  reviewDraftId: string;
  reviewRevision: number;
  findingIds: readonly string[];
  recordedAt: string;
}

export interface ToolActivity {
  id: string;
  toolName: string;
  argumentSummary: string;
  status: "running" | "succeeded" | "failed";
  outcomeSummary: string | null;
  durationMs: number | null;
}

export interface SignWiseSnapshot {
  workspace: { view: WorkspaceView; activeClauseId: string | null };
  findings: readonly RiskFinding[];
  draft: ReviewDraft | null;
  certificate: ReviewCertificate | null;
  activities: readonly ToolActivity[];
  webMcp: { status: WebMcpStatus; discoveredToolNames: readonly string[]; message: string | null };
}

export type AppResult<T> =
  | { ok: true; result: T }
  | { ok: false; error: { code: ErrorCode; message: string } };
