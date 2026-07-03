"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PartnerPlan } from "@/types/database";

export async function createShop(formData: FormData) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("shops").insert({
    area_id: String(formData.get("area_id")),
    name: String(formData.get("name")),
    genre: String(formData.get("genre") || "") || null,
    address: String(formData.get("address") || "") || null,
    partner_plan: (formData.get("partner_plan") as PartnerPlan) || "none",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/shops");
  redirect("/admin/shops");
}

export async function updateShop(shopId: string, formData: FormData) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("shops")
    .update({
      name: String(formData.get("name")),
      genre: String(formData.get("genre") || "") || null,
      address: String(formData.get("address") || "") || null,
      partner_plan: (formData.get("partner_plan") as PartnerPlan) || "none",
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", shopId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/shops");
  redirect("/admin/shops");
}
