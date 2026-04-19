import { Link } from "react-router-dom";
import type { FeedItem } from "../types";
import EggCharacter from "./EggCharacter";

interface Props {
  item: FeedItem;
}

export default function TamagoCard({ item }: Props) {
  return (
    <Link
      to={`/t/${item.slug}`}
      className="group flex flex-col items-center gap-1 p-3 transition-transform duration-200 hover:scale-105 active:scale-95"
    >
      {/* Soft glowing halo behind the egg */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 scale-75 rounded-full bg-white/60 blur-2xl" />
        <EggCharacter
          base={item.base}
          isSleeping={item.is_sleeping}
          supported={item.supported}
          size="sm"
        />
      </div>

      <h3
        className="font-display text-sm font-bold tracking-wide"
        style={{ color: "#8b5e3c" }}
      >
        {item.name}
      </h3>
    </Link>
  );
}
