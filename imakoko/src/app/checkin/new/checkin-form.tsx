"use client";

import { useMemo, useState } from "react";
import { createCheckin } from "./actions";
import type { CheckinStatus } from "@/types/database";

const MAX_MESSAGE_LENGTH = 50;

type Shop = { id: string; name: string; genre: string | null };

export function CheckinForm({ shops }: { shops: Shop[] }) {
  const [query, setQuery] = useState("");
  const [shopId, setShopId] = useState<string | null>(null);
  const [status, setStatus] = useState<CheckinStatus>("here");
  const [message, setMessage] = useState("");
  const [capacity, setCapacity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredShops = useMemo(() => {
    if (!query) return shops;
    return shops.filter((shop) => shop.name.includes(query));
  }, [shops, query]);

  const selectedShop = shops.find((shop) => shop.id === shopId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!shopId) {
      setError("店舗を選択してください");
      return;
    }

    setSubmitting(true);
    const result = await createCheckin({ shopId, status, message, capacity });
    setSubmitting(false);

    if (result.error) setError(result.error);
  }

  if (!selectedShop) {
    return (
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="店舗名で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-lg border border-neutral-300 px-4 py-3"
        />
        <ul className="flex flex-col gap-2">
          {filteredShops.map((shop) => (
            <li key={shop.id}>
              <button
                type="button"
                onClick={() => setShopId(shop.id)}
                className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-left"
              >
                <span className="font-medium">{shop.name}</span>
                {shop.genre && (
                  <span className="ml-2 text-sm text-neutral-500">
                    {shop.genre}
                  </span>
                )}
              </button>
            </li>
          ))}
          {filteredShops.length === 0 && (
            <p className="text-sm text-neutral-500">
              店舗が見つかりませんでした
            </p>
          )}
        </ul>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
        <span className="font-medium">{selectedShop.name}</span>
        <button
          type="button"
          onClick={() => setShopId(null)}
          className="text-sm text-neutral-500 underline"
        >
          変更する
        </button>
      </div>

      <fieldset className="flex gap-3">
        <legend className="mb-1 text-sm font-medium">ステータス</legend>
        {(
          [
            { value: "here", label: "🍺 いる" },
            { value: "heading", label: "🚶 向かってる" },
          ] as const
        ).map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => setStatus(option.value)}
            className={`rounded-full border px-4 py-2 text-sm ${
              status === option.value
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300"
            }`}
          >
            {option.label}
          </button>
        ))}
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          一言（{message.length}/{MAX_MESSAGE_LENGTH}）
        </span>
        <input
          type="text"
          maxLength={MAX_MESSAGE_LENGTH}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="一人飲み中、誰か来て"
          className="rounded-lg border border-neutral-300 px-4 py-3"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">合流可能人数</span>
        <select
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
          className="rounded-lg border border-neutral-300 px-4 py-3"
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}人
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "投稿中..." : "チェックインする"}
      </button>
    </form>
  );
}
