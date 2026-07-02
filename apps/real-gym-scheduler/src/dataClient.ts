import { supabase } from "./supabaseClient";
import type { Slot } from "./types";

export const DEMO_MODE = supabase === null;

const DEMO_STORAGE_KEY = "real-gym-scheduler:demo-slots";
const demoListeners = new Set<() => void>();

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
