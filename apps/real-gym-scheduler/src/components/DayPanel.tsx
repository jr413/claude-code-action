import { getBusinessHours, MEMBERS, type Member } from "../businessHours";
import type { Slot } from "../types";
import { SlotForm } from "./SlotForm";

interface DayPanelProps {
  date: Date;
  daySlots: Slot[];
  currentMember: Member;
  saving: boolean;
  error: string | null;
  onSave: (start: string, end: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function DayPanel({
  date,
  daySlots,
  currentMember,
  saving,
  error,
  onSave,
  onDelete,
}: DayPanelProps) {
  const hours = getBusinessHours(date);
  const mySlot = daySlots.find((s) => s.member === currentMember) ?? null;

  return (
    <div className="day-panel">
      <h3>
        {date.getMonth() + 1}月{date.getDate()}日（
        {["日", "月", "火", "水", "木", "金", "土"][date.getDay()]}）
      </h3>

      {hours.closed ? (
        <p className="day-panel-closed">この日は定休日です。</p>
      ) : (
        <p className="day-panel-hours">
          営業時間: {hours.open}〜{hours.close}
        </p>
      )}

      <ul className="member-status-list">
        {MEMBERS.map((member) => {
          const slot = daySlots.find((s) => s.member === member);
          return (
            <li
              key={member}
              className={member === currentMember ? "member-status-self" : ""}
            >
              <span className="member-name">{member}</span>
              <span className="member-time">
                {slot
                  ? `${slot.start_time.slice(0, 5)}〜${slot.end_time.slice(0, 5)}`
                  : "未回答"}
              </span>
            </li>
          );
        })}
      </ul>

      {!hours.closed && (
        <div className="day-panel-form">
          <SlotForm
            date={date}
            hours={hours}
            initialStart={mySlot?.start_time.slice(0, 5) ?? hours.open}
            initialEnd={mySlot?.end_time.slice(0, 5) ?? hours.close}
            saving={saving}
            onSave={onSave}
          />
          {mySlot && (
            <button
              type="button"
              className="delete-button"
              disabled={saving}
              onClick={onDelete}
            >
              自分の登録を削除
            </button>
          )}
          {error && <p className="form-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
