import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { OmiConversation, OmiPipelineStep, OmiRunResult } from "../types";

function CollapsibleTranscript({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = text.slice(0, 220);
  const long = text.length > 220;

  return (
    <div className="mb-2">
      <p className="font-pixel text-[6px] leading-relaxed" style={{ color: "#2c1a0e" }}>
        {expanded ? text : (long ? preview + "…" : text)}
      </p>
      {long && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="font-pixel text-[5px] mt-1 underline"
          style={{ color: "#9a8070" }}
        >
          {expanded ? "show less" : "show full transcript"}
        </button>
      )}
    </div>
  );
}

const PATH_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  taken:    { label: "💊 LOGGED",    color: "#22c55e", bg: "#dcfce7" },
  distress: { label: "🚨 ALERT",     color: "#ef4444", bg: "#fee2e2" },
  none:     { label: "— SKIP",       color: "#9ca3af", bg: "#f3f4f6" },
};

const STEP_ICON: Record<string, string> = {
  receive: "📡",
  detect:  "🔍",
  action:  "⚡",
};

const RESULT_COLOR: Record<string, string> = {
  match:   "#22c55e",
  success: "#22c55e",
  skip:    "#9ca3af",
  pending: "#eab308",
};

function PipelineSteps({ steps }: { steps: OmiPipelineStep[] }) {
  return (
    <div className="mt-3 flex flex-col gap-1.5">
      {steps.map((s, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-sm mt-0.5">{STEP_ICON[s.step] ?? "•"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-pixel text-[6px]" style={{ color: "#2c1a0e" }}>{s.label}</span>
              {s.result && (
                <span
                  className="font-pixel text-[5px] px-1 py-px border"
                  style={{ color: RESULT_COLOR[s.result] ?? "#9ca3af", borderColor: RESULT_COLOR[s.result] ?? "#9ca3af" }}
                >
                  {s.result.toUpperCase()}
                </span>
              )}
            </div>
            {s.detail && (
              <p className="font-pixel text-[5px] mt-0.5 truncate" style={{ color: "#9a8070" }}>{s.detail}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationCard({ conv }: { conv: OmiConversation }) {
  const [result, setResult] = useState<OmiRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const badge = PATH_BADGE[conv.path] ?? PATH_BADGE.none;

  const time = conv.started_at
    ? new Date(conv.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

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
      className="pixel-box w-full p-3"
      style={{ animation: "fadeInUp 0.4s ease-out both" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="font-pixel text-[6px]" style={{ color: "#9a8070" }}>{time}</span>
        <span
          className="font-pixel text-[5px] px-1.5 py-0.5 border"
          style={{ color: badge.color, borderColor: badge.color, background: badge.bg }}
        >
          {badge.label}
        </span>
      </div>

      {/* Transcript */}
      {conv.transcript ? (
        <CollapsibleTranscript text={conv.transcript} />
      ) : (
        <p className="font-pixel text-[6px] mb-2" style={{ color: "#9ca3af" }}>[no transcript]</p>
      )}

      {/* Match info */}
      {conv.match && (
        <p className="font-pixel text-[5px] mb-2 italic" style={{ color: "#22c55e" }}>
          {conv.match.medication}{conv.match.quote ? ` — "${conv.match.quote}"` : ""}
        </p>
      )}

      {/* Run button */}
      {conv.transcript && !result && (
        <button
          onClick={run}
          disabled={running}
          className="font-pixel text-[6px] px-2 py-1 border transition-opacity active:scale-95 disabled:opacity-50"
          style={{ borderColor: "#c47a3a", color: "#c47a3a" }}
        >
          {running ? "RUNNING…" : "▶ RUN PIPELINE"}
        </button>
      )}

      {/* Steps */}
      {result && <PipelineSteps steps={result.steps} />}
    </div>
  );
}

export default function DemoConsole() {
  const [conversations, setConversations] = useState<OmiConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getOmiConversations(10)
      .then(setConversations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Pipeline diagram */}
      <div className="pixel-box p-3">
        <h1 className="font-pixel text-[9px] tracking-widest mb-3" style={{ color: "#2c1a0e" }}>
          OMI PIPELINE
        </h1>
        <div className="flex items-center gap-1 flex-wrap">
          {[
            { icon: "🎙️", label: "OMI" },
            { icon: "→", label: "" },
            { icon: "🤖", label: "LLM" },
            { icon: "→", label: "" },
            { icon: "💊", label: "LOG MED" },
            { icon: "/", label: "" },
            { icon: "🚨", label: "ALERT" },
          ].map(({ icon, label }, i) => (
            label ? (
              <div key={i} className="flex flex-col items-center">
                <span className="font-pixel text-[8px]">{icon}</span>
                <span className="font-pixel text-[5px] mt-0.5" style={{ color: "#9a8070" }}>{label}</span>
              </div>
            ) : (
              <span key={i} className="font-pixel text-[8px]" style={{ color: "#c4a882" }}>{icon}</span>
            )
          ))}
        </div>
      </div>

      {/* Conversations */}
      <div>
        <h2 className="font-pixel text-[7px] tracking-wide mb-2" style={{ color: "#6b4c35" }}>
          RECENT CONVERSATIONS
        </h2>
        {loading && (
          <p className="font-pixel text-[7px]" style={{ color: "#9a8070" }}>Loading…</p>
        )}
        {error && (
          <p className="font-pixel text-[7px]" style={{ color: "#ef4444" }}>{error}</p>
        )}
        {!loading && !error && conversations.length === 0 && (
          <p className="font-pixel text-[7px]" style={{ color: "#9a8070" }}>No conversations found.</p>
        )}
        <div className="flex flex-col gap-3">
          {conversations.map((conv) => (
            <ConversationCard key={conv.id} conv={conv} />
          ))}
        </div>
      </div>
    </div>
  );
}
