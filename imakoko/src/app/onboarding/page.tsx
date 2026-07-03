"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toE164Japan } from "@/lib/phone";

export default function PhoneEntryPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const e164 = toE164Japan(phone);
    if (!e164) {
      setError("電話番号の形式が正しくありません");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: e164,
    });
    setSubmitting(false);

    if (otpError) {
      setError(
        "認証コードの送信に失敗しました。時間をおいて再度お試しください",
      );
      return;
    }

    router.push(`/onboarding/verify?phone=${encodeURIComponent(e164)}`);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-xl font-bold">電話番号を入力してください</h1>
        <p className="mt-2 text-sm text-neutral-500">
          SMSで認証コードを送信します
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="090-1234-5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-lg border border-neutral-300 px-4 py-3 text-base"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "送信中..." : "認証コードを送る"}
        </button>
        <p className="text-center text-xs text-neutral-500">
          認証コードを送信すると、
          <Link href="/terms" className="underline">
            利用規約
          </Link>
          と
          <Link href="/privacy" className="underline">
            プライバシーポリシー
          </Link>
          に同意したものとみなされます
        </p>
      </form>
    </main>
  );
}
