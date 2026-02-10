
# MOD-03 DMS — Reiter "Sortieren" als Widget-Kachel-Grid

## Ausgangslage

Der aktuelle `SortierenTab` ist ein manuelles Dokument-Triage-UI (Annehmen/Ablehnen/Ueberspringen). Das entspricht nicht dem gewuenschten Widget-Kachel-System fuer Sortierregeln. Es gibt:
- Keine `inbox_sort_containers` / `inbox_sort_rules` Tabellen
- Kein datenbankgestuetztes OCR-Gate (`tenant_ai_extraction_enabled`) — nur `localStorage`
- Keine Default-Kachel "Rechnungen"

## Umsetzungsplan

### 1. Datenbank-Migration

**Tabelle A: `inbox_sort_containers`**
- `id` (uuid, PK)
- `tenant_id` (uuid, FK organizations)
- `name` (text, NOT NULL)
- `is_enabled` (bool, DEFAULT true)
- `created_at`, `updated_at` (timestamptz)

**Tabelle B: `inbox_sort_rules`**
- `id` (uuid, PK)
- `tenant_id` (uuid, FK organizations)
- `container_id` (uuid, FK inbox_sort_containers ON DELETE CASCADE)
- `field` (text — 'subject', 'from', 'to')
- `operator` (text — 'contains')
- `keywords_json` (jsonb — string array)
- `created_at` (timestamptz)

**Spalte C: `organizations.ai_extraction_enabled`**
- `bool DEFAULT false` — ersetzt den localStorage-Ansatz

**RLS-Policies:** Tenant-basierter Zugriff (SELECT/INSERT/UPDATE/DELETE) ueber `tenant_id` abgesichert via Auth-Context.

**Seed:** Kein DB-Seed. Die Default-Kachel "Rechnungen" wird per Client-Logik beim ersten Laden erzeugt (wenn keine Container fuer den Tenant existieren).

### 2. EinstellungenTab anpassen

- OCR-Toggle (`handleOcrToggle`) schreibt kuenftig in `organizations.ai_extraction_enabled` statt `localStorage`
- Query fuer den Zustand aus `organizations` lesen

### 3. SortierenTab komplett neu aufbauen

**Aufbau:**

```text
+--------------------------------------------------+
| [Banner: "Dokumenten-Auslesung deaktiviert"      |
|  CTA: "Jetzt aktivieren"]  (nur wenn disabled)   |
+--------------------------------------------------+
| Sortieren                                         |
| Erstelle Sortierkacheln. Diese erzeugen           |
| Vorschlaege im Posteingang.                       |
+--------------------------------------------------+
|                                                    |
| +------------------+  +------------------+         |
| | Rechnungen       |  | (weitere...)     |         |
| | [subject:        |  |                  |         |
| |  Rechnung,       |  |                  |         |
| |  Invoice]        |  |                  |         |
| | Status: Aktiv    |  |                  |         |
| | [Edit][Dup][Del] |  |                  |         |
| +------------------+  +------------------+         |
|                                                    |
| [+ Neue Sortierkachel]                             |
+--------------------------------------------------+
```

**Datenabruf:**
- Query `organizations.ai_extraction_enabled` fuer den Global Gate
- Query `inbox_sort_containers` + `inbox_sort_rules` (join) fuer den Tenant

**Global Gate Banner:**
- Wenn `ai_extraction_enabled === false`: Gelbes/oranges Banner oben mit Cpu-Icon
- Text: "Dokumenten-Auslesung ist deaktiviert. Sortierregeln werden nicht ausgefuehrt."
- CTA-Button: "Jetzt aktivieren" → `navigate('/portal/dms/einstellungen')`
- UI bleibt editierbar (Kacheln anlegen/bearbeiten/loeschen geht trotzdem)

**Kachel-Grid:**
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Jede Kachel als `Card` mit glassmorphism-Stil:
  - Name (fett)
  - Regel-Badges (z.B. `Betreff: Rechnung, Invoice`) als `Badge variant="outline"`
  - Status-Badge: "Aktiv" (gruen) oder "Inaktiv (Auslesung aus)" (grau, wenn global disabled)
  - Trefferzahl-Platzhalter (optional, "—" wenn keine Daten)
  - Action-Buttons: Bearbeiten, Duplizieren, Loeschen

**Default-Kachel "Rechnungen":**
- Beim ersten Laden: Wenn `containers.length === 0`, automatisch INSERT eines Containers "Rechnungen" mit Regel `{ field: 'subject', operator: 'contains', keywords: ['Rechnung', 'Invoice'] }`
- Danach Query invalidieren → Kachel erscheint

**CRUD-Dialog (Create/Edit):**
- Dialog mit Feldern:
  - Name (Input, Pflicht)
  - Regel-Builder (MVP):
    - Dropdown: Feld (Betreff / Absender / Empfaenger)
    - Operator: "enthaelt" (fest, MVP)
    - Keywords: Input mit Enter-to-add Chips
  - Mehrere Regeln pro Container moeglich (Button: "+ Regel hinzufuegen")
- Speichern: Insert/Update container + rules (Transaktion: erst Container, dann Rules)
- Duplizieren: Kopiert Container + Rules mit Name "(Kopie)"

**Loeschen:**
- AlertDialog zur Bestaetigung
- CASCADE loescht automatisch die Rules mit

### 4. Dateien-Uebersicht

| Datei | Aenderung |
|---|---|
| SQL-Migration | Neue Tabellen + `organizations.ai_extraction_enabled` + RLS |
| `src/pages/portal/dms/SortierenTab.tsx` | Komplett neu (Widget-Grid + CRUD) |
| `src/pages/portal/dms/EinstellungenTab.tsx` | OCR-Toggle auf DB umstellen |

### 5. Technische Details

- Alle Queries nutzen `activeTenantId` aus `useAuth()`
- RLS-Policies pruefen `auth.uid()` gegen `user_roles.tenant_id`
- Keywords werden als `jsonb`-Array gespeichert (`["Rechnung", "Invoice"]`)
- Integration mit Posteingang (Badge-Anzeige) wird als separater Schritt behandelt — hier nur die Container-Verwaltung
