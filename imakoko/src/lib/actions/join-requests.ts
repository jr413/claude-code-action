"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FREE_JOIN_REQUESTS_PER_DAY, since24h } from "@/lib/plan-limits";

/**
 * Sends a "合流したい" request for a checkin. RLS enforces the
 * verified/non-banned requirement — this just surfaces a friendly error if
 * that (or the one-request-per-checkin constraint) is violated.
 */
export async function requestJoin(
  checkinId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "ログインが必要です" };

  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.plan === "free") {
    const { count } = await supabase
      .from("join_requests")
      .select("id", { count: "exact", head: true })
      .eq("requester_id", user.id)
      .gte("created_at", since24h());

    if ((count ?? 0) >= FREE_JOIN_REQUESTS_PER_DAY) {
      return {
        error:
          "無料プランの合流リクエストは1日3件までです。プレミアムで無制限になります",
      };
    }
  }

  const { error } = await supabase.from("join_requests").insert({
    checkin_id: checkinId,
    requester_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      // already requested — not an error from the user's point of view
      return { error: null };
    }
    return { error: "リクエストの送信に失敗しました" };
  }

  revalidatePath("/");
  return { error: null };
}
