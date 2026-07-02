import { useEffect, useMemo, useState } from "react";
import { Calendar } from "./components/Calendar";
import { DayPanel } from "./components/DayPanel";
import { MEMBERS, type Member } from "./businessHours";
import {
  DEMO_MODE,
  deleteSlot,
  listSlots,
  subscribeToChanges,
  upsertSlot,
} from "./dataClient";
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
    () => (localStorage.getItem(MEMBER_STORAGE_KEY) as Member | null) ?? null,
  );
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startKey, endKey } = useMemo(() => monthRange(month), [month]);

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

  function chooseMember(member: Member) {
    localStorage.setItem(MEMBER_STORAGE_KEY, member);
    setCurrentMember(member);
  }

  async function handleSave(start: string, end: string) {
    if (!currentMember || !selectedDateKey) return;
    setSaving(true);
    setError(null);
    const { error: saveError } = await upsertSlot({
      member: currentMember,
      slot_date: selectedDateKey,
      start_time: `${start}:00`,
      end_time: `${end}:00`,
    });
    if (saveError) setError(saveError);
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
    if (deleteError) setError(deleteError);
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
          {MEMBERS.map((member) => (
            <button
              key={member}
              type="button"
              onClick={() => chooseMember(member)}
            >
              {member}
            </button>
          ))}
        </div>
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
          <span>{currentMember} さん</span>
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
          <DayPanel
            date={selectedDate}
            daySlots={daySlots}
            currentMember={currentMember}
            saving={saving}
            error={error}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
