
# Recurring Contract Detection via Magic Intake

## Konzept-Aenderung gegenueber dem vorherigen Plan

Der urspruengliche Plan sah die Integration in KontenTab (MOD-18) vor. Nach erneuter Analyse stimme ich zu: **Magic Intake ist der deutlich bessere Ort**. Gruende:

1. **Magic Intake = zentraler Dateneingang.** Dokumente UND Transaktionsmuster sind beides "Intake"-Vorgaenge. Der User kennt Magic Intake bereits als den Ort, wo Daten ins System kommen.
2. **KontenTab bleibt schlank.** MOD-18 Konten konzentriert sich auf Bankkonten, Verbindungen und Transaktionslisten — keine Vertragserkennung.
3. **Keine Menueerweiterung.** In IntakeTab wird lediglich ein neuer Block (nach Cloud-Import, vor der Checkliste) eingefuegt. Kein neuer Tab, keine neue Route.
4. **Der Dialog selbst lebt in `src/components/shared/`** — ausserhalb jedes Modul-Freezes.

## Freeze-Status

- **MOD-18**: Wird per User-Anweisung "UNFREEZE MOD-18" entfroren. Aber: KontenTab wird NICHT mehr geaendert.
- **MOD-03 (DMS)**: Aktuell frozen. Die einzige Datei in MOD-03, die geaendert wird, ist `src/pages/portal/dms/IntakeTab.tsx`. **MOD-03 muss ebenfalls entfroren werden.** Alle anderen Dateien (Engine, Hook, Dialog) liegen ausserhalb von Modul-Pfaden.

Benoetigte Freigabe: **UNFREEZE MOD-03**

---

## Architektur-Uebersicht

```text
┌─────────────────────────────────────────────────────────┐
│  Magic Intake (/portal/dms/intake)                      │
│                                                         │
│  [1] Schrittleiste (wie bisher)                         │
│  [2] Entity-Picker + Upload (wie bisher)                │
│  [2b] Cloud-Import (wie bisher)                         │
│  [NEU] Konto-Intake Block                               │
│     └─ "Vertraege aus Kontobewegungen erkennen"         │
│     └─ Zeigt verbundene Bankkonten                      │
│     └─ Button: "Kontobewegungen analysieren"            │
│     └─ Oeffnet ContractDetectionDialog                  │
│  [3] Dokument-Checkliste (wie bisher)                   │
│  [4] Letzte Aktivitaet (wie bisher)                     │
│  [5] Link zur Intelligenz (wie bisher)                  │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  ContractDetectionDialog (Radix Dialog)                  │
│                                                          │
│  Zusammenfassung: "12 wiederkehrende Vertraege erkannt"  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ☑ Netflix          17,99 EUR/Monat   [Abo ▼]      │  │
│  │ ☑ Spotify          16,99 EUR/Monat   [Abo ▼]      │  │
│  │ ☑ Allianz Haftpfl. 24,50 EUR/Monat   [Versich. ▼] │  │
│  │ ☐ Finanzamt        850 EUR/Quartal   [Skip ▼]     │  │
│  │ ☑ SWM Strom        95,00 EUR/Monat   [Energie ▼]  │  │
│  │ ...                                                │  │
│  └────────────────────────────────────────────────────┘  │
│  [Alle] [Keine]                    [X Vertraege anlegen] │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Engine Layer (src/engines/kontoMatch/)                   │
│                                                          │
│  spec.ts  ── Neue Typen: DetectedContract, RecurPattern  │
│  recurring.ts ── Pure Fn: detectRecurringContracts()     │
│  engine.ts ── Unveraendert                               │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Hook Layer (src/hooks/)                                 │
│                                                          │
│  useContractCreation.ts ── Batch-Insert in 3 Tabellen    │
│     user_subscriptions, insurance_contracts,             │
│     miety_contracts                                      │
│  useFinanzmanagerData.ts ── Bereits vorhanden (CRUD)     │
└──────────────────────────────────────────────────────────┘
```

---

