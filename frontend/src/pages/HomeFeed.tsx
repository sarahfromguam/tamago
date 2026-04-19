import { useState } from "react";
import type { FeedItem } from "../types";
import { usePhone } from "../hooks/usePhone";
import { api } from "../api/client";
import { MOCK_FEED } from "../mocks/data";
import TamagoCard from "../components/TamagoCard";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

// Grass zone: 62%–82% of 340px scene = 211–279px from top = 61–129px from bottom = 18%–38%
// All bottom values kept between 21% and 34% so eggs land clearly on grass.
// Higher bottom % = character appears further back (near horizon); lower = foreground.
const SPAWN_POINTS = [
  { left: "14%", bottom: "33%" },  // left, near horizon
  { left: "68%", bottom: "22%" },  // right, foreground
  { left: "40%", bottom: "30%" },  // center, mid
  { left: "82%", bottom: "26%" },  // far right, mid-foreground
  { left: "24%", bottom: "21%" },  // left, close foreground
  { left: "55%", bottom: "34%" },  // center-right, near horizon
];

// Clip-path polygon: 45° chamfered corners — the "pixel art rounded corner" look
const CLIP_OUTER = "polygon(14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px),0 14px)";
const CLIP_INNER = "polygon(10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0 calc(100% - 10px),0 10px)";

// ── Pixel art scene elements ──────────────────────────────────────────────────

function PixelCloud({ size = 1, opacity = 1 }: { size?: number; opacity?: number }) {
  const p = Math.round(6 * size);
  const w = p * 6, h = p * 4;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" style={{ display: "block" }} opacity={opacity}>
      <rect x={p}     y={0}     width={p * 4} height={p}     fill="white" />
      <rect x={0}     y={p}     width={p * 6} height={p * 2} fill="white" />
      <rect x={p}     y={p * 3} width={p * 4} height={p}     fill="white" />
    </svg>
  );
}

function PixelStar({ size = 3 }: { size?: number }) {
  return (
    <svg width={size * 3} height={size * 3} viewBox={`0 0 ${size * 3} ${size * 3}`} shapeRendering="crispEdges" style={{ display: "block" }}>
      <rect x={size} y={0}      width={size} height={size} fill="#ffe8a0" opacity={0.8} />
      <rect x={0}    y={size}   width={size * 3} height={size} fill="#ffe8a0" opacity={0.8} />
      <rect x={size} y={size*2} width={size} height={size} fill="#ffe8a0" opacity={0.8} />
    </svg>
  );
}

function PixelFlower({ color = "#ff9eb5", stem = "#5aa830" }: { color?: string; stem?: string }) {
  const p = 5;
  return (
    <svg width={p * 3} height={p * 5} viewBox={`0 0 ${p * 3} ${p * 5}`} shapeRendering="crispEdges" style={{ display: "block" }}>
      <rect x={p}     y={0}     width={p} height={p} fill={color} />
      <rect x={0}     y={p}     width={p} height={p} fill={color} />
      <rect x={p}     y={p}     width={p} height={p} fill="#fffde0" />
      <rect x={p * 2} y={p}     width={p} height={p} fill={color} />
      <rect x={p}     y={p * 2} width={p} height={p} fill={color} />
      <rect x={p}     y={p * 3} width={p} height={p * 2} fill={stem} />
    </svg>
  );
}

function PixelRock() {
  const p = 5;
  return (
    <svg width={p * 5} height={p * 3} viewBox={`0 0 ${p * 5} ${p * 3}`} shapeRendering="crispEdges" style={{ display: "block" }}>
      <rect x={p}     y={0}     width={p * 3} height={p} fill="#9a8a7a" />
      <rect x={0}     y={p}     width={p * 5} height={p} fill="#8a7a6a" />
      <rect x={p}     y={p * 2} width={p * 3} height={p} fill="#6a5a4a" />
    </svg>
  );
}

