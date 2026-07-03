import Link from "next/link";
import { requireVerifiedUser } from "@/lib/current-user";
import { formatRemaining } from "@/lib/time";
import { JoinButton } from "@/components/join-button";
import { FeedRealtimeRefresher } from "@/components/feed-realtime-refresher";

const STATUS_LABEL = { here: "🍺 いる", heading: "🚶 向かってる" } as const;

export default async function Home() {
  const { supabase, profile } = await requireVerifiedUser();

  const { data: checkins } = await supabase
    .from("checkins")
    .select("id, user_id, shop_id, status, message, capacity, expires_at")
    .is("ended_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const rows = checkins ?? [];

  const shopIds = [...new Set(rows.map((c) => c.shop_id))];
  const userIds = [...new Set(rows.map((c) => c.user_id))];

  const [{ data: shops }, { data: users }, { data: myRequests }] =
    await Promise.all([
      shopIds.length
        ? supabase.from("shops").select("id, name").in("id", shopIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
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

  const shopById = new Map((shops ?? []).map((s) => [s.id, s]));
  const userById = new Map((users ?? []).map((u) => [u.id, u]));
  const requestedCheckinIds = new Set(
    (myRequests ?? []).map((r) => r.checkin_id),
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-6 py-8">
      <FeedRealtimeRefresher />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">小牧</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/requests"
            className="text-sm font-medium text-neutral-700"
          >
            合流リクエスト
          </Link>
          <Link
            href="/checkin/new"
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
          >
            チェックインする
          </Link>
        </div>
      </div>

      {rows.length === 0 && (
        <p className="mt-12 text-center text-sm text-neutral-500">
          今夜はまだ誰もいません。一番乗りでチェックインしよう
        </p>
      )}

      <div className="flex flex-col gap-3">
        {rows.map((checkin) => {
          const shop = shopById.get(checkin.shop_id);
          const author = userById.get(checkin.user_id);
          return (
            <div
              key={checkin.id}
              className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4"
            >
              <Link
                href={`/shops/${checkin.shop_id}`}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{shop?.name ?? "店舗"}</span>
                  <span className="text-sm">
                    {STATUS_LABEL[checkin.status]}
                  </span>
                </div>
                {checkin.message && (
                  <p className="text-sm text-neutral-700">{checkin.message}</p>
                )}
              </Link>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {author?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={author.avatar_url}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-neutral-200" />
                  )}
                  <span className="text-sm text-neutral-600">
                    {author?.nickname ?? "unknown"}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatRemaining(checkin.expires_at)}
                  </span>
                </div>
                {checkin.user_id !== profile.id && (
                  <JoinButton
                    checkinId={checkin.id}
                    initiallyRequested={requestedCheckinIds.has(checkin.id)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
