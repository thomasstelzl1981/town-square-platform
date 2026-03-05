/**
 * Types & constants for FMEinreichung (R-1 Refactoring)
 */
import type { FutureRoomCase } from '@/types/finance';

export const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export const READY_STATUSES = ['ready', 'submitted', 'ready_for_submission', 'ready_to_submit', 'submitted_to_bank', 'completed'];
export const MAX_BANKS = 4;

export function getRequestStatus(c: FutureRoomCase): string {
  return c.finance_mandates?.finance_requests?.status || c.status;
}

export interface SelectedBank {
  id: string;
  name: string;
  email: string;
  source: 'kontaktbuch' | 'ki' | 'manuell';
}
