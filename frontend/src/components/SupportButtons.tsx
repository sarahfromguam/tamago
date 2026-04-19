import { useState } from "react";
import type { ActionType } from "../types";
import NudgeToast from "./NudgeToast";

interface Props {
  phone: string;
  isSleeping: boolean;
  recommendedActions: string[];
  onAction: (action: ActionType) => void;
  compact?: boolean;
}

const ACTION_CONFIG: Record<ActionType, { icon: string; label: string; scheme?: string }> = {
  text: { icon: "\u{1F4AC}", label: "Text", scheme: "sms" },
  call: { icon: "\u{1F4DE}", label: "Call", scheme: "tel" },
  facetime: { icon: "\u{1F4F9}", label: "FaceTime", scheme: "facetime" },
  coffee: { icon: "\u{2615}", label: "Coffee" },
  food:   { icon: "\u{1F355}", label: "Food" },
  gift:   { icon: "\u{1F381}", label: "Gift" },
};

const ALL_ACTIONS: ActionType[] = ["text", "call", "facetime", "coffee", "food"];

export default function SupportButtons({ phone, isSleeping, recommendedActions, onAction, compact }: Props) {
  const [showNudge, setShowNudge] = useState(false);

  const ordered = [
    ...recommendedActions.filter((a) => ALL_ACTIONS.includes(a as ActionType)),
    ...ALL_ACTIONS.filter((a) => !recommendedActions.includes(a)),
  ] as ActionType[];

  const disabledWhenSleeping: ActionType[] = ["call", "facetime"];

  const handleTap = (action: ActionType) => {
    if (isSleeping && disabledWhenSleeping.includes(action)) {
      setShowNudge(true);
      return;
    }

    onAction(action);

    const cfg = ACTION_CONFIG[action];
    if (cfg.scheme) {
      window.open(`${cfg.scheme}:${phone}`, "_self");
    } else {
      // Coffee/food: open pre-filled text
      const msg = action === "coffee"
        ? "Hey! I sent you a coffee treat \u{2615} Thinking of you!"
        : "Hey! I ordered some food for you \u{1F355} Here's your DoorDash order: https://www.doordash.com/orders/gift/a8f3e2d1-7b9c-4e5a-bc12-6d4f8e3a9c71 \u{2014} Hope it helps!";
      window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, "_self");
    }
  };

  if (compact) {
    return (
      <>
        <div className="grid grid-cols-2 gap-1">
          {ordered.map((action) => {
            const cfg = ACTION_CONFIG[action];
            const disabled = isSleeping && disabledWhenSleeping.includes(action);
            const isRecommended = recommendedActions.includes(action);
            return (
              <div key={action} className="relative">
                {isRecommended && !disabled && (
                  <span className="absolute -top-1 -right-1 text-[8px] leading-none z-10">⭐</span>
                )}
                <button
                  onClick={() => handleTap(action)}
                  className={`w-full flex items-center gap-1.5 border-2 border-[#2c1a0e] px-2 py-1 font-pixel text-[7px] transition-transform active:scale-95 ${
                    disabled ? "opacity-30 grayscale" : ""
                  }`}
                  style={{
                    background: isRecommended && !disabled ? "#fff8dc" : "#fffef5",
                    color: "#6b4c35",
                    boxShadow: "1px 1px 0 0 #2c1a0e",
                  }}
                >
                  <span className="text-sm leading-none">{cfg.icon}</span>
                  {cfg.label}
                </button>
              </div>
            );
          })}
        </div>
        {showNudge && <NudgeToast onDismiss={() => setShowNudge(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="flex justify-center gap-3">
        {ordered.map((action) => {
          const cfg = ACTION_CONFIG[action];
          const disabled = isSleeping && disabledWhenSleeping.includes(action);
          const isRecommended = recommendedActions.includes(action);
          return (
            <div key={action} className="relative flex flex-col items-center">
              {isRecommended && !disabled && (
                <span className="absolute -top-1.5 -right-1.5 leading-none z-10 text-[20px]">⭐</span>
              )}
              <button
                onClick={() => handleTap(action)}
                className={`flex flex-col items-center gap-1 rounded-2xl bg-white p-3 shadow-md transition-transform active:scale-95 ${
                  disabled ? "opacity-30 grayscale" : "hover:shadow-lg"
                } ${isRecommended && !disabled ? "ring-2 ring-yellow-300" : ""}`}
              >
                <span className="text-2xl">{cfg.icon}</span>
                <span className="text-[16px] font-semibold text-gray-500">{cfg.label}</span>
              </button>
            </div>
          );
        })}
      </div>
      {showNudge && <NudgeToast onDismiss={() => setShowNudge(false)} />}
    </>
  );
}