## Phase 1: Engine-Erweiterung (ENG-KONTOMATCH)

### Datei: `src/engines/kontoMatch/spec.ts` — Neue Typen anfuegen

Folgende Typen werden am Ende der bestehenden spec.ts angefuegt:

```typescript
// ─── Recurring Contract Detection ──────────────────────────

export type ContractTargetTable = 'user_subscriptions' | 'insurance_contracts' | 'miety_contracts';

export type RecurringFrequency = 'monatlich' | 'quartalsweise' | 'jaehrlich';

export interface RecurringPattern {
  counterparty: string;          // Normalisierter Name
  averageAmount: number;         // Durchschnittsbetrag (absolut)
  frequency: RecurringFrequency;
  intervalDays: number;          // Mittlerer Abstand in Tagen
  occurrences: number;           // Anzahl erkannter Buchungen
  firstSeen: string;             // YYYY-MM-DD
  lastSeen: string;              // YYYY-MM-DD
  sampleTransactionIds: string[];
}

export interface DetectedContract {
  id: string;                    // Temporaere UUID fuer UI-State
  counterparty: string;
  amount: number;
  frequency: RecurringFrequency;
  category: TransactionCategory;
  targetTable: ContractTargetTable;
  targetLabel: string;           // "Abo", "Versicherung", "Energievertrag"
  confidence: number;            // 0..1
  pattern: RecurringPattern;
  selected: boolean;             // Default: true (User kann abwaehlen)
}

// ─── Category → Target Table Mapping ──────────────────────

export const CATEGORY_TARGET_MAP: Record<TransactionCategory, {
  table: ContractTargetTable | null;
  label: string;
}> = {
  [TransactionCategory.VERSICHERUNG]: { table: 'insurance_contracts', label: 'Versicherung' },
  [TransactionCategory.DARLEHEN]: { table: null, label: 'Darlehen (uebersprungen)' },
  [TransactionCategory.HAUSGELD]: { table: null, label: 'Hausgeld (uebersprungen)' },
  [TransactionCategory.GRUNDSTEUER]: { table: null, label: 'Grundsteuer (uebersprungen)' },
  [TransactionCategory.MIETE]: { table: null, label: 'Miete (uebersprungen)' },
  [TransactionCategory.GEHALT]: { table: null, label: 'Gehalt (uebersprungen)' },
  [TransactionCategory.INSTANDHALTUNG]: { table: null, label: 'Instandhaltung (uebersprungen)' },
  [TransactionCategory.EINSPEISEVERGUETUNG]: { table: null, label: 'Einspeisung (uebersprungen)' },
  [TransactionCategory.WARTUNG]: { table: null, label: 'Wartung (uebersprungen)' },
  [TransactionCategory.PACHT]: { table: null, label: 'Pacht (uebersprungen)' },
  [TransactionCategory.SONSTIG_EINGANG]: { table: null, label: 'Sonstiger Eingang (uebersprungen)' },
  [TransactionCategory.SONSTIG_AUSGANG]: { table: 'user_subscriptions', label: 'Abo' },
};

// Patterns to route SONSTIG_AUSGANG to miety_contracts instead of user_subscriptions
export const ENERGY_PATTERNS: string[] = [
  'stadtwerke', 'swm', 'eon', 'e.on', 'vattenfall', 'rwe', 'enbw',
  'strom', 'gas', 'fernwaerme', 'grundversorgung', 'energie',
  'telekom', 'vodafone', 'o2', 'telefonica', '1und1', '1&1',
  'unitymedia', 'kabel deutschland', 'glasfaser', 'internet', 'mobilfunk',
];

export const INSURANCE_PATTERNS: string[] = [
  'allianz', 'axa', 'ergo', 'huk', 'huk-coburg', 'devk', 'generali',
  'zurich', 'nuernberger', 'debeka', 'signal iduna', 'versicherung',
  'haftpflicht', 'hausrat', 'rechtsschutz', 'berufsunfaehigkeit',
  'krankenversicherung', 'kfz-versicherung', 'lebensversicherung',
];

export const SUBSCRIPTION_PATTERNS: string[] = [
  'netflix', 'spotify', 'amazon prime', 'disney', 'apple',
  'youtube', 'dazn', 'sky', 'microsoft', 'adobe', 'google one',
  'dropbox', 'icloud', 'playstation', 'xbox', 'nintendo',
  'fitx', 'mcfit', 'urban sports', 'gym', 'fitness',
  'zeit', 'spiegel', 'faz', 'sueddeutsche', 'handelsblatt',
];

// Recurring detection constants
export const RECURRING_DETECTION = {
  MIN_OCCURRENCES: 2,
  AMOUNT_TOLERANCE_PERCENT: 0.05,  // +/- 5%
  MONTHLY_INTERVAL: { min: 25, max: 35 },
  QUARTERLY_INTERVAL: { min: 80, max: 100 },
  YEARLY_INTERVAL: { min: 350, max: 380 },
} as const;
```

