import { createAdminClient } from "@/lib/supabase/admin";
import { isoHoursAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value.toLocaleString("ja-JP")}</p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

export default async function AdminKpiPage() {
  const supabase = createAdminClient();

  const since24h = isoHoursAgo(24);
  const since7d = isoHoursAgo(7 * 24);

  const [
    { data: recentCheckins },
    { count: totalCheckins },
    { count: premiumUsers },
    { data: recentMeetups },
    { data: weeklyMeetups },
  ] = await Promise.all([
    supabase.from("checkins").select("user_id").gte("created_at", since24h),
    supabase.from("checkins").select("id", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("plan", "premium"),
    supabase.from("meetups").select("id, confirmed_by"),
    supabase
      .from("meetups")
      .select("id, confirmed_by")
      .gte("created_at", since7d),
  ]);

  // "成立" requires both parties to have confirmed (confirmed_by has 2+ entries).
  const isConfirmed = (m: { confirmed_by: string[] }) =>
    m.confirmed_by.length >= 2;
  const totalMeetups = (recentMeetups ?? []).filter(isConfirmed).length;
  const weeklyMeetupCount = (weeklyMeetups ?? []).filter(isConfirmed).length;
  const dau = new Set((recentCheckins ?? []).map((c) => c.user_id)).size;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-xl font-bold">KPIダッシュボード</h1>
      <p className="mt-1 text-sm text-neutral-500">
        北極星指標: 週次の合流成立数
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <StatCard
          label="DAU"
          value={dau}
          hint="過去24時間にチェックインしたユーザー数"
        />
        <StatCard label="チェックイン数（累計）" value={totalCheckins ?? 0} />
        <StatCard
          label="合流成立数（週次）"
          value={weeklyMeetupCount}
          hint="過去7日間・双方確認済み"
        />
        <StatCard
          label="合流成立数（累計）"
          value={totalMeetups}
          hint="双方確認済み"
        />
        <StatCard
          label="課金者数"
          value={premiumUsers ?? 0}
          hint="プレミアム会員"
        />
      </div>
    </main>
  );
}
