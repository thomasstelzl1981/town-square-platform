
# Recherche-Zentrale: Strategie-Dashboard + Automation Toggle

## Problem

Die Seite `/admin/ki-office/recherche` zeigt aktuell nur ein manuelles Suchformular und eine Ergebnistabelle. Alles, was im Code an Strategie definiert ist (BANK_BAFIN, IHK_REGISTER, PORTAL_SCRAPING, FAMILY_OFFICE_SEARCH, GOOGLE_FIRECRAWL + LinkedIn/Netrows), ist unsichtbar. Es gibt keinen Toggle zum Starten der taeglichen Automatisierung und keinen Ueberblick ueber den Strategy Ledger oder die Kosten.

## Loesung

Die Seite `AdminRecherche.tsx` wird um **drei neue Sektionen** erweitert, die **oberhalb** des bestehenden Suchformulars eingefuegt werden:

### Sektion A: Strategie-Uebersicht (immer sichtbar)

Eine Karten-Ansicht, die alle definierten Strategien aus `CATEGORY_SOURCE_STRATEGIES` (spec.ts) visuell darstellt:

```text
+---------------------------------------------------------------------+
| RECHERCHE-STRATEGIE                                                  |
+---------------------------------------------------------------------+
| [BANK_BAFIN]        [IHK_REGISTER]      [PORTAL_SCRAPING]          |
| bank_retail          insurance_broker_34d  real_estate_agent         |
| bank_private         financial_broker_34f  real_estate_company       |
|                      fee_advisor_34h                                 |
|                      mortgage_broker_34i                             |
|                      loan_broker                                     |
|                                                                      |
| [FAMILY_OFFICE]      [GOOGLE_FIRECRAWL]                             |
| family_office        financial_advisor                               |
|                      property_management                             |
|                      tax_advisor_re                                   |
|                      dog_boarding, dog_daycare, ...                   |
+---------------------------------------------------------------------+
```

Jede Strategie-Karte zeigt:
- **Strategie-Code** als Titel (z.B. "BANK_BAFIN")
- **Schwierigkeitsgrad** als Badge (easy/medium/hard)
- **Steps** als Pipeline-Visualisierung: `BaFin CSV -> Google Places -> Firecrawl`
- **Kosten pro Kontakt** (Summe der estimatedCostEur aller Steps)
- **Zugeordnete Kategorien** als Tags
- **Provider** mit Icons (Google, Apify, Firecrawl, Netrows, BaFin)

Datenquelle: Direkt aus `CATEGORY_SOURCE_STRATEGIES` importiert -- kein API-Call noetig.

### Sektion B: Automation Toggle + Discovery Scheduler Status

Eine Card mit:

```text
+---------------------------------------------------------------------+
| AUTOMATISIERUNG                                          [=== AN ===]|
+---------------------------------------------------------------------+
| Taegliches Enrichment: 06:00 UTC                                     |
| Ziel: 500 freigegebene Kontakte / Tag                                |
| Budget: max 200 Credits / Tag (50 EUR)                               |
| Region-Split: 70% Top-Staedte / 30% Exploration                     |
|                                                                      |
| Letzter Lauf: 24.02.2026 — 342 gefunden, 12 Duplikate, 280 approved |
| Kosten heute: 28.50 EUR (114 Credits)                                |
+---------------------------------------------------------------------+
```

- **Toggle (Switch)**: Aktiviert/deaktiviert den `pg_cron`-Job fuer `sot-discovery-scheduler`
  - AN: Erstellt/aktiviert den Cron-Job via eine neue Edge Function `sot-scheduler-control`
  - AUS: Deaktiviert den Cron-Job
  - Status wird in einer neuen DB-Tabelle `automation_settings` gespeichert

- **Letzte Laeufe**: Zeigt die letzten 5 Eintraege aus `discovery_run_log`
- **Kosten-Tracker**: Summe der heutigen Kosten aus `discovery_run_log`

