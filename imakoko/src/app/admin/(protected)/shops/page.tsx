import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PARTNER_LABEL = {
  none: "無料掲載",
  light: "ライト",
  standard: "スタンダード",
} as const;

export default async function AdminShopsPage() {
  const supabase = createAdminClient();

  const { data: shops } = await supabase
    .from("shops")
    .select("id, name, genre, partner_plan, is_active")
    .order("name");

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">店舗マスタ管理</h1>
        <Link
          href="/admin/shops/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white"
        >
          新規登録
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {(shops ?? []).map((shop) => (
          <Link
            key={shop.id}
            href={`/admin/shops/${shop.id}`}
            className="flex items-center justify-between rounded-lg border border-neutral-200 p-4"
          >
            <div>
              <p className="font-medium">{shop.name}</p>
              <p className="text-sm text-neutral-500">{shop.genre}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>{PARTNER_LABEL[shop.partner_plan]}</span>
              {!shop.is_active && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-500">
                  非公開
                </span>
              )}
            </div>
          </Link>
        ))}
        {(shops ?? []).length === 0 && (
          <p className="text-sm text-neutral-500">店舗が登録されていません</p>
        )}
      </div>
    </main>
  );
}
