import { useEffect, useState, useSyncExternalStore } from "react";
import type { SignWiseApp } from "../application/signWiseApp";
import type { Agreement, ReviewDraft, RiskFinding, Severity } from "../domain/types";
import "./styles.css";

const severityRank: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function BrandMark() {
  return <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 11.5 20 5l10 6.5v17L20 35l-10-6.5z"/><path d="m15 21 3.2 3.2L25.5 16"/></svg>;
}

function DraftEditor({ app, draft }: { app: SignWiseApp; draft: ReviewDraft }) {
  const [summary, setSummary] = useState(draft.summary);
  const [recommendation, setRecommendation] = useState(draft.recommendation);
  const changed = summary !== draft.summary || recommendation !== draft.recommendation;
  const locked = draft.status === "recorded" || draft.status === "dismissed";
  return (
    <section className="draft-card" aria-label="Review proposal">
      <div className="card-heading">
        <div><span className="eyebrow">Human review</span><h3>Review summary</h3></div>
        <span className={`draft-status ${draft.status}`}>{draft.status}</span>
      </div>
      <label>Summary<textarea aria-label="Review summary" value={summary} disabled={locked} onChange={(event) => setSummary(event.target.value)} /></label>
      <label>Recommended next step<textarea aria-label="Recommended next step" value={recommendation} disabled={locked} onChange={(event) => setRecommendation(event.target.value)} /></label>
      {draft.status === "approved" && !changed && <p className="approval-note">Approval recorded. Tell the agent “Approved” to record this exact review.</p>}
      {draft.status !== "recorded" && draft.status !== "dismissed" && (
        <div className="draft-actions">
          <button className="text-button" onClick={() => app.dismissReview({ draftId: draft.id })}>Dismiss</button>
          {changed && <button className="secondary-button" onClick={() => app.editReview({ draftId: draft.id, summary, recommendation })}>Save changes</button>}
          {!changed && draft.status !== "approved" && <button className="primary-button" onClick={() => app.approveReview({ draftId: draft.id })}>Approve review</button>}
        </div>
      )}
    </section>
  );
}

function FindingCard({ finding, agreement, app }: { finding: RiskFinding; agreement: Agreement; app: SignWiseApp }) {
  const clause = agreement.clauses.find(({ id }) => id === finding.clauseId)!;
  return (
    <button className="finding-card" onClick={() => app.selectClause(finding.clauseId)}>
      <span className={`severity ${finding.severity}`}>{finding.severity}</span>
      <span className="finding-copy"><strong>{finding.title}</strong><small>Clause {clause.number} · page {clause.page}</small><span>{finding.explanation}</span></span>
      <span className="chevron">↗</span>
    </button>
  );
}

