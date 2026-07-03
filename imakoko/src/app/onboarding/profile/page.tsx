"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { INTEREST_TAGS, MAX_INTEREST_TAGS } from "@/lib/interest-tags";

const MAX_BIO_LENGTH = 30;

function isAdult(birthDate: string): boolean {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return false;

  const eighteenthBirthday = new Date(birth);
  eighteenthBirthday.setFullYear(birth.getFullYear() + 18);
  return eighteenthBirthday <= new Date();
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleTag(tag: string) {
    setTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_INTEREST_TAGS) return prev;
      return [...prev, tag];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!kycFile) {
      setError("本人確認書類の画像をアップロードしてください");
      return;
    }
    if (!isAdult(birthDate)) {
      setError(
        "生年月日をご確認ください（18歳未満の方はご利用いただけません）",
      );
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitting(false);
      setError("セッションが切れました。最初からやり直してください");
      return;
    }

    let avatarUrl: string | null = null;
    if (avatarFile) {
      const path = `${user.id}/${Date.now()}-${avatarFile.name}`;
      const { error: avatarError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });
      if (avatarError) {
        setSubmitting(false);
        setError("アイコン画像のアップロードに失敗しました");
        return;
      }
      avatarUrl = supabase.storage.from("avatars").getPublicUrl(path)
        .data.publicUrl;
    }

    const kycPath = `${user.id}/${Date.now()}-${kycFile.name}`;
    const { error: kycUploadError } = await supabase.storage
      .from("kyc-documents")
      .upload(kycPath, kycFile);
    if (kycUploadError) {
      setSubmitting(false);
      setError("本人確認書類のアップロードに失敗しました");
      return;
    }

    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      nickname,
      avatar_url: avatarUrl,
      bio,
      interest_tags: tags,
      birth_date: birthDate,
      kyc_image_url: kycPath,
      kyc_status: "pending",
    });

    setSubmitting(false);

    if (insertError) {
      setError("プロフィールの登録に失敗しました");
      return;
    }

    router.push("/onboarding/pending");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-xl font-bold">プロフィール登録</h1>
        <p className="mt-2 text-sm text-neutral-500">
          本人確認書類のアップロードには運転免許証またはマイナンバーカード（表面）が必要です
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">ニックネーム</span>
          <input
            type="text"
            required
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="rounded-lg border border-neutral-300 px-4 py-3"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">アイコン画像（任意）</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            一言（{bio.length}/{MAX_BIO_LENGTH}）
          </span>
          <input
            type="text"
            maxLength={MAX_BIO_LENGTH}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="一人飲み中、誰か来て"
            className="rounded-lg border border-neutral-300 px-4 py-3"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">
            興味タグ（最大{MAX_INTEREST_TAGS}つ）
          </legend>
          <div className="flex flex-wrap gap-2">
            {INTEREST_TAGS.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    selected
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 text-neutral-700"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">生年月日</span>
          <input
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="rounded-lg border border-neutral-300 px-4 py-3"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            本人確認書類（運転免許証 or マイナンバーカード表面）
          </span>
          <input
            type="file"
            accept="image/*"
            required
            onChange={(e) => setKycFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "送信中..." : "登録する"}
        </button>
      </form>
    </main>
  );
}
