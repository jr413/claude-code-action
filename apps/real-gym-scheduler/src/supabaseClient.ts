import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// URL/キー未設定の場合は null。呼び出し側は dataClient.ts の DEMO_MODE で分岐する。
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
