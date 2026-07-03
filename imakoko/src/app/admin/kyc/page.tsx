import { createAdminClient } from "@/lib/supabase/admin";
import { KycRowActions } from "./kyc-row-actions";

// Reads live moderation state via the service-role key on every request —
// must never be statically prerendered.
export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 5 * 60;

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export default async function AdminKycQueuePage() {
  const supabase = createAdminClient();

  const { data: pendingUsers, error } = await supabase
    .from("users")
    .select("id, nickname, birth_date, kyc_image_url, created_at")
    .eq("kyc_status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <main className="p-6 text-red-600">
        読み込みに失敗しました: {error.message}
      </main>
    );
  }

  const rows = await Promise.all(
    (pendingUsers ?? []).map(async (user) => {
      let imageUrl: string | null = null;
      if (user.kyc_image_url) {
        const { data } = await supabase.storage
          .from("kyc-documents")
          .createSignedUrl(user.kyc_image_url, SIGNED_URL_TTL_SECONDS);
        imageUrl = data?.signedUrl ?? null;
      }
      return { ...user, imageUrl };
    }),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-xl font-bold">本人確認 承認キュー</h1>
      <p className="mt-1 text-sm text-neutral-500">{rows.length}件の審査待ち</p>

      <div className="mt-6 flex flex-col gap-4">
        {rows.length === 0 && (
          <p className="text-sm text-neutral-500">
            審査待ちのユーザーはいません
          </p>
        )}
        {rows.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-4 rounded-lg border border-neutral-200 p-4"
          >
            {user.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt="本人確認書類"
                className="h-24 w-36 rounded object-cover"
              />
            ) : (
              <div className="h-24 w-36 rounded bg-neutral-100" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{user.nickname}</p>
              <p className="text-sm text-neutral-500">
                生年月日: {user.birth_date}（{calculateAge(user.birth_date)}歳）
              </p>
              <p className="text-xs text-neutral-400">
                申請日時: {new Date(user.created_at).toLocaleString("ja-JP")}
              </p>
            </div>
            {user.kyc_image_url && (
              <KycRowActions
                userId={user.id}
                kycImagePath={user.kyc_image_url}
              />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
