import type { MemberInfo } from "./members";
import type { Slot } from "./types";

const API_BASE = "/api";
const POLL_INTERVAL_MS = 5000;

export interface UpsertSlotInput {
  member: string;
  slot_date: string;
  start_time: string;
  end_time: string;
}

async function getJson<T>(
  path: string,
  fallback: T,
): Promise<{ data: T; error: string | null }> {
  try {
    const res = await fetch(path);
    const body = (await res.json()) as { data?: T; error?: string };
    if (!res.ok)
      return {
        data: fallback,
        error: body.error ?? "通信エラーが発生しました。",
      };
    return { data: body.data ?? fallback, error: null };
  } catch {
    return { data: fallback, error: "通信エラーが発生しました。" };
  }
}

async function postJson(
  path: string,
  method: string,
  body?: unknown,
): Promise<{ error: string | null }> {
  try {
    const res = await fetch(path, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const responseBody = (await res.json()) as { error?: string };
    return {
      error: res.ok
        ? null
        : (responseBody.error ?? "通信エラーが発生しました。"),
    };
  } catch {
    return { error: "通信エラーが発生しました。" };
  }
}

export async function listSlots(
  startKey: string,
  endKey: string,
): Promise<{ data: Slot[]; error: string | null }> {
  return getJson<Slot[]>(
    `${API_BASE}/slots?start=${startKey}&end=${endKey}`,
    [],
  );
}

export async function upsertSlot(
  input: UpsertSlotInput,
): Promise<{ error: string | null }> {
  return postJson(`${API_BASE}/slots`, "POST", input);
}

export async function deleteSlot(
  member: string,
  slotDate: string,
): Promise<{ error: string | null }> {
  return postJson(
    `${API_BASE}/slots?member=${encodeURIComponent(member)}&date=${slotDate}`,
    "DELETE",
  );
}

export async function listMembers(): Promise<{
  data: MemberInfo[];
  error: string | null;
}> {
  return getJson<MemberInfo[]>(`${API_BASE}/members`, []);
}

export async function addMember(
  name: string,
): Promise<{ error: string | null }> {
  return postJson(`${API_BASE}/members`, "POST", { name });
}

// リアルタイム同期の代わりに、一定間隔でポーリングして最新状態を取得する。
export function subscribeToChanges(onChange: () => void): () => void {
  const id = setInterval(onChange, POLL_INTERVAL_MS);
  return () => clearInterval(id);
}

export function subscribeToMemberChanges(onChange: () => void): () => void {
  const id = setInterval(onChange, POLL_INTERVAL_MS);
  return () => clearInterval(id);
}
