import { isoHoursAgo } from "@/lib/time";

// Free-plan limits (spec section 5.1). Premium is unlimited. Windows are
// rolling 24h rather than calendar-day, to avoid timezone edge cases.
export const FREE_CHECKINS_PER_DAY = 1;
export const FREE_JOIN_REQUESTS_PER_DAY = 3;

export function since24h(): string {
  return isoHoursAgo(24);
}
