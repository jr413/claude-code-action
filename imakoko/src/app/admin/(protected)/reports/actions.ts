"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

const BAN_AT_STRIKE_COUNT = 2;

async function resolveReport(reportId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("reports")
    .update({ status: "resolved" })
    .eq("id", reportId);
  revalidatePath("/admin/reports");
}

export async function dismissReport(reportId: string): Promise<void> {
  await resolveReport(reportId);
}

export async function hideTarget(
  reportId: string,
  targetType: "checkin" | "message",
  targetId: string,
): Promise<void> {
  const supabase = createAdminClient();

  if (targetType === "checkin") {
    await supabase
      .from("checkins")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", targetId);
  } else {
    await supabase.from("messages").delete().eq("id", targetId);
  }

  await resolveReport(reportId);
}

export async function warnUser(
  reportId: string,
  targetUserId: string,
): Promise<void> {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("strike_count")
    .eq("id", targetUserId)
    .maybeSingle();

  const strikeCount = (user?.strike_count ?? 0) + 1;

  await supabase
    .from("users")
    .update({
      strike_count: strikeCount,
      is_banned: strikeCount >= BAN_AT_STRIKE_COUNT,
    })
    .eq("id", targetUserId);

  await resolveReport(reportId);
}

export async function banUser(
  reportId: string,
  targetUserId: string,
): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("users")
    .update({ is_banned: true })
    .eq("id", targetUserId);

  await resolveReport(reportId);
}
