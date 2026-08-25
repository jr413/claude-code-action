import { colorForIndex, DEFAULT_MEMBERS, type MemberInfo } from "./members";
import { supabase } from "./supabaseClient";
import type { Slot } from "./types";

export const DEMO_MODE = supabase === null;

const DEMO_STORAGE_KEY = "real-gym-scheduler:demo-slots";
const demoListeners = new Set<() => void>();

const DEMO_MEMBERS_KEY = "real-gym-scheduler:demo-members";
const demoMemberListeners = new Set<() => void>();

function readDemoMembers(): MemberInfo[] {
  try {
    const raw = localStorage.getItem(DEMO_MEMBERS_KEY);
    if (!raw) return DEFAULT_MEMBERS;
    return JSON.parse(raw) as MemberInfo[];
  } catch {
    return DEFAULT_MEMBERS;
  }
}

function writeDemoMembers(members: MemberInfo[]) {
  localStorage.setItem(DEMO_MEMBERS_KEY, JSON.stringify(members));
  demoMemberListeners.forEach((listener) => listener());
}

function readDemoSlots(): Slot[] {
  try {
    return JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) ?? "[]") as Slot[];
  } catch {
    return [];
  }
}

function writeDemoSlots(slots: Slot[]) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(slots));
  demoListeners.forEach((listener) => listener());
}

export interface UpsertSlotInput {
  member: Slot["member"];
  slot_date: string;
  start_time: string;
  end_time: string;
}

export async function listSlots(
  startKey: string,
  endKey: string,
): Promise<{ data: Slot[]; error: string | null }> {
  if (DEMO_MODE) {
    const slots = readDemoSlots().filter(
      (s) => s.slot_date >= startKey && s.slot_date <= endKey,
    );
    return { data: slots, error: null };
  }
  const { data, error } = await supabase!
    .from("slots")
    .select("*")
    .gte("slot_date", startKey)
    .lte("slot_date", endKey)
    .order("slot_date", { ascending: true });
  return { data: (data ?? []) as Slot[], error: error?.message ?? null };
}

export async function upsertSlot(
  input: UpsertSlotInput,
): Promise<{ error: string | null }> {
  if (DEMO_MODE) {
    const slots = readDemoSlots().filter(
      (s) => !(s.member === input.member && s.slot_date === input.slot_date),
    );
    slots.push({
      id: `${input.member}-${input.slot_date}`,
      created_at: new Date().toISOString(),
      ...input,
    });
    writeDemoSlots(slots);
    return { error: null };
  }
  const { error } = await supabase!
    .from("slots")
    .upsert(input, { onConflict: "member,slot_date" });
  return { error: error?.message ?? null };
}

export async function deleteSlot(
  member: string,
  slotDate: string,
): Promise<{ error: string | null }> {
  if (DEMO_MODE) {
    writeDemoSlots(
      readDemoSlots().filter(
        (s) => !(s.member === member && s.slot_date === slotDate),
      ),
    );
    return { error: null };
  }
  const { error } = await supabase!
    .from("slots")
    .delete()
    .eq("member", member)
    .eq("slot_date", slotDate);
  return { error: error?.message ?? null };
}

export function subscribeToChanges(onChange: () => void): () => void {
  if (DEMO_MODE) {
    demoListeners.add(onChange);
    return () => demoListeners.delete(onChange);
  }
  const channel = supabase!
    .channel("slots-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "slots" },
      onChange,
    )
    .subscribe();
  return () => {
    supabase!.removeChannel(channel);
  };
}

export async function listMembers(): Promise<{
  data: MemberInfo[];
  error: string | null;
}> {
  if (DEMO_MODE) {
    return { data: readDemoMembers(), error: null };
  }
  const { data, error } = await supabase!
    .from("members")
    .select("name, color")
    .order("created_at", { ascending: true });
  return { data: (data ?? []) as MemberInfo[], error: error?.message ?? null };
}

export async function addMember(
  name: string,
): Promise<{ error: string | null }> {
  if (DEMO_MODE) {
    const members = readDemoMembers();
    members.push({ name, color: colorForIndex(members.length) });
    writeDemoMembers(members);
    return { error: null };
  }
  const { count } = await supabase!
    .from("members")
    .select("id", { count: "exact", head: true });
  const { error } = await supabase!
    .from("members")
    .insert({ name, color: colorForIndex(count ?? 0) });
  if (error) {
    if (error.code === "23505") {
      return { error: "その名前はすでに登録されています。" };
    }
    return { error: error.message };
  }
  return { error: null };
}

export function subscribeToMemberChanges(onChange: () => void): () => void {
  if (DEMO_MODE) {
    demoMemberListeners.add(onChange);
    return () => demoMemberListeners.delete(onChange);
  }
  const channel = supabase!
    .channel("members-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "members" },
      onChange,
    )
    .subscribe();
  return () => {
    supabase!.removeChannel(channel);
  };
}
