import { useState } from "react";
import { useParams } from "react-router-dom";
import type { ActionType, EggState, FeedItem } from "../types";
import { usePhone } from "../hooks/usePhone";
import { api } from "../api/client";
import { MOCK_FEED } from "../mocks/data";
import EggCharacter from "../components/EggCharacter";
import DimensionPanel from "../components/DimensionPanel";
import { ActionList } from "../components/ActionCard";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export default function FriendDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { phone, setPhone } = usePhone();

  const [state, setState] = useState<(EggState & { name?: string; phone?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState("");

  // Fetch on mount
  useState(() => {
    if (USE_MOCKS) {
      const mock = MOCK_FEED.find((f) => f.slug === slug) ?? MOCK_FEED[0];
      setState(mock);
      setLoading(false);
      return;
    }
    if (!slug) return;
    api.getTamagoState(slug)
      .then((data) => setState(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  const handleSupport = (action: ActionType) => {
    if (!slug || !phone) return;
    if (!USE_MOCKS) {
      api.logSupport(slug, phone, action).catch(() => {});
    }
    setState((prev) =>
      prev ? { ...prev, supported: true, support_count: prev.support_count + 1 } : prev
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16">
        <div className="h-40 w-40 animate-pulse rounded-full bg-white/50" />
        <div className="h-4 w-32 animate-pulse rounded bg-white/50" />
        <div className="h-24 w-full animate-pulse rounded-2xl bg-white/50" />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="pt-16 text-center">
        <p className="text-lg font-semibold" style={{ color: "#9a7a6a" }}>Tamago not found</p>
      </div>
    );
  }

  // Phone gate
  if (!phone) {
    return (
      <div className="flex flex-col items-center gap-6 pt-16">
        <EggCharacter base={state.base} isSleeping={state.is_sleeping} supported={state.supported} size="lg" />
        <h2 className="ghibli-heading text-2xl">{(state as FeedItem).name ?? "Friend's Egg"}</h2>
        <div className="w-full rounded-2xl bg-white/50 p-6 shadow-md backdrop-blur-sm">
          <p className="mb-3 text-center text-sm font-semibold" style={{ color: "#9a7a6a" }}>
            Enter your phone to support them
          </p>
          <input
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="mb-3 w-full rounded-xl border border-[#e8d8c8] bg-white/70 px-4 py-3 text-center text-lg outline-none focus:border-[#c9856a]"
          />
          <button
            onClick={() => { if (phoneInput.trim()) setPhone(phoneInput.trim()); }}
            className="w-full rounded-xl py-3 font-bold text-white transition-transform active:scale-95"
            style={{ backgroundColor: "#c9856a" }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const friendPhone = (state as FeedItem).phone ?? "";
  const name = (state as FeedItem).name ?? "Friend";

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Sleeping banner */}
      {state.is_sleeping && (
        <div
          className="w-full rounded-2xl px-4 py-3 text-center text-sm font-bold"
          style={{ background: "#ede0f5", color: "#8060a0" }}
        >
          💤 {name} is resting — send a quiet text instead
        </div>
      )}

      <h2 className="ghibli-heading text-2xl">{name}</h2>

      {/* Egg · dimension panel */}
      <div className="flex w-full items-center gap-4 px-2">
        <div className="flex shrink-0 items-center justify-center">
          <EggCharacter
            base={state.base}
            isSleeping={state.is_sleeping}
            supported={state.supported}
            size="md"
          />
        </div>
        <div className="flex-1 rounded-2xl bg-white/40 p-4 backdrop-blur-sm">
          <DimensionPanel
            dimensions={state.dimensions}
            details={state.dimension_details}
            muted={state.is_sleeping}
          />
        </div>
      </div>

      {/* Action section */}
      <div className="w-full">
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: "#c9856a" }}>
          How to help
        </p>
        <ActionList
          phone={friendPhone}
          isSleeping={state.is_sleeping}
          recommendedActions={state.recommended_actions}
          onAction={handleSupport}
        />
      </div>
    </div>
  );
}
