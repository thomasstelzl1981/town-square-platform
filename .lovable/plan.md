
# MOD-18 Investment Tab: Depot-Eroeffnung & Demo-Depot (Upvest-Vorbereitung)

## Ueberblick

Die aktuelle InvestmentTab-Seite zeigt nur einen statischen Empty State mit einem deaktivierten "Upvest verbinden" Button. Ziel ist es, diese Seite in ein vollwertiges, interaktives Modul umzubauen mit:

1. Einem funktionalen **Depot-Eroeffnungs-Wizard** (3 Schritte, klickbar)
2. Einem **Demo-Depot** mit realistischen Wertpapierdaten
3. Einer **Portfolio-Uebersicht** mit Donut-Chart, Positionen-Liste und Performance-Verlauf

---

## Architektur

Der InvestmentTab wird zustandsbasiert gesteuert:

```text
+------------------------------------------+
|  depot_status (localStorage)             |
|                                          |
|  "none"  --> Onboarding-Wizard anzeigen  |
|  "pending" --> Verifizierung laeuft      |
|  "active"  --> Demo-Depot anzeigen       |
+------------------------------------------+
```

---

## Teil 1: Depot-Eroeffnungs-Wizard

Ein 3-Schritt Stepper (orientiert an den Upvest-Screenshots):

| Schritt | Titel | Inhalte |
|---------|-------|---------|
| 1 - Persoenliche Daten | Personal Information | Anrede, Vorname, Nachname, E-Mail, Geburtsdatum, Nationalitaet (vorausgefuellt aus Profildaten) |
| 2 - Angemessenheitspruefung | Appropriateness Check | Erfahrung mit Anleihen, Aktien, Fonds, Zertifikaten (Ja/Nein Radio-Buttons) |
| 3 - Vertragsbedingungen | Terms & Conditions | AGB-Toggle, Datenschutzhinweis, Bestaetigung |

Nach Abschluss: Erfolgs-Animation ("Depot wurde eroeffnet"), Status wechselt auf "active".

**UI-Stil**: Vertical Stepper mit Fortschrittsanzeige rechts (wie in den Upvest-Screenshots), glass-card Design passend zum CI-System.

---

## Teil 2: Demo-Depot (nach Eroeffnung)

Aufbau orientiert an Upvest "Custody Management" Screenshots:

### 2a: Portfolio-Header-Card
- Gesamtwert: **29.431,00 EUR**
- Tagesveraenderung: +1,2%
- Donut-Chart mit Allokation (Recharts PieChart)

### 2b: Positionen-Liste
Realistische Demo-Wertpapiere:

| Name | ISIN | Stueck | Kurs | Wert | Performance |
|------|------|--------|------|------|-------------|
| iShares Core MSCI World | IE00B4L5Y983 | 45,00 | 89,12 EUR | 4.010,40 EUR | +8,12% |
| Vanguard FTSE All-World | IE00BK5BQT80 | 30,00 | 118,50 EUR | 3.555,00 EUR | +6,50% |
| Apple Inc. | US0378331005 | 15,00 | 230,00 EUR | 3.450,00 EUR | +3,20% |
| Alphabet Inc. | US02079K3059 | 8,00 | 665,00 EUR | 5.320,00 EUR | +8,12% |
| MSCI EM Sustainable | IE00BYVJRP78 | 60,00 | 54,60 EUR | 3.276,00 EUR | +4,80% |
| Xtrackers DAX UCITS | LU0274211480 | 25,00 | 167,28 EUR | 4.182,00 EUR | +2,10% |
| Cash/Verrechnungskonto | — | — | — | 5.637,60 EUR | — |

### 2c: Performance-Chart
- Linienchart (Recharts LineChart) mit 12-Monats-Verlauf
- Zeitraum-Toggle: 1M / 3M / 6M / 1J / Max

### 2d: Letzte Transaktionen
- 5-6 Demo-Transaktionen (Kauf/Verkauf/Dividende)
- Datum, Typ, Wertpapier, Stueck, Betrag

### 2e: Steuer-Report Card
- Kapitalertraege, Abgeltungsteuer, Soli, Kirchensteuer (wie Screenshot slide_14)
- "Report herunterladen" Button (Demo-only, zeigt Toast)

---

## Teil 3: Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/pages/portal/finanzanalyse/InvestmentTab.tsx` | Hauptdatei - Refactoring mit State-Machine |
| `src/components/finanzanalyse/depot/DepotOnboardingWizard.tsx` | 3-Schritt Wizard Komponente |
| `src/components/finanzanalyse/depot/DepotPortfolio.tsx` | Portfolio-Uebersicht mit Donut-Chart |
| `src/components/finanzanalyse/depot/DepotPositionen.tsx` | Positionen-Tabelle |
| `src/components/finanzanalyse/depot/DepotPerformanceChart.tsx` | Linien-Chart mit Zeitraum-Toggle |
| `src/components/finanzanalyse/depot/DepotTransaktionen.tsx` | Letzte Transaktionen |
| `src/components/finanzanalyse/depot/DepotSteuerReport.tsx` | Steuer-Zusammenfassung |
| `src/hooks/useDemoDepot.ts` | Hook fuer Demo-Daten und Depot-Status (localStorage) |

---

## Teil 4: Technische Details

### Datenpersistenz
- Depot-Status wird in **localStorage** gespeichert (`depot_onboarding_status`)
- Kein Datenbank-Eintrag noetig (reine Demo-Vorbereitung)
- Spaeter ersetzbar durch echte Upvest-API-Aufrufe

### Bestehende Abhaengigkeiten
- `recharts` (bereits installiert) fuer Donut + Linien-Charts
- `useAuth` fuer Profildaten-Vorausfuellung im Wizard
- `designManifest.ts` CI-Klassen (glass-card, RECORD_CARD)

### Kein Datenbankschema noetig
- Alle Daten sind client-seitig (Demo-Framework konform)
- Spaeter werden die Demo-Hooks durch echte API-Calls ersetzt

### Reset-Moeglichkeit
- Ein kleiner "Depot zuruecksetzen" Link am Seitenende (nur Dev/Demo) zum erneuten Testen des Onboarding-Flows
