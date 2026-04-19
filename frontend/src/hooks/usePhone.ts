import { useState } from "react";

const PHONE_KEY = "tamago_phone";
const SLUG_KEY = "tamago_my_slug";

// Always seed for demo so we skip auth flows
if (!localStorage.getItem(PHONE_KEY)) localStorage.setItem(PHONE_KEY, "+15550001234");
if (!localStorage.getItem(SLUG_KEY)) localStorage.setItem(SLUG_KEY, "user_mia");

export function usePhone() {
  const [phone, setPhoneState] = useState(() => localStorage.getItem(PHONE_KEY) ?? "");

  const setPhone = (p: string) => {
    localStorage.setItem(PHONE_KEY, p);
    setPhoneState(p);
  };

  const clearPhone = () => {
    localStorage.removeItem(PHONE_KEY);
    setPhoneState("");
  };

  return { phone, setPhone, clearPhone };
}

export function useMySlug() {
  const [slug, setSlugState] = useState(() => localStorage.getItem(SLUG_KEY) ?? "");

  const setSlug = (s: string) => {
    localStorage.setItem(SLUG_KEY, s);
    setSlugState(s);
  };

  const clearSlug = () => {
    localStorage.removeItem(SLUG_KEY);
    setSlugState("");
  };

  return { slug, setSlug, clearSlug };
}
