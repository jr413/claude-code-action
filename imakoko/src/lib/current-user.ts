import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

/**
 * Guards a page to verified, non-banned users only — redirecting into the
 * right onboarding step otherwise. Banned users land on /onboarding/pending
 * too; there is no separate "banned" screen in the MVP scope.
 */
export async function requireVerifiedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<UserProfile>();

  if (!profile) redirect("/onboarding/profile");
  if (profile.kyc_status !== "verified" || profile.is_banned) {
    redirect("/onboarding/pending");
  }

  return { supabase, profile };
}
