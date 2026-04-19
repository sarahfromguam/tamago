import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { EggBase, OmiConversation, OmiPipelineStep, OmiRunResult } from "../types";

// ── Shared terminal styles ───────────────────────────────
const T = {
  bg:       "#0d1117",
  card:     "#161b22",
  border:   "#30363d",
  muted:    "#8b949e",
  text:     "#e6edf3",
  green:    "#3fb950",
  red:      "#f85149",
  yellow:   "#d29922",
  purple:   "#bc8cff",
  cyan:     "#79c0ff",
};

const PATH_CONFIG: Record<string, { label: string; color: string }> = {
  taken:    { label: "MED LOGGED",  color: T.green },
  distress: { label: "ALERT SENT",  color: T.red },
  none:     { label: "NO ACTION",   color: T.muted },
};

const STEP_ICON: Record<string, string> = {
  receive: "↓",
  detect:  "~",
  action:  "→",
};

const RESULT_COLOR: Record<string, string> = {
  match:   T.green,
  success: T.green,
  skip:    T.muted,
  pending: T.yellow,
};

// ── Components ───────────────────────────────────────────

function CollapsibleTranscript({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 280;
  const display = expanded ? text : (long ? text.slice(0, 280) + "…" : text);

  return (
    <div className="mb-3">
      <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: T.muted }}>
        {display}
      </p>
      {long && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="font-mono text-sm mt-1 hover:underline"
          style={{ color: T.cyan }}
        >
          {expanded ? "[ collapse ]" : "[ show full ]"}
        </button>
      )}
    </div>
  );
}

