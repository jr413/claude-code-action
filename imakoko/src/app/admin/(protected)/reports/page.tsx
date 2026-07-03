import { createAdminClient } from "@/lib/supabase/admin";
import { ReportActions } from "./report-actions";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const supabase = createAdminClient();

  const { data: reports } = await supabase
    .from("reports")
    .select(
      "id, reporter_id, target_user_id, target_type, target_id, reason, created_at",
    )
    .eq("status", "open")
    .order("created_at", { ascending: true });

  const rows = reports ?? [];

  const checkinIds = rows
    .filter((r) => r.target_type === "checkin")
    .map((r) => r.target_id);
  const messageIds = rows
    .filter((r) => r.target_type === "message")
    .map((r) => r.target_id);
  const userIds = [
    ...new Set(
      rows.flatMap(
        (r) => [r.reporter_id, r.target_user_id].filter(Boolean) as string[],
      ),
    ),
  ];

  const [{ data: checkins }, { data: messages }, { data: users }] =
    await Promise.all([
      checkinIds.length
        ? supabase.from("checkins").select("id, message").in("id", checkinIds)
        : Promise.resolve({
            data: [] as { id: string; message: string | null }[],
          }),
      messageIds.length
        ? supabase.from("messages").select("id, body").in("id", messageIds)
        : Promise.resolve({ data: [] as { id: string; body: string }[] }),
      userIds.length
        ? supabase.from("users").select("id, nickname").in("id", userIds)
        : Promise.resolve({ data: [] as { id: string; nickname: string }[] }),
    ]);

  const checkinById = new Map((checkins ?? []).map((c) => [c.id, c]));
  const messageById = new Map((messages ?? []).map((m) => [m.id, m]));
  const nicknameById = new Map((users ?? []).map((u) => [u.id, u.nickname]));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-xl font-bold">通報対応キュー</h1>
      <p className="mt-1 text-sm text-neutral-500">{rows.length}件の未対応</p>

      <div className="mt-6 flex flex-col gap-4">
        {rows.length === 0 && (
          <p className="text-sm text-neutral-500">未対応の通報はありません</p>
        )}
        {rows.map((report) => {
          const content =
            report.target_type === "checkin"
              ? checkinById.get(report.target_id)?.message
              : report.target_type === "message"
                ? messageById.get(report.target_id)?.body
                : null;

          return (
            <div
              key={report.id}
              className="rounded-lg border border-neutral-200 p-4"
            >
              <div className="flex items-center justify-between text-sm text-neutral-500">
                <span>
                  {report.target_type} ・ 対象:{" "}
                  {nicknameById.get(report.target_user_id ?? "") ?? "-"}
                </span>
                <span>
                  {new Date(report.created_at).toLocaleString("ja-JP")}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium">{report.reason}</p>
              {content && (
                <p className="mt-1 rounded bg-neutral-50 p-2 text-sm text-neutral-700">
                  「{content}」
                </p>
              )}
              <p className="mt-1 text-xs text-neutral-400">
                通報者: {nicknameById.get(report.reporter_id) ?? "unknown"}
              </p>
              <div className="mt-3">
                <ReportActions
                  reportId={report.id}
                  targetType={report.target_type}
                  targetId={report.target_id}
                  targetUserId={report.target_user_id}
                />
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
