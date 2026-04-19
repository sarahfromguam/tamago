import { useEffect, useState } from "react";
import type { MedicationLog, ScheduledMedication } from "../types";
import { api } from "../api/client";

const UID = "user_mia";

const _d = new Date();
const TODAY = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, "0")}-${String(_d.getDate()).padStart(2, "0")}`;

function formatScheduledTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (localDate === TODAY) return formatTime(iso) ?? "—";
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " · " + formatTime(iso);
}

function SourceBadge({ source, confidence }: { source: string; confidence: number | null }) {
  if (source === "webhook" || source === "realtime") {
    return (
      <span className="pill pill-green">
        🎙 Omi{confidence !== null ? ` ${Math.round(confidence * 100)}%` : ""}
      </span>
    );
  }
  return <span className="pill pill-grey">✏️ Manual</span>;
}

function StatusPill({ taken }: { taken: boolean }) {
  return taken
    ? <span className="pill pill-green">✓ Taken</span>
    : <span className="pill pill-grey">— Pending</span>;
}

interface ScheduleRowProps {
  med: ScheduledMedication;
  takenLogs: MedicationLog[];
}

function ScheduleRow({ med, takenLogs }: ScheduleRowProps) {
  const taken = takenLogs.some(
    (l) => l.medication_name.toLowerCase() === med.medication_name.toLowerCase()
  );
  const log = takenLogs.find(
    (l) => l.medication_name.toLowerCase() === med.medication_name.toLowerCase()
  );

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-[#f0e8de]/80 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl">💊</span>
        <div className="min-w-0">
          <p className="font-bold text-base truncate" style={{ color: "#6b4c35" }}>
            {med.medication_name}
          </p>
          <p className="text-base" style={{ color: "#b8a898" }}>
            {med.dose}{med.unit ? ` ${med.unit}` : ""} · {med.scheduled_times.map(formatScheduledTime).join(", ")}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <StatusPill taken={taken} />
        {log && (
          <span className="text-[16px]" style={{ color: "#b8a898" }}>
            {formatTime(log.taken_at)}
          </span>
        )}
      </div>
    </div>
  );
}

interface LogRowProps {
  log: MedicationLog;
}

function LogRow({ log }: LogRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-[#f0e8de]/80 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl">🕐</span>
        <div className="min-w-0">
          <p className="font-bold text-base truncate" style={{ color: "#6b4c35" }}>
            {log.medication_name}
          </p>
          {log.notes && (
            <p className="text-base italic truncate" style={{ color: "#b8a898" }}>
              "{log.notes}"
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <SourceBadge source={log.source} confidence={log.confidence_score} />
        <span className="text-[16px]" style={{ color: "#b8a898" }}>
          {formatDateTime(log.taken_at)}
        </span>
      </div>
    </div>
  );
}

export default function MedLog() {
  const [schedule, setSchedule] = useState<ScheduledMedication[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () =>
    Promise.all([
      api.getSchedule(UID),
      api.getLogs(UID, TODAY),
      api.getLogs(UID),
    ]).then(([sched, today, all]) => {
      setSchedule(sched);
      setTodayLogs(today);
      setRecentLogs(all.filter((l) => l.source !== "manual").slice(0, 20));
    }).catch(() => {});

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    const poll = setInterval(fetchData, 8000);
    return () => clearInterval(poll);
  }, []);

  const takenCount = schedule.filter((m) =>
    todayLogs.some((l) => l.medication_name.toLowerCase() === m.medication_name.toLowerCase())
  ).length;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="ghibli-heading text-center text-3xl">Medications</h1>

      {/* Today summary bar */}
      <div className="rounded-kawaii bg-white shadow-md p-4 flex items-center justify-between">
        <div>
          <p className="text-base font-semibold" style={{ color: "#b8a898" }}>TODAY</p>
          <p className="font-bold text-lg" style={{ color: "#6b4c35" }}>
            {new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
        {!loading && (
          <div className="text-right">
            <p className="text-2xl font-extrabold" style={{ color: takenCount === schedule.length && schedule.length > 0 ? "#3a7a4a" : "#c9856a" }}>
              {takenCount}/{schedule.length}
            </p>
            <p className="text-base" style={{ color: "#b8a898" }}>doses taken</p>
          </div>
        )}
      </div>

      {/* Today's schedule */}
      <div className="rounded-kawaii bg-white shadow-md p-4">
        <h2 className="text-base font-bold mb-1" style={{ color: "#8b7060" }}>📋 Today's Schedule</h2>
        <p className="text-[16px] mb-3" style={{ color: "#b8a898" }}>scheduled medications vs. logged doses</p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-[#f5ede4]/60" />
            ))}
          </div>
        ) : schedule.length === 0 ? (
          <p className="text-center text-base py-4" style={{ color: "#b8a898" }}>No schedule set up yet</p>
        ) : (
          schedule.map((med) => (
            <ScheduleRow key={med.id} med={med} takenLogs={todayLogs} />
          ))
        )}
      </div>

      {/* Recent log */}
      <div className="rounded-kawaii bg-white shadow-md p-4">
        <h2 className="text-base font-bold mb-1" style={{ color: "#8b7060" }}>🎙 Recent Detections</h2>
        <p className="text-[16px] mb-3" style={{ color: "#b8a898" }}>detected from Omi voice transcripts</p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-[#f5ede4]/60" />
            ))}
          </div>
        ) : recentLogs.length === 0 ? (
          <p className="text-center text-base py-4" style={{ color: "#b8a898" }}>No logs yet</p>
        ) : (
          recentLogs.map((log) => <LogRow key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
}
