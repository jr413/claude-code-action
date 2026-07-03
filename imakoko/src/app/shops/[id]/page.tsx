import Link from "next/link";
import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/current-user";
import { formatRemaining } from "@/lib/time";
import { JoinButton } from "@/components/join-button";

const STATUS_LABEL = { here: "🍺 いる", heading: "🚶 向かってる" } as const;

const PARTNER_LABEL = {
  none: null,
  light: "提携店",
  standard: "提携店",
} as const;

export default async function ShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await requireVerifiedUser();

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, genre, address, photo_url, partner_plan")
    .eq("id", id)
    .maybeSingle();

  if (!shop) notFound();

  const [{ data: checkins }, { data: coupons }] = await Promise.all([
    supabase
      .from("checkins")
      .select("id, user_id, status, message, capacity, expires_at")
      .eq("shop_id", id)
      .is("ended_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
    shop.partner_plan !== "none"
      ? supabase
          .from("coupons")
          .select("id, title, conditions")
          .eq("shop_id", id)
          .eq("is_active", true)
      : Promise.resolve({
          data: [] as {
            id: string;
            title: string;
            conditions: string | null;
          }[],
        }),
  ]);

  const rows = checkins ?? [];
  const userIds = [...new Set(rows.map((c) => c.user_id))];

  const [{ data: users }, { data: myRequests }] = await Promise.all([
    userIds.length
      ? supabase
          .from("users")
          .select("id, nickname, avatar_url")
          .in("id", userIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            nickname: string;
            avatar_url: string | null;
          }[],
        }),
    rows.length
      ? supabase
          .from("join_requests")
          .select("checkin_id")
          .eq("requester_id", profile.id)
          .in(
            "checkin_id",
            rows.map((c) => c.id),
          )
      : Promise.resolve({ data: [] as { checkin_id: string }[] }),
  ]);

  const userById = new Map((users ?? []).map((u) => [u.id, u]));
  const requestedCheckinIds = new Set(
    (myRequests ?? []).map((r) => r.checkin_id),
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-6 py-8">
      <div>
        {shop.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shop.photo_url}
            alt={shop.name}
            className="mb-4 h-40 w-full rounded-xl object-cover"
          />
        )}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{shop.name}</h1>
          {PARTNER_LABEL[shop.partner_plan] && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {PARTNER_LABEL[shop.partner_plan]}
            </span>
          )}
        </div>
        {shop.genre && <p className="text-sm text-neutral-500">{shop.genre}</p>}
        {shop.address && (
          <p className="text-sm text-neutral-500">{shop.address}</p>
        )}
      </div>

      {coupons && coupons.length > 0 && (
        <div className="flex flex-col gap-2">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="rounded-lg bg-amber-50 p-3">
              <p className="font-semibold text-amber-900">{coupon.title}</p>
              {coupon.conditions && (
                <p className="text-sm text-amber-700">{coupon.conditions}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold">今いる人・向かってる人</h2>
        {rows.length === 0 && (
          <p className="text-sm text-neutral-500">まだ誰もいません</p>
        )}
        {rows.map((checkin) => {
          const author = userById.get(checkin.user_id);
          return (
            <div
              key={checkin.id}
              className="flex items-center justify-between rounded-xl border border-neutral-200 p-4"
            >
              <div className="flex items-center gap-3">
                {author?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={author.avatar_url}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-neutral-200" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {author?.nickname ?? "unknown"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {STATUS_LABEL[checkin.status]} ・{" "}
                    {formatRemaining(checkin.expires_at)}
                  </p>
                  {checkin.message && (
                    <p className="text-sm text-neutral-700">
                      {checkin.message}
                    </p>
                  )}
                </div>
              </div>
              {checkin.user_id !== profile.id && (
                <div className="flex flex-col items-end gap-1">
                  <JoinButton
                    checkinId={checkin.id}
                    initiallyRequested={requestedCheckinIds.has(checkin.id)}
                  />
                  <Link
                    href={`/report/new?type=checkin&id=${checkin.id}&userId=${checkin.user_id}&returnTo=/shops/${shop.id}`}
                    className="text-xs text-neutral-400"
                  >
                    通報する
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
