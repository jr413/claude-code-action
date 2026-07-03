"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { JoinRequestStatus } from "@/types/database";

export async function respondToJoinRequest(
  requestId: string,
  status: Extract<JoinRequestStatus, "approved" | "declined">,
): Promise<void> {
  const supabase = await createClient();

  // RLS ("checkin owner can respond to join request") is the real guard —
  // this update is a no-op if the caller isn't the checkin owner.
  await supabase.from("join_requests").update({ status }).eq("id", requestId);

  revalidatePath("/requests");
}
