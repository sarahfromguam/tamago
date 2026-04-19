import type { DimensionDetails, DimensionState, Dimensions } from "../types";

const ROW_CONFIG = [
  { key: "sleep",  icon: "🌙", label: "Sleep" },
  { key: "stress", icon: "💚", label: "Readiness" },
  { key: "meds",   icon: "💊", label: "Meds" },
] as const;

const BAR_COLOR: Record<DimensionState, string> = {
  green:  "#7ec8a0",
  yellow: "#f5c96a",
  red:    "#e88a8a",
  grey:   "#d4cfc8",
};

const TEXT_COLOR: Record<DimensionState, string> = {
  green:  "#3a7a4a",
  yellow: "#9a6a10",
  red:    "#a04040",
  grey:   "#8a7a6a",
};

interface Props {
  dimensions: Dimensions;
  details?: DimensionDetails;
  muted?: boolean;
}

export default function DimensionPanel({ dimensions, details, muted }: Props) {
  return (
    <div className={`flex flex-col gap-3 ${muted ? "opacity-50" : ""}`}>
      {ROW_CONFIG.map(({ key, icon, label }) => {
        const state = dimensions[key];
        const detail = details?.[key];
        const score = detail?.score ?? null;
        const barColor = BAR_COLOR[state];
        const textColor = TEXT_COLOR[state];

        return (
          <div key={key} className="flex flex-col gap-0.5">
            {/* Label row */}
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-bold tracking-wide" style={{ color: "#8b7060" }}>
                {icon} {label}
              </span>
              {detail && (
                <span className="font-mono text-[11px] font-bold" style={{ color: textColor }}>
                  {detail.label}
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-[5px] w-full overflow-hidden rounded-full bg-black/8" style={{ backgroundColor: "rgba(0,0,0,0.07)" }}>
              {score !== null && score > 0 && (
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${score}%`, backgroundColor: barColor }}
                />
              )}
            </div>

            {/* Sub-label */}
            {detail?.sublabel && (
              <span className="text-[9px] tracking-wide" style={{ color: "#b8a898" }}>
                {detail.sublabel}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
