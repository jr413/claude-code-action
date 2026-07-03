"use client";

import { useTransition } from "react";
import { respondToJoinRequest } from "./actions";

export function RequestActions({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(() => respondToJoinRequest(requestId, "approved"))
        }
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        承認
      </button>
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(() => respondToJoinRequest(requestId, "declined"))
        }
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
      >
        辞退
      </button>
    </div>
  );
}