### Datei: `src/engines/kontoMatch/recurring.ts` — NEUE DATEI

Vollstaendige reine TypeScript-Funktion, KEINE DB-Aufrufe, KEINE React-Imports:

```typescript
/**
 * Engine 17 Extension: Recurring Contract Detection
 * Pure function — detects recurring payment patterns from categorized transactions.
 *
 * Input:  Array of bank transactions (already categorized by ENG-KONTOMATCH)
 * Output: Array of DetectedContract candidates for user review
 */

import {
  type DetectedContract,
  type RecurringPattern,
  type RecurringFrequency,
  type ContractTargetTable,
  TransactionCategory,
  CATEGORY_TARGET_MAP,
  ENERGY_PATTERNS,
  INSURANCE_PATTERNS,
  SUBSCRIPTION_PATTERNS,
  RECURRING_DETECTION,
} from './spec';

// ─── Input Type (from DB row shape) ──────────────────────

export interface TransactionRow {
  id: string;
  booking_date: string;
  amount_eur: number;
  counterparty: string | null;
  purpose_text: string | null;
  match_category: string | null;
  match_status: string | null;
}

// ─── Helpers ─────────────────────────────────────────────

function normalizeCounterparty(raw: string | null): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9äöüß\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.abs(db - da) / (1000 * 60 * 60 * 24);
}

function amountsAreSimilar(a: number, b: number): boolean {
  const absA = Math.abs(a);
  const absB = Math.abs(b);
  if (absA === 0 && absB === 0) return true;
  const avg = (absA + absB) / 2;
  if (avg === 0) return true;
  return Math.abs(absA - absB) / avg <= RECURRING_DETECTION.AMOUNT_TOLERANCE_PERCENT;
}

function detectFrequency(intervals: number[]): RecurringFrequency | null {
  if (intervals.length === 0) return null;
  const avg = intervals.reduce((s, v) => s + v, 0) / intervals.length;

  const { MONTHLY_INTERVAL, QUARTERLY_INTERVAL, YEARLY_INTERVAL } = RECURRING_DETECTION;

  if (avg >= MONTHLY_INTERVAL.min && avg <= MONTHLY_INTERVAL.max) return 'monatlich';
  if (avg >= QUARTERLY_INTERVAL.min && avg <= QUARTERLY_INTERVAL.max) return 'quartalsweise';
  if (avg >= YEARLY_INTERVAL.min && avg <= YEARLY_INTERVAL.max) return 'jaehrlich';
  return null;
}

function haystackContains(haystack: string, patterns: string[]): boolean {
  return patterns.some(p => haystack.includes(p));
}

function resolveTargetTable(
  category: TransactionCategory,
  counterparty: string,
  purpose: string,
): { table: ContractTargetTable; label: string } {
  const haystack = `${counterparty} ${purpose}`.toLowerCase();

  // Versicherung category → always insurance_contracts
  if (category === TransactionCategory.VERSICHERUNG) {
    return { table: 'insurance_contracts', label: 'Versicherung' };
  }

  // For SONSTIG_AUSGANG and others: pattern-based routing
  if (haystackContains(haystack, INSURANCE_PATTERNS)) {
    return { table: 'insurance_contracts', label: 'Versicherung' };
  }
  if (haystackContains(haystack, ENERGY_PATTERNS)) {
    return { table: 'miety_contracts', label: 'Energievertrag' };
  }
  if (haystackContains(haystack, SUBSCRIPTION_PATTERNS)) {
    return { table: 'user_subscriptions', label: 'Abo' };
  }

  // Default: user_subscriptions (most common for uncategorized recurring)
  return { table: 'user_subscriptions', label: 'Abo' };
}

function generateTempId(): string {
  return 'temp-' + Math.random().toString(36).slice(2, 10);
}

// ─── Main Detection Function ─────────────────────────────

/**
 * Detects recurring payment patterns from categorized transactions.
 *
 * Algorithm:
 * 1. Filter to debit transactions with a counterparty
 * 2. Group by normalized counterparty name
 * 3. Within each group, find sub-groups with similar amounts (+/- 5%)
 * 4. For each sub-group, check booking date intervals for regularity
 * 5. If regular (monthly/quarterly/yearly) and >= 2 occurrences → DetectedContract
 * 6. Skip categories that belong to other modules (MIETE, DARLEHEN, HAUSGELD, etc.)
 *
 * @param transactions - Array of categorized bank transactions
 * @returns Array of DetectedContract candidates, sorted by confidence desc
 */
export function detectRecurringContracts(
  transactions: TransactionRow[],
): DetectedContract[] {
  // Step 1: Filter — only debits with counterparty, skip irrelevant categories
  const SKIP_CATEGORIES = new Set([
    TransactionCategory.MIETE,
    TransactionCategory.HAUSGELD,
    TransactionCategory.GRUNDSTEUER,
    TransactionCategory.DARLEHEN,
    TransactionCategory.INSTANDHALTUNG,
    TransactionCategory.EINSPEISEVERGUETUNG,
    TransactionCategory.WARTUNG,
    TransactionCategory.PACHT,
    TransactionCategory.GEHALT,
    TransactionCategory.SONSTIG_EINGANG,
  ]);

  const candidates = transactions.filter(tx => {
    if (tx.amount_eur >= 0) return false;              // Only debits
    if (!tx.counterparty) return false;                 // Need counterparty
    const cat = tx.match_category as TransactionCategory;
    if (SKIP_CATEGORIES.has(cat)) return false;         // Skip module-specific
    return true;
  });

  // Step 2: Group by normalized counterparty
  const groups = new Map<string, TransactionRow[]>();
  for (const tx of candidates) {
    const key = normalizeCounterparty(tx.counterparty);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  const results: DetectedContract[] = [];

  // Step 3: For each group, find amount clusters
  for (const [counterpartyKey, txs] of groups) {
    // Sort by date ascending
    const sorted = [...txs].sort(
      (a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime(),
    );

    // Cluster by similar amounts
    const used = new Set<number>();
    for (let i = 0; i < sorted.length; i++) {
      if (used.has(i)) continue;
      const cluster: TransactionRow[] = [sorted[i]];
      used.add(i);

      for (let j = i + 1; j < sorted.length; j++) {
        if (used.has(j)) continue;
        if (amountsAreSimilar(sorted[i].amount_eur, sorted[j].amount_eur)) {
          cluster.push(sorted[j]);
          used.add(j);
        }
      }

      // Step 4: Need minimum occurrences
      if (cluster.length < RECURRING_DETECTION.MIN_OCCURRENCES) continue;

      // Calculate intervals
      const intervals: number[] = [];
      for (let k = 1; k < cluster.length; k++) {
        intervals.push(daysBetween(cluster[k - 1].booking_date, cluster[k].booking_date));
      }

      const frequency = detectFrequency(intervals);
      if (!frequency) continue; // Not regular enough

      // Step 5: Build DetectedContract
      const avgAmount = cluster.reduce((s, t) => s + Math.abs(t.amount_eur), 0) / cluster.length;
      const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
      const rawCounterparty = sorted[i].counterparty || counterpartyKey;
      const rawPurpose = sorted[i].purpose_text || '';
      const category = (sorted[i].match_category as TransactionCategory) || TransactionCategory.SONSTIG_AUSGANG;

      const { table, label } = resolveTargetTable(category, rawCounterparty, rawPurpose);

      // Confidence: more occurrences + consistent intervals = higher
      const intervalVariance = intervals.length > 0
        ? intervals.reduce((s, v) => s + Math.abs(v - avgInterval), 0) / intervals.length
        : 0;
      let confidence = Math.min(0.95, 0.6 + (cluster.length * 0.05) - (intervalVariance * 0.005));
      confidence = Math.max(0.5, Math.min(1, confidence));

      const pattern: RecurringPattern = {
        counterparty: rawCounterparty,
        averageAmount: Math.round(avgAmount * 100) / 100,
        frequency,
        intervalDays: Math.round(avgInterval),
        occurrences: cluster.length,
        firstSeen: cluster[0].booking_date,
        lastSeen: cluster[cluster.length - 1].booking_date,
        sampleTransactionIds: cluster.slice(0, 5).map(t => t.id),
      };

      results.push({
        id: generateTempId(),
        counterparty: rawCounterparty,
        amount: Math.round(avgAmount * 100) / 100,
        frequency,
        category,
        targetTable: table,
        targetLabel: label,
        confidence,
        pattern,
        selected: true,
      });
    }
  }

  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence);
}
```

