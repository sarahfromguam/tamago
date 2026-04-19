import type { DimensionDetail, DimensionState } from "../types";

export const STATE_COLORS: Record<DimensionState, { fill: string; glow: string; label: string }> = {
  green:  { fill: "#22c55e", glow: "#86efac", label: "GOOD" },
  yellow: { fill: "#eab308", glow: "#fde047", label: "OK" },
  red:    { fill: "#ef4444", glow: "#fca5a5", label: "LOW" },
  grey:   { fill: "#9ca3af", glow: "#e5e7eb", label: "N/A" },
};

export const STAT_ICONS: Record<string, string> = {
  sleep: "🌙", stress: "💚", meds: "💊", activity: "👟",
};

interface PixelHPBarProps {
  label: string;
  statKey: string;
  state: DimensionState;
  detail?: DimensionDetail;
  animDelay?: number;
  /** Owner-mode: show visibility toggle */
  visible?: boolean;
  onToggle?: () => void;
}

export function PixelHPBar({
  label, statKey, state, detail, animDelay = 0, visible, onToggle,
}: PixelHPBarProps) {
  const score = detail?.score ?? 0;
  const totalBlocks = 10;
  const filledBlocks = state === "grey" ? 0 : Math.round((score / 100) * totalBlocks);
  const colors = STATE_COLORS[state];
  const history = detail?.history ?? [];
  const dimmed = visible === false;

  return (
    <div
      className="pixel-box w-full p-3"
      style={{
        animationDelay: `${animDelay}ms`,
        animation: "fadeInUp 0.4s ease-out both",
        opacity: dimmed ? 0.4 : 1,
      }}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-pixel text-[7px] tracking-wide" style={{ color: "#2c1a0e" }}>
          {STAT_ICONS[statKey]} {label.toUpperCase()}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[7px]" style={{ color: colors.fill }}>
            {state === "grey" ? "- - -" : `${score} HP`}
          </span>
          {onToggle !== undefined && (
            <button
              onClick={onToggle}
              className="text-[14px] leading-none transition-opacity hover:opacity-70 active:scale-90"
              title={visible ? "Hide from supporters" : "Show to supporters"}
            >
              {visible ? "👁️" : "🙈"}
            </button>
          )}
        </div>
      </div>

      {/* HP blocks */}
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

      {/* Sub-label + sparkline bars */}
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
          <div className="flex items-end gap-px flex-shrink-0">
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

      <div className="mt-1.5 flex justify-end">
        <span
          className="font-pixel text-[5px] px-1.5 py-0.5 border border-current"
          style={{ color: dimmed ? "#9ca3af" : colors.fill }}
        >
          {dimmed ? "PRIVATE" : colors.label}
        </span>
      </div>
    </div>
  );
}

export function PixelVitals({ steps, hrv, rhr }: { steps?: number; hrv?: number; rhr?: number }) {
  const items = [
    { icon: "👟", label: "STEPS", value: steps != null ? steps.toLocaleString() : "—" },
    { icon: "❤️", label: "RHR",   value: rhr  != null ? `${rhr}bpm` : "—" },
    { icon: "〰️", label: "HRV",   value: hrv  != null ? `${hrv}ms`  : "—" },
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
