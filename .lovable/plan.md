

# Zone 1: Plattform-Kostenmonitor (Testphase)

## Ziel

Ein Zone 1 Dashboard, das euch zeigt: **Was kostet uns die Plattform tatsaechlich?** Damit koennt ihr spaeter eure Credit-Preise datenbasiert kalkulieren, statt zu raten.

## Was existiert bereits

| Komponente | Status |
|------------|--------|
| `armstrong_action_runs` (Tabelle) | Vorhanden — loggt jede Action mit `cost_cents`, `tokens_used`, `duration_ms` |
| `armstrong_billing_events` (Tabelle) | Vorhanden — loggt `cost_model`, `cost_cents`, `credits_charged` |
| `credit_ledger` (Tabelle) | Vorhanden — Einzelbuchungen mit `kind`, `amount` |
| `v_armstrong_costs_daily` (View) | Vorhanden — Tagesaggregation |
| `ArmstrongBilling.tsx` (Zone 1) | Vorhanden — zeigt Events und Tageskosten |
| `KostenDashboard.tsx` (Zone 2) | Vorhanden — zeigt User-KPIs |

## Was fehlt fuer den "Plattformkosten-Monitor"

Die bestehende `ArmstrongBilling.tsx` zeigt Rohdaten pro Event. Fuer die Testphase braucht ihr ein uebergeordnetes Dashboard, das die **echten Plattformkosten** (API-Kosten, LLM-Tokens, SMTP etc.) aggregiert und mit den **geplanten Credit-Preisen** vergleicht.

### Schritt 1: Datenbank — Plattformkosten-View

Eine neue View `v_platform_cost_summary`, die aus `armstrong_action_runs` und `armstrong_billing_events` die realen Kosten aggregiert:

- **Pro Action-Code**: Anzahl Runs, Summe Tokens, Summe cost_cents, Durchschnitt pro Run
- **Pro Kostenkategorie**: LLM (Token-basiert), API (Flatrate pro Call), Communication (SMTP/Fax), Free
- **Pro Zeitraum**: Taeglich, woechentlich, monatlich
- **Marge**: Vergleich `cost_cents` (unsere Kosten) vs. `credits_charged * 50` (Erloes bei 1 Credit = 0.50 EUR)

### Schritt 2: Zone 1 UI — "Plattformkosten-Monitor"

Eine neue Seite unter `/admin/armstrong/costs` mit drei Bereichen:

**Bereich A: KPI-Uebersicht (Header-Cards)**
- Gesamtkosten (Plattform) in EUR — was wir bezahlen
- Theoretischer Erloess (Credits * 0.50) — was wir einnehmen wuerden
- Marge in % — Differenz
- Anzahl metered Actions vs. free Actions

**Bereich B: Kostenanalyse pro Action (Tabelle)**
- Action-Code, Kategorie (LLM/API/Communication/Free)
- Runs gesamt, Ø Kosten pro Run (in Cent)
- Ø Tokens pro Run
- Aktueller Credit-Preis (aus Manifest)
- Marge pro Action (Kosten vs. Credit-Erloess)
- Farbmarkierung: Rot = Verlust, Gruen = Gewinn

**Bereich C: Credit-Kalkulator**
- Eingabefelder: Ziel-Marge (z.B. 60%), Fixkosten pro Monat
- Berechnet automatisch: empfohlener Credit-Preis pro Action
- Vergleicht: aktueller Preis vs. empfohlener Preis
- Export-Button: Kalkulationstabelle als CSV

### Schritt 3: Manifest-Erweiterung

Jede Action im Manifest erhaelt ein zusaetzliches Feld `cost_category`, um die Kostenart zu klassifizieren:

```text
cost_category: 'llm' | 'api_external' | 'communication' | 'infrastructure' | 'free'
```

Dies erlaubt spaeter automatische Gruppierung und Reporting.

## Dateien

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| SQL Migration | CREATE | View `v_platform_cost_summary` |
| `src/pages/admin/armstrong/PlatformCostMonitor.tsx` | CREATE | Neue Zone 1 Seite |
| `src/pages/admin/armstrong/index.ts` | EDIT | Export hinzufuegen |
| `src/router/ManifestRouter.tsx` | EDIT | Route `/admin/armstrong/costs` registrieren |
| `src/pages/admin/armstrong/ArmstrongDashboard.tsx` | EDIT | Quick-Link zur neuen Seite |
| `src/manifests/armstrongManifest.ts` | EDIT | `cost_category` Feld zu allen Actions hinzufuegen |
| `src/types/armstrong.ts` | EDIT | `cost_category` zum Type hinzufuegen |

## Vorgehensweise

1. **Migration**: View `v_platform_cost_summary` erstellen
2. **Type + Manifest**: `cost_category` Feld einfuehren und alle ~153 Actions klassifizieren
3. **UI**: `PlatformCostMonitor.tsx` mit KPIs, Tabelle und Kalkulator bauen
4. **Routing**: Seite in Zone 1 Navigation einbinden

## Kein Breaking Change

- Alle bestehenden Seiten bleiben unveraendert
- `cost_category` ist optional im Type (Manifest-seitig, nicht DB)
- Die View liest nur bestehende Tabellen

