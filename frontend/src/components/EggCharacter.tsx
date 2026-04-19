import { useState } from "react";
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
}

export default function EggCharacter({ base, isSleeping, supported, size }: Props) {
  const imgSrc = getEggImage(base, isSleeping);
  const animation = getEggAnimation(base, isSleeping);
  const px = size === "lg" ? "w-44 h-44" : size === "md" ? "w-32 h-32" : "w-20 h-20";
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`relative inline-flex items-center justify-center ${px} ${animation}`}>
      {imgFailed ? (
        <span className={size === "lg" ? "text-8xl" : "text-4xl"}>
          {isSleeping ? "\u{1F634}" : FALLBACK_EMOJI[base]}
        </span>
      ) : (
        <img
          src={imgSrc}
          alt={`${base} egg`}
          className="h-full w-full object-contain"
          onError={() => setImgFailed(true)}
        />
      )}

    </div>
  );
}
