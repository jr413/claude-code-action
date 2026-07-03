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

export async function createCoupon(shopId: string, formData: FormData) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("coupons").insert({
    shop_id: shopId,
    title: String(formData.get("title")),
    conditions: String(formData.get("conditions") || "") || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/shops/${shopId}`);
}

export async function toggleCouponActive(
  couponId: string,
  shopId: string,
  isActive: boolean,
) {
  const supabase = createAdminClient();

  await supabase
    .from("coupons")
    .update({ is_active: isActive })
    .eq("id", couponId);

  revalidatePath(`/admin/shops/${shopId}`);
}

export async function deleteCoupon(couponId: string, shopId: string) {
  const supabase = createAdminClient();

  await supabase.from("coupons").delete().eq("id", couponId);

  revalidatePath(`/admin/shops/${shopId}`);
}
