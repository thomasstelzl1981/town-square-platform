/**
 * MOD-07: Dokumente Tab
 * Manages credit-worthiness documents (persistent, linked to applicant_profile)
 * and object documents (per finance request)
 */

import { FinanceDocumentsManager } from '@/components/finanzierung/FinanceDocumentsManager';

export default function DokumenteTab() {
  return <FinanceDocumentsManager />;
}
