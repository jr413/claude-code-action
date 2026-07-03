"use client";

import { useTransition } from "react";
import { endCheckin } from "./actions";

export function EndCheckinButton({ checkinId }: { checkinId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => endCheckin(checkinId))}
      className="rounded-lg border border-neutral-300 px-4 py-3 font-semibold disabled:opacity-50"
    >
      {isPending ? "終了中..." : "チェックインを終了する"}
    </button>
  );
}
