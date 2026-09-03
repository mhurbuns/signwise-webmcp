const text = (value: unknown, max = 60) => typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";

export function summarizeArguments(toolName: string, input: Record<string, unknown>) {
  if (toolName === "read_clause") return `clause ${text(input.clauseId, 30) || "unknown"}`;
  if (toolName === "flag_clause") return `${text(input.severity, 12)} · ${text(input.clauseId, 30)}`;
  if (toolName === "propose_review") return `${Array.isArray(input.findingIds) ? input.findingIds.length : 0} findings`;
  if (toolName === "record_approved_review") return `approved review ${text(input.reviewId, 30)}`;
  return "current agreement";
}

export function summarizeOutcome(toolName: string, output: unknown) {
  if (typeof output === "object" && output !== null && "ok" in output && output.ok === false && "error" in output) {
    const error = (output as { error?: { code?: string } }).error;
    return error?.code ? `Rejected · ${error.code}` : "Rejected";
  }
  const labels: Record<string, string> = {
    get_agreement: "Agreement context returned",
    list_clauses: "Clause index returned",
    read_clause: "Clause evidence returned",
    get_review_workspace: "Live workspace returned",
    flag_clause: "Risk added to document",
    propose_review: "Review prepared for human",
    record_approved_review: "Approved review recorded",
  };
  return labels[toolName] ?? "Completed";
}
