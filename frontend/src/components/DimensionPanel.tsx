import type { DimensionDetails, DimensionState, Dimensions } from "../types";

const ROW_CONFIG = [
  { key: "sleep",    icon: "🌙", label: "Sleep" },
  { key: "stress",   icon: "💚", label: "Readiness" },
  { key: "activity", icon: "🚶", label: "Activity" },
  { key: "meds",     icon: "💊", label: "Meds" },
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

function Sparkline({ history, color }: { history: number[]; color: string }) {
  if (history.length < 2) return null;
  const W = 60;
  const H = 18;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="flex-shrink-0">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

interface Props {
  dimensions: Dimensions;
  details?: DimensionDetails;
  muted?: boolean;
}

export default function DimensionPanel({ dimensions, details, muted }: Props) {
  return (
    <div className={`flex flex-col gap-3 ${muted ? "opacity-50" : ""}`}>
      {ROW_CONFIG.map(({ key, icon, label }) => {
        // activity uses its own state from details, not from dimensions
        const state: DimensionState =
          key === "activity"
            ? details?.activity
              ? (details.activity.score >= 75 ? "green" : details.activity.score >= 50 ? "yellow" : "red")
              : "grey"
            : ((dimensions as unknown) as Record<string, DimensionState>)[key] ?? "grey";

        const detail = details?.[key];
        const score = detail?.score ?? null;
        const barColor = BAR_COLOR[state];
        const textColor = TEXT_COLOR[state];
        const history = detail?.history ?? [];

        return (
          <div key={key} className="flex flex-col gap-0.5">
            {/* Label row */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[18px] font-bold tracking-wide whitespace-nowrap" style={{ color: "#8b7060" }}>
                {icon} {label}
              </span>
              <div className="flex items-center gap-2">
                {history.length >= 2 && (
                  <Sparkline history={history} color={barColor} />
                )}
                {detail && (
                  <span className="font-mono text-[18px] font-bold whitespace-nowrap" style={{ color: textColor }}>
                    {detail.label}
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-[5px] w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.07)" }}>
              {score !== null && score > 0 && (
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${score}%`, backgroundColor: barColor }}
                />
              )}
            </div>

            {/* Sub-label */}
            {detail?.sublabel && (
              <span className="text-[16px] tracking-wide" style={{ color: "#b8a898" }}>
                {detail.sublabel}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
