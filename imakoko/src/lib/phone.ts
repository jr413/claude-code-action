/**
 * Normalizes a Japanese domestic phone number (e.g. "090-1234-5678" or
 * "09012345678") to E.164 (e.g. "+819012345678") for Supabase phone auth.
 * Returns null if the input doesn't look like a valid JP mobile/landline
 * number.
 */
export function toE164Japan(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");

  if (digits.startsWith("81") && digits.length === 11) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `+81${digits.slice(1)}`;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `+81${digits.slice(1)}`;
  }

  return null;
}
