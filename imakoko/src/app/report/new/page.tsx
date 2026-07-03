import { submitReport } from "./actions";

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    id?: string;
    userId?: string;
    returnTo?: string;
  }>;
}) {
  const { type, id, userId, returnTo } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-xl font-bold">通報する</h1>
        <p className="mt-2 text-sm text-neutral-500">
          内容は24時間以内に運営が確認します
        </p>
      </div>
      <form action={submitReport} className="flex flex-col gap-4">
        <input type="hidden" name="target_type" value={type ?? "profile"} />
        <input type="hidden" name="target_id" value={id ?? ""} />
        <input type="hidden" name="target_user_id" value={userId ?? ""} />
        <input type="hidden" name="return_to" value={returnTo ?? "/"} />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">通報理由</span>
          <textarea
            name="reason"
            required
            rows={4}
            className="rounded-lg border border-neutral-300 px-4 py-3"
            placeholder="具体的な内容を教えてください"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-4 py-3 font-semibold text-white"
        >
          通報する
        </button>
      </form>
    </main>
  );
}
