"use client";

import { useState, useTransition } from "react";
import { sendMessage } from "./actions";

export function MessageForm({ joinRequestId }: { joinRequestId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await sendMessage(joinRequestId, body);
      if (result.error) {
        setError(result.error);
      } else {
        setBody("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="メッセージを入力"
          className="flex-1 rounded-full border border-neutral-300 px-4 py-2"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          送信
        </button>
      </div>
    </form>
  );
}
