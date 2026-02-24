

# Marketing-Maschine Phase 1: Kategorisierte Kontaktbuecher in Zone 1

## Ausgangslage

Aktuell existieren fragmentierte Kontaktquellen:
- **AdminKontaktbuch** (KI-Office): Allgemeines Kontaktbuch mit `scope: 'zone1_admin'`, nicht kategorisiert nach Geschaeftsbereich
- **AcquiaryKontakte**: Eigener Kontakt-Pool via `contact_staging` Tabelle mit integrierter SOAT Search Engine
- **SOAT Search Engine**: Funktionaler Orchestrator (Google Places + Apify + Firecrawl), aber nur im Acquiary Desk eingebettet
- **sot-research-engine**: Edge Function existiert und arbeitet mit Google Places API, Apify und Firecrawl

**Probleme:**
1. Nur Acquiary hat ein Kontaktbuch mit Recherche-Integration
2. Lead Desk, Sales Desk, Finance Desk und Pet Desk haben keinen eigenen Kontakt-Tab
3. Die SOAT Search Engine ist fest an Acquiary gekoppelt statt wiederverwendbar
4. Das UI der Recherche ist rein funktional, aber nicht fuer Marketing-Volumen ausgelegt

## Architektur-Entscheidung

### Datenbank: Ein `desk_contact_book` Feld statt separater Tabellen

Statt 6 separate Tabellen wird die bestehende `contact_staging`-Tabelle um ein `desk` Feld erweitert. Jeder Desk sieht nur seine eigenen Kontakte. Das vermeidet Schema-Explosion und nutzt bestehende RLS-Policies.

### UI: Shared `DeskContactBook` Komponente

Eine wiederverwendbare Komponente, die in jeden Operative Desk als neuer Tab eingehaengt wird.

## Kategorien-Zuordnung zu Desks

| Kategorie | Desk | Desk-Code |
|-----------|------|-----------|
| Family Offices & Immobilienunternehmen | Acquiary | `acquiary` |
| Immobilienmakler | Sales Desk | `sales` |
| Finanzvertriebe | Finance Desk | `finance` |
| Finanzdienstleister | Finance Desk | `finance` |
| Versicherungskaufleute | Lead Desk | `insurance` |
| Hundepensionen, Hundehotels, Hundefriseure | Pet Desk | `pet` |

## Umsetzungsplan

### 1. Migration: `desk` Spalte auf `contact_staging`

```sql
ALTER TABLE contact_staging ADD COLUMN desk TEXT DEFAULT 'acquiary';
CREATE INDEX idx_contact_staging_desk ON contact_staging(desk);
```

Bestehende Acquiary-Kontakte behalten `desk = 'acquiary'`. Neue Kontakte werden dem jeweiligen Desk zugeordnet.

### 2. Migration: `soat_search_orders` um `desk` erweitern

```sql
ALTER TABLE soat_search_orders ADD COLUMN desk TEXT DEFAULT 'acquiary';
```

Damit koennen Recherche-Auftraege desk-spezifisch gefiltert werden.

### 3. Shared Komponente: `DeskContactBook`

**Datei:** `src/components/admin/desks/DeskContactBook.tsx`

Eine neue Komponente, die den gesamten AcquiaryKontakte-Code generalisiert:
- Props: `desk: string`, `searchPresets: SearchPreset[]`, `title: string`
- Enthaelt: SOAT Search Section (wiederverwendbar) + Kontakt-Pool
- Filtert `contact_staging` und `soat_search_orders` nach `desk`
- SearchPresets definieren pro Desk die typischen Suchintents (z.B. "Hundepension Muenchen" fuer Pet Desk)

```text
Interface SearchPreset {
  label: string;        // "Hundepensionen"
  intent: string;       // "Hundepensionen Hundehotels"
  icon?: LucideIcon;
}
```

### 4. Neues UI-Konzept: Preset-Karten statt freie Textfelder

Statt des aktuellen minimalen Formulars (Titel + Intent + Anzahl) wird eine visuelle Preset-Auswahl angeboten:

