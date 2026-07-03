"use client";

import { useTransition } from "react";
import {
  createBillingPortalSession,
  createPremiumCheckoutSession,
} from "@/lib/actions/billing";
import type { Plan } from "@/types/database";

export function BillingSection({ plan }: { plan: Plan }) {
  const [isPending, startTransition] = useTransition();

  if (plan === "premium") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-4">
        <div>
          <p className="font-semibold">プレミアム会員</p>
          <p className="text-sm text-neutral-500">月980円</p>
        </div>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => createBillingPortalSession())}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          支払い管理
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-4">
      <div>
        <p className="font-semibold">無料プラン</p>
        <p className="text-sm text-neutral-500">
          チェックイン1日1回・現在エリアのみ・リクエスト1日3件
        </p>
      </div>
      <button
        disabled={isPending}
        onClick={() => startTransition(() => createPremiumCheckoutSession())}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        プレミアムに登録
      </button>
    </div>
  );
}
