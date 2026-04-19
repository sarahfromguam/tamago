import { useState } from "react";
import type { ActionType } from "../types";
import NudgeToast from "./NudgeToast";

interface ActionDef {
  icon: string;
  label: string;
  sublabel: string;
  scheme?: string;
  msgTemplate?: (phone: string) => string;
}

const ACTION_DEF: Record<ActionType, ActionDef> = {
  text: {
    icon: "💬",
    label: "Send a Text",
    sublabel: "Quick check-in message",
    scheme: "sms",
  },
  call: {
    icon: "📞",
    label: "Give a Call",
    sublabel: "A voice goes a long way",
    scheme: "tel",
  },
  facetime: {
    icon: "📹",
    label: "FaceTime",
    sublabel: "Face-to-face support",
    scheme: "facetime",
  },
  coffee: {
    icon: "☕",
    label: "Send a Coffee",
    sublabel: "A warm treat, delivered",
    msgTemplate: (phone) =>
      `sms:${phone}?body=${encodeURIComponent("Hey! I sent you a coffee treat ☕ Thinking of you!")}`,
  },
  food: {
    icon: "🍱",
    label: "Drop Off Food",
    sublabel: "A home-cooked meal or delivery",
    msgTemplate: (phone) =>
      `sms:${phone}?body=${encodeURIComponent("Hey! I'm sending some food your way 🍱 Hope it helps!")}`,
  },
  gift: {
    icon: "🎁",
    label: "Send a Gift",
    sublabel: "A little care package",
    msgTemplate: (phone) =>
      `sms:${phone}?body=${encodeURIComponent("Hey! Sending you something special 🎁 Thinking of you!")}`,
  },
};

const SLEEP_BLOCKED: ActionType[] = ["call", "facetime"];

interface Props {
  action: ActionType;
  phone: string;
  isSleeping: boolean;
  recommended: boolean;
  onAction: (action: ActionType) => void;
}

export function ActionCard({ action, phone, isSleeping, recommended, onAction }: Props) {
  const [showNudge, setShowNudge] = useState(false);
  const def = ACTION_DEF[action];
  const blocked = isSleeping && SLEEP_BLOCKED.includes(action);

  const handleTap = () => {
    if (blocked) {
      setShowNudge(true);
      return;
    }
    onAction(action);
    if (def.scheme) {
      window.open(`${def.scheme}:${phone}`, "_self");
    } else if (def.msgTemplate) {
      window.open(def.msgTemplate(phone), "_self");
    }
  };

  return (
    <>
      <button
        onClick={handleTap}
        className={`
          flex w-full items-center gap-4 rounded-2xl px-4 py-3.5
          text-left transition-transform active:scale-[0.97]
          ${recommended && !blocked
            ? "bg-white/70 shadow-md backdrop-blur-sm"
            : "bg-white/30 backdrop-blur-sm"
          }
          ${blocked ? "opacity-40 grayscale" : ""}
        `}
      >
        <span className="text-3xl leading-none">{def.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: "#5a3e30" }}>{def.label}</p>
          <p className="text-[18px]" style={{ color: "#b8a898" }}>{def.sublabel}</p>
        </div>
        {recommended && !blocked && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[16px] font-bold"
            style={{ background: "#fde8d8", color: "#c9856a" }}
          >
            suggested
          </span>
        )}
      </button>
      {showNudge && <NudgeToast onDismiss={() => setShowNudge(false)} />}
    </>
  );
}

interface ActionListProps {
  phone: string;
  isSleeping: boolean;
  recommendedActions: string[];
  onAction: (action: ActionType) => void;
}

const ALL_ACTIONS: ActionType[] = ["text", "call", "facetime", "coffee", "food"];

export function ActionList({ phone, isSleeping, recommendedActions, onAction }: ActionListProps) {
  const recommended = new Set(recommendedActions);
  const ordered = [
    ...ALL_ACTIONS.filter((a) => recommended.has(a)),
    ...ALL_ACTIONS.filter((a) => !recommended.has(a)),
  ];

  return (
    <div className="flex w-full flex-col gap-2">
      {ordered.map((action) => (
        <ActionCard
          key={action}
          action={action}
          phone={phone}
          isSleeping={isSleeping}
          recommended={recommended.has(action)}
          onAction={onAction}
        />
      ))}
    </div>
  );
}
