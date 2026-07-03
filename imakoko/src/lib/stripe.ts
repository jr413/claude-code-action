import Stripe from "stripe";

let stripeClient: Stripe | null = null;

// Lazy singleton — Stripe's constructor validates the API key eagerly
// (unlike supabase-js), which would otherwise throw during Next.js's build
// page-data-collection step whenever STRIPE_SECRET_KEY isn't set.
export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeClient;
}
