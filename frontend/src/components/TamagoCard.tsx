import { Link } from "react-router-dom";
import type { EggBase, FeedItem } from "../types";
import EggCharacter from "./EggCharacter";

const HP_BARS: Record<EggBase, number> = { thriving: 10, okay: 6, struggling: 3, fried: 1 };
const HP_COLOR: Record<EggBase, string> = {
  thriving:  "#52cc78",
  okay:      "#f5c518",
  struggling:"#f5844a",
  fried:     "#f04040",
};

interface Props { item: FeedItem; }

export default function TamagoCard({ item }: Props) {
  const bars = HP_BARS[item.base];
  const color = HP_COLOR[item.base];

  return (
    <Link
      to={`/t/${item.slug}`}
      className="group flex flex-col items-center gap-0 transition-all duration-200 hover:-translate-y-2 active:scale-95"
    >
      {/* Floating name tag + HP bar — RPG character label */}
      <div className="flex flex-col items-center gap-[3px]">
        <span
          className="rounded-sm px-2 py-[2px] text-[10px] font-bold tracking-wide leading-none"
          style={{
            color: "#2a1a08",
            background: "rgba(255,248,220,0.92)",
            boxShadow: "0 1px 0 rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.12)",
            border: "1px solid rgba(180,140,60,0.35)",
          }}
        >
          {item.name}
        </span>

        {/* Segmented HP bar */}
        <div className="flex items-center gap-1">
          <span className="text-[6px] font-bold tracking-[0.18em] uppercase" style={{ color: "#b8a898" }}>HP</span>
          <div className="flex gap-[2px]">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="h-[4px] w-[5px] rounded-[1px]"
                style={{
                  backgroundColor: i < bars ? color : "rgba(0,0,0,0.09)",
                  boxShadow: i < bars ? `0 0 3px ${color}99` : "none",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Egg character with ground shadow */}
      <div className="relative flex items-center justify-center">
        <div className="absolute bottom-0 left-1/2 h-3 w-14 -translate-x-1/2 translate-y-3 rounded-full bg-black/[0.06] blur-[4px]" />
        <EggCharacter
          base={item.base}
          isSleeping={item.is_sleeping}
          supported={item.supported}
          size="sm"
        />
      </div>

      {item.is_sleeping && (
        <span className="mt-1 text-[9px] font-semibold" style={{ color: "#9080b0" }}>zz</span>
      )}
    </Link>
  );
}
