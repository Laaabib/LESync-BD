import { authService } from '../services/authService';
import { rbacService } from '../services/rbacService';

/**
 * Returns today's calendar date string in YYYY-MM-DD format (local timezone).
 */
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns the minimum selectable date string for date inputs.
 * If the active user is the System Owner (Labib Zunaedy), returns undefined (unrestricted historical dates).
 * If the user is staff, returns the current business date or today's date, preventing past date selection.
 */
export const getMinAllowedDate = (isOwner: boolean, businessDate?: string): string | undefined => {
  if (isOwner) return undefined;
  return businessDate || getTodayDateString();
};

/**
 * Returns true if the given date is earlier than today / the business date.
 */
export const isPastDate = (dateStr?: string, businessDate?: string): boolean => {
  if (!dateStr) return false;
  const targetDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim();
  const benchmarkDate = businessDate || getTodayDateString();
  return targetDate < benchmarkDate;
};

/**
 * Invariant assertion: Throws an explicit error if a non-owner attempts to post backdated data.
 */
export const assertOwnerForBackdate = (
  dateStr: string | undefined,
  isOwner: boolean,
  actionName = 'data entry',
  businessDate?: string
): void => {
  if (!dateStr) return;
  if (!isOwner && isPastDate(dateStr, businessDate)) {
    throw new Error(
      `Security Clearance Required: Only the System Owner (Labib Zunaedy) is authorized to post or process back-dated ${actionName} (attempted date: ${dateStr.split('T')[0]}).`
    );
  }
};

/**
 * Helper to check current session System Owner status.
 */
export const checkIsSystemOwner = (): boolean => {
  const user = rbacService.getActiveUser();
  return authService.isSystemOwner(user);
};
