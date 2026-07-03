import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The area feed itself is Sprint 2 scope. For now, route each visitor to
// the right place in the onboarding funnel.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("users")
    .select("kyc_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding/profile");
  if (profile.kyc_status !== "verified") redirect("/onboarding/pending");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-xl font-bold">認証が完了しました</h1>
      <p className="text-sm text-neutral-500">
        エリアフィードは近日公開予定です
      </p>
    </main>
  );
}
