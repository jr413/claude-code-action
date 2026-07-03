import Link from "next/link";
import { requireVerifiedUser } from "@/lib/current-user";
import { ProfileEditForm } from "./profile-edit-form";
import { BillingSection } from "./billing-section";
import { UnblockButton } from "./unblock-button";
import { PushNotificationToggle } from "./push-notification-toggle";

export const dynamic = "force-dynamic";

const REPORT_STATUS_LABEL = { open: "対応待ち", resolved: "対応済み" } as const;

export default async function MyPage() {
  const { supabase, profile } = await requireVerifiedUser();

  const [{ data: blocks }, { data: meetups }, { data: reports }] =
    await Promise.all([
      supabase.from("blocks").select("blocked_id").eq("blocker_id", profile.id),
      supabase
        .from("meetups")
        .select("id, checkin_id, created_at")
        .contains("confirmed_by", [profile.id])
        .order("created_at", { ascending: false }),
      supabase
        .from("reports")
        .select("id, target_type, reason, status, created_at")
        .eq("reporter_id", profile.id)
        .order("created_at", { ascending: false }),
    ]);

  const blockedUserIds = (blocks ?? []).map((b) => b.blocked_id);
  const checkinIds = [...new Set((meetups ?? []).map((m) => m.checkin_id))];

  const [{ data: blockedUsers }, { data: meetupCheckins }] = await Promise.all([
    blockedUserIds.length
      ? supabase.from("users").select("id, nickname").in("id", blockedUserIds)
      : Promise.resolve({ data: [] as { id: string; nickname: string }[] }),
    checkinIds.length
      ? supabase.from("checkins").select("id, shop_id").in("id", checkinIds)
      : Promise.resolve({ data: [] as { id: string; shop_id: string }[] }),
  ]);

  const shopIds = [...new Set((meetupCheckins ?? []).map((c) => c.shop_id))];
  const { data: shops } = shopIds.length
    ? await supabase.from("shops").select("id, name").in("id", shopIds)
    : { data: [] as { id: string; name: string }[] };

  const nicknameByUserId = new Map(
    (blockedUsers ?? []).map((u) => [u.id, u.nickname]),
  );
  const shopIdByCheckinId = new Map(
    (meetupCheckins ?? []).map((c) => [c.id, c.shop_id]),
  );
  const shopNameById = new Map((shops ?? []).map((s) => [s.id, s.name]));

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-10 px-6 py-8">
      <h1 className="text-xl font-bold">マイページ</h1>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">プロフィール</h2>
        <ProfileEditForm
          nickname={profile.nickname}
          bio={profile.bio}
          interestTags={profile.interest_tags}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">課金管理</h2>
        <BillingSection plan={profile.plan} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">通知</h2>
        <PushNotificationToggle />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">合流履歴</h2>
        {(meetups ?? []).length === 0 && (
          <p className="text-sm text-neutral-500">まだ合流履歴はありません</p>
        )}
        {(meetups ?? []).map((meetup) => {
          const shopId = shopIdByCheckinId.get(meetup.checkin_id);
          const shopName = shopId ? shopNameById.get(shopId) : undefined;
          return (
            <div
              key={meetup.id}
              className="rounded-lg border border-neutral-200 p-3 text-sm"
            >
              <span className="font-medium">{shopName ?? "店舗"}</span>
              <span className="ml-2 text-neutral-500">
                {new Date(meetup.created_at).toLocaleDateString("ja-JP")}
              </span>
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">ブロックリスト</h2>
        {blockedUserIds.length === 0 && (
          <p className="text-sm text-neutral-500">
            ブロックしたユーザーはいません
          </p>
        )}
        {blockedUserIds.map((id) => (
          <div
            key={id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 text-sm"
          >
            <span>{nicknameByUserId.get(id) ?? "unknown"}</span>
            <UnblockButton blockedUserId={id} />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">通報履歴</h2>
        {(reports ?? []).length === 0 && (
          <p className="text-sm text-neutral-500">通報履歴はありません</p>
        )}
        {(reports ?? []).map((report) => (
          <div
            key={report.id}
            className="rounded-lg border border-neutral-200 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <span>{report.target_type}</span>
              <span className="text-neutral-500">
                {REPORT_STATUS_LABEL[report.status]}
              </span>
            </div>
            <p className="mt-1 text-neutral-700">{report.reason}</p>
          </div>
        ))}
      </section>

      <footer className="flex gap-4 text-xs text-neutral-400">
        <Link href="/terms" className="underline">
          利用規約
        </Link>
        <Link href="/privacy" className="underline">
          プライバシーポリシー
        </Link>
      </footer>
    </main>
  );
}
