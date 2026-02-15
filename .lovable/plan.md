
# MOD-18 Finanzen (Base) — Kompletter Neubau nach 5-Punkte-Menue

## Ausgangslage

**MOD-18 "Finanzen"** befindet sich im Base-Bereich (`/portal/finanzanalyse`) und hat aktuell 4 Tabs:
1. Uebersicht (Personen + KPIs + Setup)
2. Cashflow & Budget (Charts + Budget-Editor)
3. Vertraege & Fixkosten (Recurring Detection)
4. Risiko & Absicherung (Versicherungs-Check)

Diese 4 Tabs werden **komplett ersetzt** durch die vom Prompt vorgegebene 5-Punkte-Struktur. Das RecordCard-System (wie in ProfilTab/Stammdaten) wird als UI-Standard verwendet.

## Neue 5-Punkte-Menustruktur

| Nr | Tile-Name | Route-Path | Inhalt |
|----|-----------|------------|--------|
| 1 | UEBERSICHT | dashboard | Personen (RecordCard) + Konten (RecordCard) + 12M Scan |
| 2 | INVESTMENT | investment | Upvest-Integration (read-only, Empty State) |
| 3 | SACHVERSICHERUNGEN | sachversicherungen | Versicherungs-SSOT (RecordCard + kategoriespezifische Felder) |
| 4 | VORSORGEVERTRAEGE | vorsorge | Vorsorge-CRUD (RecordCard + Person-Zuordnung) |
| 5 | ABONNEMENTS | abonnements | Abo-SSOT (RecordCard + Seed Merchants) |

## Aenderungen im Detail

### 1. `routesManifest.ts` — Tiles von 4 auf 5 aendern

Aktuelle Tiles:
```
{ path: "dashboard", title: "Uebersicht" }
{ path: "reports", title: "Cashflow & Budget" }
{ path: "szenarien", title: "Vertraege & Fixkosten" }
{ path: "settings", title: "Risiko & Absicherung" }
```

Neue Tiles:
```
{ path: "dashboard", title: "Uebersicht", default: true }
{ path: "investment", title: "Investment" }
{ path: "sachversicherungen", title: "Sachversicherungen" }
{ path: "vorsorge", title: "Vorsorgevertraege" }
{ path: "abonnements", title: "Abonnements" }
```

### 2. `FinanzanalysePage.tsx` — Router anpassen

Alte Routes (reports, szenarien, settings) entfernen. Neue Routes fuer die 5 Tiles registrieren. Lazy Imports anpassen.

### 3. `UebersichtTab.tsx` — Komplett-Neubau

**Block A — Personen im Haushalt (RecordCard):**
- Jede Person als `RecordCard` im `RECORD_CARD.GRID`
- Geschlossen: Avatar-Initialen, Name, Rolle-Badge, Geburtsdatum
- Geoeffnet: Alle Felder (Rolle, Anrede, Vorname, Nachname, Geb., E-Mail, Mobil, Adresse) als editierbare Inputs im `RECORD_CARD.FIELD_GRID`
- DRV-Subsektion: Renteninformationen (Datum, Regelaltersrente, kuenftige Rente, Erwerbsminderung)
- CTA-Widget `+ Person hinzufuegen`

**Block B — Konten (RecordCard):**
- Eigener Sektions-Header
- Jedes Konto als `RecordCard`
- Geschlossen: Custom Name oder "Bankname IBAN****1234", Kontotyp-Badge, Status-Badge
- Geoeffnet: Meta (editierbar), Kontodaten (read-only), Umsaetze 12M (read-only Tabelle)

**Block C — 12M Scan:**
- Glass-card mit Button "Umsaetze auslesen & Vertraege erkennen"
- Output: Contract Candidates als Liste mit Action-Buttons (Als Abo/Versicherung/Vorsorge uebernehmen)

### 4. Neue Datei: `InvestmentTab.tsx`

- Zustand "nicht verbunden" (Default): Zentrierter Empty State, Upvest-Logo, "Depot nicht verbunden", deaktivierter Button
- Zustand "verbunden" (vorbereitet): 4 Cards (Depot-Uebersicht, Positionen, Transaktionen, Reports/DMS-Links)
- Visueller Stepper (3 Schritte: Personal Info, Appropriateness Check, T&Cs) als Hinweis

### 5. Neue Datei: `SachversicherungenTab.tsx`

- Jede Versicherung als `RecordCard`
- Geschlossen: Shield-Icon, "Versicherer — Kategorie", Beitrag, Status-Badge
- Geoeffnet:
  - Universal-Felder: Kategorie, Versicherer, Policen-Nr., VN, Beginn, Ablauf, Beitrag+Intervall, Status
  - Kategorie-spezifisch (dynamisch nach Kategorie-Wahl):
    - Haftpflicht: Deckungssumme, SB, mitversicherte Personen
    - Hausrat: Versicherungssumme, Wohnflaeche, Elementar Toggle
    - Wohngebaeude: Objekt-Referenz, Wohnflaeche, Elementar Toggle
    - Rechtsschutz: Bereiche (Checkboxen), SB
    - KFZ: Fahrzeug-Referenz, TK/VK, SB
    - Unfall/BU: Grunddaten + Beitrag
  - EntityStorageTree (Datenraum)
