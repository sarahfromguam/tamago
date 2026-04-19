import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";
import type {
  CircleMember,
  DimensionVisibility,
  EggState,
  SupportActionOut,
} from "../types";
import { usePhone } from "../hooks/usePhone";
import { useMySlug } from "../hooks/usePhone";
import { api } from "../api/client";
import { MOCK_TAMAGO_STATE, MOCK_SUPPORT_ACTIONS } from "../mocks/data";
import EggCharacter from "../components/EggCharacter";
import { PixelHPBar, PixelVitals } from "../components/PixelHPBar";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

// ── My Circle ───────────────────────────────────────────────
const TIER_LABEL: Record<number, string> = { 1: "TIER 1", 2: "TIER 2" };
const TIER_COLOR: Record<number, string> = { 1: "#c9856a", 2: "#9a8070" };

function CircleSection({ slug }: { slug: string }) {
  const [circle, setCircle] = useState<CircleMember[]>([]);

  useEffect(() => {
    api.getCircle(slug).then(setCircle).catch(() => {});
  }, [slug]);

  if (!circle.length) return null;

  return (
    <div className="pixel-box w-full p-4">
      <h3 className="mb-3 font-pixel text-[7px]" style={{ color: "#2c1a0e" }}>👥 MY CIRCLE</h3>
      <div className="flex flex-col gap-2">
        {circle.map((m) => (
          <div key={m.phone} className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white text-xs"
              style={{ backgroundColor: TIER_COLOR[m.tier] ?? "#9a8070" }}
            >
              {m.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-pixel text-[7px]" style={{ color: "#2c1a0e" }}>{m.name}</p>
              <p className="font-pixel text-[5px]" style={{ color: "#9a8070" }}>{m.relationship}</p>
            </div>
            <span
              className="font-pixel text-[5px] px-1.5 py-0.5 border"
              style={{ color: TIER_COLOR[m.tier] ?? "#9a8070", borderColor: TIER_COLOR[m.tier] ?? "#9a8070" }}
            >
              {TIER_LABEL[m.tier] ?? "CIRCLE"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Supporters ─────────────────────────────────────────────
interface Supporter {
  name: string;
  emoji: string;
  color: string;
  actions: string[];
  role: "caregiver" | "friend";
}

const SEED_SUPPORTERS: Supporter[] = [
  { name: "Emma",   emoji: "🌸", color: "#e8a0bf", actions: ["☕", "💬", "📞"], role: "caregiver" },
  { name: "Jake",   emoji: "🌿", color: "#7cb894", actions: ["🍕", "💬"],       role: "friend"    },
  { name: "Mia",    emoji: "🌙", color: "#9b8ec4", actions: ["📹", "☕", "💬"], role: "caregiver" },
  { name: "Liam",   emoji: "🔥", color: "#d4845a", actions: ["🍕", "🎁"],       role: "friend"    },
  { name: "Sophie", emoji: "✨", color: "#c9a84c", actions: ["💬"],             role: "friend"    },
];

function SupportersSection() {
  return (
    <div className="pixel-box w-full p-4">
      <h3 className="mb-3 font-pixel text-[7px]" style={{ color: "#2c1a0e" }}>
        💛 MY SUPPORTERS
      </h3>
      <div className="flex flex-col gap-2.5">
        {SEED_SUPPORTERS.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base"
              style={{ backgroundColor: s.color + "30", border: `2px solid ${s.color}` }}
            >
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-pixel text-[7px]" style={{ color: "#2c1a0e" }}>{s.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {s.actions.map((a, i) => (
                  <span key={i} className="text-xs">{a}</span>
                ))}
              </div>
            </div>
            <span
              className="font-pixel text-[5px] px-1.5 py-0.5"
              style={s.role === "caregiver"
                ? { color: "#fff", backgroundColor: "#c9856a", border: "1px solid #a06840" }
                : { color: "#9a8070", backgroundColor: "#9a807018", border: "1px solid #9a807040" }
              }
            >
              {s.role === "caregiver" ? "CAREGIVER" : "FRIEND"}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center font-pixel text-[5px]" style={{ color: "#b8a898" }}>
        {SEED_SUPPORTERS.length} PEOPLE SUPPORTING YOU
      </p>
      <p className="mt-1 text-center font-pixel text-[4.5px]" style={{ color: "#c9856a" }}>
        CAREGIVERS GET TEXTED WHEN THINGS ARE DIRE
      </p>
    </div>
  );
}

// ── QR Share ────────────────────────────────────────────────
function QRShare({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const url = `${window.location.origin}/t/${slug}`;

  return (
    <div className="pixel-box w-full p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <h3 className="font-pixel text-[7px]" style={{ color: "#2c1a0e" }}>📱 SHARE YOUR TAMAGO</h3>
        <span className="font-pixel text-[7px]" style={{ color: "#9a8070" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col items-center gap-3">
          <div className="rounded-xl bg-white p-3 shadow-inner">
            <QRCodeSVG value={url} size={160} level="M" />
          </div>
          <p className="font-pixel text-[6px] text-center break-all" style={{ color: "#9a8070" }}>{url}</p>
          <button
            onClick={() => navigator.clipboard?.writeText(url)}
            className="border-2 border-[#2c1a0e] px-4 py-1.5 font-pixel text-[6px] transition-transform active:scale-95"
            style={{ color: "#6b4c35", boxShadow: "2px 2px 0 0 #2c1a0e" }}
          >
            COPY LINK
          </button>
        </div>
      )}
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
    } catch { /* noop */ }
  };

  const handleConnectOura = async () => {
    if (USE_MOCKS) { setStep(3); return; }
    try {
      const { url } = await api.getOuraConnectUrl(createdSlug);
      window.location.href = url;
    } catch { setStep(3); }
  };

  if (step === 1) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8">
        <span className="text-6xl">🥚</span>
        <h1 className="text-2xl font-extrabold text-gray-700">Create Your Tamago</h1>
        <div className="w-full rounded-kawaii bg-white p-6 shadow-md">
          <label className="mb-1 block text-xs font-semibold text-gray-500">Phone number</label>
          <input type="tel" placeholder="+1 (555) 123-4567" value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-300" />
          <label className="mb-1 block text-xs font-semibold text-gray-500">Name your egg</label>
          <input type="text" placeholder="Sarah's Egg" value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-300" />
          <button onClick={handleCreate}
            className="w-full rounded-xl bg-tamago-accent py-3 font-bold text-white transition-transform active:scale-95">
            Create My Tamago
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8">
        <span className="text-6xl">💍</span>
        <h1 className="text-2xl font-extrabold text-gray-700">Connect Your Oura Ring</h1>
        <div className="w-full rounded-kawaii bg-white p-6 shadow-md">
          <button onClick={handleConnectOura}
            className="mb-2 w-full rounded-xl bg-tamago-accent py-3 font-bold text-white transition-transform active:scale-95">
            Connect Oura Ring 🔗
          </button>
          <button onClick={() => setStep(3)} className="w-full py-2 text-sm font-semibold text-gray-400">
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 pt-8">
      <span className="text-6xl">🎉</span>
      <h1 className="text-2xl font-extrabold text-gray-700">Your Tamago is Ready!</h1>
      <button onClick={() => onCreated(createdSlug)}
        className="rounded-xl bg-tamago-accent px-8 py-3 font-bold text-white transition-transform active:scale-95">
        View My Tamago
      </button>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────
const UID = "user_mia";

const DEFAULT_VIS: DimensionVisibility = { sleep: true, stress: true, meds: true, activity: true };

export default function MyTamago() {
  const { slug, setSlug } = useMySlug();
  const [state, setState] = useState<EggState | null>(null);
  const [visibility, setVisibilityState] = useState<DimensionVisibility>(DEFAULT_VIS);
  const [support, setSupport] = useState<SupportActionOut[]>([]);
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [supporting, setSupporting] = useState(false);
  const [supportStatus, setSupportStatus] = useState<"idle" | "sent" | "error">("idle");
  const [loading, setLoading] = useState(true);
  const [transitionTo, setTransitionTo] = useState<import("../types").EggBase | null>(null);

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
      .catch(() => setState(MOCK_TAMAGO_STATE))
      .finally(() => setLoading(false));
    api.getTodaySupport(slug).then(setSupport).catch(() => setSupport([]));
    api.getVisibility(slug).then(setVisibilityState).catch(() => {});

    const poll = setInterval(() => {
      api.getTamagoState(slug).then(setState).catch(() => {});
    }, 8000);
    return () => clearInterval(poll);
  }, [slug]);

  const toggleDimension = (key: keyof DimensionVisibility) => {
    if (!slug) return;
    const next = { ...visibility, [key]: !visibility[key] };
    setVisibilityState(next);
    api.setVisibility(slug, next).catch(() => {});
  };

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

  const handleGetSupport = async () => {
    setSupporting(true);
    setSupportStatus("idle");
    try {
      await api.getSupport(UID);
      setSupportStatus("sent");
    } catch {
      setSupportStatus("error");
    } finally {
      setSupporting(false);
      setTimeout(() => setSupportStatus("idle"), 4000);
    }
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
    { key: "meds"   , label: "Meds",     dimKey: "meds"     as keyof DimensionVisibility, state: dims.meds,   detail: details.meds     },
    { key: "sleep"  , label: "Sleep",    dimKey: "sleep"    as keyof DimensionVisibility, state: dims.sleep,  detail: details.sleep    },
    { key: "stress" , label: "Stress",   dimKey: "stress"   as keyof DimensionVisibility, state: dims.stress, detail: details.stress   },
    { key: "activity", label: "Activity", dimKey: "activity" as keyof DimensionVisibility, state: (details.activity?.score ?? 0) >= 75 ? "green" as const : (details.activity?.score ?? 0) >= 50 ? "yellow" as const : details.activity ? "red" as const : "grey" as const, detail: details.activity },
  ];

  return (
    <div className="flex flex-col items-center gap-3">

      {/* Header image */}
      <img src="/my-stats.png" alt="My Stats" className="w-56 object-contain" style={{ marginBottom: "-8px" }} />

      {/* Egg */}
      <div className="relative" style={{ perspective: "600px" }}>
        <EggCharacter
          base={state.base}
          isSleeping={state.is_sleeping}
          supported={state.supported}
          size="lg"
          transitionTo={transitionTo}
          onTransitionEnd={() => {
            // Update the actual state after animation completes
            setState((prev) => prev ? { ...prev, base: transitionTo!, dimensions: { ...prev.dimensions, meds: "green" }, dimension_details: { ...prev.dimension_details, meds: { score: 100, label: "All taken", sublabel: "on schedule", history: [] } } } : prev);
            setTransitionTo(null);
          }}
        />
        {state.is_sleeping && (
          <span className="absolute -right-2 -top-2 font-pixel text-[8px] animate-pixel-pulse" style={{ color: "#7c5cbf" }}>
            ZZZ
          </span>
        )}
      </div>

      {/* Demo: simulate medication taken */}
      {state.base === "fried" && !transitionTo && (
        <button
          onClick={async () => {
            await api.takeMeds().catch(() => {});
            setTransitionTo("okay");
          }}
          className="border-2 border-[#2c1a0e] px-4 py-1.5 font-pixel text-[6px] transition-transform active:scale-95"
          style={{
            background: "#7c5cbf",
            color: "#fff",
            boxShadow: "2px 2px 0 0 #2c1a0e",
            opacity: 0.7,
          }}
        >
          DEMO: MEDS TAKEN
        </button>
      )}

      {/* ── Get Support button ── */}
      <div className="flex w-full justify-end">
        <button
          onClick={handleGetSupport}
          disabled={supporting}
          className="border-2 border-[#2c1a0e] px-3 py-1.5 font-pixel text-[6px] transition-transform active:scale-95 disabled:opacity-60"
          style={{
            backgroundColor: supportStatus === "sent" ? "#22c55e" : supportStatus === "error" ? "#ef4444" : "#c4a882",
            color: "#fff",
            boxShadow: "2px 2px 0 0 #2c1a0e",
          }}
        >
          {supporting ? "SENDING..." : supportStatus === "sent" ? "✓ SENT!" : supportStatus === "error" ? "✗ FAILED" : "🆘 GET SUPPORT"}
        </button>
      </div>

      {/* Visibility hint */}
      <p className="font-pixel text-[6px] text-center" style={{ color: "#9a8070" }}>
        TAP 👁️ TO SHOW/HIDE STATS FROM YOUR FRIENDS
      </p>

      {/* ── Pixel stat bars ── */}
      <div className="w-full space-y-2 mt-1">
        {statRows.map(({ key, label, dimKey, state: dimState, detail }, i) => (
          key === "meds" ? (
            <Link key={key} to="/meds" className="block">
              <PixelHPBar
                statKey={key}
                label={label}
                state={dimState}
                detail={detail}
                animDelay={i * 80}
                visible={visibility[dimKey]}
                onToggle={() => toggleDimension(dimKey)}
              />
            </Link>
          ) : (
            <PixelHPBar
              key={key}
              statKey={key}
              label={label}
              state={dimState}
              detail={detail}
              animDelay={i * 80}
              visible={visibility[dimKey]}
              onToggle={() => toggleDimension(dimKey)}
            />
          )
        ))}
      </div>

      {/* Vitals */}
      {state.vitals && (
        <PixelVitals steps={state.vitals.steps} hrv={state.vitals.hrv} rhr={state.vitals.resting_hr} />
      )}

      {/* Refresh */}
      <button onClick={handleRefresh}
        className="pixel-box-sm w-full py-2 font-pixel text-[7px] text-center transition-transform active:scale-95"
        style={{ color: "#6b4c35" }}>
        ↻ REFRESH DATA
      </button>

      {/* Supporters */}
      <SupportersSection />

      {/* QR share */}
      <QRShare slug={slug} />

      {/* My Circle */}
      <CircleSection slug={slug} />

      {/* Invite */}
      <div className="pixel-box w-full p-4">
        <h3 className="mb-3 font-pixel text-[7px]" style={{ color: "#2c1a0e" }}>INVITE SUPPORTERS</h3>
        <div className="flex gap-2">
          <input type="tel" placeholder="Phone number" value={invitePhone}
            onChange={(e) => setInvitePhone(e.target.value)}
            className="flex-1 border-2 border-[#2c1a0e] px-3 py-2 text-sm outline-none focus:border-tamago-accent font-body bg-[#fffef5]" />
          <button onClick={handleInvite}
            className="border-2 border-[#2c1a0e] px-4 py-2 font-pixel text-[7px] bg-tamago-accent text-white transition-transform active:scale-95"
            style={{ boxShadow: "2px 2px 0 0 #2c1a0e" }}>
            SEND
          </button>
        </div>
        {inviteSent && (
          <p className="mt-2 text-center font-pixel text-[7px]" style={{ color: "#22c55e" }}>✓ INVITE SENT!</p>
        )}
      </div>


      {/* Today's support received */}
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
