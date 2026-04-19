import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(url, key);
