"use client";

import { useTransition } from "react";
import { approveKyc, rejectKyc } from "./actions";

export function KycRowActions({
  userId,
  kycImagePath,
}: {
  userId: string;
  kycImagePath: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <button
        disabled={isPending}
        onClick={() => startTransition(() => approveKyc(userId, kycImagePath))}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        承認
      </button>
      <button
        disabled={isPending}
        onClick={() => startTransition(() => rejectKyc(userId))}
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        却下
      </button>
    </div>
  );
}
