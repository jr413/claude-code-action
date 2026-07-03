"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

async function getOrCreateStripeCustomerId(
  userId: string,
  currentCustomerId: string | null,
): Promise<string> {
  if (currentCustomerId) return currentCustomerId;

  const customer = await getStripe().customers.create({
    metadata: { supabase_user_id: userId },
  });

  // Written via the admin client — stripe_customer_id is a system-managed
  // column the user's own RLS-scoped client can't write (see migration
  // 0006's protecting trigger).
  const adminClient = createAdminClient();
  await adminClient
    .from("users")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

export async function createPremiumCheckoutSession(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const customerId = await getOrCreateStripeCustomerId(
    user.id,
    profile?.stripe_customer_id ?? null,
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID!, quantity: 1 }],
    success_url: `${siteUrl}/mypage?checkout=success`,
    cancel_url: `${siteUrl}/mypage?checkout=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}

export async function createBillingPortalSession(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) redirect("/mypage");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl}/mypage`,
  });

  redirect(session.url);
}
