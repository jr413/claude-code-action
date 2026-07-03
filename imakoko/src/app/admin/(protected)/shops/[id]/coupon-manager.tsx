"use client";

import { useTransition } from "react";
import { createCoupon, deleteCoupon, toggleCouponActive } from "../actions";

type Coupon = {
  id: string;
  title: string;
  conditions: string | null;
  is_active: boolean;
};

export function CouponManager({
  shopId,
  coupons,
}: {
  shopId: string;
  coupons: Coupon[];
}) {
  const [isPending, startTransition] = useTransition();
  const createCouponWithId = createCoupon.bind(null, shopId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {coupons.length === 0 && (
          <p className="text-sm text-neutral-500">クーポンはまだありません</p>
        )}
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 p-3"
          >
            <div>
              <p className="text-sm font-medium">{coupon.title}</p>
              {coupon.conditions && (
                <p className="text-xs text-neutral-500">{coupon.conditions}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(() =>
                    toggleCouponActive(coupon.id, shopId, !coupon.is_active),
                  )
                }
                className="text-sm text-neutral-600 underline disabled:opacity-50"
              >
                {coupon.is_active ? "非公開にする" : "公開する"}
              </button>
              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(() => deleteCoupon(coupon.id, shopId))
                }
                className="text-sm text-red-600 underline disabled:opacity-50"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      <form
        action={createCouponWithId}
        className="flex flex-col gap-2 border-t pt-4"
      >
        <input
          name="title"
          required
          placeholder="チェックインで1杯無料"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          name="conditions"
          placeholder="条件（任意）"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white"
        >
          クーポンを追加
        </button>
      </form>
    </div>
  );
}
