"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { INTEREST_TAGS, MAX_INTEREST_TAGS } from "@/lib/interest-tags";

export async function updateProfile(
  formData: FormData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "ログインが必要です" };

  const nickname = String(formData.get("nickname") ?? "").trim();
  const bio = String(formData.get("bio") ?? "");
  const tags = formData
    .getAll("interest_tags")
    .map(String)
    .filter((tag) =>
      INTEREST_TAGS.includes(tag as (typeof INTEREST_TAGS)[number]),
    )
    .slice(0, MAX_INTEREST_TAGS);

  if (!nickname) return { error: "ニックネームを入力してください" };

  const { error } = await supabase
    .from("users")
    .update({ nickname, bio, interest_tags: tags })
    .eq("id", user.id);

  if (error) return { error: "更新に失敗しました" };

  revalidatePath("/mypage");
  return { error: null };
}

export async function unblockUser(blockedUserId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedUserId);

  revalidatePath("/mypage");
}
