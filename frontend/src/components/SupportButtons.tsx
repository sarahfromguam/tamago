import { useState } from "react";
import type { ActionType } from "../types";
import NudgeToast from "./NudgeToast";

interface Props {
  phone: string;
  isSleeping: boolean;
  recommendedActions: string[];
  onAction: (action: ActionType) => void;
}

const ACTION_CONFIG: Record<ActionType, { icon: string; label: string; scheme?: string }> = {
  text: { icon: "\u{1F4AC}", label: "Text", scheme: "sms" },
  call: { icon: "\u{1F4DE}", label: "Call", scheme: "tel" },
  facetime: { icon: "\u{1F4F9}", label: "FaceTime", scheme: "facetime" },
  coffee: { icon: "\u{2615}", label: "Coffee" },
  food: { icon: "\u{1F355}", label: "Food" },
};

const ALL_ACTIONS: ActionType[] = ["text", "call", "facetime", "coffee", "food"];

export default function SupportButtons({ phone, isSleeping, recommendedActions, onAction }: Props) {
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
        : "Hey! I ordered some food for you \u{1F355} Hope it helps!";
      window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, "_self");
    }
  };

  return (
    <>
      <div className="flex justify-center gap-3">
        {ordered.map((action) => {
          const cfg = ACTION_CONFIG[action];
          const disabled = isSleeping && disabledWhenSleeping.includes(action);

          return (
            <button
              key={action}
              onClick={() => handleTap(action)}
              className={`flex flex-col items-center gap-1 rounded-2xl bg-white p-3 shadow-md transition-transform active:scale-95 ${
                disabled ? "opacity-30 grayscale" : "hover:shadow-lg"
              }`}
            >
              <span className="text-2xl">{cfg.icon}</span>
              <span className="text-[10px] font-semibold text-gray-500">{cfg.label}</span>
            </button>
          );
        })}
      </div>
      {showNudge && <NudgeToast onDismiss={() => setShowNudge(false)} />}
    </>
  );
}
