import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { EggState, MedicationLog, ScheduledMedication, SupportActionOut } from "../types";
import { usePhone } from "../hooks/usePhone";
import { useMySlug } from "../hooks/usePhone";
import { api } from "../api/client";
import { MOCK_TAMAGO_STATE, MOCK_SUPPORT_ACTIONS } from "../mocks/data";
import EggCharacter from "../components/EggCharacter";
import DimensionDots from "../components/DimensionDots";
import SupportBadge from "../components/SupportBadge";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

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
      // After Oura OAuth, the callback will redirect back; step 3 loads on return
    } catch {
      setStep(3); // let them skip if backend isn't wired yet
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
          We use Oura to track your sleep and readiness. You'll be taken to Oura's login page.
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

  // Step 3: Success
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

  // Fetch on mount if we have a slug
  useState(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    if (USE_MOCKS) {
      setState(MOCK_TAMAGO_STATE);
      setSupport(MOCK_SUPPORT_ACTIONS);
      setLoading(false);
      return;
    }
    api.getTamagoState(slug)
      .then((s) => setState(s))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.getTodaySupport(slug)
      .then(setSupport)
      .catch(() => setSupport([]));
  });

  useEffect(() => {
    if (!USE_MOCKS) {
      api.getSchedule(UID).then(setSchedule).catch(() => {});
      api.getLogs(UID, TODAY).then(setTodayLogs).catch(() => {});
    }
  }, []);

  if (!slug) {
    return <Onboarding onCreated={setSlug} />;
  }

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
    if (!USE_MOCKS) {
      await api.sendInvite(slug, invitePhone.trim()).catch(() => {});
    }
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
    text: "\u{1F4AC}",
    call: "\u{1F4DE}",
    facetime: "\u{1F4F9}",
    coffee: "\u{2615}",
    food: "\u{1F355}",
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <h1 className="text-2xl font-extrabold text-gray-700">My Tamago</h1>

      <EggCharacter base={state.base} isSleeping={state.is_sleeping} supported={state.supported} size="lg" />

      <DimensionDots dimensions={state.dimensions} />

      <SupportBadge count={state.support_count} />

      <button
        onClick={handleRefresh}
        className="rounded-xl bg-white px-6 py-2 text-sm font-semibold text-gray-500 shadow-md transition-transform active:scale-95"
      >
        &#x1F504; Refresh Health Data
      </button>

      {/* Invite section */}
      <div className="w-full rounded-kawaii bg-white p-5 shadow-md">
        <h3 className="mb-3 text-sm font-bold text-gray-700">Invite Supporters</h3>
        <div className="flex gap-2">
          <input
            type="tel"
            placeholder="Phone number"
            value={invitePhone}
            onChange={(e) => setInvitePhone(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-pink-300"
          />
          <button
            onClick={handleInvite}
            className="rounded-xl bg-tamago-accent px-4 py-2 text-sm font-bold text-white transition-transform active:scale-95"
          >
            Send
          </button>
        </div>
        {inviteSent && (
          <p className="mt-2 text-center text-xs font-semibold text-green-500">Invite sent!</p>
        )}
      </div>

      {/* Today's medications */}
      {schedule.length > 0 && (
        <div className="w-full rounded-kawaii bg-white p-5 shadow-md">
          <h3 className="mb-3 text-sm font-bold" style={{ color: "#8b7060" }}>💊 Today's Medications</h3>
          <div className="divide-y divide-[#f0e8de]/80">
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
                    <p className="text-sm font-semibold" style={{ color: "#6b4c35" }}>{med.medication_name}</p>
                    <p className="text-xs" style={{ color: "#b8a898" }}>
                      {med.dose}{med.unit ? ` ${med.unit}` : ""} · {scheduledStr}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    {taken ? (
                      <span className="pill pill-green">✓ Taken</span>
                    ) : (
                      <span className="pill pill-grey">— Pending</span>
                    )}
                    {log?.taken_at && (
                      <span className="text-[10px]" style={{ color: "#b8a898" }}>{formatTime(log.taken_at)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            to="/meds"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#e8d8c8] py-2 text-xs font-semibold transition-colors hover:bg-[#fdf0e8]"
            style={{ color: "#8b7060" }}
          >
            📋 View Full History
          </Link>
        </div>
      )}

      {/* Today's support */}
      {support.length > 0 && (
        <div className="w-full rounded-kawaii bg-white p-5 shadow-md">
          <h3 className="mb-3 text-sm font-bold text-gray-700">Today's Support</h3>
          <div className="space-y-2">
            {support.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-sm text-gray-600">
                <span>{ACTION_EMOJI[s.action_type] ?? "?"}</span>
                <span>{s.supporter_phone}</span>
                <span className="text-gray-400">
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
