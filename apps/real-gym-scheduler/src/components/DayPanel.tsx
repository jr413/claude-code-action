import {
  getBusinessHours,
  intersectRanges,
  type Member,
} from "../businessHours";
import type { MemberInfo } from "../members";
import type { Slot } from "../types";
import { SlotForm } from "./SlotForm";

interface DayPanelProps {
  date: Date;
  daySlots: Slot[];
  members: MemberInfo[];
  currentMember: Member;
  saving: boolean;
  error: string | null;
  onSave: (start: string, end: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onSwitchMember: (member: Member) => void;
}

export function DayPanel({
  date,
  daySlots,
  members,
  currentMember,
  saving,
  error,
  onSave,
  onDelete,
  onSwitchMember,
}: DayPanelProps) {
  const hours = getBusinessHours(date);
  const mySlot = daySlots.find((s) => s.member === currentMember) ?? null;
  const overlap = !hours.closed
    ? intersectRanges(
        daySlots.map((s) => ({ start: s.start_time, end: s.end_time })),
      )
    : null;

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

      {overlap && daySlots.length >= 2 && (
        <p className="day-panel-overlap">
          {daySlots.length === members.length
            ? "全員が行けます！ "
            : "共通で行けそう: "}
          {overlap.start.slice(0, 5)}〜{overlap.end.slice(0, 5)}
        </p>
      )}

      <ul className="member-status-list">
        {members.map((member) => {
          const slot = daySlots.find((s) => s.member === member.name);
          return (
            <li key={member.name}>
              <button
                type="button"
                className={
                  member.name === currentMember
                    ? "member-status-item member-status-self"
                    : "member-status-item"
                }
                onClick={() => onSwitchMember(member.name)}
              >
                <span className="member-name">
                  <span
                    className="member-dot"
                    style={{ backgroundColor: member.color }}
                  />
                  {member.name}
                </span>
                <span className="member-time">
                  {slot
                    ? `${slot.start_time.slice(0, 5)}〜${slot.end_time.slice(0, 5)}`
                    : "未回答"}
                </span>
              </button>
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