---

## Phase 2: Contract Creation Hook

### Datei: `src/hooks/useContractCreation.ts` — NEUE DATEI

```typescript
/**
 * useContractCreation — Batch-insert detected contracts into target tables.
 * Handles: user_subscriptions, insurance_contracts, miety_contracts
 * Includes duplicate detection before insert.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { DetectedContract } from '@/engines/kontoMatch/spec';

interface CreationResult {
  created: number;
  skipped: number;
  errors: string[];
}

export function useContractCreation() {
  const { activeTenantId, user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (contracts: DetectedContract[]): Promise<CreationResult> => {
      if (!activeTenantId || !user?.id) throw new Error('Nicht angemeldet');

      const selected = contracts.filter(c => c.selected);
      const result: CreationResult = { created: 0, skipped: 0, errors: [] };

      for (const contract of selected) {
        try {
          const isDuplicate = await checkDuplicate(contract, activeTenantId);
          if (isDuplicate) {
            result.skipped++;
            continue;
          }

          await insertContract(contract, activeTenantId, user.id);
          result.created++;
        } catch (err: any) {
          result.errors.push(`${contract.counterparty}: ${err.message}`);
        }
      }

      return result;
    },
    onSuccess: (result) => {
      // Invalidate all relevant query caches
      qc.invalidateQueries({ queryKey: ['user_subscriptions'] });
      qc.invalidateQueries({ queryKey: ['insurance_contracts'] });
      qc.invalidateQueries({ queryKey: ['miety_contracts'] });
      qc.invalidateQueries({ queryKey: ['miety-contracts'] });

      if (result.created > 0) {
        toast.success(`${result.created} Vertraege angelegt`);
      }
      if (result.skipped > 0) {
        toast.info(`${result.skipped} Duplikate uebersprungen`);
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} Fehler: ${result.errors[0]}`);
      }
    },
    onError: (err: Error) => {
      toast.error(`Fehler: ${err.message}`);
    },
  });
}

