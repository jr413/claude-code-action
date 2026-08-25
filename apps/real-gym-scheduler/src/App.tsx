import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar } from "./components/Calendar";
import { DayPanel } from "./components/DayPanel";
import type { Member } from "./businessHours";
import {
  addMember,
  DEMO_MODE,
  deleteSlot,
  listMembers,
  listSlots,
  subscribeToChanges,
  subscribeToMemberChanges,
  upsertSlot,
} from "./dataClient";
import {
  colorForIndex,
  DEFAULT_MEMBERS,
  validateNewMemberName,
  type MemberInfo,
} from "./members";
import type { Slot } from "./types";

const MEMBER_STORAGE_KEY = "real-gym-scheduler:member";

function monthRange(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { startKey: toKey(start), endKey: toKey(end) };
}

export default function App() {
  const [currentMember, setCurrentMember] = useState<Member | null>(
    () => localStorage.getItem(MEMBER_STORAGE_KEY) ?? null,
  );
  const [members, setMembers] = useState<MemberInfo[]>(DEFAULT_MEMBERS);
  const [newMemberName, setNewMemberName] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dayPanelRef = useRef<HTMLDivElement>(null);

  const { startKey, endKey } = useMemo(() => monthRange(month), [month]);

  const memberColors = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m) => (map[m.name] = m.color));
    return map;
  }, [members]);

  useEffect(() => {
    let cancelled = false;
    async function fetchMembers() {
      const { data } = await listMembers();
      if (!cancelled && data.length > 0) setMembers(data);
    }
    fetchMembers();
    const unsubscribe = subscribeToMemberChanges(fetchMembers);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchSlots() {
      setLoading(true);
      const { data, error: fetchError } = await listSlots(startKey, endKey);
      if (!cancelled) {
        if (fetchError) setError(fetchError);
        else setSlots(data);
        setLoading(false);
      }
    }
    fetchSlots();

    const unsubscribe = subscribeToChanges(fetchSlots);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [startKey, endKey]);

  useEffect(() => {
    if (selectedDateKey) {
      dayPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedDateKey]);

  function chooseMember(member: Member) {
    localStorage.setItem(MEMBER_STORAGE_KEY, member);
    setCurrentMember(member);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newMemberName.trim();
    const validationError = validateNewMemberName(trimmed, members);
    if (validationError) {
      setMemberError(validationError);
      return;
    }
    setAddingMember(true);
    setMemberError(null);
    const { error: addError } = await addMember(trimmed);
    if (addError) {
      setMemberError(addError);
    } else {
      setMembers((prev) => [
        ...prev.filter((m) => m.name !== trimmed),
        { name: trimmed, color: colorForIndex(prev.length) },
      ]);
      setNewMemberName("");
      chooseMember(trimmed);
    }
    setAddingMember(false);
  }

  async function handleSave(start: string, end: string) {
    if (!currentMember || !selectedDateKey) return;
    setSaving(true);
    setError(null);
    const input = {
      member: currentMember,
      slot_date: selectedDateKey,
      start_time: `${start}:00`,
      end_time: `${end}:00`,
    };
    const { error: saveError } = await upsertSlot(input);
    if (saveError) {
      setError(saveError);
    } else {
      setSlots((prev) => [
        ...prev.filter(
          (s) =>
            !(s.member === currentMember && s.slot_date === selectedDateKey),
        ),
        {
          id: `${currentMember}-${selectedDateKey}`,
          created_at: new Date().toISOString(),
          ...input,
        },
      ]);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!currentMember || !selectedDateKey) return;
    setSaving(true);
    setError(null);
    const { error: deleteError } = await deleteSlot(
      currentMember,
      selectedDateKey,
    );
    if (deleteError) {
      setError(deleteError);
    } else {
      setSlots((prev) =>
        prev.filter(
          (s) =>
            !(s.member === currentMember && s.slot_date === selectedDateKey),
        ),
      );
    }
    setSaving(false);
  }

  if (!currentMember) {
    return (
      <div className="member-picker">
        {DEMO_MODE && (
          <p className="demo-banner">
            デモモード:
            Supabase未接続のため、データはこの端末のブラウザにのみ保存されます。
          </p>
        )}
        <h1>REAL ジム スケジューラー</h1>
        <p>あなたの名前を選んでください</p>
        <div className="member-picker-list">
          {members.map((member) => (
            <button
              key={member.name}
              type="button"
              style={{ borderColor: member.color, color: member.color }}
              onClick={() => chooseMember(member.name)}
            >
              {member.name}
            </button>
          ))}
        </div>
        <form className="add-member-form" onSubmit={handleAddMember}>
          <input
            type="text"
            value={newMemberName}
            placeholder="新しい人の名前"
            maxLength={12}
            onChange={(e) => setNewMemberName(e.target.value)}
          />
          <button type="submit" disabled={addingMember}>
            {addingMember ? "追加中..." : "追加"}
          </button>
        </form>
        {memberError && <p className="form-error">{memberError}</p>}
      </div>
    );
  }

  const selectedDate = selectedDateKey
    ? new Date(`${selectedDateKey}T00:00:00`)
    : null;
  const daySlots = selectedDateKey
    ? slots.filter((s) => s.slot_date === selectedDateKey)
    : [];

  return (
    <div className="app">
      {DEMO_MODE && (
        <p className="demo-banner">
          デモモード:
          Supabase未接続のため、データはこの端末のブラウザにのみ保存されます。
        </p>
      )}
      <header className="app-header">
        <h1>REAL ジム スケジューラー</h1>
        <div className="app-header-right">
          <span style={{ color: memberColors[currentMember] }}>
            {currentMember} さん
          </span>
          <button type="button" onClick={() => setCurrentMember(null)}>
            切替
          </button>
        </div>
      </header>

      {loading && <p className="loading-label">読み込み中...</p>}

      <div className="app-body">
        <Calendar
          month={month}
          slots={slots}
          memberCount={members.length}
          memberColors={memberColors}
          selectedDateKey={selectedDateKey}
          onSelectDate={setSelectedDateKey}
          onPrevMonth={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
          onNextMonth={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
        />
        {selectedDate && (
          <div ref={dayPanelRef}>
            <DayPanel
              date={selectedDate}
              daySlots={daySlots}
              members={members}
              currentMember={currentMember}
              saving={saving}
              error={error}
              onSave={handleSave}
              onDelete={handleDelete}
              onSwitchMember={chooseMember}
            />
          </div>
        )}
      </div>
    </div>
  );
}
