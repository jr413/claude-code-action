import { useState } from "react";
import { type BusinessHours, isValidRange } from "../businessHours";

interface SlotFormProps {
  date: Date;
  hours: Extract<BusinessHours, { closed: false }>;
  initialStart: string;
  initialEnd: string;
  saving: boolean;
  onSave: (start: string, end: string) => Promise<void>;
}

export function SlotForm({
  date,
  hours,
  initialStart,
  initialEnd,
  saving,
  onSave,
}: SlotFormProps) {
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = isValidRange(date, start, end);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    await onSave(start, end);
  }

  return (
    <form className="slot-form" onSubmit={handleSubmit}>
      <div className="slot-form-row">
        <label>
          開始
          <input
            type="time"
            value={start}
            min={hours.open}
            max={hours.close}
            step={900}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          終了
          <input
            type="time"
            value={end}
            min={hours.open}
            max={hours.close}
            step={900}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      {formError && <p className="form-error">{formError}</p>}
      <button type="submit" disabled={saving}>
        {saving ? "保存中..." : "この時間で登録"}
      </button>
    </form>
  );
}
