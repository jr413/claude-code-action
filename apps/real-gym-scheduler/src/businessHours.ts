export const MEMBERS = ["佐藤", "ジョンス", "手島", "飯田"] as const;
export type Member = (typeof MEMBERS)[number];

export type BusinessHours =
  | { closed: true }
  | { closed: false; open: string; close: string };

// 営業時間: 火曜休み、日曜は12:00〜19:30、それ以外は12:00〜23:00
export function getBusinessHours(date: Date): BusinessHours {
  const day = date.getDay(); // 0 = 日曜, 2 = 火曜

  if (day === 2) {
    return { closed: true };
  }
  if (day === 0) {
    return { closed: false, open: "12:00", close: "19:30" };
  }
  return { closed: false, open: "12:00", close: "23:00" };
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidRange(
  date: Date,
  startTime: string,
  endTime: string,
): string | null {
  const hours = getBusinessHours(date);
  if (hours.closed) {
    return "この曜日（火曜）は定休日です。";
  }
  if (startTime >= endTime) {
    return "終了時刻は開始時刻より後にしてください。";
  }
  if (startTime < hours.open || endTime > hours.close) {
    return `営業時間内（${hours.open}〜${hours.close}）で選択してください。`;
  }
  return null;
}

// 2つの時間帯の共通部分（HH:MM文字列）。重なりがなければ null。
export function intersectRanges(
  ranges: Array<{ start: string; end: string }>,
): { start: string; end: string } | null {
  if (ranges.length === 0) return null;
  let start = ranges[0].start;
  let end = ranges[0].end;
  for (const r of ranges.slice(1)) {
    start = start > r.start ? start : r.start;
    end = end < r.end ? end : r.end;
  }
  return start < end ? { start, end } : null;
}
