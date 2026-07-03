"use client";

import { useState, useTransition } from "react";
import { requestJoin } from "@/lib/actions/join-requests";

export function JoinButton({
  checkinId,
  initiallyRequested,
}: {
  checkinId: string;
  initiallyRequested: boolean;
}) {
  const [requested, setRequested] = useState(initiallyRequested);
  const [isPending, startTransition] = useTransition();

  if (requested) {
    return (
      <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-500">
        リクエスト済み
      </span>
    );
  }

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const { error } = await requestJoin(checkinId);
          if (!error) setRequested(true);
        })
      }
      className="rounded-full bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
    >
      合流したい
    </button>
  );
}
