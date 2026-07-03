"use client";

import { useTransition } from "react";
import { confirmMeetup } from "./actions";

export function MeetupSection({
  checkinId,
  joinRequestId,
  shopName,
  myConfirmed,
  bothConfirmed,
}: {
  checkinId: string;
  joinRequestId: string;
  shopName: string;
  myConfirmed: boolean;
  bothConfirmed: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (bothConfirmed) {
    const shareText = `小牧の${shopName}で合流しました🍻 #イマココ`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    return (
      <a
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-neutral-300 px-4 py-2 text-center text-sm font-semibold"
      >
        今日の合流を記念投稿する
      </a>
    );
  }

  return (
    <button
      disabled={isPending || myConfirmed}
      onClick={() =>
        startTransition(() => confirmMeetup(checkinId, joinRequestId))
      }
      className="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50"
    >
      {myConfirmed ? "相手の確認を待っています" : "合流できたら確認する"}
    </button>
  );
}
