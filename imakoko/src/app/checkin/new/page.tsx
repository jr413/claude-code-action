import { requireVerifiedUser } from "@/lib/current-user";
import { formatRemaining } from "@/lib/time";
import { CheckinForm } from "./checkin-form";
import { EndCheckinButton } from "./end-checkin-button";

export default async function NewCheckinPage() {
  const { supabase, profile } = await requireVerifiedUser();

  const { data: activeCheckin } = await supabase
    .from("checkins")
    .select("id, shop_id, expires_at")
    .eq("user_id", profile.id)
    .is("ended_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (activeCheckin) {
    const { data: shop } = await supabase
      .from("shops")
      .select("name")
      .eq("id", activeCheckin.shop_id)
      .maybeSingle();

    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-bold">すでにチェックイン中です</h1>
        <p className="text-sm text-neutral-500">
          {shop?.name ?? "店舗"} ・ {formatRemaining(activeCheckin.expires_at)}
        </p>
        <EndCheckinButton checkinId={activeCheckin.id} />
      </main>
    );
  }

  const { data: shops } = await supabase
    .from("shops")
    .select("id, name, genre, area_id")
    .eq("is_active", true)
    .order("name");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-xl font-bold">チェックイン</h1>
        <p className="mt-2 text-sm text-neutral-500">
          3時間で自動的に終了します
        </p>
      </div>
      <CheckinForm shops={shops ?? []} />
    </main>
  );
}