function ActivityFeed({ activities }: { activities: ReturnType<SignWiseApp["getSnapshot"]>["activities"] }) {
  return (
    <section className="activity-card">
      <div className="card-heading"><div><span className="eyebrow">Live collaboration</span><h3>Agent activity</h3></div><span className="live-dot">live</span></div>
      <div className="activity-list" aria-live="polite">
        {activities.length === 0 && <p className="empty">Agent actions will appear here as the agreement is reviewed.</p>}
        {activities.slice(0, 8).map((activity) => (
          <div className="activity-row" key={activity.id}>
            <span className={`activity-icon ${activity.status}`}>{activity.status === "running" ? "…" : activity.status === "succeeded" ? "✓" : "!"}</span>
            <span><code>{activity.toolName}</code><small>{activity.argumentSummary}{activity.durationMs === null ? "" : ` · ${activity.durationMs}ms`}</small></span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function App({ app, agreement }: { app: SignWiseApp; agreement: Agreement }) {
  const snapshot = useSyncExternalStore(app.subscribe, app.getSnapshot, app.getSnapshot);
  const [toast, setToast] = useState<string | null>(null);
  const findings = [...snapshot.findings].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  const webMcpLabel = snapshot.webMcp.status === "ready" ? `WebMCP ready · ${snapshot.webMcp.discoveredToolNames.length} tools` : snapshot.webMcp.status === "checking" ? "WebMCP checking" : `WebMCP ${snapshot.webMcp.status} · 0 tools`;

  useEffect(() => {
    if (!snapshot.workspace.activeClauseId) return;
    document.getElementById(`clause-${snapshot.workspace.activeClauseId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [snapshot.workspace.activeClauseId]);

  function continueToSignature() {
    setToast("Signature ceremony ready — signing remains your action.");
    window.setTimeout(() => setToast(null), 2600);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><BrandMark /></span><span>SignWise</span></div>
        <span className="crumb">Agreements <b>/</b> Review</span>
        <span className="top-spacer" />
        <span className={`integration-status ${snapshot.webMcp.status}`} title={snapshot.webMcp.message ?? undefined}><i />{webMcpLabel}</span>
        <span className="avatar">MH</span>
      </header>

      <nav className="view-tabs" aria-label="Agreement views">
        <button className={snapshot.workspace.view === "agreement" ? "active" : ""} onClick={() => app.setView("agreement")}>Agreement</button>
        <button className={snapshot.workspace.view === "review" ? "active" : ""} onClick={() => app.setView("review")}>Review with agent <span>{snapshot.findings.length || ""}</span></button>
        <button className={snapshot.workspace.view === "certificate" ? "active" : ""} disabled={!snapshot.certificate} onClick={() => app.setView("certificate")}>Review record</button>
      </nav>

      <main className="layout">
        <section className="workspace" aria-label="Contract document">
          <div className="doc-header">
            <div className="pdf-icon">PDF</div>
            <div><h1>{agreement.filename}</h1><p>{agreement.pageCount} pages · From {agreement.sender} · Due {agreement.dueDate}</p></div>
            <span className="awaiting">Awaiting your signature</span>
          </div>
          <div className="document-pages" aria-label={`${agreement.pageCount}-page agreement`}>
            {Array.from({ length: agreement.pageCount }, (_, index) => index + 1).map((pageNumber) => {
              const pageClauses = agreement.clauses.filter(({ page }) => page === pageNumber);
              return (
                <article className="paper" data-page={pageNumber} key={pageNumber}>
                  {pageNumber === 1
                    ? <div className="paper-title"><span>Agreement No. NS-2048</span><h2>{agreement.title}</h2><p>{agreement.parties.join(" and ")}</p></div>
                    : <div className="paper-running-head"><span>{agreement.title}</span><span>NS-2048</span></div>}
                  {pageClauses.map((clause) => {
                    const finding = snapshot.findings.find(({ clauseId }) => clauseId === clause.id);
                    const selected = snapshot.workspace.activeClauseId === clause.id;
                    return (
                      <section id={`clause-${clause.id}`} className={`clause ${finding ? "flagged" : ""} ${selected ? "selected" : ""}`} key={clause.id} onClick={() => app.selectClause(clause.id)}>
                        <h3>{clause.number}. {clause.title}</h3>
                        {clause.text.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                        {finding && <aside className={`margin-flag ${finding.severity}`} aria-label={`${finding.severity} risk finding`}><b>{finding.severity === "critical" ? "!" : snapshot.findings.indexOf(finding) + 1}</b><span>{finding.title}</span></aside>}
                      </section>
                    );
                  })}
                  {pageNumber === agreement.pageCount && (
                    <div className="signature-block">
                      <div><b>Meridian Labs</b><span>Authorized signature</span></div><div><b>Date</b><span>DD / MM / YYYY</span></div>
                      <div className={`signature-lock ${snapshot.certificate ? "ready" : ""}`}><span>{snapshot.certificate ? "✓" : "◇"}</span><b>{snapshot.certificate ? "Review recorded — signature step ready" : "Signature remains human-only"}</b><small>{snapshot.certificate ? "You may continue when you are ready." : "The agent can review and prepare, but never sign for you."}</small></div>
                    </div>
                  )}
                  <div className="page-number">Page {pageNumber} of {agreement.pageCount}</div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="review-rail" aria-label="Agreement review panel">
          {snapshot.workspace.view === "agreement" && (
            <div className="intro-panel">
              <span className="eyebrow">Agreement intelligence</span><h2>Know what you’re signing.</h2>
              <p>Ask an agent to investigate this agreement, place evidence beside consequential clauses, and prepare a review you control.</p>
              <div className="boundary"><span>✦</span><div><b>Agent-assisted, human-decided</b><p>The agent cannot acknowledge terms or sign this agreement.</p></div></div>
              <button className="primary-button wide" onClick={() => app.setView("review")}>Open review workspace <span>→</span></button>
              <div className="prompt-card"><span>Try asking your agent</span><p>“Review the agreement open on this page. Show the most consequential risks and prepare a concise review. Don’t sign or accept anything for me.”</p></div>
            </div>
          )}

          {snapshot.workspace.view === "review" && (
            <>
              <div className="rail-heading"><div><span className="eyebrow">Agreement intelligence</span><h2>Risk review</h2></div><span className="finding-count">{findings.length} found</span></div>
              <p className="rail-note">AI-generated analysis · not legal advice</p>
              <div className="metrics"><div><strong>{findings.filter(({ severity }) => severity === "critical").length}</strong><span>critical</span></div><div><strong>{findings.length}</strong><span>flagged</span></div><div><strong>{snapshot.draft?.status ?? "—"}</strong><span>review</span></div></div>
              <div className="findings" aria-live="polite">
                {findings.length === 0 ? <div className="empty-state"><span>✦</span><h3>No findings yet</h3><p>Your agent can read the agreement and place evidence-backed findings here.</p></div> : findings.map((finding) => <FindingCard key={finding.id} finding={finding} agreement={agreement} app={app} />)}
              </div>
              {snapshot.draft && snapshot.draft.status !== "dismissed" && <DraftEditor key={`${snapshot.draft.id}-${snapshot.draft.revision}-${snapshot.draft.status}`} app={app} draft={snapshot.draft} />}
              <ActivityFeed activities={snapshot.activities} />
            </>
          )}

          {snapshot.workspace.view === "certificate" && snapshot.certificate && (
            <div className="certificate-panel">
              <div className="certificate-seal">✓</div><span className="eyebrow">Review recorded</span><h2>Ready for your decision</h2>
              <p>The exact review you approved is bound to this fixture agreement fingerprint. This is a demonstration audit record, not a digital signature.</p>
              <dl><div><dt>Record</dt><dd>{snapshot.certificate.id}</dd></div><div><dt>Review revision</dt><dd>{snapshot.certificate.reviewRevision}</dd></div><div><dt>Findings</dt><dd>{snapshot.certificate.findingIds.length}</dd></div><div><dt>Recorded</dt><dd>{new Date(snapshot.certificate.recordedAt).toLocaleString()}</dd></div><div className="fingerprint"><dt>Agreement fingerprint</dt><dd>{snapshot.certificate.agreementFingerprint}</dd></div></dl>
              <button className="primary-button wide" onClick={continueToSignature}>Continue to signature <span>→</span></button>
              <p className="human-only">This button is human-only and is not exposed through WebMCP.</p>
              <ActivityFeed activities={snapshot.activities} />
            </div>
          )}
        </aside>
      </main>
      <footer>Independent WebMCP prototype · Local fixture data · No Adobe affiliation · Signing is always a direct human action</footer>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
