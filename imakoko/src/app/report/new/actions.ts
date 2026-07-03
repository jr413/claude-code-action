"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReportTargetType } from "@/types/database";

export async function submitReport(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/onboarding");

  const targetType = String(formData.get("target_type")) as ReportTargetType;
  const targetId = String(formData.get("target_id"));
  const targetUserId = String(formData.get("target_user_id") || "") || null;
  const reason = String(formData.get("reason"));
  const returnTo = String(formData.get("return_to") || "/");

  await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    target_user_id: targetUserId,
    reason,
  });

  redirect(`${returnTo}?reported=1`);
}