// Pixel grass tips strip spanning full container width
function GrassTips() {
  const tipCount = 30;
  const vbW = 320;
  const heights = [8, 13, 7, 11, 9, 13, 7, 9];
  const fills = ["#4a9420", "#3a8010"];
  return (
    <svg
      width="100%" height="14"
      viewBox={`0 0 ${vbW} 14`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      style={{ display: "block" }}
    >
      {Array.from({ length: tipCount }, (_, i) => (
        <rect
          key={i}
          x={(i / tipCount) * vbW}
          y={14 - heights[i % heights.length]}
          width={vbW / tipCount - 1}
          height={heights[i % heights.length]}
          fill={fills[i % 2]}
        />
      ))}
    </svg>
  );
}

// Alternating pixel tiles at the grass→dirt seam
function DirtEdge() {
  return (
    <svg width="100%" height="6" viewBox="0 0 320 6" preserveAspectRatio="none" shapeRendering="crispEdges" style={{ display: "block" }}>
      {Array.from({ length: 20 }, (_, i) => (
        <rect key={i} x={(i / 20) * 320} y={0} width={14} height={6} fill={i % 2 === 0 ? "#a07030" : "#b07838"} />
      ))}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HomeFeed() {
  const { phone, setPhone } = usePhone();
  const [phoneInput, setPhoneInput] = useState("");
  const [feed, setFeed] = useState<FeedItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    if (USE_MOCKS) { setFeed(MOCK_FEED); setLoading(false); return; }
    if (!phone) { setLoading(false); return; }
    api.getFeed(phone).then(setFeed).catch(() => setFeed([])).finally(() => setLoading(false));
  });

  if (!phone) {
    return (
      <div className="flex flex-col items-center gap-6 pt-16">
        <img src="/logo.png" alt="Tamago" className="h-16 w-auto object-contain drop-shadow" />
        <span className="text-6xl">&#x1F95A;</span>
        <p className="text-center text-sm text-gray-500">Enter your phone number to see your friends' tamagos</p>
        <div className="w-full rounded-kawaii bg-white p-6 shadow-md">
          <input
            type="tel" placeholder="+1 (555) 123-4567" value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg outline-none focus:border-pink-300"
          />
          <button
            onClick={() => { if (phoneInput.trim()) setPhone(phoneInput.trim()); }}
            className="w-full rounded-xl bg-tamago-accent py-3 font-bold text-white transition-transform active:scale-95"
          >
            View Friends
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 className="ghibli-heading mb-6 text-center text-3xl">Your Friends</h1>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 animate-pulse rounded-kawaii bg-white/50" />)}
        </div>
      </div>
    );
  }

  if (!feed || feed.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16">
        <span className="text-6xl">&#x1F95A;</span>
        <h2 className="text-xl font-bold text-gray-700">No tamagos yet!</h2>
        <p className="text-center text-sm text-gray-500">Ask a friend to invite you to view their tamago</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0">
      {/* "Your Village" title image */}
      <img
        src="/your-village.png"
        alt="Your Village"
        className="w-full max-w-xs object-contain drop-shadow-sm"
        draggable={false}
      />

      {/* ── Pixel frame wrapper ───────────────────────────────────────────────
          Outer div = dark wood border (shows as 4px inset via padding).
          clip-path gives the chamfered pixel-art corner instead of smooth rounding.
          filter:drop-shadow follows the clip-path shape (unlike box-shadow). */}
      <div
        className="w-full"
        style={{
          padding: "4px",
          background: "#4a2e18",
          clipPath: CLIP_OUTER,
          filter: "drop-shadow(4px 4px 0 #2a1008)",
        }}
      >
        {/* ── World scene ──────────────────────────────────────────────────── */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            height: "340px",
            clipPath: CLIP_INNER,
            // Hard stops — no gradients, pure pixel art flat color bands
            background:
              "linear-gradient(180deg," +
              "#a0d8f0 0%,#a0d8f0 62%," +   // sky
              "#6ec830 62%,#6ec830 82%," +   // grass
              "#c89050 82%)",                 // dirt
          }}
        >
          {/* Sky clouds */}
          <div className="absolute" style={{ left: "3%",  top: "6%"  }}><PixelCloud size={1.1} /></div>
          <div className="absolute" style={{ right: "5%", top: "4%"  }}><PixelCloud size={1.3} /></div>
          <div className="absolute" style={{ left: "40%", top: "13%" }}><PixelCloud size={0.8} opacity={0.7} /></div>
          <div className="absolute" style={{ left: "22%", top: "29%" }}><PixelCloud size={0.65} opacity={0.5} /></div>

          {/* Stars */}
          <div className="absolute" style={{ left: "26%", top: "7%"  }}><PixelStar size={3} /></div>
          <div className="absolute" style={{ right: "30%",top: "5%"  }}><PixelStar size={2} /></div>
          <div className="absolute" style={{ left: "60%", top: "21%" }}><PixelStar size={2} /></div>

          {/* Grass tips at sky/grass seam */}
          <div className="absolute inset-x-0" style={{ top: "calc(62% - 14px)" }}>
            <GrassTips />
          </div>

          {/* Pixel flowers — placed in empty zones between spawn points */}
          <div className="absolute" style={{ left: "5%",  top: "67%" }}><PixelFlower color="#ff9eb5" /></div>
          <div className="absolute" style={{ left: "31%", top: "66%" }}><PixelFlower color="#ffd700" stem="#4a9420" /></div>
          <div className="absolute" style={{ left: "50%", top: "68%" }}><PixelFlower color="#f0f0ff" /></div>
          <div className="absolute" style={{ right: "11%",top: "66%" }}><PixelFlower color="#ff9eb5" /></div>
          <div className="absolute" style={{ right: "30%",top: "69%" }}><PixelFlower color="#ffd700" stem="#4a9420" /></div>

          {/* Pixel rock */}
          <div className="absolute" style={{ left: "73%", top: "66%" }}><PixelRock /></div>

          {/* Dirt seam tiles */}
          <div className="absolute inset-x-0" style={{ top: "82%" }}>
            <DirtEdge />
          </div>

          {/* ── Egg characters ──────────────────────────────────────────────
              translateX(-50%) centres the character on its left% coordinate.
              bottom% sets where the egg's feet land in the scene. */}
          {feed.map((item, i) => {
            const pos = SPAWN_POINTS[i % SPAWN_POINTS.length];
            return (
              <div
                key={item.slug}
                className="absolute animate-fade-up"
                style={{
                  left: pos.left,
                  bottom: pos.bottom,
                  transform: "translateX(-50%)",
                  animationDelay: `${i * 90}ms`,
                }}
              >
                <TamagoCard item={item} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