// ─── Duplicate Check ──────────────────────────────────────

async function checkDuplicate(
  contract: DetectedContract,
  tenantId: string,
): Promise<boolean> {
  const counterpartyLower = contract.counterparty.toLowerCase();

  switch (contract.targetTable) {
    case 'user_subscriptions': {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('merchant', `%${counterpartyLower}%`)
        .limit(1);
      return (data?.length ?? 0) > 0;
    }
    case 'insurance_contracts': {
      const { data } = await supabase
        .from('insurance_contracts')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('insurer', `%${counterpartyLower}%`)
        .limit(1);
      return (data?.length ?? 0) > 0;
    }
    case 'miety_contracts': {
      const { data } = await supabase
        .from('miety_contracts')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('provider_name', `%${counterpartyLower}%`)
        .limit(1);
      return (data?.length ?? 0) > 0;
    }
    default:
      return false;
  }
}

// ─── Insert Logic ─────────────────────────────────────────

async function insertContract(
  contract: DetectedContract,
  tenantId: string,
  userId: string,
): Promise<void> {
  const frequencyMap: Record<string, string> = {
    monatlich: 'monatlich',
    quartalsweise: 'quartalsweise',
    jaehrlich: 'jaehrlich',
  };

  switch (contract.targetTable) {
    case 'user_subscriptions': {
      const { error } = await supabase.from('user_subscriptions').insert({
        tenant_id: tenantId,
        user_id: userId,
        merchant: contract.counterparty,
        category: mapToSubscriptionCategory(contract),
        frequency: frequencyMap[contract.frequency] || 'monatlich',
        amount: contract.amount,
        status: 'active',
      });
      if (error) throw error;
      break;
    }
    case 'insurance_contracts': {
      const { error } = await supabase.from('insurance_contracts').insert({
        tenant_id: tenantId,
        user_id: userId,
        insurer: contract.counterparty,
        category: 'sonstige',
        monthly_premium: contract.frequency === 'monatlich'
          ? contract.amount
          : contract.frequency === 'quartalsweise'
            ? Math.round((contract.amount / 3) * 100) / 100
            : Math.round((contract.amount / 12) * 100) / 100,
        status: 'active',
      });
      if (error) throw error;
      break;
    }
    case 'miety_contracts': {
      const { error } = await supabase.from('miety_contracts').insert({
        tenant_id: tenantId,
        user_id: userId,
        category: mapToMietyCategory(contract),
        provider_name: contract.counterparty,
        monthly_cost: contract.frequency === 'monatlich'
          ? contract.amount
          : contract.frequency === 'quartalsweise'
            ? Math.round((contract.amount / 3) * 100) / 100
            : Math.round((contract.amount / 12) * 100) / 100,
        start_date: contract.pattern.firstSeen,
      });
      if (error) throw error;
      break;
    }
  }
}

