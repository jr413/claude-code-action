import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PendingPage() {
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
  if (profile.kyc_status === "verified") redirect("/");

  const rejected = profile.kyc_status === "rejected";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold">
        {rejected ? "本人確認が完了できませんでした" : "本人確認を審査中です"}
      </h1>
      <p className="text-sm text-neutral-500">
        {rejected
          ? "書類の内容をご確認のうえ、サポートまでお問い合わせください"
          : "審査には最大24時間ほどお時間をいただく場合があります。チェックインや合流リクエストは審査完了後にご利用いただけます"}
      </p>
    </main>
  );
}
