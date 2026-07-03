"use client";

import { useTransition } from "react";
import { banUser, dismissReport, hideTarget, warnUser } from "./actions";
import type { ReportTargetType } from "@/types/database";

export function ReportActions({
  reportId,
  targetType,
  targetId,
  targetUserId,
}: {
  reportId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetUserId: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {(targetType === "checkin" || targetType === "message") && (
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(() => hideTarget(reportId, targetType, targetId))
          }
          className="rounded-md bg-neutral-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          投稿非表示
        </button>
      )}
      {targetUserId && (
        <>
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(() => warnUser(reportId, targetUserId))
            }
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            警告
          </button>
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(() => banUser(reportId, targetUserId))
            }
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            BAN
          </button>
        </>
      )}
      <button
        disabled={isPending}
        onClick={() => startTransition(() => dismissReport(reportId))}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
      >
        問題なし
      </button>
    </div>
  );
}
