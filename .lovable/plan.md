
# Zone 1 Harmonisierung — Runde 2: Professionalisierung

## Verbleibende Befunde nach Runde 1

### A. Sprache: Verbleibende englische Strings

| # | Datei | Zeile(n) | Aktueller Text | Korrektur |
|---|-------|----------|----------------|-----------|
| A1 | `Organizations.tsx` | 208 | `"Parent Organization"` (Label) | `"Eltern-Organisation"` |
| A2 | `Organizations.tsx` | 219 | `"Select parent (or none for root)"` | `"Eltern-Organisation waehlen (oder keine fuer Root)"` |
| A3 | `Organizations.tsx` | 221 | `"— Root (no parent) —"` | `"— Root (ohne Eltern) —"` |
| A4 | `Organizations.tsx` | 232 | `"Organization Type"` | `"Organisationstyp"` |
| A5 | `Organizations.tsx` | 238 | `"Select type"` | `"Typ waehlen"` |
| A6 | `Organizations.tsx` | 249 | `'Root organizations must be of type "Internal"'` | `'Root-Organisationen muessen vom Typ "Internal" sein'` |
| A7 | `Organizations.tsx` | 250 | `` `Allowed under ${...}: ${...}` `` | `` `Erlaubt unter ${...}: ${...}` `` |
| A8 | `Organizations.tsx` | 273 | `"URL-friendly identifier"` | `"URL-freundlicher Bezeichner"` |
| A9 | `Organizations.tsx` | 304 | `'Viewing organizations you have access to'` | `'Organisationen mit Ihrem Zugriff'` |
| A10 | `Users.tsx` | 231 | `'All fields are required'` | `'Alle Felder sind erforderlich'` |
| A11 | `Users.tsx` | 237 | `'Only platform admins can assign...'` | `'Nur Platform Admins koennen...'` |
| A12 | `Users.tsx` | 261 | `'This user already has a membership...'` | `'Dieser Benutzer hat bereits eine Mitgliedschaft...'` |
| A13 | `Users.tsx` | 263 | `'Failed to create membership'` | `'Mitgliedschaft konnte nicht erstellt werden'` |
| A14 | `Users.tsx` | 452 | `'Platform Admin role can only be assigned by platform admins'` | `'Die Platform-Admin-Rolle kann nur von Platform Admins vergeben werden'` |
| A15 | `Users.tsx` | 482-483 | `'Filtered by organization: ...' / 'All memberships across organizations'` | Deutsche Texte |
| A16 | `Users.tsx` | 501-504 | Tabellen-Header `"Organization"`, `"Role"`, `"Created"`, `"Actions"` | `"Organisation"`, `"Rolle"`, `"Erstellt"`, `"Aktionen"` |
| A17 | `Users.tsx` | 526 | `'You'` Badge | `'Du'` |
| A18 | `Users.tsx` | 536 | `'MMM d, yyyy'` Datumsformat | `'dd.MM.yyyy'` (deutsches Format) |
| A19 | `Users.tsx` | 571 | `"Edit Membership"` Dialog-Titel | `"Mitgliedschaft bearbeiten"` |
| A20 | `Users.tsx` | 572 | `"Change the role for this membership."` | `"Rolle fuer diese Mitgliedschaft aendern."` |
| A21 | `Users.tsx` | 587-594 | Labels `"User ID"`, `"Organization"`, `"New Role"`, `"Select role"` | Deutsche Labels |
| A22 | `Users.tsx` | 623-626 | Buttons `"Cancel"`, `"Save Changes"` | `"Abbrechen"`, `"Speichern"` |
| A23 | `Users.tsx` | 636-638 | `"Remove Membership"`, `"This will remove..."`, `"Cancel"`, `"Remove"` | Deutsche Texte |
| A24 | `Users.tsx` | 714 | `documentTitle="Users & Memberships"` | `"Benutzer & Mitgliedschaften"` |
| A25 | `Delegations.tsx` | 245-261 | Labels `"Delegate Organization"`, `"Target Organization"`, `"Who gets access"`, `"Whose resources"` | Deutsche Labels |
| A26 | `Delegations.tsx` | 294 | `"Expires At (optional)"` | `"Ablaufdatum (optional)"` |
| A27 | `Delegations.tsx` | 345 | Filter-Optionen `"Active"`, `"Revoked"`, `"Expired"` | `"Aktiv"`, `"Widerrufen"`, `"Abgelaufen"` |
| A28 | `Delegations.tsx` | 368-373 | Tabellen-Header `"Delegate -> Target"`, `"Scopes"`, `"Status"`, `"Granted"`, `"Expires"`, `"Actions"` | Deutsche Header |
| A29 | `Delegations.tsx` | 397 | `'MMM d, yyyy'` Datumsformat | `'dd.MM.yyyy'` |
| A30 | `Delegations.tsx` | 440-454 | Detail-Dialog Labels `"Delegate"`, `"Target"`, `"Granted"` | Deutsche Labels |
| A31 | `Delegations.tsx` | 492-501 | Revoke-Dialog komplett Englisch | Deutsche Texte |
| A32 | `Support.tsx` | 90 | `'Please enter a search query'` | `'Bitte Suchbegriff eingeben'` |
| A33 | `Support.tsx` | 253 | Tabellen-Header `"Actions"` | `"Aktionen"` |
| A34 | `Support.tsx` | 305-309 | `"User Context: ..."`, `"View and edit user profile..."` | Deutsche Texte |
| A35 | `Support.tsx` | 314 | `"Read-Only Context"` | `"Nur-Lesen Kontext"` |
| A36 | `Support.tsx` | 317-327 | Labels `"User ID"`, `"Email"`, `"Created"`, `"Updated"` | Deutsche Labels |
| A37 | `Support.tsx` | 334-342 | `"Memberships"`, `"No memberships"` | Deutsche Texte |
| A38 | `Support.tsx` | 358-386 | Labels `"Display Name"`, `"User's display name"`, `"Active Tenant"`, `"Select active tenant"`, `"The organization context..."` | Deutsche Labels |
| A39 | `Support.tsx` | 392-397 | Buttons `"Cancel"`, `"Save Changes"` | `"Abbrechen"`, `"Speichern"` |
| A40 | `Oversight.tsx` | 320 | `"Public Listings"` | `"Oeffentliche Inserate"` |
| A41 | `Oversight.tsx` | 337 | Tab `"Tenants"` | `"Mandanten"` |
| A42 | `Oversight.tsx` | 431 | Badge `"Public"` | `"Oeffentlich"` |

