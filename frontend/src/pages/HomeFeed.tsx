import { useState } from "react";
import type { FeedItem } from "../types";
import { usePhone } from "../hooks/usePhone";
import { api } from "../api/client";
import { MOCK_FEED } from "../mocks/data";
import TamagoCard from "../components/TamagoCard";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export default function HomeFeed() {
  const { phone, setPhone } = usePhone();
  const [phoneInput, setPhoneInput] = useState("");
  const [feed, setFeed] = useState<FeedItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch feed on mount
  useState(() => {
    if (USE_MOCKS) {
      setFeed(MOCK_FEED);
      setLoading(false);
      return;
    }
    if (!phone) {
      setLoading(false);
      return;
    }
    api.getFeed(phone)
      .then(setFeed)
      .catch(() => setFeed([]))
      .finally(() => setLoading(false));
  });

  // Phone entry prompt
  if (!phone) {
    return (
      <div className="flex flex-col items-center gap-6 pt-16">
        <img src="/logo.png" alt="Tamago" className="h-16 w-auto object-contain drop-shadow" />
        <span className="text-6xl">&#x1F95A;</span>
        <p className="text-center text-sm text-gray-500">
          Enter your phone number to see your friends' tamagos
        </p>
        <div className="w-full rounded-kawaii bg-white p-6 shadow-md">
          <input
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={phoneInput}
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-kawaii bg-white/50" />
          ))}
        </div>
      </div>
    );
  }

  if (!feed || feed.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16">
        <span className="text-6xl">&#x1F95A;</span>
        <h2 className="text-xl font-bold text-gray-700">No tamagos yet!</h2>
        <p className="text-center text-sm text-gray-500">
          Ask a friend to invite you to view their tamago
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="ghibli-heading mb-1 text-center text-3xl">Your Friends</h1>
      <p className="mb-8 text-center text-xs" style={{ color: "#c9a882", letterSpacing: "0.06em" }}>
        ✦ checking in on your people ✦
      </p>
      <div className="grid w-full grid-cols-2 gap-6">
        {feed.map((item) => (
          <TamagoCard key={item.slug} item={item} />
        ))}
      </div>
    </div>
  );
}
