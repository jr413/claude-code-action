"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!phone) {
      setError("電話番号が見つかりません。最初からやり直してください");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });

    if (verifyError || !data.session) {
      setSubmitting(false);
      setError("認証コードが正しくありません");
      return;
    }

    // A row in `users` only exists once profile registration (step 2) has
    // been completed — route accordingly.
    const { data: profile } = await supabase
      .from("users")
      .select("kyc_status")
      .eq("id", data.session.user.id)
      .maybeSingle();

    setSubmitting(false);

    if (!profile) {
      router.push("/onboarding/profile");
    } else if (profile.kyc_status === "verified") {
      router.push("/");
    } else {
      router.push("/onboarding/pending");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="rounded-lg border border-neutral-300 px-4 py-3 text-base tracking-widest"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "確認中..." : "確認する"}
      </button>
    </form>
  );
}

export default function VerifyPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-xl font-bold">認証コードを入力してください</h1>
        <p className="mt-2 text-sm text-neutral-500">
          SMSで届いた6桁のコードを入力してください
        </p>
      </div>
      <Suspense fallback={null}>
        <VerifyForm />
      </Suspense>
    </main>
  );
}
