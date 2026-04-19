import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { ActionType, DimensionState, DimensionVisibility, EggState, FeedItem } from "../types";
// ActionType used by handleSupport
import { usePhone } from "../hooks/usePhone";
import { api } from "../api/client";
import { MOCK_FEED } from "../mocks/data";
import EggCharacter from "../components/EggCharacter";
import { PixelHPBar, PixelVitals, STATE_COLORS } from "../components/PixelHPBar";
import SupportButtons from "../components/SupportButtons";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";
const DEFAULT_VIS: DimensionVisibility = { sleep: true, stress: true, meds: true, activity: true };

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FriendDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { phone, setPhone } = usePhone();

  const [state, setState] = useState<(EggState & { name?: string; phone?: string }) | null>(null);
  const [visibility, setVisibility] = useState<DimensionVisibility>(DEFAULT_VIS);
  const [loading, setLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState("");

  useEffect(() => {
    if (!slug) return;
    if (USE_MOCKS) {
      const mock = MOCK_FEED.find((f) => f.slug === slug) ?? MOCK_FEED[0];
      setState(mock);
      setLoading(false);
      return;
    }
    Promise.all([api.getTamagoState(slug), api.getVisibility(slug)])
      .then(([data, vis]) => { setState(data); setVisibility(vis); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSupport = (action: ActionType) => {
    if (!slug || !phone) return;
    if (!USE_MOCKS) api.logSupport(slug, phone, action).catch(() => {});
    setState((prev) => prev ? { ...prev, supported: true, support_count: prev.support_count + 1 } : prev);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 pt-12">
        <div className="h-32 w-32 animate-pulse" style={{ background: "#e5e0d0" }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 w-full animate-pulse" style={{ background: "#e5e0d0" }} />
        ))}
      </div>
    );
  }

  if (!state) {
    return (
      <div className="pt-16 text-center">
        <p className="font-pixel text-[8px]" style={{ color: "#9a8070" }}>TAMAGO NOT FOUND</p>
      </div>
    );
  }

  // Phone gate
  if (!phone) {
    return (
      <div className="flex flex-col items-center gap-5 pt-12">
        <EggCharacter base={state.base} isSleeping={state.is_sleeping} supported={state.supported} size="lg" />
        <p className="font-pixel text-[9px]" style={{ color: "#2c1a0e" }}>
          {((state as FeedItem).name ?? "FRIEND").toUpperCase()}'S TAMAGO
        </p>
        <div className="pixel-box w-full p-5">
          <p className="mb-3 font-pixel text-[6px] text-center" style={{ color: "#9a8070" }}>
            ENTER YOUR PHONE TO SUPPORT THEM
          </p>
          <input
            type="tel" placeholder="+1 (555) 123-4567" value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="mb-3 w-full border-2 border-[#2c1a0e] bg-[#fffef5] px-3 py-2 text-center font-body text-sm outline-none focus:border-tamago-accent"
          />
          <button
            onClick={() => { if (phoneInput.trim()) setPhone(phoneInput.trim()); }}
            className="w-full border-2 border-[#2c1a0e] bg-tamago-accent py-2 font-pixel text-[7px] text-white transition-transform active:scale-95"
            style={{ boxShadow: "2px 2px 0 0 #2c1a0e" }}
          >
            CONTINUE
          </button>
        </div>
      </div>
    );
  }

  const friendPhone = (state as FeedItem).phone ?? "";
  const name = ((state as FeedItem).name ?? "Friend").toUpperCase();
  const details = state.dimension_details ?? {};
  const dims = state.dimensions;

  // Apply visibility filter
  const statRows = [
    { key: "sleep",    label: "Sleep",    dimKey: "sleep"    as keyof DimensionVisibility, dimState: dims.sleep,  detail: details.sleep    },
    { key: "stress",   label: "Stress",   dimKey: "stress"   as keyof DimensionVisibility, dimState: dims.stress, detail: details.stress   },
    { key: "activity", label: "Activity", dimKey: "activity" as keyof DimensionVisibility,
      dimState: (details.activity ? (details.activity.score >= 75 ? "green" : details.activity.score >= 50 ? "yellow" : "red") : "grey") as DimensionState,
      detail: details.activity },
    { key: "meds",     label: "Meds",     dimKey: "meds"     as keyof DimensionVisibility, dimState: dims.meds,   detail: details.meds     },
  ].filter(({ dimKey }) => visibility[dimKey] !== false);

  // Overall state color for the name badge
  const overallState = dims.sleep === "red" || dims.stress === "red" ? "red"
    : dims.sleep === "yellow" || dims.stress === "yellow" ? "yellow"
    : dims.sleep === "green" && dims.stress === "green" ? "green" : "grey";
  const nameColor = STATE_COLORS[overallState].fill;

  return (
    <div className="flex flex-col items-center gap-3">

      {/* Sleeping banner */}
      {state.is_sleeping && (
        <div
          className="w-full px-4 py-2 text-center font-pixel text-[7px]"
          style={{ background: "#ede0f5", color: "#8060a0", border: "2px solid #c8a0e0" }}
        >
          💤 {name} IS RESTING — SEND A QUIET TEXT
        </div>
      )}

      {/* Name + egg + action buttons */}
      <div className="flex w-full items-center gap-4">
        <EggCharacter
          base={state.base}
          isSleeping={state.is_sleeping}
          supported={state.supported}
          size="md"
        />
        <div className="flex flex-col gap-2">
          <p className="font-pixel text-[10px]" style={{ color: nameColor }}>{name}</p>
          <p className="font-pixel text-[6px]" style={{ color: "#9a8070" }}>
            {state.base.toUpperCase()}
          </p>
          <SupportButtons
            phone={friendPhone}
            isSleeping={state.is_sleeping}
            recommendedActions={state.recommended_actions}
            onAction={handleSupport}
          />
        </div>
      </div>

      {/* Stat bars */}
      <div className="w-full space-y-2">
        {statRows.map(({ key, label, dimState, detail }, i) => (
          <PixelHPBar
            key={key}
            statKey={key}
            label={label}
            state={dimState}
            detail={detail}
            animDelay={i * 80}
          />
        ))}
      </div>

      {/* Vitals */}
      {state.vitals && (
        <PixelVitals
          steps={state.vitals.steps}
          hrv={state.vitals.hrv}
          rhr={state.vitals.resting_hr}
        />
      )}

    </div>
  );
}
