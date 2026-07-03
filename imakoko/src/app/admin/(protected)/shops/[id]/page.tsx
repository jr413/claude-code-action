import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateShop } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, genre, address, partner_plan, is_active")
    .eq("id", id)
    .maybeSingle();

  if (!shop) notFound();

  const updateShopWithId = updateShop.bind(null, shop.id);

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-xl font-bold">店舗を編集</h1>
      <form action={updateShopWithId} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">店舗名</span>
          <input
            name="name"
            required
            defaultValue={shop.name}
            className="rounded-lg border border-neutral-300 px-4 py-3"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">ジャンル</span>
          <input
            name="genre"
            defaultValue={shop.genre ?? ""}
            className="rounded-lg border border-neutral-300 px-4 py-3"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">住所</span>
          <input
            name="address"
            defaultValue={shop.address ?? ""}
            className="rounded-lg border border-neutral-300 px-4 py-3"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">提携プラン</span>
          <select
            name="partner_plan"
            defaultValue={shop.partner_plan}
            className="rounded-lg border border-neutral-300 px-4 py-3"
          >
            <option value="none">無料掲載</option>
            <option value="light">ライト</option>
            <option value="standard">スタンダード</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={shop.is_active}
          />
          <span className="text-sm font-medium">掲載を公開する</span>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-neutral-900 px-4 py-3 font-semibold text-white"
        >
          保存する
        </button>
      </form>
    </main>
  );
}
