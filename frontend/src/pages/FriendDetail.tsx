import { useState } from "react";
import { useParams } from "react-router-dom";
import type { ActionType, EggState, FeedItem } from "../types";
import { usePhone } from "../hooks/usePhone";
import { api } from "../api/client";
import { MOCK_FEED } from "../mocks/data";
import EggCharacter from "../components/EggCharacter";
import DimensionPanel from "../components/DimensionPanel";
import SupportButtons from "../components/SupportButtons";
import SupportBadge from "../components/SupportBadge";

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
    // Optimistic update
    setState((prev) =>
      prev ? { ...prev, supported: true, support_count: prev.support_count + 1 } : prev
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16">
        <div className="h-52 w-52 animate-pulse rounded-full bg-white/50" />
        <div className="h-4 w-32 animate-pulse rounded bg-white/50" />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="pt-16 text-center">
        <p className="text-lg font-semibold text-gray-600">Tamago not found</p>
      </div>
    );
  }

  // If supporter hasn't entered their phone yet
  if (!phone) {
    return (
      <div className="flex flex-col items-center gap-6 pt-16">
        <EggCharacter base={state.base} isSleeping={state.is_sleeping} supported={state.supported} size="lg" />
        <h2 className="text-xl font-bold text-gray-700">{(state as FeedItem).name ?? "Friend's Egg"}</h2>
        <div className="w-full rounded-kawaii bg-white p-6 shadow-md">
          <p className="mb-3 text-center text-sm font-semibold text-gray-600">
            Enter your phone to support them
          </p>
          <input
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg outline-none focus:border-pink-300"
          />
          <button
            onClick={() => { if (phoneInput.trim()) setPhone(phoneInput.trim()); }}
            className="w-full rounded-xl bg-tamago-accent py-3 font-bold text-white transition-transform active:scale-95"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const friendPhone = (state as FeedItem).phone ?? "";

  return (
    <div className="flex flex-col items-center gap-5">
      <h2
        className="ghibli-heading text-2xl"
        style={{ color: "#c9856a" }}
      >
        {(state as FeedItem).name ?? "Friend's Egg"}
      </h2>

      {/* Egg left · data right */}
      <div className="flex w-full items-center gap-4 px-2">
        <div className="flex shrink-0 items-center justify-center">
          <EggCharacter
            base={state.base}
            isSleeping={state.is_sleeping}
            supported={state.supported}
            size="md"
          />
        </div>

        {/* Technical data panel */}
        <div className="flex-1 rounded-2xl bg-white/40 p-4 backdrop-blur-sm">
          <DimensionPanel
            dimensions={state.dimensions}
            details={(state as FeedItem & { dimension_details?: EggState["dimension_details"] }).dimension_details}
            muted={state.is_sleeping}
          />
        </div>
      </div>

      <SupportButtons
        phone={friendPhone}
        isSleeping={state.is_sleeping}
        recommendedActions={state.recommended_actions}
        onAction={handleSupport}
      />

      <SupportBadge count={state.support_count} />

      {state.is_sleeping && (
        <p className="text-xs font-semibold" style={{ color: "#b8a0d0" }}>
          &#x1F4A4; resting — send a text instead
        </p>
      )}
    </div>
  );
}
