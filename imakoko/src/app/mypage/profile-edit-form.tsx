"use client";

import { useState } from "react";
import { updateProfile } from "./actions";
import { INTEREST_TAGS, MAX_INTEREST_TAGS } from "@/lib/interest-tags";

const MAX_BIO_LENGTH = 30;

export function ProfileEditForm({
  nickname: initialNickname,
  bio: initialBio,
  interestTags: initialTags,
}: {
  nickname: string;
  bio: string | null;
  interestTags: string[];
}) {
  const [nickname, setNickname] = useState(initialNickname);
  const [bio, setBio] = useState(initialBio ?? "");
  const [tags, setTags] = useState<string[]>(initialTags);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
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
    setSaved(false);
    setSubmitting(true);

    const formData = new FormData();
    formData.set("nickname", nickname);
    formData.set("bio", bio);
    tags.forEach((tag) => formData.append("interest_tags", tag));

    const result = await updateProfile(formData);
    setSubmitting(false);

    if (result.error) setError(result.error);
    else setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <span className="text-sm font-medium">
          一言（{bio.length}/{MAX_BIO_LENGTH}）
        </span>
        <input
          type="text"
          maxLength={MAX_BIO_LENGTH}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
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

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">保存しました</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
