import { useEffect, useRef, useState } from "react";
import type { EggBase } from "../types";
import { getEggAnimation, getEggImage } from "../lib/egg";

const FALLBACK_EMOJI: Record<EggBase, string> = {
  thriving: "\u{1F95A}",
  okay: "\u{1F95A}",
  struggling: "\u{1F614}",
  fried: "\u{1F373}",
};

interface Props {
  base: EggBase;
  isSleeping: boolean;
  supported: boolean;
  supportCount?: number;
  size: "sm" | "md" | "lg";
  /** When set, triggers a Y-axis spin from the previous base to this one */
  transitionTo?: EggBase | null;
  onTransitionEnd?: () => void;
}

export default function EggCharacter({ base, isSleeping, supported, size, transitionTo, onTransitionEnd }: Props) {
  const imgSrc = getEggImage(base, isSleeping);
  const animation = getEggAnimation(base, isSleeping);
  const px = size === "lg" ? "w-44 h-44" : size === "md" ? "w-32 h-32" : "w-20 h-20";
  const [imgFailed, setImgFailed] = useState(false);

  // ── Spin transition state ──
  const [spinning, setSpinning] = useState(false);
  const [displayBase, setDisplayBase] = useState(base);
  const containerRef = useRef<HTMLDivElement>(null);

  // When transitionTo changes, kick off the spin
  useEffect(() => {
    if (!transitionTo || transitionTo === displayBase) return;

    setSpinning(true);

    // At the halfway point (600ms), swap the image
    const swapTimer = setTimeout(() => {
      setDisplayBase(transitionTo);
    }, 600);

    // At the end (1200ms), stop spinning
    const endTimer = setTimeout(() => {
      setSpinning(false);
      onTransitionEnd?.();
    }, 1200);

    return () => {
      clearTimeout(swapTimer);
      clearTimeout(endTimer);
    };
  }, [transitionTo]);

  // Keep displayBase in sync when base prop changes without animation
  useEffect(() => {
    if (!spinning && !transitionTo) {
      setDisplayBase(base);
    }
  }, [base]);

  const currentImg = getEggImage(displayBase, isSleeping);
  const currentAnimation = spinning ? "" : getEggAnimation(displayBase, isSleeping);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center ${px} ${currentAnimation}`}
      style={spinning ? {
        animation: "egg-spin-y 1.2s ease-in-out forwards",
      } : undefined}
    >
      {imgFailed ? (
        <span className={size === "lg" ? "text-8xl" : "text-4xl"}>
          {isSleeping ? "\u{1F634}" : FALLBACK_EMOJI[displayBase]}
        </span>
      ) : (
        <img
          src={currentImg}
          alt={`${displayBase} egg`}
          className="h-full w-full object-contain"
          onError={() => setImgFailed(true)}
        />
      )}

      {/* Sparkle burst on transition end */}
      {spinning && (
        <div className="absolute inset-0 pointer-events-none">
          {["✨", "💊", "✨"].map((emoji, i) => (
            <span
              key={i}
              className="absolute text-lg"
              style={{
                left: `${20 + i * 30}%`,
                top: `${10 + (i % 2) * 60}%`,
                animation: `sparkle-float 1.2s ease-out ${i * 0.2}s forwards`,
                opacity: 0,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
