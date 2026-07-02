import {
  getBusinessHours,
  intersectRanges,
  MEMBERS,
  toDateKey,
} from "../businessHours";
import type { Slot } from "../types";

interface CalendarProps {
  month: Date;
  slots: Slot[];
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function buildMonthGrid(month: Date): Array<Date | null> {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = firstDay.getDay();

  const cells: Array<Date | null> = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(new Date(year, monthIndex, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function Calendar({
  month,
  slots,
  selectedDateKey,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: CalendarProps) {
  const cells = buildMonthGrid(month);
  const slotsByDate = new Map<string, Slot[]>();
  for (const slot of slots) {
    const list = slotsByDate.get(slot.slot_date) ?? [];
    list.push(slot);
    slotsByDate.set(slot.slot_date, list);
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button type="button" onClick={onPrevMonth} aria-label="前の月">
          ←
        </button>
        <h2>
          {month.getFullYear()}年 {month.getMonth() + 1}月
        </h2>
        <button type="button" onClick={onNextMonth} aria-label="次の月">
          →
        </button>
      </div>
      <div className="calendar-grid calendar-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="calendar-weekday">
            {label}
          </div>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((date, index) => {
          if (!date) {
            return (
              <div
                key={`blank-${index}`}
                className="calendar-cell calendar-cell-blank"
              />
            );
          }
          const dateKey = toDateKey(date);
          const daySlots = slotsByDate.get(dateKey) ?? [];
          const hours = getBusinessHours(date);
          const overlap = !hours.closed
            ? intersectRanges(
                daySlots.map((s) => ({ start: s.start_time, end: s.end_time })),
              )
            : null;
          const allFourOverlap =
            overlap &&
            new Set(daySlots.map((s) => s.member)).size === MEMBERS.length;

          return (
            <button
              type="button"
              key={dateKey}
              className={[
                "calendar-cell",
                hours.closed ? "calendar-cell-closed" : "",
                dateKey === selectedDateKey ? "calendar-cell-selected" : "",
                allFourOverlap ? "calendar-cell-match" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectDate(dateKey)}
            >
              <span className="calendar-date">{date.getDate()}</span>
              {hours.closed ? (
                <span className="calendar-closed-label">定休日</span>
              ) : (
                <div className="calendar-slots">
                  {daySlots.map((slot) => (
                    <span key={slot.id} className="calendar-slot-chip">
                      {slot.member} {slot.start_time.slice(0, 5)}-
                      {slot.end_time.slice(0, 5)}
                    </span>
                  ))}
                  {allFourOverlap && overlap && (
                    <span className="calendar-match-label">
                      全員OK {overlap.start}-{overlap.end}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