```text
+--------------------------------------------------+
| KONTAKT-RECHERCHE                                |
|                                                  |
| [Hundepension]  [Hundehotel]  [Hundesalon]       |  <-- Preset-Chips
|                                                  |
| Region: [_Muenchen___________]  Anzahl: [25]     |  <-- Region + Count
|                                                  |
| [Recherche starten]                              |
+--------------------------------------------------+
|                                                  |
| ERGEBNISSE (Live-Stream)                         |
| +----------------------------------------------+ |
| | Firma           | Kontakt | Tel  | Mail | +  | |
| | Lennox & Friends | M. Doe  | ...  | ...  | o | |
| | Happy Paws       | K. Mue  | ...  | ...  | o | |
| +----------------------------------------------+ |
|                                                  |
| KONTAKTBUCH (12 Kontakte)                        |
| +----------------------------------------------+ |
| | ...                                          | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

Die Preset-Chips sind pro Desk vordefiniert:
- **Pet Desk**: Hundepension, Hundehotel, Hundesalon, Tierbedarf
- **Sales Desk**: Immobilienmakler, Hausverwaltung, Bautraeger
- **Finance Desk**: Finanzvertrieb, Versicherungsmakler, Bankberater
- **Lead Desk**: Versicherungskaufleute, Mehrfachagenten
- **Acquiary**: Family Office, Immobilienunternehmen, Projektentwickler

### 5. Hook: `useDeskContacts` generalisieren

Basierend auf `useSoatSearchEngine.ts`, aber mit `desk`-Filter:

```text
useDeskContacts(desk: string)
useDeskSoatOrders(desk: string)
useDeskSoatResults(orderId: string)
useCreateDeskSoatOrder(desk: string)
```

### 6. Desk-Routing: Neuer "Kontakte" Tab pro Desk

| Desk | Tab hinzufuegen | Route |
|------|-----------------|-------|
| Sales Desk | "Kontakte" | `/admin/sales-desk/kontakte` |
| Finance Desk | "Kontakte" | `/admin/finance-desk/kontakte` |
| Lead Desk | "Kontakte" | `/admin/lead-desk/kontakte` |
| Pet Desk | "Kontakte" | `/admin/pet-desk/kontakte` |
| Acquiary | Bestehendes Tab refactorn | `/admin/acquiary/kontakte` |

### 7. AcquiaryKontakte refactorn

Die bestehende `AcquiaryKontakte.tsx` wird auf die neue `DeskContactBook`-Komponente umgestellt. Der gesamte SOAT-Search-Code und Kontakt-Pool-Code wird in die Shared-Komponente verschoben.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| **Migration (neu)** | `desk` Spalte auf `contact_staging` und `soat_search_orders` |
| **`src/components/admin/desks/DeskContactBook.tsx`** | Neue Shared-Komponente |
| **`src/hooks/useDeskContacts.ts`** | Neuer generalisierter Hook |
| **`src/pages/admin/desks/SalesDesk.tsx`** | Neuer "Kontakte" Tab + Route |
| **`src/pages/admin/desks/FinanceDesk.tsx`** | Neuer "Kontakte" Tab + Route |
| **`src/pages/admin/desks/LeadDesk.tsx`** | Neuer "Kontakte" Tab + Route |
| **`src/pages/admin/desks/PetmanagerDesk.tsx`** | Neuer "Kontakte" Tab + Route |
| **`src/pages/admin/acquiary/AcquiaryKontakte.tsx`** | Refactor auf DeskContactBook |
| **`src/pages/admin/sales-desk/SalesDeskKontakte.tsx`** | Neue Sub-Page |
| **`src/pages/admin/finance-desk/FinanceDeskKontakte.tsx`** | Neue Sub-Page |
| **`src/pages/admin/lead-desk/LeadDeskKontakte.tsx`** | Neue Sub-Page |
| **`src/pages/admin/petmanager/PetDeskKontakte.tsx`** | Neue Sub-Page |

## Nicht betroffen

- `sot-research-engine` Edge Function — bleibt unveraendert, wird bereits korrekt aufgerufen
- `contacts` Tabelle (Zone-2 Tenant-Kontakte) — separates System
- `AdminKontaktbuch` (KI-Office) — bleibt als uebergreifendes Admin-Kontaktbuch bestehen
- Keine Modul-Freeze-Verletzung, da alle Aenderungen in `src/pages/admin/` und `src/components/admin/` liegen (nicht in Modul-Pfaden)

## Zusammenfassung

```text
Desk-spezifischer Kontakt-Tab
  |
  v
DeskContactBook (Shared Component)
  |-- Preset-Chips (desk-spezifische Suchvorlagen)
  |-- Region + Anzahl Eingabe
  |-- [Recherche starten] -> useDeskSoatOrders(desk)
  |       |
  |       v
  |   sot-research-engine (Google Places + Apify + Firecrawl)
  |       |
  |       v
  |   Live-Ergebnisse (Realtime via soat_search_results)
  |       |
  |       v
  |   [Uebernehmen] -> contact_staging (desk-spezifisch)
  |
  |-- Kontaktbuch (gefiltert nach desk)
       |-- Suche, Filter, Inline-Details
       |-- CSV-Export
```
