import { useMemo, useState } from "react";
import {
  type BusinessHours,
  generateTimeOptions,
  isValidRange,
} from "../businessHours";

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

  const allTimes = useMemo(() => {
    const generated = generateTimeOptions(hours.open, hours.close);
    return Array.from(new Set([...generated, initialStart, initialEnd])).sort();
  }, [hours.open, hours.close, initialStart, initialEnd]);

  const startOptions = allTimes.filter((t) => t < hours.close);
  const endOptions = allTimes.filter((t) => t > start);

  function handleStartChange(value: string) {
    setStart(value);
    if (end <= value) {
      const next = allTimes.find((t) => t > value);
      if (next) setEnd(next);
    }
  }

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
          <select
            value={start}
            onChange={(e) => handleStartChange(e.target.value)}
          >
            {startOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          終了
          <select value={end} onChange={(e) => setEnd(e.target.value)}>
            {endOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      {formError && <p className="form-error">{formError}</p>}
      <button type="submit" disabled={saving}>
        {saving ? "保存中..." : "この時間で登録"}
      </button>
    </form>
  );
}
