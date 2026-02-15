

# MOD-11 Finanzmanager — Kompletter Neubau mit RecordCard-System

## Ueberblick

Alle 5 Tabs werden von Grund auf neu gebaut. Die bestehenden Accordion-basierten Tabs werden durch das etablierte **RecordCard-Pattern** ersetzt (wie in `ProfilTab.tsx` vorgemacht). Jeder Datensatz wird als quadratisches Widget dargestellt (geschlossen) und oeffnet sich als volle Breite (geoeffnet) mit allen Feldern, Datenraum und Actions — ohne Tabs, Wizards oder Accordions.

Die Hooks (`useFinanzmanagerData.ts`) und DB-Tabellen bleiben erhalten — nur die UI wird komplett erneuert.

## Visuelle Referenz: Upvest-Inspiration

Die Upvest-Screenshots zeigen ein cleanes Card-Design mit:
- Dunkle Header-Cards mit klarer Informationshierarchie
- Strukturierte Datenfelder (Label links, Wert rechts) mit feinen Trennlinien
- Stepper/Progress-Indikatoren rechts neben den Cards
- Klare CTAs am unteren Rand

Dieses Gefuehl wird uebertragen auf das bestehende `glass-card` Design-System mit `RECORD_CARD`-Konstanten.

## Layout-Prinzip (alle Tabs gleich)

```text
+--------------------------------------------+
| PageShell + ModulePageHeader               |
+--------------------------------------------+
| RECORD_CARD.GRID (2 Spalten)               |
|                                            |
| +------------------+  +------------------+ |
| | [RecordCard]     |  | [RecordCard]     | |
| | glass-card       |  | glass-card       | |
| | aspect-square    |  | aspect-square    | |
| | Avatar/Icon      |  | Avatar/Icon      | |
| | Titel            |  | Titel            | |
| | Summary-Zeilen   |  | Summary-Zeilen   | |
| | Badges           |  | Badges           | |
| |        [>]       |  |        [>]       | |
| +------------------+  +------------------+ |
| +------------------+                       |
| | [+ Hinzufuegen]  |                       |
| | CTA-Widget       |                       |
| +------------------+                       |
|                                            |
| --- Bei Klick: RecordCard OPEN ---         |
| +----------------------------------------+ |
| | [X]  Titel — Subtitle                  | |
| |                                        | |
| | SECTION_TITLE: Basisdaten              | |
| | FIELD_GRID: 3 Spalten                  | |
| | [Label: Wert] [Label: Wert] [...]      | |
| |                                        | |
| | SECTION_TITLE: Spezifisch              | |
| | FIELD_GRID: Dynamische Felder          | |
| |                                        | |
| | SECTION_TITLE: Datenraum               | |
| | [EntityStorageTree]                    | |
| |                                        | |
| |           [Loeschen]  [Speichern]      | |
| +----------------------------------------+ |
+--------------------------------------------+
```

## Datei-fuer-Datei Aenderungen

### 1. `FMUebersichtTab.tsx` — Komplett-Neubau

**Block A — Personen im Haushalt:**
- Jede Person als `RecordCard` mit `entityType="person"`
- Geschlossen: Avatar-Initialen, Name, Rolle-Badge, Geburtsdatum, E-Mail
- Geoeffnet:
  - Sektion "Persoenliche Daten": Rolle (Select), Anrede, Vorname, Nachname, Geb., E-Mail, Mobil
  - Sektion "Adresse": Strasse, HNr, PLZ, Ort (optional)
  - Sektion "DRV Renteninformation": Datum der Info, Regelaltersrente, kuenftige Rente, Erwerbsminderungsrente (alle editierbar)
  - EntityStorageTree fuer Datenraum
  - Speichern/Loeschen-Buttons
- CTA-Widget `+ Person hinzufuegen` im RECORD_CARD.GRID

**Block B — Konten:**
- Eigener Sektions-Header "Konten"
- Jedes Konto als `RecordCard` mit `entityType="bank_account"`
- Geschlossen: Custom Name oder "Bankname IBAN****1234", Kontotyp-Badge, Status-Badge (OK/Fehler)
- Geoeffnet:
  - Sektion "Meta" (EDITIERBAR): Custom Name (Input), Kategorie (Select: Privat/Vermietung/Tagesgeld/PV/Sonstige), Org-Zuordnung
  - Sektion "Kontodaten" (READ-ONLY): Bank, IBAN maskiert, BIC, Inhaber, Saldo, Provider=FinAPI
  - Sektion "Umsaetze 12M" (READ-ONLY): Tabelle mit Buchungsdatum, Betrag, Verwendungszweck, Gegenpartei
  - Speichern-Button (nur fuer Meta)

**Block C — 12M Scan:**
- Prominente glass-card mit ScanSearch-Icon
- Button "Umsaetze (12 Monate) auslesen & Vertraege erkennen"
- Output-Bereich: Contract Candidates als Liste mit Action-Buttons

### 2. `FMInvestmentTab.tsx` — Visuelles Upgrade (Upvest-inspiriert)

**Zustand: Nicht verbunden** (aktueller Default):
- Zentrierter Empty State in glass-card
- Grosses Icon, Titel "Depot nicht verbunden"
- Beschreibung + deaktivierter "Upvest verbinden (demnaechst)"-Button
- Upvest-inspirierter Stepper rechts (3 Punkte: Personal Info, Appropriateness Check, T&Cs) als visueller Hinweis auf den Onboarding-Prozess

**Zustand: Verbunden** (vorbereitet):
- 4 Cards im RECORD_CARD.GRID:
  - Depot-Uebersicht: Portfolio-Wert in gross (gruen wie bei Upvest), Cash-Position, Verbunden-Badge
  - Positionen: Tabelle ISIN/Name/Stuecke/Wert (read-only)
  - Transaktionen: Liste (read-only)
  - Reports: DMS-Links + Download-Button (wie Upvest "DOWNLOAD REPORT")

