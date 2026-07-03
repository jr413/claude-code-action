import Link from "next/link";
import { requireVerifiedUser } from "@/lib/current-user";
import { RequestActions } from "./request-actions";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const { supabase, profile } = await requireVerifiedUser();

  // RLS already scopes this to requests where I'm either the requester or
  // the checkin owner — no extra filter needed.
  const { data: requests } = await supabase
    .from("join_requests")
    .select("id, checkin_id, requester_id, status, created_at")
    .order("created_at", { ascending: false });

  const rows = requests ?? [];
  const checkinIds = [...new Set(rows.map((r) => r.checkin_id))];
  const userIds = [...new Set(rows.map((r) => r.requester_id))];

  const { data: checkins } = checkinIds.length
    ? await supabase
        .from("checkins")
        .select("id, user_id, shop_id")
        .in("id", checkinIds)
    : { data: [] as { id: string; user_id: string; shop_id: string }[] };

  const checkinById = new Map((checkins ?? []).map((c) => [c.id, c]));
  const ownerIds = [...new Set((checkins ?? []).map((c) => c.user_id))];
  const shopIds = [...new Set((checkins ?? []).map((c) => c.shop_id))];

  const [{ data: users }, { data: shops }] = await Promise.all([
    supabase
      .from("users")
      .select("id, nickname")
      .in("id", [...new Set([...userIds, ...ownerIds])]),
    shopIds.length
      ? supabase.from("shops").select("id, name").in("id", shopIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const nicknameById = new Map((users ?? []).map((u) => [u.id, u.nickname]));
  const shopNameById = new Map((shops ?? []).map((s) => [s.id, s.name]));

  const incoming = rows.filter(
    (r) =>
      r.status === "pending" &&
      checkinById.get(r.checkin_id)?.user_id === profile.id,
  );
  const approved = rows.filter((r) => r.status === "approved");

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-8 px-6 py-8">
      <div>
        <h1 className="text-xl font-bold">合流リクエスト</h1>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">受信したリクエスト</h2>
        {incoming.length === 0 && (
          <p className="text-sm text-neutral-500">
            保留中のリクエストはありません
          </p>
        )}
        {incoming.map((request) => {
          const checkin = checkinById.get(request.checkin_id);
          return (
            <div
              key={request.id}
              className="flex items-center justify-between rounded-xl border border-neutral-200 p-4"
            >
              <div>
                <p className="text-sm font-medium">
                  {nicknameById.get(request.requester_id) ?? "unknown"}
                </p>
                <p className="text-xs text-neutral-500">
                  {checkin ? shopNameById.get(checkin.shop_id) : ""}
                </p>
              </div>
              <RequestActions requestId={request.id} />
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">トーク</h2>
        {approved.length === 0 && (
          <p className="text-sm text-neutral-500">
            承認済みのトークはありません
          </p>
        )}
        {approved.map((request) => {
          const checkin = checkinById.get(request.checkin_id);
          const isOwner = checkin?.user_id === profile.id;
          const otherId = isOwner ? request.requester_id : checkin?.user_id;
          return (
            <Link
              key={request.id}
              href={`/messages/${request.id}`}
              className="flex items-center justify-between rounded-xl border border-neutral-200 p-4"
            >
              <div>
                <p className="text-sm font-medium">
                  {otherId
                    ? (nicknameById.get(otherId) ?? "unknown")
                    : "unknown"}
                </p>
                <p className="text-xs text-neutral-500">
                  {checkin ? shopNameById.get(checkin.shop_id) : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
