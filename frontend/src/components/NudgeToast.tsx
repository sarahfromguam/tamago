import { useEffect } from "react";

interface Props {
  onDismiss: () => void;
}

export default function NudgeToast({ onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="animate-nudge-in fixed left-4 right-4 top-4 z-50 mx-auto max-w-md rounded-2xl bg-indigo-100 px-5 py-4 text-center shadow-lg">
      <p className="text-sm font-semibold text-indigo-800">
        &#x1F4A4; They're sleeping right now — send a text instead!
      </p>
    </div>
  );
}
