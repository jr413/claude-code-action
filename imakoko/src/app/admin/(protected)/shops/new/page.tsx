import { createAdminClient } from "@/lib/supabase/admin";
import { createShop } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewShopPage() {
  const supabase = createAdminClient();
  const { data: areas } = await supabase
    .from("areas")
    .select("id, name")
    .eq("is_active", true);

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-xl font-bold">店舗を登録</h1>
      <form action={createShop} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">エリア</span>
          <select
            name="area_id"
            required
            className="rounded-lg border border-neutral-300 px-4 py-3"
          >
            {(areas ?? []).map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">店舗名</span>
          <input
            name="name"
            required
            className="rounded-lg border border-neutral-300 px-4 py-3"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">ジャンル</span>
          <input
            name="genre"
            className="rounded-lg border border-neutral-300 px-4 py-3"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">住所</span>
          <input
            name="address"
            className="rounded-lg border border-neutral-300 px-4 py-3"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">提携プラン</span>
          <select
            name="partner_plan"
            defaultValue="none"
            className="rounded-lg border border-neutral-300 px-4 py-3"
          >
            <option value="none">無料掲載</option>
            <option value="light">ライト</option>
            <option value="standard">スタンダード</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-neutral-900 px-4 py-3 font-semibold text-white"
        >
          登録する
        </button>
      </form>
    </main>
  );
}