- CTA-Widget `+ Versicherung`

### 6. Neue Datei: `VorsorgeTab.tsx`

- Jeder Vertrag als `RecordCard`
- Geschlossen: HeartPulse-Icon, Anbieter, Vertragsart-Badge, Beitrag
- Geoeffnet: Anbieter, Vertragsnummer, Vertragsart (bAV/Riester/Ruerup/Versorgungswerk/Privat/Sonstige), Person-Zuordnung (Dropdown aus household_persons), Beginn, Beitrag+Intervall, Status, Notizen
- DRV-Referenz: Info-Banner "DRV-Renteninformationen werden unter Uebersicht > Personen gepflegt"
- EntityStorageTree
- CTA-Widget `+ Vorsorgevertrag`

### 7. Neue Datei: `AbonnementsTab.tsx`

- Monatliche Gesamtkosten im Header
- Jedes Abo als `RecordCard`
- Geschlossen: Repeat-Icon, Name/Merchant, Kategorie-Badge, Betrag/Frequenz
- Geoeffnet: Custom Name, Merchant, Kategorie (12er-Enum), Frequenz, Betrag, Payment Source, Start/Renewal, Letzte Zahlung, Status, Auto-Renew Toggle, Confidence
- CTA-Widget `+ Abonnement` mit Seed-Merchant Quick-Select Chips (Netflix, Amazon Prime, Spotify, etc.)
- EntityStorageTree

### 8. Alte Dateien loeschen

- `CashflowBudgetTab.tsx` — entfaellt (Analyse-Funktionen werden spaeter wieder eingefuehrt)
- `VertraegeFixkostenTab.tsx` — entfaellt
- `RisikoAbsicherungTab.tsx` — entfaellt

### 9. `useFinanzanalyseData.ts` — Erweitern

Der Hook bleibt bestehen (Personen + Pension CRUD funktioniert). Neue Queries/Mutations fuer:
- `insurance_contracts` (CRUD fuer Sachversicherungen)
- `vorsorge_contracts` (CRUD fuer Vorsorgevertraege)
- `user_subscriptions` (CRUD fuer Abonnements)
- `bank_account_meta` (Update Custom Name, Kategorie)

Diese Tabellen existieren bereits in der DB (aus MOD-11 SSOT). Der Hook liest und schreibt direkt darauf.

### 10. `recordCardManifest.ts` — Pruefen

Entity Types `person`, `insurance`, `vorsorge`, `subscription`, `bank_account` muessen registriert sein. Fehlende ergaenzen.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/routesManifest.ts` | MOD-18 Tiles: 4 -> 5, neue Pfade/Titel |
| `src/pages/portal/FinanzanalysePage.tsx` | Router: 5 neue Routes, alte entfernen |
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | Komplett-Neubau mit RecordCard |
| `src/pages/portal/finanzanalyse/InvestmentTab.tsx` | NEU: Upvest Empty State + vorbereitet |
| `src/pages/portal/finanzanalyse/SachversicherungenTab.tsx` | NEU: Versicherungs-SSOT mit RecordCard |
| `src/pages/portal/finanzanalyse/VorsorgeTab.tsx` | NEU: Vorsorge-CRUD mit RecordCard |
| `src/pages/portal/finanzanalyse/AbonnementsTab.tsx` | NEU: Abo-SSOT mit RecordCard + Seeds |
| `src/pages/portal/finanzanalyse/CashflowBudgetTab.tsx` | LOESCHEN |
| `src/pages/portal/finanzanalyse/VertraegeFixkostenTab.tsx` | LOESCHEN |
| `src/pages/portal/finanzanalyse/RisikoAbsicherungTab.tsx` | LOESCHEN |
| `src/hooks/useFinanzanalyseData.ts` | Erweitern: Insurance/Vorsorge/Subscription/BankMeta CRUD |
| `src/config/recordCardManifest.ts` | Ggf. fehlende entityTypes ergaenzen |

## Umsetzungsreihenfolge

Aufgrund der Groesse empfehle ich, die Tabs einzeln zu bauen:

1. **Manifest + Router + UebersichtTab** (Grundgeruest, Personen + Konten)
2. **SachversicherungenTab** (komplexester Tab wegen Kategorie-Felder)
3. **VorsorgeTab + AbonnementsTab** (gleiche Struktur, parallel)
4. **InvestmentTab** (visuelles Upgrade, kein CRUD)

## SSOT-Regeln (unveraendert)

- Versicherungen: SSOT in MOD-18 Finanzen (zentral)
- Abonnements: SSOT in MOD-18 Finanzen (zentral)
- Andere Module (Fahrzeuge/Zuhause/PV): Duerfen nur referenzieren/deep-linken
- DRV-Rente: Gepflegt unter Uebersicht > Personen, in Vorsorge nur referenziert
