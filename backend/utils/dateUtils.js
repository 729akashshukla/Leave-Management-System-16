/**
 * Parses a "YYYY-MM-DD" string into a local-midnight Date.
 *
 * Why this exists: `new Date("2026-09-28")` is parsed as UTC midnight by the
 * ES spec.  On a server whose TZ is ahead of UTC (e.g. IST = UTC+5:30) this
 * silently becomes the **previous calendar day** in local time, which throws
 * off weekday calculations.  By splitting the string and feeding year/month/day
 * to the Date constructor we get a Date that represents local midnight on the
 * intended calendar date.
 */
export function parseDateOnly(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return new Date(NaN); // invalid → NaN date
  return new Date(year, month - 1, day);              // local midnight
}

/**
 * Counts weekdays (Mon-Fri) between two dates, inclusive of both endpoints.
 *
 * Approach documented in README: weekends (Sat/Sun) that fall inside a leave
 * range are NOT deducted from the employee's leave balance, since employees
 * aren't working those days anyway. Example: a request from Fri to Mon spans
 * 4 calendar days but only deducts 2 (Fri + Mon).
 *
 * Edge case: if a range is ENTIRELY a weekend (e.g. Sat-Sun), workingDays
 * will be 0. We still allow the request (0 balance deducted) rather than
 * rejecting it outright, since the assessment left this open - documented
 * in README as a deliberate choice.
 */
export function countWorkingDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function rangesOverlap(startA, endA, startB, endB) {
  return new Date(startA) <= new Date(endB) && new Date(endA) >= new Date(startB);
}
