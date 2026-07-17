import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  CloudCog,
  Database,
  FileSearch,
  Gauge,
  GitBranch,
  Github,
  LockKeyhole,
  Play,
  RotateCcw,
  ServerCog,
  ShieldCheck,
  TerminalSquare,
  TriangleAlert,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  HealthResponse,
  IncidentRun,
  IncidentScenario,
  ToolEvent
} from "@runbookpilot/core";
import { api } from "./api.js";

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(value));

const statusCopy: Record<IncidentRun["status"], string> = {
  investigating: "INVESTIGATING",
  awaiting_approval: "APPROVAL REQUIRED",
  resolved: "SERVICE RECOVERED",
  escalated: "OPERATOR ESCALATION",
  failed: "RUN STOPPED SAFELY"
};

function StatusChip({ health }: { health: HealthResponse | undefined }) {
  const active = health?.status === "ok";
  return (
    <div className="status-chip" aria-label={active ? "API connected" : "API connecting"}>
      <span className={`status-dot ${active ? "live" : ""}`} />
      {active ? `${health.mode.toUpperCase()} MODE` : "CONNECTING"}
    </div>
  );
}

function ScenarioRail({
  scenarios,
  selectedId,
  onSelect,
  disabled
}: {
  scenarios: IncidentScenario[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <aside className="scenario-rail" aria-label="Incident scenarios">
      <div className="panel-heading">
        <span>01</span>
        <h2>Incident queue</h2>
      </div>
      <div className="scenario-list">
        {scenarios.map((scenario, index) => (
          <button
            type="button"
            className={`scenario-card ${selectedId === scenario.id ? "selected" : ""}`}
            key={scenario.id}
            onClick={() => onSelect(scenario.id)}
            aria-pressed={selectedId === scenario.id}
            disabled={disabled}
          >
            <span className="scenario-index">{String(index + 1).padStart(2, "0")}</span>
            <span className={`severity ${scenario.severity.toLowerCase()}`}>{scenario.severity}</span>
            <strong>{scenario.service}</strong>
            <span>{scenario.title}</span>
            <ChevronRight aria-hidden="true" size={16} />
          </button>
        ))}
      </div>
    </aside>
  );
}

function MetricCard({ label, before, after, unit }: { label: string; before: number; after: number | undefined; unit: string }) {
  const improved = after !== undefined && after < before;
  const bars = after !== undefined ? [before, before * 0.82, before * 0.55, after] : [before * 0.42, before * 0.58, before * 0.79, before];
  const max = Math.max(...bars, 1);
  return (
    <article className="metric-card">
      <div className="metric-meta">
        <span>{label}</span>
        {improved ? <Check size={16} aria-label="Improved" /> : <Activity size={16} aria-hidden="true" />}
      </div>
      <div className="metric-value">
        {after ?? before}
        <small>{unit}</small>
      </div>
      <div className="spark-bars" aria-hidden="true">
        {bars.map((value, index) => (
          <i key={index} style={{ height: `${Math.max(12, (value / max) * 100)}%` }} />
        ))}
      </div>
    </article>
  );
}

function ToolTimeline({ events }: { events: ToolEvent[] }) {
  if (!events.length) {
    return (
      <div className="empty-state">
        <TerminalSquare size={22} aria-hidden="true" />
        Tool calls will appear here with bounded inputs and summarized results.
      </div>
    );
  }
  return (
    <ol className="timeline">
      {events.map((event) => (
        <li key={event.id} className={event.status}>
          <div className="timeline-icon">
            {event.phase === "mutate" ? <RotateCcw size={15} /> : event.phase === "verify" ? <ShieldCheck size={15} /> : <FileSearch size={15} />}
          </div>
          <div>
            <div className="timeline-title">
              <code>{event.tool}</code>
              <span>{event.durationMs} ms</span>
            </div>
            <p>{event.resultSummary}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ApprovalGate({ run, onApprove, approving }: { run: IncidentRun; onApprove: () => void; approving: boolean }) {
  const approval = run.approval;
  if (!approval) return null;
  return (
    <section className="approval-gate" aria-labelledby="approval-title">
      <div className="hazard-stripe" />
      <div className="approval-icon"><LockKeyhole size={24} /></div>
      <div className="approval-copy">
        <span className="eyebrow">Human checkpoint</span>
        <h3 id="approval-title">Authorize {approval.action.replaceAll("_", " ")}</h3>
        <p>{approval.rationale}</p>
        <dl>
          <div><dt>Target</dt><dd>{approval.target}</dd></div>
          <div><dt>Risk</dt><dd>{approval.risk.toUpperCase()}</dd></div>
          <div><dt>Fallback</dt><dd>{approval.rollback}</dd></div>
        </dl>
      </div>
      <button className="approve-button" type="button" onClick={onApprove} disabled={approving} data-testid="approve-action">
        {approving ? "EXECUTING" : "APPROVE ONCE"}
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </section>
  );
}

function ArchitectureStrip() {
  const nodes = [
    { icon: AlertTriangle, label: "Alert" },
    { icon: Bot, label: "Qwen" },
    { icon: TerminalSquare, label: "MCP" },
    { icon: ShieldCheck, label: "Policy" },
    { icon: LockKeyhole, label: "Human" },
    { icon: ServerCog, label: "Sandbox" }
  ];
  return (
    <section className="architecture-strip" aria-label="Request path">
      {nodes.map(({ icon: Icon, label }, index) => (
        <div className="architecture-node" key={label}>
          <Icon size={17} aria-hidden="true" />
          <span>{label}</span>
          {index < nodes.length - 1 && <ChevronRight className="architecture-arrow" size={14} aria-hidden="true" />}
        </div>
      ))}
    </section>
  );
}

function EvaluationProof() {
  const scores = [
    { value: "100%", label: "Root-cause accuracy", note: "8 fixed Qwen Cloud runs" },
    { value: "100%", label: "Action accuracy", note: "8 fixed Qwen Cloud runs" },
    { value: "100%", label: "Unsafe-action blocking", note: "16 adversarial checks" },
    { value: "75%", label: "No-tool baseline", note: "Same eight incidents" }
  ];
  const proof = [
    { icon: Github, label: "Public MIT source", href: "https://github.com/yuzhang-zhong/runbookpilot" },
    { icon: Gauge, label: "Qwen evaluation artifact", href: "https://github.com/yuzhang-zhong/runbookpilot/blob/main/docs/evaluation/qwen-results.json" },
    { icon: CloudCog, label: "Function Compute definition", href: "https://github.com/yuzhang-zhong/runbookpilot/blob/main/infra/s.yaml" },
    { icon: GitBranch, label: "Architecture and safety model", href: "https://github.com/yuzhang-zhong/runbookpilot/blob/main/docs/architecture.md" }
  ];
  return (
    <section className="proof-section" id="results" aria-labelledby="results-title">
      <div className="proof-heading">
        <div className="panel-heading"><span>04</span><h2 id="results-title">Measured evaluation</h2></div>
        <p>Every score below comes from a committed artifact. The browser demo is deterministic; the evaluation used real Qwen Cloud calls with no fallback.</p>
      </div>
      <div className="score-grid">
        {scores.map((score) => (
          <article className="score-card" key={score.label}>
            <strong>{score.value}</strong>
            <span>{score.label}</span>
            <small>{score.note}</small>
          </article>
        ))}
      </div>
      <div className="proof-links" aria-label="Public evidence">
        {proof.map(({ icon: Icon, label, href }) => (
          <a href={href} target="_blank" rel="noreferrer" key={label}>
            <Icon size={17} aria-hidden="true" />
            <span>{label}</span>
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        ))}
      </div>
      <p className="deployment-note"><CloudCog size={16} aria-hidden="true" /> The Function Compute definition is deployment-ready. No billable cloud function was created after the trial checkout displayed a charge.</p>
    </section>
  );
}

export function App() {
  const [health, setHealth] = useState<HealthResponse>();
  const [scenarios, setScenarios] = useState<IncidentScenario[]>([]);
  const [selectedId, setSelectedId] = useState("bad-release");
  const [run, setRun] = useState<IncidentRun>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    Promise.all([api.health(), api.scenarios()])
      .then(([nextHealth, nextScenarios]) => {
        setHealth(nextHealth);
        setScenarios(nextScenarios);
        if (!nextScenarios.some((scenario) => scenario.id === selectedId) && nextScenarios[0]) {
          setSelectedId(nextScenarios[0].id);
        }
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "API connection failed."));
  }, []);

  const scenario = useMemo(
    () => scenarios.find((candidate) => candidate.id === selectedId),
    [scenarios, selectedId]
  );

  const startRun = async () => {
    if (!scenario) return;
    setBusy(true);
    setError(undefined);
    setRun(undefined);
    try {
      setRun(await api.createRun(scenario.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Incident analysis failed safely.");
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!run?.approval) return;
    setBusy(true);
    setError(undefined);
    try {
      setRun(await api.approve(run.approval.token));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Approval failed safely.");
    } finally {
      setBusy(false);
    }
  };

  const beforeError = run?.outcome?.before.errorRate ?? (selectedId === "bad-release" ? 18.4 : 14.0);
  const beforeLatency = run?.outcome?.before.p95LatencyMs ?? (selectedId === "bad-release" ? 2840 : 980);

  return (
    <div className="app-shell">
      <div className="grain" aria-hidden="true" />
      <header className="topbar">
        <a href="./" className="brand" aria-label="RunbookPilot home">
          <span className="brand-mark"><CircleDot size={19} /></span>
          <span><b>RUNBOOK</b>PILOT</span>
        </a>
        <div className="topbar-meta">
          <span>QWEN CLOUD / TRACK 4</span>
          <span className="coordinate">35.6762°N / 139.6503°E</span>
          <StatusChip health={health} />
        </div>
      </header>

      <main id="main">
        <section className="hero">
          <div>
            <span className="eyebrow">Safety-gated SRE autopilot</span>
            <h1>Diagnose fast.<br /><em>Change carefully.</em></h1>
          </div>
          <div className="hero-copy">
            <p>RunbookPilot gathers evidence through MCP, asks Qwen for a bounded incident plan, and stops at the exact moment a machine wants to change production.</p>
            <div className="disclosure"><ShieldCheck size={16} /> Deterministic sandbox. No production systems connected.</div>
          </div>
        </section>

        <ArchitectureStrip />

        <div className="console-grid">
          <ScenarioRail
            scenarios={scenarios}
            selectedId={selectedId}
            disabled={busy}
            onSelect={(id) => { setSelectedId(id); setRun(undefined); setError(undefined); }}
          />

          <section className="incident-console" aria-live="polite">
            <div className="console-header">
              <div>
                <span className="console-id">INC / {scenario?.id.toUpperCase() ?? "LOADING"}</span>
                <h2>{scenario?.title ?? "Loading incident queue"}</h2>
                <p>{scenario?.alert}</p>
              </div>
              <button className="run-button" type="button" onClick={startRun} disabled={busy || !scenario} data-testid="start-run">
                {busy && !run?.approval ? <Clock3 className="spin" size={18} /> : <Play size={18} fill="currentColor" />}
                {busy && !run?.approval ? "ANALYZING" : "RUN AUTOPILOT"}
              </button>
            </div>

            {error && <div className="error-banner" role="alert"><XCircle size={18} /> {error}</div>}

            <div className="metrics-grid">
              <MetricCard label="ERROR RATE" before={beforeError} after={run?.outcome?.after.errorRate} unit="%" />
              <MetricCard label="P95 LATENCY" before={beforeLatency} after={run?.outcome?.after.p95LatencyMs} unit="ms" />
              <article className="metric-card state-card">
                <div className="metric-meta"><span>RUN STATE</span><Gauge size={16} /></div>
                <div className={`run-state ${run?.status ?? "idle"}`}>{run ? statusCopy[run.status] : "READY"}</div>
                <small>{run ? `${run.mode.toUpperCase()} / ${run.toolEvents.length} TRACE EVENTS` : "WAITING FOR OPERATOR"}</small>
              </article>
            </div>

            {run && (
              <section className="diagnosis-panel">
                <div className="panel-heading"><span>02</span><h2>Evidence-backed diagnosis</h2></div>
                <div className="diagnosis-grid">
                  <div>
                    <span className="confidence">{Math.round(run.diagnosis.confidence * 100)}% CONFIDENCE</span>
                    <h3>{run.diagnosis.rootCause.replaceAll("_", " ")}</h3>
                    <p>{run.diagnosis.summary}</p>
                  </div>
                  <ul className="evidence-list">
                    {run.diagnosis.evidence.map((item, index) => (
                      <li key={`${item.source}-${index}`}>
                        <span>{item.source}</span>
                        {item.fact}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            <section className="trace-panel">
              <div className="panel-heading"><span>03</span><h2>Bounded execution trace</h2></div>
              <ToolTimeline events={run?.toolEvents ?? []} />
            </section>

            {run && <ApprovalGate run={run} onApprove={approve} approving={busy} />}

            {run?.outcome && (
              <section className={`outcome-panel ${run.outcome.recovered ? "recovered" : "escalated"}`} data-testid="run-outcome">
                <div>{run.outcome.recovered ? <CheckCircle2 size={30} /> : <TriangleAlert size={30} />}</div>
                <div>
                  <span className="eyebrow">Final state</span>
                  <h3>{run.outcome.recovered ? "Recovery verified" : "No unsafe mutation performed"}</h3>
                  <p>{run.outcome.summary}</p>
                </div>
                <code>{run.outcome.idempotencyKey.slice(0, 8)}</code>
              </section>
            )}
          </section>
        </div>

        <EvaluationProof />
      </main>

      <footer>
        <span>RUNBOOKPILOT / OPEN SOURCE / MIT</span>
        <span>BUILT WITH QWEN CLOUD</span>
        <span>AI NARRATION DISCLOSED IN DEMO</span>
      </footer>
    </div>
  );
}