### B. DESIGN Token Konsistenz — Fehlende Anwendung

| # | Datei | Problem | Loesung |
|---|-------|---------|---------|
| B1 | `Organizations.tsx` | `className="space-y-6"` + `text-2xl font-bold tracking-tight` inline | `DESIGN.SPACING.SECTION` + `DESIGN.TYPOGRAPHY.PAGE_TITLE` |
| B2 | `Users.tsx` | Gleiches Problem wie B1 | DESIGN Tokens |
| B3 | `Delegations.tsx` | Gleiches Problem | DESIGN Tokens |
| B4 | `Support.tsx` | Gleiches Problem | DESIGN Tokens |
| B5 | `Oversight.tsx` | `className="space-y-6"` + `text-2xl font-bold` inline | DESIGN Tokens |
| B6 | `Integrations.tsx` | `text-2xl font-bold` ohne DESIGN Token | DESIGN Token |
| B7 | `Oversight.tsx` | KPI-Grid `grid-cols-6` — 6 Spalten verstoesst gegen Design-Manifest (max 4) | Umstellen auf `DESIGN.KPI_GRID.FULL` (max 4 Spalten) mit 2. Zeile |

### C. Datumsformat-Inkonsistenz

| # | Datei | Aktuell | Korrektur |
|---|-------|---------|-----------|
| C1 | `Organizations.tsx:366` | `'MMM d, yyyy'` (englisch) | `'dd.MM.yyyy'` + `{ locale: de }` |
| C2 | `Users.tsx:536` | `'MMM d, yyyy'` | `'dd.MM.yyyy'` + `{ locale: de }` |
| C3 | `Delegations.tsx:397,401` | `'MMM d, yyyy'` | `'dd.MM.yyyy'` + `{ locale: de }` |
| C4 | `Support.tsx:279` | `'MMM d, yyyy'` | `'dd.MM.yyyy'` + `{ locale: de }` |

