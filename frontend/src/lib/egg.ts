import type { DimensionState, EggBase } from "../types";

const EGG_IMAGES: Record<string, string> = {
  thriving: "/eggs/joyful.png",
  okay: "/eggs/okay.png",
  struggling: "/eggs/fried.png",
  fried: "/eggs/fried.png",
  sleeping: "/eggs/okay.png",
};

export function getEggImage(base: EggBase, isSleeping: boolean): string {
  if (isSleeping) return EGG_IMAGES.sleeping;
  return EGG_IMAGES[base];
}

export function getEggAnimation(base: EggBase, isSleeping: boolean): string {
  if (isSleeping) return "";
  if (base === "struggling" || base === "fried") return "animate-wobble";
  return "";
}

export const DIMENSION_COLORS: Record<DimensionState, string> = {
  green: "#4ADE80",
  yellow: "#FACC15",
  red: "#F87171",
  grey: "#D1D5DB",
};

export const DIMENSION_LABELS: Record<string, string> = {
  sleep: "Sleep",
  stress: "Stress",
  meds: "Meds",
};

export const DIMENSION_ICONS: Record<string, string> = {
  sleep: "\u{1F319}",
  stress: "\u{1F49A}",
  meds: "\u{1F48A}",
};

const PRIORITY: Record<DimensionState, number> = { red: 3, yellow: 2, green: 1, grey: 0 };

export function getWorstDimension(dims: { sleep: DimensionState; stress: DimensionState; meds: DimensionState }): [string, DimensionState] | null {
  const active = Object.entries(dims).filter(([, v]) => v !== "grey");
  if (active.length === 0) return null;
  active.sort((a, b) => PRIORITY[b[1]] - PRIORITY[a[1]]);
  return active[0] as [string, DimensionState];
}
