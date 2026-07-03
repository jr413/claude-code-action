"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function approveKyc(userId: string, kycImagePath: string) {
  const supabase = createAdminClient();

  const { error: updateError } = await supabase
    .from("users")
    .update({ kyc_status: "verified", kyc_image_url: null })
    .eq("id", userId);

  if (updateError) throw new Error(updateError.message);

  // Delete promptly after approval — the document should not be retained
  // once identity is confirmed (spec section 4).
  await supabase.storage.from("kyc-documents").remove([kycImagePath]);

  revalidatePath("/admin/kyc");
}

export async function rejectKyc(userId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("users")
    .update({ kyc_status: "rejected" })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/kyc");
}