### D. Strukturelle Verbesserungen

| # | Befund | Loesung |
|---|--------|---------|
| D1 | `Oversight.tsx` laedt ALLE Daten ohne Pagination (E4 aus Runde 1 nicht adressiert) | Limit auf 100 Zeilen pro Tabelle + "Mehr laden" Button |
| D2 | Oversight KPI-Grid hat 6 Spalten — bricht auf kleinen Bildschirmen | Umstrukturieren auf max 4 Spalten (2 Zeilen) |
| D3 | `Support.tsx:126` Fehlermeldung noch Englisch `'Search failed'` | `'Suche fehlgeschlagen'` |
| D4 | Alle Seiten ausser Dashboard nutzen nicht `DESIGN.SPACING.SECTION` als Root-Container | Einheitlich umstellen |

---

## Umsetzungsplan

### Phase 1: Sprachbereinigung (42 Strings)

Alle verbleibenden englischen UI-Strings in den 6 Dateien werden auf Deutsch umgestellt:
- `Organizations.tsx` — 10 Strings (Dialog-Labels, Platzhalter, Beschreibungen)
- `Users.tsx` — 15 Strings (Dialog-Titel, Tabellen-Header, Buttons, Fehlermeldungen)
- `Delegations.tsx` — 12 Strings (Dialog-Labels, Tabellen-Header, Revoke-Dialog)
- `Support.tsx` — 10 Strings (Fehlermeldungen, Labels, Buttons)
- `Oversight.tsx` — 3 Strings (Tab-Label, KPI-Label, Badge)

### Phase 2: DESIGN Token Migration

Alle 6 Seiten erhalten konsistente DESIGN Token-Nutzung:
- Root-Container: `DESIGN.SPACING.SECTION` statt `className="space-y-6"`
- Seiten-Titel: `DESIGN.TYPOGRAPHY.PAGE_TITLE` statt inline `text-2xl font-bold tracking-tight`
- Untertitel: `DESIGN.TYPOGRAPHY.MUTED`
- KPI-Grid: `DESIGN.KPI_GRID.FULL` (max 4 Spalten)

### Phase 3: Datumsformat

Alle `date-fns` `format()`-Aufrufe werden auf `'dd.MM.yyyy'` mit `{ locale: de }` umgestellt. Import von `de` aus `date-fns/locale` wird in fehlenden Dateien ergaenzt.

### Phase 4: Oversight Pagination

`Oversight.tsx` erhaelt `.limit(100)` auf alle Queries und das 6-Spalten-KPI-Grid wird auf 4 Spalten (2 Zeilen) umgestellt, konform zum Design Manifest (max 4 Spalten).

---

## Zusammenfassung der betroffenen Dateien

| Datei | Aenderungen |
|-------|-------------|
| `src/pages/admin/Organizations.tsx` | 10 Strings DE, DESIGN Tokens, Datumsformat |
| `src/pages/admin/Users.tsx` | 15 Strings DE, DESIGN Tokens, Datumsformat |
| `src/pages/admin/Delegations.tsx` | 12 Strings DE, DESIGN Tokens, Datumsformat |
| `src/pages/admin/Support.tsx` | 10 Strings DE, DESIGN Tokens, Datumsformat |
| `src/pages/admin/Oversight.tsx` | 3 Strings DE, DESIGN Tokens, KPI-Grid Fix, Pagination |
| `src/pages/admin/Integrations.tsx` | DESIGN Token fuer Titel |

**Modul-Freeze-Check**: Alle Dateien liegen in `src/pages/admin/` — ausserhalb der Modul-Pfade. Kein Freeze betroffen.
