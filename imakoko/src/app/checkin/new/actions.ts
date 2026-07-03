"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