### 3. `FMSachversicherungenTab.tsx` — Komplett-Neubau mit RecordCard

- Jede Versicherung als `RecordCard` mit `entityType="insurance"`
- Geschlossen: Shield-Icon, "Versicherer — Kategorie", Beitrag, Status-Badge (Aktiv/Gekuendigt)
- Geoeffnet:
  - Sektion "Vertragsdaten":
    - Kategorie (Select: Haftpflicht/Hausrat/Wohngebaeude/Rechtsschutz/KFZ/Unfall/BU/Sonstige)
    - Versicherer, Policen-Nr., VN, Beginn, Ablauf/Kuendigungsfrist, Beitrag, Intervall, Status
  - Sektion "Kategorie-spezifisch" (dynamisch eingeblendet nach Kategorie-Wahl):
    - Haftpflicht: Deckungssumme, SB, mitversicherte Personen
    - Hausrat: Versicherungssumme, Wohnflaeche, Elementar (Toggle)
    - Wohngebaeude: Objekt-Referenz (Select), Wohnflaeche, Elementar (Toggle)
    - Rechtsschutz: Bereiche (Checkboxen: Privat/Beruf/Verkehr/Miete), SB
    - KFZ: Fahrzeug-Referenz (Select), Teilkasko/Vollkasko, SB
    - Unfall: Grunddaten + Beitrag
    - BU: Grunddaten + Beitrag
  - Sektion "Datenraum": EntityStorageTree
  - Actions: Loeschen + Speichern
- CTA-Widget `+ Versicherung` mit Kategorie-Dropdown als erster Schritt

### 4. `FMVorsorgeTab.tsx` — Komplett-Neubau mit RecordCard

- Jeder Vertrag als `RecordCard` mit `entityType="vorsorge"`
- Geschlossen: HeartPulse-Icon, Anbieter, Vertragsart-Badge (bAV/Riester/Ruerup/...), Beitrag
- Geoeffnet:
  - Sektion "Vertragsdaten": Anbieter, Vertragsnummer, Vertragsart (Select), Person-Zuordnung (Select aus household_persons), Beginn, Beitrag, Intervall, Status, Notizen
  - DRV-Referenz: Info-Banner "DRV-Renteninformationen werden unter Uebersicht > Personen gepflegt"
  - Sektion "Datenraum": EntityStorageTree
  - Actions: Loeschen + Speichern
- CTA-Widget `+ Vorsorgevertrag`

### 5. `FMAbonnementsTab.tsx` — Komplett-Neubau mit RecordCard

- Monatliche Gesamtkosten im Header (wie bisher, aber prominenter)
- Jedes Abo als `RecordCard` mit `entityType="subscription"`
- Geschlossen: Repeat-Icon, Custom Name/Merchant, Kategorie-Badge, Betrag/Frequenz
- Geoeffnet:
  - Sektion "Abo-Details": Custom Name, Merchant, Kategorie (12er-Enum), Frequenz, Betrag, Payment Source, Start/Renewal, Letzte Zahlung, Status, Auto-Renew (Toggle), Confidence
  - Sektion "Datenraum": EntityStorageTree
  - Actions: Loeschen + Speichern
- CTA-Widget `+ Abonnement` mit Seed-Merchant Quick-Select Chips (Netflix, Amazon Prime, Spotify, etc.)

### 6. `useFinanzmanagerData.ts` — Minimale Ergaenzung

- `useUserSubscriptionMutations`: Doppelte `if (error)` Zeile entfernen (Zeile 190)
- Update-Mutation ist bereits vorhanden — keine Aenderung noetig

### 7. `FinanzierungsmanagerPage.tsx` — Keine Aenderung

Router-Struktur, Dynamic Routes und Zugriffskontrolle bleiben unveraendert.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/finanzierungsmanager/FMUebersichtTab.tsx` | Komplett-Neubau: RecordCard fuer Personen + Konten + Scan |
| `src/pages/portal/finanzierungsmanager/FMInvestmentTab.tsx` | Visuelles Upgrade: glass-card, Upvest-Stepper, Depot-Cards |
| `src/pages/portal/finanzierungsmanager/FMSachversicherungenTab.tsx` | Komplett-Neubau: RecordCard + kategoriespezifische Felder |
| `src/pages/portal/finanzierungsmanager/FMVorsorgeTab.tsx` | Komplett-Neubau: RecordCard + Person-Zuordnung + DRV-Referenz |
| `src/pages/portal/finanzierungsmanager/FMAbonnementsTab.tsx` | Komplett-Neubau: RecordCard + Seed Merchants + Gesamtkosten |
| `src/hooks/useFinanzmanagerData.ts` | Bugfix: Doppelte Error-Zeile entfernen |

## Nicht betroffen

- `FinanzierungsmanagerPage.tsx` (Router bleibt)
- `routesManifest.ts` (Tiles/Menue bleiben)
- DB-Tabellen (vorhanden und funktional)
- `recordCardManifest.ts` (entityTypes bereits registriert)
- `useFinanzmanagerData.ts` Hooks (CRUD funktioniert, wird weiterverwendet)

## Umsetzungsreihenfolge

Aufgrund der Groesse wird empfohlen, die Tabs einzeln umzubauen:

1. **FMUebersichtTab** (wichtigster Tab, Personen + Konten)
2. **FMSachversicherungenTab** (komplexester Tab wegen Kategorie-Felder)
3. **FMVorsorgeTab** + **FMAbonnementsTab** (gleiche Struktur, parallel moeglich)
4. **FMInvestmentTab** (visuelles Upgrade, kein CRUD)

