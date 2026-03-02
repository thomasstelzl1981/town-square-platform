/**
 * useInvoiceVerification — Feld 19: Rechnungsprüfung
 * 
 * Validates incoming invoices against BWA Kontenplan (SKR04),
 * checks budget limits, and logs verification events.
 * 
 * @field 19
 * @module TLC
 */

import { useMemo, useCallback } from 'react';
import { BWA_KATEGORIEN, type BwaKategorie } from '@/manifests/bwaKontenplan';

// ─── Types ────────────────────────────────────────────────────

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  vendor: string;
  description: string;
  amount: number;
  currency: string;
  invoiceDate: string;
  dueDate: string;
  bwaKontoNummer: string | null;
  propertyId: string;
  unitId?: string | null;
  status: 'pending' | 'verified' | 'rejected' | 'paid';
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  rejectionReason?: string | null;
}

export interface InvoiceVerificationResult {
  invoiceId: string;
  isValid: boolean;
  bwaMatch: BwaKategorie | null;
  budgetCheck: BudgetCheckResult;
  warnings: string[];
  errors: string[];
  suggestedKonto: string | null;
}

export interface BudgetCheckResult {
  annualBudget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  overBudget: boolean;
}

export interface BudgetLimit {
  bwaCode: string;
  annualLimit: number;
}

// ─── Pure Verification Logic ──────────────────────────────────

/** Map a BWA Konto number to its category */
export function findBwaKategorie(kontoNummer: string): BwaKategorie | null {
  return BWA_KATEGORIEN.find(kat =>
    kat.konten.some(k => k.nummer === kontoNummer)
  ) || null;
}

/** Suggest BWA Konto based on vendor/description keywords */
export function suggestBwaKonto(description: string, vendor: string): string | null {
  const text = `${description} ${vendor}`.toLowerCase();

  const mappings: Array<{ keywords: string[]; konto: string }> = [
    { keywords: ['hausverwaltung', 'verwalter', 'weg'], konto: '6300' },
    { keywords: ['versicherung', 'haftpflicht', 'gebäudevers'], konto: '6400' },
    { keywords: ['grundsteuer'], konto: '7680' },
    { keywords: ['reparatur', 'instandhaltung', 'sanitär', 'heizungswartung'], konto: '6490' },
    { keywords: ['strom', 'gas', 'wasser', 'energie'], konto: '6325' },
    { keywords: ['rechtsanwalt', 'beratung', 'notar', 'steuerberater'], konto: '6825' },
    { keywords: ['bank', 'konto', 'gebühr'], konto: '6855' },
    { keywords: ['müll', 'abfall', 'entsorgung'], konto: '6859' },
    { keywords: ['abschreibung', 'afa'], konto: '6221' },
    { keywords: ['zins', 'darlehen', 'kredit'], konto: '7310' },
  ];

  for (const m of mappings) {
    if (m.keywords.some(kw => text.includes(kw))) {
      return m.konto;
    }
  }
  return null;
}

/** Verify a single invoice */
export function verifyInvoice(
  invoice: InvoiceItem,
  budgetLimits: BudgetLimit[],
  spentByCode: Record<string, number>
): InvoiceVerificationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. BWA Konto matching
  let bwaMatch: BwaKategorie | null = null;
  let suggestedKonto: string | null = null;

  if (invoice.bwaKontoNummer) {
    bwaMatch = findBwaKategorie(invoice.bwaKontoNummer);
    if (!bwaMatch) {
      warnings.push(`Konto ${invoice.bwaKontoNummer} nicht im SKR04-Kontenplan gefunden`);
    }
  } else {
    suggestedKonto = suggestBwaKonto(invoice.description, invoice.vendor);
    if (suggestedKonto) {
      bwaMatch = findBwaKategorie(suggestedKonto);
      warnings.push(`Kein Konto zugewiesen — Vorschlag: ${suggestedKonto} (${bwaMatch?.name || 'unbekannt'})`);
    } else {
      errors.push('Kein BWA-Konto zugewiesen und keine automatische Zuordnung möglich');
    }
  }

  // 2. Amount validation
  if (invoice.amount <= 0) {
    errors.push('Rechnungsbetrag muss positiv sein');
  }
  if (invoice.amount > 50000) {
    warnings.push('Rechnungsbetrag > 50.000 € — Freigabe durch Geschäftsführung empfohlen');
  }

  // 3. Date validation
  const invoiceDate = new Date(invoice.invoiceDate);
  const dueDate = new Date(invoice.dueDate);
  if (dueDate < invoiceDate) {
    errors.push('Fälligkeitsdatum liegt vor Rechnungsdatum');
  }
  const today = new Date();
  const daysToDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysToDue < 0) {
    warnings.push(`Rechnung ist seit ${Math.abs(daysToDue)} Tagen überfällig`);
  } else if (daysToDue <= 3) {
    warnings.push(`Rechnung ist in ${daysToDue} Tagen fällig — Eilbearbeitung`);
  }

  // 4. Budget check
  const effectiveCode = bwaMatch?.code || '';
  const limit = budgetLimits.find(bl => bl.bwaCode === effectiveCode);
  const spent = spentByCode[effectiveCode] || 0;

  const budgetCheck: BudgetCheckResult = limit
    ? {
        annualBudget: limit.annualLimit,
        spent,
        remaining: limit.annualLimit - spent,
        percentUsed: limit.annualLimit > 0 ? (spent / limit.annualLimit) * 100 : 0,
        overBudget: spent + invoice.amount > limit.annualLimit,
      }
    : { annualBudget: 0, spent: 0, remaining: 0, percentUsed: 0, overBudget: false };

  if (budgetCheck.overBudget) {
    warnings.push(
      `Budgetüberschreitung: ${effectiveCode} — ${budgetCheck.percentUsed.toFixed(0)}% verbraucht, Rechnung würde Limit um ${((spent + invoice.amount - (limit?.annualLimit || 0))).toFixed(2)} € überschreiten`
    );
  }

  // 5. Duplicate check hint
  if (!invoice.invoiceNumber || invoice.invoiceNumber.trim() === '') {
    warnings.push('Keine Rechnungsnummer angegeben — Dublettenprüfung nicht möglich');
  }

  const isValid = errors.length === 0;

  return {
    invoiceId: invoice.id,
    isValid,
    bwaMatch,
    budgetCheck,
    warnings,
    errors,
    suggestedKonto,
  };
}

// ─── Hook ─────────────────────────────────────────────────────

export function useInvoiceVerification(
  invoices: InvoiceItem[],
  budgetLimits: BudgetLimit[] = [],
  spentByCode: Record<string, number> = {}
) {
  const verificationResults = useMemo(
    () => invoices.map(inv => verifyInvoice(inv, budgetLimits, spentByCode)),
    [invoices, budgetLimits, spentByCode]
  );

  const summary = useMemo(() => {
    const total = verificationResults.length;
    const valid = verificationResults.filter(r => r.isValid).length;
    const withWarnings = verificationResults.filter(r => r.warnings.length > 0).length;
    const withErrors = verificationResults.filter(r => r.errors.length > 0).length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);

    return { total, valid, withWarnings, withErrors, totalAmount };
  }, [verificationResults, invoices]);

  const bwaKategorien = useMemo(() => BWA_KATEGORIEN, []);

  const findKonto = useCallback((kontoNummer: string) => findBwaKategorie(kontoNummer), []);
  const suggest = useCallback((desc: string, vendor: string) => suggestBwaKonto(desc, vendor), []);

  return {
    verificationResults,
    summary,
    bwaKategorien,
    findKonto,
    suggest,
  };
}
