

# TLC Komplett-Check — Finale Analyse nach Fixes

## Status der 3 bereits gefixten Probleme

| Problem | Status | Verifiziert |
|---|---|---|
| Bug #1: `val.label` → `val.description` | GEFIXT | Zeile 127 in TLCRentReductionSection.tsx korrekt |
| Warnung #2: `landlordName` leer | GEFIXT | Zeile 732: `orgName \|\| 'Eigentümer'`, orgName wird aus DB geladen (Zeile 183-188) |
| Bug #6: Defect-Liste fehlte | GEFIXT | TLCDefectSection zeigt existierende Reports + Badge mit offener Anzahl |

---

## Verbleibende offene Punkte (aus der 30-Punkte-Analyse)

### 1. FEHLEND — 3-Jahres-Check UI (Punkt #23)
- `performThreeYearCheck()` existiert in der Engine (Zeile 385-422), liefert `status`, `capUsedPercent`, `remainingCapEur`, `proposals`
- Kein UI zeigt das Ergebnis an
- **Fix:** Neue `TLCThreeYearCheckSection.tsx` erstellen — kompakte Info-Box pro Lease mit Ampel-Status (within_cap/near_cap/at_cap/over_cap) und verbleibendem Spielraum in Euro

### 2. FEHLEND — Kautions-Zinsgutschrift UI (Punkt #14)
- `calculateDepositInterest()` existiert in der Engine (Zeile 479-501), liefert `accruedInterest`, `years`, `totalWithInterest`
- Kaution-Feld + Status existieren in der Lease-Card, aber kein Zins-Info
- **Fix:** Kleine Info-Zeile in der Lease-Card unter dem Deposit-Status einfügen: "Zinsgutschrift: X,XX € (Y Jahre, 0,1%)"

### 3. UX-PROBLEM — Sections nur fuer activeLeases[0] (Punkt #5)
- Zeile 719-768: Alle Workflow-Sections (Handover, Defect, PaymentPlan, RentReduction, Contract, Communication, Prepayment, Invoice, ServiceProvider, Insurance) werden nur fuer den ERSTEN aktiven Lease gerendert
- Bei mehreren aktiven Leases fehlen alle Workflow-Tools fuer Lease 2, 3, etc.
- **Fix:** Loop ueber `activeLeases` statt `activeLeases[0]`, mit Lease-Name als Gruppenkopf

### 4. UX-PROBLEM — 16 Collapsible-Sections Ueberflutung (Punkt #7)
- Alle 16 Sections erscheinen als flache Liste — das ist bei leerer Datenbank oder wenig Aktivitaet uebersichtlich, wird aber bei aktiven Leases unuebersichtlich
- **Fix:** Gruppierung in 4 Kategorien mit verschachtelten Collapsibles:
  - **Kernfunktionen:** Events, Tasks, Deadlines, Zaehlerstaende
  - **Vertrag & Uebergabe:** Vertragsgenerator, Handover, Bewerber
  - **Finanzen:** Ratenplan, Mietminderung, NK-Anpassung, Rechnungspruefung
  - **Verwaltung:** Kommunikation, Dienstleister, Versicherung, Report

### 5. UX-DETAIL — TLCContractSection: propertyAddress und unitDescription leer
- Zeile 733-734: `propertyAddress: ''` und `unitDescription: ''` sind hardcoded leer
- Der Vertragsentwurf wird dadurch unvollstaendig generiert (Adresse fehlt im Vertrag)
- **Fix:** Property-Adresse und Unit-Bezeichnung aus der DB laden (analog zu orgName)

### 6. UX-DETAIL — TLCContractSection: areaSqm und roomCount = 0
- Zeile 737-738: Flaeche und Raumzahl werden als 0 uebergeben
- Der Vertrag zeigt "0 qm, 0 Raeume"
- **Fix:** Aus der Unit-/Property-Tabelle laden

---

## Implementierungsplan

### Schritt 1: Property- und Unit-Daten laden (fuer Contract + Deposit Interest)
- In `TenancyTab.tsx` zusaetzlich `properties` und `units` Daten fetchen (Adresse, Flaeche, Raumzahl)
- Diese an TLCContractSection durchreichen
- Deposit-Interest-Berechnung in die Lease-Card einbauen

### Schritt 2: TLCThreeYearCheckSection erstellen
- Neue Datei `src/components/portfolio/tlc/TLCThreeYearCheckSection.tsx`
- Ruft `performThreeYearCheck()` auf mit Lease-Daten
- Zeigt Ampel-Badge + Restspielraum + ggf. Vorschlaege

### Schritt 3: Sections gruppieren
- 4 Kategorie-Collapsibles mit Unter-Sections
- Reduziert visuelle Komplexitaet von 16 auf 4 Top-Level-Elemente

### Schritt 4: Multi-Lease-Support
- activeLeases-Loop statt `activeLeases[0]`
- Jeder Lease bekommt seine eigenen Workflow-Sections mit Lease-Kennung als Header

### Betroffene Dateien
- `src/components/portfolio/TenancyTab.tsx` — Hauptaenderungen (Daten-Fetch, Gruppierung, Multi-Lease)
- `src/components/portfolio/tlc/TLCThreeYearCheckSection.tsx` — NEU
- Keine Engine-Aenderungen noetig (alle Funktionen existieren bereits)
- Keine DB-Migrationen noetig

