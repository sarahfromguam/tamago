import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { ActionType, DimensionDetail, DimensionState, EggState, FeedItem } from "../types";
import { usePhone } from "../hooks/usePhone";
import { api } from "../api/client";
import { MOCK_FEED } from "../mocks/data";
import EggCharacter from "../components/EggCharacter";
import NudgeToast from "../components/NudgeToast";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

// ── Pixel HP Bar (same style as MyTamago) ───────────────────
const STATE_COLORS: Record<DimensionState, { fill: string; glow: string; label: string }> = {
  green:  { fill: "#22c55e", glow: "#86efac", label: "GOOD" },
  yellow: { fill: "#eab308", glow: "#fde047", label: "OK" },
  red:    { fill: "#ef4444", glow: "#fca5a5", label: "LOW" },
  grey:   { fill: "#9ca3af", glow: "#e5e7eb", label: "N/A" },
};

function PixelHPBar({
  icon,
  label,
  state,
  detail,
  animDelay = 0,
}: {
  icon: string;
  label: string;
  state: DimensionState;
  detail?: DimensionDetail;
  animDelay?: number;
}) {
  const score = detail?.score ?? 0;
  const totalBlocks = 10;
  const filledBlocks = state === "grey" ? 0 : Math.round((score / 100) * totalBlocks);
  const colors = STATE_COLORS[state];
  const history = detail?.history ?? [];

  return (
    <div
      className="pixel-box w-full p-3"
      style={{ animation: "fadeInUp 0.4s ease-out both", animationDelay: `${animDelay}ms` }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-pixel text-[7px] tracking-wide" style={{ color: "#2c1a0e" }}>
          {icon} {label.toUpperCase()}
        </span>
        <span className="font-pixel text-[7px]" style={{ color: colors.fill }}>
          {state === "grey" ? "- - -" : `${score} HP`}
        </span>
      </div>

      <div className="mb-1.5 flex gap-0.5">
        {Array.from({ length: totalBlocks }).map((_, i) => (
          <div
            key={i}
            className="h-4 flex-1 border border-black/20"
            style={{
              backgroundColor: i < filledBlocks ? colors.fill : "#e5e0d0",
              boxShadow: i < filledBlocks ? `0 0 4px ${colors.glow}` : "none",
            }}
          />
        ))}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          {detail?.label && (
            <p className="font-pixel text-[6px]" style={{ color: "#6b4c35" }}>{detail.label}</p>
          )}
          {detail?.sublabel && (
            <p className="font-pixel text-[5px] mt-0.5" style={{ color: "#9a8070" }}>{detail.sublabel}</p>
          )}
        </div>
        {history.length > 0 && (
          <div className="flex items-end gap-px">
            {history.slice(-7).map((val, i) => {
              const h = Math.max(2, Math.round((val / 100) * 16));
              return (
                <div
                  key={i}
                  className="w-1.5"
                  style={{
                    height: `${h}px`,
                    backgroundColor: val >= 75 ? "#22c55e" : val >= 50 ? "#eab308" : "#ef4444",
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-1.5 flex justify-end">
        <span
          className="font-pixel text-[5px] px-1.5 py-0.5 border border-current"
          style={{ color: colors.fill, borderColor: colors.fill }}
        >
          {colors.label}
        </span>
      </div>
    </div>
  );
}

// ── Pixel action button ─────────────────────────────────────
const ACTION_DEF: Record<ActionType, { icon: string; label: string; sublabel: string; scheme?: string; msgTemplate?: (p: string) => string }> = {
  text:     { icon: "💬", label: "SEND A TEXT",    sublabel: "Quick check-in",        scheme: "sms" },
  call:     { icon: "📞", label: "GIVE A CALL",    sublabel: "Voice goes a long way",  scheme: "tel" },
  facetime: { icon: "📹", label: "FACETIME",       sublabel: "Face-to-face support",   scheme: "facetime" },
  coffee:   { icon: "☕", label: "SEND A COFFEE",  sublabel: "Warm treat, delivered",
    msgTemplate: (p) => `sms:${p}?body=${encodeURIComponent("Hey! I sent you a coffee treat ☕ Thinking of you!")}` },
  food:     { icon: "🍱", label: "DROP OFF FOOD",  sublabel: "Meal or delivery",
    msgTemplate: (p) => `sms:${p}?body=${encodeURIComponent("Hey! I'm sending some food your way 🍱 Hope it helps!")}` },
};

const SLEEP_BLOCKED: ActionType[] = ["call", "facetime"];
const ALL_ACTIONS: ActionType[] = ["text", "call", "facetime", "coffee", "food"];

function PixelActionButton({
  action,
  phone,
  isSleeping,
  recommended,
  onAction,
}: {
  action: ActionType;
  phone: string;
  isSleeping: boolean;
  recommended: boolean;
  onAction: (a: ActionType) => void;
}) {
  const [showNudge, setShowNudge] = useState(false);
  const def = ACTION_DEF[action];
  const blocked = isSleeping && SLEEP_BLOCKED.includes(action);

  const handleTap = () => {
    if (blocked) { setShowNudge(true); return; }
    onAction(action);
    if (def.scheme) window.open(`${def.scheme}:${phone}`, "_self");
    else if (def.msgTemplate) window.open(def.msgTemplate(phone), "_self");
  };

  return (
    <>
      <button
        onClick={handleTap}
        className={`flex w-full items-center gap-3 p-3 transition-transform active:scale-[0.97] ${blocked ? "opacity-40 grayscale" : ""}`}
        style={{
          background: recommended && !blocked ? "#fffef5" : "#f5f0e8",
          border: "2px solid #2c1a0e",
          boxShadow: recommended && !blocked ? "3px 3px 0 0 #2c1a0e" : "2px 2px 0 0 #2c1a0e",
        }}
      >
        <span className="text-2xl leading-none">{def.icon}</span>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-pixel text-[7px]" style={{ color: "#2c1a0e" }}>{def.label}</p>
          <p className="font-pixel text-[5px] mt-1" style={{ color: "#9a8070" }}>{def.sublabel}</p>
        </div>
        {recommended && !blocked && (
          <span
            className="font-pixel text-[5px] px-1.5 py-0.5 shrink-0"
            style={{ background: "#fde8d8", color: "#c9856a", border: "1px solid #c9856a" }}
          >
            ★ TOP
          </span>
        )}
      </button>
      {showNudge && <NudgeToast onDismiss={() => setShowNudge(false)} />}
    </>
  );
}

// ── Main component ──────────────────────────────────────────
export default function FriendDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { phone, setPhone } = usePhone();

  const [state, setState] = useState<(EggState & { name?: string; phone?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState("");

  useEffect(() => {
    if (USE_MOCKS) {
      const mock = MOCK_FEED.find((f) => f.slug === slug) ?? MOCK_FEED[0];
      setState(mock);
      setLoading(false);
      return;
    }
    if (!slug) { setLoading(false); return; }
    api.getTamagoState(slug)
      .then(setState)
      .catch(() => {
        // Fall back to mock data matching slug (demo mode)
        const mock = MOCK_FEED.find((f) => f.slug === slug) ?? MOCK_FEED[0];
        setState(mock);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSupport = (action: ActionType) => {
    if (!slug || !phone) return;
    if (!USE_MOCKS) api.logSupport(slug, phone, action).catch(() => {});
    setState((prev) => prev ? { ...prev, supported: true, support_count: prev.support_count + 1 } : prev);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 pt-8">
        <div className="pixel-box w-40 h-40 animate-pulse" />
        <div className="pixel-box-sm w-48 h-4 animate-pulse" />
        <div className="pixel-box w-full h-24 animate-pulse" />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="pt-16 text-center">
        <p className="font-pixel text-[9px]" style={{ color: "#9a7a6a" }}>TAMAGO NOT FOUND</p>
      </div>
    );
  }

  // Phone gate
  if (!phone) {
    return (
      <div className="flex flex-col items-center gap-5 pt-8">
        <EggCharacter base={state.base} isSleeping={state.is_sleeping} supported={state.supported} size="lg" />
        <p className="font-pixel text-[9px]" style={{ color: "#2c1a0e" }}>
          {((state as FeedItem).name ?? "FRIEND").toUpperCase()}'S TAMAGO
        </p>
        <div className="pixel-box w-full p-5">
          <p className="mb-3 text-center font-pixel text-[7px]" style={{ color: "#6b4c35" }}>
            ENTER YOUR PHONE TO SUPPORT
          </p>
          <input
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="mb-3 w-full border-2 border-[#2c1a0e] bg-[#fffef5] px-4 py-3 text-center text-sm outline-none focus:border-tamago-accent"
          />
          <button
            onClick={() => { if (phoneInput.trim()) setPhone(phoneInput.trim()); }}
            className="w-full border-2 border-[#2c1a0e] py-3 font-pixel text-[8px] text-white transition-transform active:scale-95"
            style={{ background: "#c9856a", boxShadow: "3px 3px 0 0 #2c1a0e" }}
          >
            CONTINUE →
          </button>
        </div>
      </div>
    );
  }

  const friendPhone = (state as FeedItem).phone ?? "";
  const name = ((state as FeedItem).name ?? "FRIEND").toUpperCase();
  const dims = state.dimensions;
  const details = state.dimension_details ?? {};

  // Derive activity state from detail score
  const activityDetail = details.activity;
  const activityState: DimensionState = activityDetail
    ? activityDetail.score >= 75 ? "green" : activityDetail.score >= 50 ? "yellow" : "red"
    : "grey";

  const statRows = [
    { icon: "🌙", label: "Sleep",     state: dims.sleep,   detail: details.sleep },
    { icon: "💚", label: "Readiness", state: dims.stress,  detail: details.stress },
    { icon: "👟", label: "Activity",  state: activityState, detail: activityDetail },
    { icon: "💊", label: "Meds",      state: dims.meds,    detail: details.meds },
  ] as const;

  const recommended = new Set(state.recommended_actions);
  const orderedActions = [
    ...ALL_ACTIONS.filter((a) => recommended.has(a)),
    ...ALL_ACTIONS.filter((a) => !recommended.has(a)),
  ];

  return (
    <div className="flex flex-col items-center gap-3">

      {/* ── Sleeping banner ── */}
      {state.is_sleeping && (
        <div
          className="w-full p-3 text-center font-pixel text-[7px]"
          style={{ background: "#ede0f5", color: "#8060a0", border: "2px solid #8060a0", boxShadow: "2px 2px 0 0 #8060a0" }}
        >
          ZZZ {name} IS RESTING — SEND A QUIET TEXT
        </div>
      )}

      {/* ── Name header ── */}
      <p className="font-pixel text-[11px] tracking-widest" style={{ color: "#2c1a0e" }}>
        {name}
      </p>

      {/* ── Egg ── */}
      <div className="relative">
        <EggCharacter
          base={state.base}
          isSleeping={state.is_sleeping}
          supported={state.supported}
          size="lg"
        />
        {state.is_sleeping && (
          <span className="absolute -right-2 -top-2 font-pixel text-[8px] animate-pixel-pulse" style={{ color: "#7c5cbf" }}>
            ZZZ
          </span>
        )}
      </div>

      {/* ── HP bars ── */}
      <div className="w-full space-y-2 mt-1">
        {statRows.map(({ icon, label, state: dimState, detail }, i) => (
          <PixelHPBar
            key={label}
            icon={icon}
            label={label}
            state={dimState}
            detail={detail}
            animDelay={i * 70}
          />
        ))}
      </div>

      {/* ── How to help ── */}
      <div className="w-full mt-1">
        <p className="mb-2 font-pixel text-[7px] tracking-widest" style={{ color: "#c9856a" }}>
          ★ HOW TO HELP
        </p>
        <div className="flex flex-col gap-2">
          {orderedActions.map((action) => (
            <PixelActionButton
              key={action}
              action={action}
              phone={friendPhone}
              isSleeping={state.is_sleeping}
              recommended={recommended.has(action)}
              onAction={handleSupport}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
