import type { Member } from "./businessHours";

export interface Slot {
  id: string;
  member: Member;
  slot_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  created_at: string;
}
