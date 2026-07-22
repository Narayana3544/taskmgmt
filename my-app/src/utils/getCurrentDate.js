/**
 * Centralized date utility.
 * Returns the reference "current" date used throughout the application.
 *
 * Reference date: October 7, 2027 at 1:00 PM
 *
 * To restore real system time, replace the line below with:
 *   return new Date();
 */
export const getCurrentDate = () => {
  return new Date(2027, 9, 7, 13, 0, 0); // Month is 0-indexed: 9 = October
};

/**
 * Returns the reference date as an ISO date string (YYYY-MM-DD).
 * Used wherever only the date portion is needed.
 */
export const getCurrentDateString = () => {
  return "2027-10-07";
};
