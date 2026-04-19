import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { OmiConversation, OmiPipelineStep, OmiRunResult } from "../types";

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

// ── Demo inject ──────────────────────────────────────────

const DEMO_SCENARIOS = [
  {
    label: "took medication",
    color: T.green,
    segments: [
      { text: "Hey, just a heads up I took my Tylenol about ten minutes ago.", speaker: "SPEAKER_0", is_user: true },
      { text: "Good, how are you feeling?", speaker: "SPEAKER_1", is_user: false },
      { text: "A bit better, the headache is starting to go away.", speaker: "SPEAKER_0", is_user: true },
    ],
  },
  {
    label: "distress signal",
    color: T.red,
    segments: [
      { text: "I have such a terrible headache right now, it's been throbbing all morning.", speaker: "SPEAKER_0", is_user: true },
      { text: "Did you take anything for it?", speaker: "SPEAKER_1", is_user: false },
      { text: "Not yet, I keep forgetting and I feel so exhausted.", speaker: "SPEAKER_0", is_user: true },
    ],
  },
];

function DemoInject({ onSent }: { onSent: () => void }) {
  const [sending, setSending] = useState<string | null>(null);
  const [visibleSteps, setVisibleSteps] = useState<OmiPipelineStep[]>([]);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  async function inject(scenario: typeof DEMO_SCENARIOS[0]) {
    setSending(scenario.label);
    setVisibleSteps([]);
    setActiveScenario(scenario.label);

    const id = `demo-${Date.now()}`;
    const transcript = scenario.segments.map(s => s.text).join(" ");

    // Fire webhook and fetch steps in parallel
    const [, result] = await Promise.all([
      fetch(`/webhook/omi?uid=user_mia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, transcript_segments: scenario.segments, discarded: false }),
      }),
      api.runOmiPipeline(transcript, id),
    ]);

    setSending(null);
    onSent();

    // Reveal steps one by one
    for (let i = 0; i < result.steps.length; i++) {
      await new Promise(r => setTimeout(r, 500));
      setVisibleSteps(result.steps.slice(0, i + 1));
    }
  }

  return (
    <div className="rounded p-3 mb-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
      <p className="font-mono text-sm mb-3" style={{ color: T.muted }}>// inject demo conversation</p>
      <div className="flex gap-2 flex-wrap mb-3">
        {DEMO_SCENARIOS.map((s) => (
          <button
            key={s.label}
            onClick={() => inject(s)}
            disabled={!!sending}
            className="font-mono text-sm px-3 py-1.5 rounded hover:opacity-80 disabled:opacity-40 transition-opacity"
            style={{ background: "#21262d", color: s.color, border: `1px solid ${s.color}40` }}
          >
            {sending === s.label ? "sending…" : `▶ ${s.label}`}
          </button>
        ))}
      </div>

      {/* Processing trace */}
      {activeScenario && (
        <div className="border-t pt-3 mt-1" style={{ borderColor: T.border }}>
          <p className="font-mono text-sm mb-2" style={{ color: T.muted }}>
            // processing: {activeScenario}
          </p>
          <div className="flex flex-col gap-1.5 border-l-2 pl-3" style={{ borderColor: T.border }}>
            {visibleSteps.map((s, i) => (
              <div
                key={i}
                className="flex items-baseline gap-2"
                style={{ animation: "fadeInUp 0.2s ease-out both" }}
              >
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
            {sending && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm" style={{ color: T.muted }}>·</span>
                <span className="font-mono text-sm" style={{ color: T.muted }}>
                  <span style={{ animation: "pixelPulse 1s step-end infinite", display: "inline-block" }}>▋</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Live entry ───────────────────────────────────────────

function LiveEntry({ conv }: { conv: OmiConversation }) {
  const cfg = PATH_CONFIG[conv.path] ?? PATH_CONFIG.none;
  const receivedAt = conv.received_at
    ? new Date(conv.received_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <div
      className="rounded p-3 font-mono"
      style={{ background: T.card, border: `1px solid ${T.green}30`, animation: "fadeInUp 0.2s ease-out both" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: T.green }} />
          <span className="text-sm" style={{ color: T.muted }}>{receivedAt}</span>
        </div>
        <span className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
      </div>

      {conv.match && (
        <p className="text-sm mb-1.5" style={{ color: T.green }}>
          + {conv.match.medication}{conv.match.quote ? ` · "${conv.match.quote}"` : ""}
        </p>
      )}

      {conv.transcript && (
        <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
          {conv.transcript.length > 160 ? conv.transcript.slice(0, 160) + "…" : conv.transcript}
        </p>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────

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
    <div
      className="min-h-screen -mx-4 -mt-4 px-4 pt-4 pb-10"
      style={{ background: T.bg }}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-sm" style={{ color: T.green }}>omi</span>
          <span className="font-mono text-sm" style={{ color: T.muted }}>/</span>
          <span className="font-mono text-sm" style={{ color: T.text }}>pipeline</span>
        </div>
        <h1 className="font-mono text-2xl font-bold" style={{ color: T.text }}>
          Pipeline Console
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