function PipelineSteps({ steps }: { steps: OmiPipelineStep[] }) {
  return (
    <div className="mt-3 flex flex-col gap-1 border-l-2 pl-3" style={{ borderColor: T.border }}>
      {steps.map((s, i) => (
        <div key={i} className="flex items-baseline gap-2">
          <span className="font-mono text-sm w-3 flex-shrink-0" style={{ color: T.muted }}>
            {STEP_ICON[s.step] ?? "·"}
          </span>
          <span className="font-mono text-sm" style={{ color: T.text }}>{s.label}</span>
          {s.result && (
            <span className="font-mono text-sm" style={{ color: RESULT_COLOR[s.result] ?? T.muted }}>
              [{s.result}]
            </span>
          )}
          {s.detail && (
            <span className="font-mono text-sm truncate" style={{ color: T.muted }}>{s.detail}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ConversationCard({ conv, live }: { conv: OmiConversation; live?: boolean }) {
  const [result, setResult] = useState<OmiRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const cfg = PATH_CONFIG[conv.path] ?? PATH_CONFIG.none;

  const ts = conv.started_at
    ? new Date(conv.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "??:??:??";

  async function run() {
    if (!conv.transcript) return;
    setRunning(true);
    try {
      const res = await api.runOmiPipeline(conv.transcript, conv.id);
      setResult(res);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      className="rounded p-3"
      style={{ background: T.card, border: `1px solid ${live ? T.green + "40" : T.border}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2">
          {live && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: T.green }} />}
          <span className="font-mono text-sm" style={{ color: T.muted }}>{ts}</span>
        </div>
        <span className="font-mono text-sm" style={{ color: cfg.color }}>{cfg.label}</span>
      </div>

      {/* Transcript */}
      {conv.transcript ? (
        <CollapsibleTranscript text={conv.transcript} />
      ) : (
        <p className="font-mono text-sm mb-3" style={{ color: T.muted }}>[no transcript]</p>
      )}

      {/* Match */}
      {conv.match && (
        <p className="font-mono text-sm mb-2" style={{ color: T.green }}>
          + {conv.match.medication}{conv.match.quote ? ` · "${conv.match.quote}"` : ""}
        </p>
      )}

      {/* Run */}
      {conv.transcript && !result && (
        <button
          onClick={run}
          disabled={running}
          className="font-mono text-sm px-3 py-1 rounded hover:opacity-80 disabled:opacity-40 transition-opacity"
          style={{ background: "#21262d", color: T.cyan, border: `1px solid ${T.border}` }}
        >
          {running ? "running…" : "▶ run pipeline"}
        </button>
      )}

      {result && <PipelineSteps steps={result.steps} />}
    </div>
  );
}

const UID = "user_mia";
const DEMO_EGG_KEY = "tamago_demo_egg_base";
const DEMO_TRANSITION_KEY = "tamago_demo_transition";

const demoChannel = new BroadcastChannel("tamago_demo");

function DemoControls() {
  const [eggBase, setEggBase] = useState<EggBase>(() =>
    (localStorage.getItem(DEMO_EGG_KEY) as EggBase) || "fried"
  );
  const [friendStatus, setFriendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [caregiverStatus, setCaregiverStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleMedsTaken = async () => {
    if (eggBase !== "fried") return;
    await api.takeMeds().catch(() => {});
    localStorage.setItem(DEMO_EGG_KEY, "okay");
    localStorage.setItem(DEMO_TRANSITION_KEY, "okay");
    demoChannel.postMessage({ type: "transition", base: "okay" });
    setEggBase("okay");
  };

  const handleReset = async () => {
    await api.resetSarah().catch(() => {});
    localStorage.setItem(DEMO_EGG_KEY, "fried");
    localStorage.removeItem(DEMO_TRANSITION_KEY);
    demoChannel.postMessage({ type: "reset", base: "fried" });
    setEggBase("fried");
  };

  const handleAlertFriend = async () => {
    setFriendStatus("sending");
    try {
      await api.getSupportFriend(UID);
      setFriendStatus("sent");
    } catch {
      setFriendStatus("error");
    } finally {
      setTimeout(() => setFriendStatus("idle"), 4000);
    }
  };

  const handleAlertCaregiver = async () => {
    setCaregiverStatus("sending");
    try {
      await api.getSupportCaregiver(UID);
      setCaregiverStatus("sent");
    } catch {
      setCaregiverStatus("error");
    } finally {
      setTimeout(() => setCaregiverStatus("idle"), 4000);
    }
  };

  const btnStyle = (bg: string) => ({
    background: bg,
    color: "#fff",
    boxShadow: "2px 2px 0 0 #2c1a0e",
  });

  const statusColor = (s: "idle" | "sending" | "sent" | "error") =>
    s === "sent" ? "#22c55e" : s === "error" ? "#ef4444" : "#c4a882";

  const statusLabel = (s: "idle" | "sending" | "sent" | "error", label: string) =>
    s === "sending" ? "SENDING..." : s === "sent" ? "✓ SENT!" : s === "error" ? "✗ FAILED" : label;

  return (
    <div className="pixel-box p-3">
      <h2 className="font-pixel text-[9px] tracking-widest mb-3" style={{ color: "#2c1a0e" }}>
        DEMO CONTROLS
      </h2>

      {/* Meds / Reset row */}
      <div className="flex gap-2 mb-2">
        {eggBase === "fried" ? (
          <button
            onClick={handleMedsTaken}
            className="flex-1 border-2 border-[#2c1a0e] px-3 py-1.5 font-pixel text-[6px] transition-transform active:scale-95"
            style={btnStyle("#7c5cbf")}
          >
            💊 MEDS TAKEN
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="flex-1 border-2 border-[#2c1a0e] px-3 py-1.5 font-pixel text-[6px] transition-transform active:scale-95"
            style={btnStyle("#9a8070")}
          >
            ↺ RESET TO FRIED
          </button>
        )}
      </div>

      {/* Support buttons row */}
      <div className="flex gap-2">
        <button
          onClick={handleAlertFriend}
          disabled={friendStatus === "sending"}
          className="flex-1 border-2 border-[#2c1a0e] px-3 py-1.5 font-pixel text-[6px] transition-transform active:scale-95 disabled:opacity-60"
          style={btnStyle(statusColor(friendStatus))}
        >
          {statusLabel(friendStatus, "💬 ALERT FRIEND")}
        </button>
        <button
          onClick={handleAlertCaregiver}
          disabled={caregiverStatus === "sending"}
          className="flex-1 border-2 border-[#2c1a0e] px-3 py-1.5 font-pixel text-[6px] transition-transform active:scale-95 disabled:opacity-60"
          style={btnStyle(statusColor(caregiverStatus))}
        >
          {statusLabel(caregiverStatus, "🆘 ALERT CAREGIVER")}
        </button>
      </div>
    </div>
  );
}

export default function DemoConsole() {
  const [conversations, setConversations] = useState<OmiConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveLog, setLiveLog] = useState<OmiConversation[]>([]);

  useEffect(() => {
    api.getOmiConversations(10)
      .then(setConversations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const poll = () => api.getWebhookLog().then(setLiveLog).catch(() => {});
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Demo controls */}
      <DemoControls />

      {/* Pipeline diagram */}
      <div className="pixel-box p-3">
        <h1 className="font-pixel text-[9px] tracking-widest mb-3" style={{ color: "#2c1a0e" }}>
          OMI PIPELINE
        </h1>
        <p className="font-mono text-sm mt-1" style={{ color: T.muted }}>
          real-time conversation processing
        </p>
      </div>

      <DemoInject onSent={() => api.getWebhookLog().then(setLiveLog).catch(() => {})} />

      {/* Pipeline diagram */}
      <div className="rounded p-3 mb-6 font-mono text-sm" style={{ background: T.card, border: `1px solid ${T.border}` }}>
        <p className="mb-2" style={{ color: T.muted }}>// flow</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { label: "omi device", color: T.cyan },
            { label: "→",         color: T.muted },
            { label: "webhook",   color: T.cyan },
            { label: "→",         color: T.muted },
            { label: "llm",       color: T.purple },
            { label: "→",         color: T.muted },
            { label: "log med",   color: T.green },
            { label: "|",         color: T.muted },
            { label: "alert",     color: T.red },
          ].map(({ label, color }, i) => (
            <span key={i} style={{ color }}>{label}</span>
          ))}
        </div>
      </div>

      {/* Live */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: liveLog.length > 0 ? T.green : T.muted }} />
          <span className="font-mono text-sm font-semibold" style={{ color: T.text }}>live</span>
          {liveLog.length > 0 && (
            <span className="font-mono text-sm" style={{ color: T.muted }}>{liveLog.length} received</span>
          )}
        </div>
        {liveLog.length === 0 ? (
          <p className="font-mono text-sm" style={{ color: T.muted }}>waiting for webhook…</p>
        ) : (
          <div className="flex flex-col gap-2">
            {liveLog.map((conv) => (
              <LiveEntry key={conv.id} conv={conv} />
            ))}
          </div>
        )}
      </div>

      {/* Historical */}
      <div>
        <p className="font-mono text-sm font-semibold mb-3" style={{ color: T.text }}>recent</p>
        {loading && <p className="font-mono text-sm" style={{ color: T.muted }}>loading…</p>}
        {error && <p className="font-mono text-sm" style={{ color: T.red }}>{error}</p>}
        {!loading && !error && conversations.length === 0 && (
          <p className="font-mono text-sm" style={{ color: T.muted }}>no conversations found</p>
        )}
        <div className="flex flex-col gap-2">
          {conversations.map((conv) => (
            <ConversationCard key={conv.id} conv={conv} />
          ))}
        </div>
      </div>
    </div>
  );
}
