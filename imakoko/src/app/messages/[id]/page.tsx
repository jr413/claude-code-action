import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/current-user";
import { isThreadLocked } from "@/lib/time";
import { MessageForm } from "./message-form";
import { ThreadActions } from "./thread-actions";
import { MeetupSection } from "./meetup-section";

export const dynamic = "force-dynamic";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await requireVerifiedUser();

  const { data: joinRequest } = await supabase
    .from("join_requests")
    .select("id, checkin_id, requester_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!joinRequest) notFound();

  const { data: checkin } = await supabase
    .from("checkins")
    .select("user_id, shop_id, expires_at, ended_at")
    .eq("id", joinRequest.checkin_id)
    .maybeSingle();

  if (!checkin) notFound();

  const otherUserId =
    profile.id === joinRequest.requester_id
      ? checkin.user_id
      : joinRequest.requester_id;

  const [
    { data: shop },
    { data: otherUser },
    { data: messages },
    { data: meetup },
  ] = await Promise.all([
    supabase
      .from("shops")
      .select("name")
      .eq("id", checkin.shop_id)
      .maybeSingle(),
    supabase
      .from("users")
      .select("nickname")
      .eq("id", otherUserId)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("join_request_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("meetups")
      .select("confirmed_by")
      .eq("checkin_id", joinRequest.checkin_id)
      .maybeSingle(),
  ]);

  if (joinRequest.status !== "approved") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-2 px-6 text-center">
        <h1 className="text-xl font-bold">承認待ちです</h1>
        <p className="text-sm text-neutral-500">
          相手が承認するとトークができるようになります
        </p>
      </main>
    );
  }

  const locked = isThreadLocked(checkin.ended_at ?? checkin.expires_at);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">
            {otherUser?.nickname ?? "unknown"}
          </h1>
          <p className="text-xs text-neutral-500">{shop?.name}</p>
        </div>
        <ThreadActions otherUserId={otherUserId} joinRequestId={id} />
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {(messages ?? []).map((message) => (
          <div
            key={message.id}
            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
              message.sender_id === profile.id
                ? "self-end bg-neutral-900 text-white"
                : "self-start bg-neutral-100 text-neutral-900"
            }`}
          >
            {message.body}
          </div>
        ))}
        {(messages ?? []).length === 0 && (
          <p className="text-sm text-neutral-500">まだメッセージはありません</p>
        )}
      </div>

      <MeetupSection
        checkinId={joinRequest.checkin_id}
        joinRequestId={id}
        shopName={shop?.name ?? "店舗"}
        myConfirmed={(meetup?.confirmed_by ?? []).includes(profile.id)}
        bothConfirmed={
          (meetup?.confirmed_by ?? []).includes(profile.id) &&
          (meetup?.confirmed_by ?? []).includes(otherUserId)
        }
      />

      {locked ? (
        <p className="text-center text-sm text-neutral-500">
          このトークは終了しました
        </p>
      ) : (
        <MessageForm joinRequestId={id} />
      )}
    </main>
  );
}
