"use client";

import Link from "next/link";
import { useTransition } from "react";
import { blockUser } from "./actions";

export function ThreadActions({
  otherUserId,
  joinRequestId,
}: {
  otherUserId: string;
  joinRequestId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-3 text-sm">
      <Link
        href={`/report/new?type=profile&id=${otherUserId}&userId=${otherUserId}&returnTo=/messages/${joinRequestId}`}
        className="text-red-600"
      >
        通報する
      </Link>
      <button
        disabled={isPending}
        onClick={() => startTransition(() => blockUser(otherUserId))}
        className="text-neutral-500 disabled:opacity-50"
      >
        ブロックする
      </button>
    </div>
  );
}
