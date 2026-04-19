import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePhone } from "../hooks/usePhone";
import { api } from "../api/client";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export default function AcceptInvite() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { phone, setPhone } = usePhone();
  const [phoneInput, setPhoneInput] = useState(phone);
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!phoneInput.trim() || !code) return;
    setSubmitting(true);

    setPhone(phoneInput.trim());

    if (!USE_MOCKS) {
      try {
        await api.acceptInvite(code, phoneInput.trim());
      } catch {
        // handle error
      }
    }

    navigate("/home");
  };

  return (
    <div className="flex flex-col items-center gap-6 pt-16">
      <span className="text-6xl">&#x1F48C;</span>
      <h1 className="text-2xl font-extrabold text-gray-700">You've Been Invited!</h1>
      <p className="text-center text-sm text-gray-500">
        Someone wants you to be part of their support crew
      </p>

      <div className="w-full rounded-kawaii bg-white p-6 shadow-md">
        <label className="mb-1 block text-xs font-semibold text-gray-500">Your phone number</label>
        <input
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
          className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-300"
        />
        <button
          onClick={handleAccept}
          disabled={submitting}
          className="w-full rounded-xl bg-tamago-accent py-3 font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
        >
          {submitting ? "Joining..." : "Join Support Crew"}
        </button>
      </div>
    </div>
  );
}