function mapToSubscriptionCategory(contract: DetectedContract): string {
  const h = contract.counterparty.toLowerCase();
  if (['netflix', 'disney', 'amazon prime', 'sky', 'dazn', 'youtube'].some(p => h.includes(p))) return 'streaming_video';
  if (['spotify', 'apple music', 'deezer', 'tidal'].some(p => h.includes(p))) return 'streaming_music';
  if (['microsoft', 'adobe', 'google', 'dropbox'].some(p => h.includes(p))) return 'software_saas';
  if (['fitx', 'mcfit', 'gym', 'urban sports', 'fitness'].some(p => h.includes(p))) return 'fitness';
  if (['zeit', 'spiegel', 'faz', 'handelsblatt'].some(p => h.includes(p))) return 'news_media';
  if (['telekom', 'vodafone', 'o2', 'telefonica'].some(p => h.includes(p))) return 'telecom_mobile';
  return 'sonstige';
}

function mapToMietyCategory(contract: DetectedContract): string {
  const h = contract.counterparty.toLowerCase();
  if (['strom', 'eon', 'vattenfall', 'enbw'].some(p => h.includes(p))) return 'strom';
  if (['gas', 'fernwaerme'].some(p => h.includes(p))) return 'gas';
  if (['internet', 'glasfaser', 'kabel', 'unitymedia'].some(p => h.includes(p))) return 'internet';
  if (['telekom', 'vodafone', 'o2', '1und1', '1&1'].some(p => h.includes(p))) return 'internet';
  return 'strom'; // Default for energy providers
}
```

---

## Phase 3: Dialog-Komponente

### Datei: `src/components/shared/ContractDetectionDialog.tsx` — NEUE DATEI

Verwendet unsere bestehende `Dialog`-Komponente (Radix UI). Zeigt erkannte Vertraege in einer Tabelle mit Checkboxen, Kategorie-Dropdown und Ziel-Badge. Kein Browser-Popup, kein Popup-Blocker-Problem.

Hauptelemente:
- **Header**: Zusammenfassung "X von Y Vertraege erkannt"
- **Tabelle**: Checkbox | Counterparty | Betrag | Frequenz | Kategorie-Dropdown | Ziel-Badge
- **Footer**: "Alle/Keine" Toggle + "Vertraege uebernehmen" Button
- **Kategorie-Dropdown**: Erlaubt dem User, die Zuordnung zu korrigieren (Abo → Versicherung, etc.)
- **Ziel-Badge**: Zeigt wohin der Vertrag geschrieben wird (farbkodiert)

Komponenten-Props:
```typescript
interface ContractDetectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contracts: DetectedContract[];
  onConfirm: (contracts: DetectedContract[]) => void;
  isCreating: boolean;
}
```

---

## Phase 4: Integration in IntakeTab

### Datei: `src/pages/portal/dms/IntakeTab.tsx` — AENDERUNG

Neuer Block zwischen Cloud-Import und Dokument-Checkliste:

**Block "Konto-Intake":**
- Icon: `ScanSearch` (Lucide)
- Titel: "Vertraege aus Kontobewegungen"
- Untertitel: "Wiederkehrende Zahlungen automatisch als Vertraege erkennen"
- Anzeige: Nur wenn mindestens 1 FinAPI-Verbindung besteht (Query auf `finapi_connections`)
- Button: "Kontobewegungen analysieren" → laedt `bank_transactions` → ruft `detectRecurringContracts()` → oeffnet Dialog

Ablauf:
1. User klickt "Kontobewegungen analysieren"
2. Hook laedt kategorisierte Transaktionen aus `bank_transactions` (alle mit `match_category != null`)
3. `detectRecurringContracts()` wird aufgerufen (pure Engine-Funktion, client-side)
4. Falls Ergebnisse > 0: `ContractDetectionDialog` oeffnet sich
5. Falls keine Ergebnisse: Toast "Keine wiederkehrenden Muster erkannt"
6. User waehlt/korrigiert/bestaetigt → `useContractCreation` schreibt in DB
7. Dialog schliesst, Checkliste refresht

---

## Betroffene Dateien (Zusammenfassung)

| Datei | Aenderung | Modul-Pfad? |
|-------|-----------|-------------|
| `src/engines/kontoMatch/spec.ts` | Neue Typen anfuegen | Nein (engine) |
| `src/engines/kontoMatch/recurring.ts` | NEUE DATEI | Nein (engine) |
| `src/hooks/useContractCreation.ts` | NEUE DATEI | Nein (hook) |
| `src/components/shared/ContractDetectionDialog.tsx` | NEUE DATEI | Nein (shared) |
| `src/pages/portal/dms/IntakeTab.tsx` | Neuer Block einfuegen | **MOD-03 (braucht UNFREEZE)** |
| `spec/current/00_frozen/modules_freeze.json` | MOD-18 + MOD-03 unfreeze | Meta |

---

## Governance-Checkliste

- Keine neuen Routen oder Menuepunkte
- Keine neuen Tabs oder Tiles
- Engine-Erweiterung bleibt in ENG-KONTOMATCH (keine neue Engine-Nummer)
- Business-Logik (Pattern-Erkennung) liegt ausschliesslich in `src/engines/kontoMatch/recurring.ts`
- Dialog liegt in `src/components/shared/` (kein Modul-Lock)
- Keine hardcoded Demo-Daten (Daten kommen aus `bank_transactions`)
- KontenTab (MOD-18) wird NICHT geaendert

## Voraussetzung

**UNFREEZE MOD-03** ist erforderlich, da `IntakeTab.tsx` unter `src/pages/portal/dms/` liegt.
