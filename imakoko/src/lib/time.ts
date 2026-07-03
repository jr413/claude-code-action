export function formatRemaining(expiresAtIso: string): string {
  const remainingMs = new Date(expiresAtIso).getTime() - Date.now();
  if (remainingMs <= 0) return "まもなく終了";

  const totalMinutes = Math.floor(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `あと${minutes}分`;
  return `あと${hours}時間${minutes}分`;
}
