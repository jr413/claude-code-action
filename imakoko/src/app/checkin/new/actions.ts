"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FREE_CHECKINS_PER_DAY, since24h } from "@/lib/plan-limits";
import type { CheckinStatus } from "@/types/database";

const CHECKIN_DURATION_MS = 3 * 60 * 60 * 1000;

export async function createCheckin(input: {
  shopId: string;
  status: CheckinStatus;
  message: string;
  capacity: number;
}): Promise<{ error: string | null }> {
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
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", since24h());

    if ((count ?? 0) >= FREE_CHECKINS_PER_DAY) {
      return {
        error:
          "無料プランのチェックインは1日1回までです。プレミアムで無制限になります",
      };
    }
  }

  const expiresAt = new Date(Date.now() + CHECKIN_DURATION_MS).toISOString();

  const { error } = await supabase.from("checkins").insert({
    user_id: user.id,
    shop_id: input.shopId,
    status: input.status,
    message: input.message || null,
    capacity: input.capacity,
    expires_at: expiresAt,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "すでにアクティブなチェックインがあります" };
    }
    return { error: "チェックインに失敗しました" };
  }

  revalidatePath("/");
  redirect("/");
}

export async function endCheckin(checkinId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("checkins")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", checkinId)
    .eq("user_id", user.id);

  revalidatePath("/");
  revalidatePath("/checkin/new");
}