### Sektion C: Strategy Ledger Zusammenfassung

```text
+---------------------------------------------------------------------+
| STRATEGY LEDGER STATUS                                               |
+---------------------------------------------------------------------+
| Aktive Ledger: 1.247                                                 |
| Vollstaendig abgeschlossen: 834 (67%)                                |
| In Bearbeitung: 289 (23%)                                            |
| Noch nicht gestartet: 124 (10%)                                      |
|                                                                      |
| Top Data Gaps: email (412), phone (287), contact_person (156)        |
| Durchschnittliche Kosten/Kontakt: 0.023 EUR                          |
+---------------------------------------------------------------------+
```

Datenquelle: Aggregation aus `contact_strategy_ledger`.

---

## Technische Aenderungen

### 1. Neue DB-Tabelle: `automation_settings`

```sql
CREATE TABLE public.automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
```

Initialer Eintrag:
```sql
INSERT INTO automation_settings (setting_key, setting_value)
VALUES ('discovery_scheduler', '{"active": false, "cron_schedule": "0 6 * * *", "target_per_day": 500, "max_credits_per_day": 200}');
```

### 2. Neue Edge Function: `sot-scheduler-control`

Endpoints:
- `GET`: Liefert aktuellen Status (aktiv/inaktiv, letzte Laeufe, Kosten heute)
- `POST { action: 'activate' | 'deactivate' }`: Schaltet den Scheduler ein/aus
  - Schreibt in `automation_settings`
  - Erstellt/loescht den `pg_cron`-Job via SQL

### 3. Neuer Hook: `useSchedulerControl`

```typescript
// src/hooks/useSchedulerControl.ts
- useQuery: GET /sot-scheduler-control (Status + Stats)
- useMutation: POST /sot-scheduler-control (Toggle)
```

### 4. Neue UI-Komponente: `StrategyOverview`

```typescript
// src/components/admin/recherche/StrategyOverview.tsx
// Importiert CATEGORY_SOURCE_STRATEGIES aus spec.ts
// Gruppiert nach strategyCode
// Rendert Pipeline-Visualisierung
```

### 5. Neue UI-Komponente: `AutomationPanel`

```typescript
// src/components/admin/recherche/AutomationPanel.tsx
// Switch-Toggle fuer Scheduler
// Stats aus useSchedulerControl
// Letzte Laeufe aus discovery_run_log
```

### 6. Neue UI-Komponente: `LedgerSummary`

```typescript
// src/components/admin/recherche/LedgerSummary.tsx
// Aggregierte Stats aus contact_strategy_ledger
```

### 7. AdminRecherche.tsx erweitern

Die drei neuen Sektionen werden oberhalb des bestehenden Suchformulars eingefuegt:

```text
<StrategyOverview />      -- Sektion A
<AutomationPanel />       -- Sektion B
<LedgerSummary />         -- Sektion C
--- bestehender Code ---
<Card> Neue Suche </Card>  -- unveraendert
<Card> Auftraege </Card>   -- unveraendert
...
```

### Zusammenfassung der Dateien

| Datei | Aenderung |
|---|---|
| `automation_settings` Tabelle | Neue DB-Tabelle (Migration) |
| `supabase/functions/sot-scheduler-control/index.ts` | Neue Edge Function |
| `src/hooks/useSchedulerControl.ts` | Neuer Hook |
| `src/components/admin/recherche/StrategyOverview.tsx` | Neue Komponente |
| `src/components/admin/recherche/AutomationPanel.tsx` | Neue Komponente |
| `src/components/admin/recherche/LedgerSummary.tsx` | Neue Komponente |
| `src/pages/admin/ki-office/AdminRecherche.tsx` | Integration der 3 neuen Sektionen |

### Modul-Freeze-Check

Alle Dateien liegen ausserhalb der Modul-Pfade (admin/ki-office, hooks, shared components, Edge Functions) -- kein Freeze betroffen.
