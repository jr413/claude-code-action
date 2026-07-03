"use client";

import { useTransition } from "react";
import { unblockUser } from "./actions";

export function UnblockButton({ blockedUserId }: { blockedUserId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => unblockUser(blockedUserId))}
      className="text-sm text-neutral-500 underline disabled:opacity-50"
    >
      ブロック解除
    </button>
  );
}
