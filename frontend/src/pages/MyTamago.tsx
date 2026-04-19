import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { DimensionDetail, DimensionState, EggState, MedicationLog, ScheduledMedication, SupportActionOut } from "../types";
import { usePhone } from "../hooks/usePhone";
import { useMySlug } from "../hooks/usePhone";
import { api } from "../api/client";
import { MOCK_TAMAGO_STATE, MOCK_SUPPORT_ACTIONS } from "../mocks/data";
import EggCharacter from "../components/EggCharacter";
import SupportBadge from "../components/SupportBadge";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

// ── Pixel HP Bar ────────────────────────────────────────────
const STATE_COLORS: Record<DimensionState, { fill: string; glow: string; label: string }> = {
  green:  { fill: "#22c55e", glow: "#86efac", label: "GOOD" },
  yellow: { fill: "#eab308", glow: "#fde047", label: "OK" },
  red:    { fill: "#ef4444", glow: "#fca5a5", label: "LOW" },
  grey:   { fill: "#9ca3af", glow: "#e5e7eb", label: "N/A" },
};

const STAT_ICONS: Record<string, string> = {
  sleep: "🌙",
  stress: "💚",
  meds: "💊",
  activity: "👟",
};

function PixelHPBar({
  label,
  statKey,
  state,
  detail,
  animDelay = 0,
}: {
  label: string;
  statKey: string;
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
      style={{ animationDelay: `${animDelay}ms`, animation: "fadeInUp 0.4s ease-out both" }}
    >
      {/* Header row */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-pixel text-[7px] tracking-wide" style={{ color: "#2c1a0e" }}>
          {STAT_ICONS[statKey]} {label.toUpperCase()}
        </span>
        <span
          className="font-pixel text-[7px]"
          style={{ color: colors.fill }}
        >
          {state === "grey" ? "- - -" : `${score} HP`}
        </span>
      </div>

      {/* HP Blocks */}
      <div className="mb-1.5 flex gap-0.5">
        {Array.from({ length: totalBlocks }).map((_, i) => (
          <div
            key={i}
            className="h-4 flex-1 border border-black/20"
            style={{
              backgroundColor: i < filledBlocks ? colors.fill : "#e5e0d0",
              boxShadow: i < filledBlocks ? `0 0 4px ${colors.glow}` : "none",
              imageRendering: "pixelated",
            }}
          />
        ))}
      </div>

      {/* Sub-label + sparkline */}
      <div className="flex items-end justify-between gap-2">
        <div>
          {detail?.label && (
            <p className="font-pixel text-[6px]" style={{ color: "#6b4c35" }}>
              {detail.label}
            </p>
          )}
          {detail?.sublabel && (
            <p className="font-pixel text-[5px] mt-0.5" style={{ color: "#9a8070" }}>
              {detail.sublabel}
            </p>
          )}
        </div>

        {/* Mini sparkline pixel bars (7-day history) */}
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
                    imageRendering: "pixelated",
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Status badge */}
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

// ── Pixel vitals row ────────────────────────────────────────
function PixelVitals({ steps, hrv, rhr }: { steps?: number; hrv?: number; rhr?: number }) {
  const items = [
    { icon: "👟", label: "STEPS", value: steps != null ? steps.toLocaleString() : "—" },
    { icon: "❤️", label: "RHR", value: rhr != null ? `${rhr}bpm` : "—" },
    { icon: "〰️", label: "HRV", value: hrv != null ? `${hrv}ms` : "—" },
  ];
  return (
    <div className="flex gap-2 w-full">
      {items.map(({ icon, label, value }) => (
        <div key={label} className="pixel-box-sm flex-1 p-2 text-center">
          <div className="text-sm">{icon}</div>
          <div className="font-pixel text-[5px] mt-1" style={{ color: "#9a8070" }}>{label}</div>
          <div className="font-pixel text-[7px] mt-0.5" style={{ color: "#2c1a0e" }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// ── Onboarding ──────────────────────────────────────────────
function Onboarding({ onCreated }: { onCreated: (slug: string) => void }) {
  const { setPhone } = usePhone();
  const [step, setStep] = useState(1);
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");

  const handleCreate = async () => {
    if (!phoneInput.trim() || !nameInput.trim()) return;
    if (USE_MOCKS) {
      setPhone(phoneInput.trim());
      setCreatedSlug("my-egg");
      setStep(2);
      return;
    }
    try {
      const user = await api.createUser(phoneInput.trim(), nameInput.trim());
      setPhone(phoneInput.trim());
      setCreatedSlug(user.slug);
      setStep(2);
    } catch {
      // handle error
    }
  };

  const handleConnectOura = async () => {
    if (USE_MOCKS) { setStep(3); return; }
    try {
      const { url } = await api.getOuraConnectUrl(createdSlug);
      window.location.href = url;
    } catch {
      setStep(3);
    }
  };

  if (step === 1) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8">
        <span className="text-6xl">&#x1F95A;</span>
        <h1 className="text-2xl font-extrabold text-gray-700">Create Your Tamago</h1>
        <div className="w-full rounded-kawaii bg-white p-6 shadow-md">
          <label className="mb-1 block text-xs font-semibold text-gray-500">Phone number</label>
          <input
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-300"
          />
          <label className="mb-1 block text-xs font-semibold text-gray-500">Name your egg</label>
          <input
            type="text"
            placeholder="Sarah's Egg"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-300"
          />
          <button
            onClick={handleCreate}
            className="w-full rounded-xl bg-tamago-accent py-3 font-bold text-white transition-transform active:scale-95"
          >
            Create My Tamago
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8">
        <span className="text-6xl">&#x1F48D;</span>
        <h1 className="text-2xl font-extrabold text-gray-700">Connect Your Oura Ring</h1>
        <p className="text-center text-sm text-gray-500">
          We use Oura to track your sleep and readiness.
        </p>
        <div className="w-full rounded-kawaii bg-white p-6 shadow-md">
          <button
            onClick={handleConnectOura}
            className="mb-2 w-full rounded-xl bg-tamago-accent py-3 font-bold text-white transition-transform active:scale-95"
          >
            Connect Oura Ring &#x1F517;
          </button>
          <button
            onClick={() => setStep(3)}
            className="w-full py-2 text-sm font-semibold text-gray-400"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 pt-8">
      <span className="text-6xl">&#x1F389;</span>
      <h1 className="text-2xl font-extrabold text-gray-700">Your Tamago is Ready!</h1>
      <p className="text-center text-sm text-gray-500">
        Share it with your support crew so they can check on you
      </p>
      <button
        onClick={() => onCreated(createdSlug)}
        className="rounded-xl bg-tamago-accent px-8 py-3 font-bold text-white transition-transform active:scale-95"
      >
        View My Tamago
      </button>
    </div>
  );
}

const _d = new Date();
const TODAY = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, "0")}-${String(_d.getDate()).padStart(2, "0")}`;
const UID = "user_mia";

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function MyTamago() {
  const { slug, setSlug } = useMySlug();
  const [state, setState] = useState<EggState | null>(null);
  const [support, setSupport] = useState<SupportActionOut[]>([]);
  const [schedule, setSchedule] = useState<ScheduledMedication[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    if (USE_MOCKS) {
      setState(MOCK_TAMAGO_STATE);
      setSupport(MOCK_SUPPORT_ACTIONS);
      setLoading(false);
      return;
    }
    api.getTamagoState(slug)
      .then(setState)
      .catch(() => setState(MOCK_TAMAGO_STATE))   // fall back to demo data if API is down
      .finally(() => setLoading(false));
    api.getTodaySupport(slug).then(setSupport).catch(() => setSupport([]));
    api.getSchedule(UID).then(setSchedule).catch(() => {});
    api.getLogs(UID, TODAY).then(setTodayLogs).catch(() => {});
  }, [slug]);

  if (!slug) return <Onboarding onCreated={setSlug} />;

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16">
        <div className="h-52 w-52 animate-pulse rounded-full bg-white/50" />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="pt-16 text-center">
        <p className="text-lg font-semibold text-gray-600">Could not load your tamago</p>
      </div>
    );
  }

  const handleInvite = async () => {
    if (!invitePhone.trim()) return;
    if (!USE_MOCKS) await api.sendInvite(slug, invitePhone.trim()).catch(() => {});
    setInviteSent(true);
    setInvitePhone("");
    setTimeout(() => setInviteSent(false), 3000);
  };

  const handleRefresh = async () => {
    if (USE_MOCKS) return;
    const updated = await api.refreshHealth(slug);
    setState(updated);
  };

  const ACTION_EMOJI: Record<string, string> = {
    text: "💬", call: "📞", facetime: "📹", coffee: "☕", food: "🍕",
  };

  const dims = state.dimensions;
  const details = state.dimension_details ?? {};
  const statRows = [
    { key: "sleep",  label: "Sleep",  state: dims.sleep,  detail: details.sleep },
    { key: "stress", label: "Stress", state: dims.stress, detail: details.stress },
    { key: "meds",   label: "Meds",   state: dims.meds,   detail: details.meds },
  ] as const;

  return (
    <div className="flex flex-col items-center gap-3">

      {/* ── MY STATS image header ── */}
      <img
        src="/my-stats.png"
        alt="My Stats"
        className="w-56 object-contain"
        style={{ marginBottom: "-8px" }}
      />

      {/* ── Egg character (tight spacing) ── */}
      <div className="relative">
        <EggCharacter
          base={state.base}
          isSleeping={state.is_sleeping}
          supported={state.supported}
          size="lg"
        />
        {state.is_sleeping && (
          <span
            className="absolute -right-2 -top-2 font-pixel text-[8px] animate-pixel-pulse"
            style={{ color: "#7c5cbf" }}
          >
            ZZZ
          </span>
        )}
      </div>

      {/* ── Pixel stat bars ── */}
      <div className="w-full space-y-2 mt-1">
        {statRows.map(({ key, label, state: dimState, detail }, i) => (
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

      {/* ── Vitals row ── */}
      {state.vitals && (
        <PixelVitals
          steps={state.vitals.steps}
          hrv={state.vitals.hrv}
          rhr={state.vitals.resting_hr}
        />
      )}

      {/* ── Refresh button ── */}
      <button
        onClick={handleRefresh}
        className="pixel-box-sm w-full py-2 font-pixel text-[7px] text-center transition-transform active:scale-95"
        style={{ color: "#6b4c35" }}
      >
        ↻ REFRESH DATA
      </button>

      {/* ── Invite section ── */}
      <div className="pixel-box w-full p-4">
        <h3 className="mb-3 font-pixel text-[7px]" style={{ color: "#2c1a0e" }}>INVITE SUPPORTERS</h3>
        <div className="flex gap-2">
          <input
            type="tel"
            placeholder="Phone number"
            value={invitePhone}
            onChange={(e) => setInvitePhone(e.target.value)}
            className="flex-1 border-2 border-[#2c1a0e] px-3 py-2 text-sm outline-none focus:border-tamago-accent font-body bg-[#fffef5]"
          />
          <button
            onClick={handleInvite}
            className="border-2 border-[#2c1a0e] px-4 py-2 font-pixel text-[7px] bg-tamago-accent text-white transition-transform active:scale-95"
            style={{ boxShadow: "2px 2px 0 0 #2c1a0e" }}
          >
            SEND
          </button>
        </div>
        {inviteSent && (
          <p className="mt-2 text-center font-pixel text-[7px]" style={{ color: "#22c55e" }}>
            ✓ INVITE SENT!
          </p>
        )}
      </div>

      {/* ── Today's medications ── */}
      {schedule.length > 0 && (
        <div className="pixel-box w-full p-4">
          <h3 className="mb-3 font-pixel text-[7px]" style={{ color: "#2c1a0e" }}>💊 TODAY'S MEDS</h3>
          <div className="divide-y divide-[#e8d8c0]">
            {schedule.map((med) => {
              const log = todayLogs.find(
                (l) => l.medication_name.toLowerCase() === med.medication_name.toLowerCase()
              );
              const taken = !!log;
              const scheduledStr = med.scheduled_times.map((t) => {
                const [h, m] = t.split(":").map(Number);
                const d = new Date(); d.setHours(h, m, 0);
                return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
              }).join(", ");
              return (
                <div key={med.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-pixel text-[7px]" style={{ color: "#6b4c35" }}>{med.medication_name}</p>
                    <p className="font-pixel text-[5px] mt-1" style={{ color: "#b8a898" }}>
                      {med.dose}{med.unit ? ` ${med.unit}` : ""} · {scheduledStr}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    {taken ? (
                      <span className="pill pill-green font-pixel" style={{ fontSize: "5px" }}>✓ TAKEN</span>
                    ) : (
                      <span className="pill pill-grey font-pixel" style={{ fontSize: "5px" }}>PENDING</span>
                    )}
                    {log?.taken_at && (
                      <span className="font-pixel text-[5px]" style={{ color: "#b8a898" }}>{formatTime(log.taken_at)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            to="/meds"
            className="mt-3 flex w-full items-center justify-center gap-1.5 border-2 border-[#2c1a0e] py-2 font-pixel text-[6px] transition-colors hover:bg-[#fdf0e8]"
            style={{ color: "#8b7060" }}
          >
            📋 VIEW FULL HISTORY
          </Link>
        </div>
      )}

      {/* ── Today's support ── */}
      {support.length > 0 && (
        <div className="pixel-box w-full p-4">
          <h3 className="mb-3 font-pixel text-[7px]" style={{ color: "#2c1a0e" }}>TODAY'S SUPPORT</h3>
          <div className="space-y-2">
            {support.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className="text-sm">{ACTION_EMOJI[s.action_type] ?? "?"}</span>
                <span className="font-pixel text-[6px]" style={{ color: "#6b4c35" }}>{s.supporter_phone}</span>
                <span className="font-pixel text-[5px] ml-auto" style={{ color: "#b8a898" }}>
                  {new Date(s.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
