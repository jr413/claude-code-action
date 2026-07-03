"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, {
    error: null,
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-xl font-bold">管理画面ログイン</h1>
      <form action={formAction} className="flex flex-col gap-4">
        <input
          type="password"
          name="password"
          placeholder="パスワード"
          required
          className="rounded-lg border border-neutral-300 px-4 py-3"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {pending ? "確認中..." : "ログイン"}
        </button>
      </form>
    </main>
  );
}
