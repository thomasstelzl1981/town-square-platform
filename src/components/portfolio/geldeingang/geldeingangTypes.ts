/**
 * R-10: Types for GeldeingangTab
 */
export interface GeldeingangLease {
  id: string;
  monthly_rent: number;
  rent_cold_eur: number | null;
  nk_advance_eur: number | null;
  heating_advance_eur: number | null;
  tenant_contact_id: string;
  status: string;
  linked_bank_account_id: string | null;
  auto_match_enabled: boolean | null;
  start_date: string;
}

export interface GeldeingangRentPayment {
  id: string;
  lease_id: string;
  amount: number;
  expected_amount: number | null;
  due_date: string;
  paid_date: string | null;
  status: string | null;
  notes: string | null;
}

export interface GeldeingangBankAccount {
  id: string;
  account_name: string;
  bank_name: string | null;
  iban: string;
}

export interface GeldeingangBankTransaction {
  id: string;
  booking_date: string;
  amount_eur: number;
  counterparty: string | null;
  purpose_text: string | null;
  match_status: string | null;
}
