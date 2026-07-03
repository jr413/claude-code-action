"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendMessage(
  joinRequestId: string,
  body: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "ログインが必要です" };
  if (!body.trim()) return { error: null };

  const { error } = await supabase.from("messages").insert({
    join_request_id: joinRequestId,
    sender_id: user.id,
    body,
  });

  if (error) {
    return {
      error: "送信できませんでした(トークが終了している可能性があります)",
    };
  }

  revalidatePath(`/messages/${joinRequestId}`);
  return { error: null };
}

export async function blockUser(otherUserId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("blocks")
    .insert({ blocker_id: user.id, blocked_id: otherUserId });

  revalidatePath("/");
  revalidatePath("/requests");
}

export async function confirmMeetup(
  checkinId: string,
  joinRequestId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: existing } = await supabase
    .from("meetups")
    .select("id, confirmed_by")
    .eq("checkin_id", checkinId)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from("meetups")
      .insert({ checkin_id: checkinId, confirmed_by: [user.id] });
  } else if (!existing.confirmed_by.includes(user.id)) {
    await supabase
      .from("meetups")
      .update({ confirmed_by: [...existing.confirmed_by, user.id] })
      .eq("id", existing.id);
  }

  revalidatePath(`/messages/${joinRequestId}`);
}
