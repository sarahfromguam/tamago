import type { Dimensions } from "../types";
import { DIMENSION_COLORS, DIMENSION_ICONS, DIMENSION_LABELS } from "../lib/egg";

interface Props {
  dimensions: Dimensions;
  muted?: boolean;
}

export default function DimensionDots({ dimensions, muted }: Props) {
  const keys = ["sleep", "stress", "meds"] as const;

  return (
    <div className={`flex justify-center gap-6 ${muted ? "opacity-40" : ""}`}>
      {keys.map((key) => {
        const state = dimensions[key];
        return (
          <div key={key} className="flex flex-col items-center gap-1">
            <div
              className="h-4 w-4 rounded-full shadow-sm"
              style={{ backgroundColor: DIMENSION_COLORS[state] }}
            />
            <span className="text-xs font-semibold text-gray-600">
              {DIMENSION_ICONS[key]} {DIMENSION_LABELS[key]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
