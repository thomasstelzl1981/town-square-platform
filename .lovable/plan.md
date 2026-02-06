
# MOD-08 Investment-Suche: Vervollständigungsplan v3.0

## Korrigierte Workflow-Architektur

### ZWEI GETRENNTE GOLDEN PATHS

MOD-08 beinhaltet **zwei völlig unabhängige Workflows**, die nicht vermischt werden dürfen:

---

## Workflow A: Objektsuche & Favoriten

**Datenquelle:** Public Listings aus MOD-06 (Verkauf)

```text
MOD-04 (Property anlegen)
    │
    ▼
MOD-06 (Listing erstellen)
    │
    ├─── Partner-Netzwerk freigeben (Pflicht zuerst)
    │         │
    │         └─► MOD-09 KatalogTab (Vertriebspartner sieht Objekt)
    │
    └─── Kaufy freigeben (Optional, nach Partner)
              │
              ├─► Zone 3 Kaufy Marktplatz (öffentlich)
              │
              └─► MOD-08 Suche (User sucht Investment)
                      │
                      ▼
              MOD-08 Favoriten (User merkt vor)
                      │
                      ▼
              MOD-08 Simulation (Portfolio + Favorit)
```

**Regel:** Objekte erscheinen in MOD-08 Suche UND MOD-09 Katalog, sobald sie via MOD-06 freigegeben sind.

---

## Workflow B: Akquise-Mandat (KOMPLETT EIGENSTÄNDIG)

**Datenquelle:** Suchauftrag des Investors → Zone 1 Acquiary → MOD-12 Akquise-Manager

```text
MOD-08 Mandat
├── MandatCreateWizard (5-Step Wizard)
│   └── Suchkriterien definieren (Region, Preis, Rendite, Objektart)
│
└── Status: draft → submitted_to_zone1
                        │
                        ▼
            Zone 1 ACQUIARY (/admin/acquiary)
            ├── Inbox: Neue Mandate prüfen
            ├── Zuweisung: Akquise-Manager auswählen
            └── Status: assigned
                        │
                        ▼
            MOD-12 AKQUISE-MANAGER (/portal/akquise)
            ├── Dashboard: Zugewiesene Mandate
            ├── Mandate: Workbench für Sourcing
            ├── Objekteingang: Gefundene Objekte analysieren
            └── Status: active → closed
```

**Regel:** Dieses Mandat hat NICHTS mit dem MOD-04/MOD-06 Verkaufs-Flow zu tun. Es ist ein eigenständiger Suchauftrag.

---

## Menüpunkt-Spezifikationen (Aktualisiert)

### 1. Suche (`/portal/investments/suche`)

**Kernfunktion:** Investment-Suche mit zVE + EK-Engine (identisch Zone 3 Kaufy + MOD-09 Beratung)

| Modus | Beschreibung | Engine |
|-------|--------------|--------|
| **Investment-Suche** | zVE + EK → Netto-Belastung pro Objekt | `sot-investment-engine` |
| **Klassische Suche** | Stadt, Preis, Fläche, Rendite | Direkte Query |

**UI-Struktur:**
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Objektsuche                                                                 │
│ Finden Sie passende Kapitalanlage-Objekte für Ihre Situation               │
├─────────────────────────────────────────────────────────────────────────────┤
│ [⊛ Investment-Suche]  [⊙ Klassische Suche]                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ INVESTMENT-SUCHE:                                                           │
│ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────────┐ │
│ │ zVE (Einkommen)     │ │ Eigenkapital        │ │ [▼ Mehr Optionen]       │ │
│ │ [60.000 €         ] │ │ [50.000 €         ] │ │ Familienstand, Kirche   │ │
│ └─────────────────────┘ └─────────────────────┘ └─────────────────────────┘ │
│                                                                             │
│                               [Ergebnisse anzeigen →]                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 12 Objekte · berechnet für 60.000€ zVE · 50.000€ EK                        │
│                                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                 │
│ │ [Bild]          │ │ [Bild]          │ │ [Bild]          │                 │
│ │ MFH München     │ │ ETW Berlin      │ │ EFH Leipzig     │                 │
│ │ 890.000€        │ │ 385.000€        │ │ 295.000€        │                 │
│ │ Rendite: 5,7%   │ │ Rendite: 4,5%   │ │ Rendite: 4,0%   │                 │
│ │ ─────────────── │ │ ─────────────── │ │ ─────────────── │                 │
│ │ +Miete: +4.200€ │ │ +Miete: +1.450€ │ │ +Miete: +980€   │                 │
│ │ −Rate:  −2.900€ │ │ −Rate:  −1.200€ │ │ −Rate:  −800€   │                 │
│ │ ═══════════════ │ │ ═══════════════ │ │ ═══════════════ │                 │
│ │ Belastung:      │ │ Belastung:      │ │ Belastung:      │                 │
│ │ −180€/Mo    [♡] │ │ +120€/Mo    [♥] │ │ +80€/Mo     [♡] │                 │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Datenquelle:** 
- `v_public_listings` (Kaufy-freigegebene Listings)
- ODER: `listings` + `listing_publications` WHERE `channel IN ('kaufy', 'partner_network')`

**Technische Implementierung:**
- Wiederverwendung: `sot-investment-engine` Edge Function (Zone 1)
- Wiederverwendung: `InvestmentSearchCard.tsx` (Zone 3 Kaufy Style)
- Heart-Toggle → `investment_favorites` Tabelle

---

### 2. Favoriten (`/portal/investments/favoriten`)

**Kernfunktion:** Gespeicherte Objekte mit Finanzierungseinstellungen

**Datenstruktur (investment_favorites erweitern):**
```sql
ALTER TABLE investment_favorites 
ADD COLUMN search_params JSONB DEFAULT '{}',
ADD COLUMN calculated_burden NUMERIC;
```

**UI-Struktur:**
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Meine Favoriten                                          [+ Kaufy Sync]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ┌─────────┐ ETW Berlin-Mitte                              Quelle: Suche │ │
│ │ │  [Bild] │ 385.000€ · 4,5% Rendite · 95m²                             │ │
│ │ │         │ Berechnet mit: 60.000€ zVE, 50.000€ EK                      │ │
│ │ └─────────┘ Netto-Belastung: +120€/Mo ✓                                 │ │
│ │                                                                         │ │
│ │ [Zur Simulation hinzufügen]  [Anfrage stellen*]  [Bearbeiten]  [×]     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ *Hinweis: Für eine aktive Objektsuche durch einen Akquise-Manager         │
│  erstellen Sie ein Suchmandat unter "Mandat".                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Aktionen:**
- **Zur Simulation:** Navigiert zu `/portal/investments/simulation?add=:favoriteId`
- **Anfrage stellen:** Deep-Link zu MOD-07 Finanzierungsanfrage (falls Objekt gekauft werden soll)
- **Bearbeiten:** Notiz + Neu-Berechnung
- **Entfernen:** Soft-Delete

---

### 3. Mandat (`/portal/investments/mandat`) — EIGENSTÄNDIGER WORKFLOW

**Kernfunktion:** Suchmandat an Zone 1 Acquiary senden (NICHT mit Favoriten verknüpft)

**Zwei Einstiegspunkte:**
| Einstieg | Route | Beschreibung |
|----------|-------|--------------|
| **Direkt** | `/portal/investments/mandat/neu` | Neues Mandat von Grund auf |
| **Nach Marktanalyse** | `/portal/investments/mandat/neu?region=Berlin&type=apartment` | Prefill aus vorheriger Suche |

**WICHTIG:** Ein Mandat ist KEIN konkretes Objekt, sondern ein **Suchauftrag**. Der User beschreibt, WAS er sucht, und ein Akquise-Manager wird beauftragt, passende Objekte zu finden.

**Wizard-Flow (5 Steps):**
1. **Suchgebiet:** Region, Stadt, PLZ-Bereiche
2. **Objektart:** ETW, MFH, EFH, Gewerbe, Mixed
3. **Budget:** Preis-Range, max. monatliche Belastung
4. **Anforderungen:** Rendite, Baujahr, Zustand
5. **Zusammenfassung + Einreichung**

**Nach Einreichung:**
- Status → `submitted_to_zone1`
- Mandat erscheint in Zone 1 Acquiary Inbox
- Admin weist Akquise-Manager zu
- Manager bearbeitet in MOD-12

---

### 4. Simulation (`/portal/investments/simulation`)

**Kernfunktion:** Portfolio-Spiegelung aus MOD-04 + Favoriten hinzufügen

**Drei Bereiche:**

**A) Aktuelles Portfolio (MOD-04 Spiegelung)**
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 Ihr aktuelles Portfolio                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Objekte: 3    Verkehrswert: 1.200.000€    Restschuld: 800.000€              │
│ Netto-Vermögen: 400.000€                                                    │
│                                                                             │
│ EINNAHMEN p.a.               AUSGABEN p.a.                                  │
│ + Miete:      +48.000€       − Zins:     −24.000€ (rot)                    │
│ + Steuer:      +6.000€       − Tilgung:  −12.000€ (blau)                   │
│ ─────────────────────        ─────────────────────                          │
│ Summe:        +54.000€       Summe:      −36.000€                           │
│                                                                             │
│ Jahresüberschuss: +18.000€ (= +1.500€/Mo)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**B) Objekt hinzufügen (aus Favoriten)**
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ➕ Neues Objekt hinzufügen                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Dropdown: Aus Ihren Favoriten wählen ▼]                                    │
│   ├─ ETW Berlin (385.000€, +120€/Mo, berechnet mit 60k zVE)                │
│   ├─ MFH Hamburg (1.200.000€, −180€/Mo, berechnet mit 60k zVE)             │
│   └─ [+ Manuell eingeben...]                                                │
│                                                                             │
│ Ausgewählt: ETW Berlin-Mitte                                                │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Die gespeicherten Finanzierungsparameter werden übernommen:             │ │
│ │ EK: 50.000€ · Zins: 3,5% · Tilgung: 2,0% · Belastung: +120€/Mo          │ │
│ │ [Anpassen...]                                                           │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                              [+ Zur Simulation hinzufügen]                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**C) Kombinierte Projektion (Charts)**
- 40-Jahres-Vermögensentwicklung (ComposedChart aus MOD-04)
- 10-Jahres-Detailtabelle (Jahr, Miete, Zinsen, Tilgung, Restschuld, Wert, Vermögen)
- Monatliche EÜR (Haushaltsrechnung aus MOD-04)
- Slider für Projektion: Wertsteigerung, Mietsteigerung

---

## Technische Umsetzung

### Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/pages/portal/investments/SucheTab.tsx` | Investment-Engine + Klassische Suche |
| `src/pages/portal/investments/FavoritenTab.tsx` | Favoriten-Verwaltung |
| `src/pages/portal/investments/SimulationTab.tsx` | Portfolio + Projektion |
| `src/hooks/useInvestmentFavorites.ts` | CRUD für investment_favorites |
| `src/hooks/usePortfolioSummary.ts` | MOD-04 Aggregation extrahiert |
| `src/components/investment/FavoriteCard.tsx` | Favoriten-Karte |
| `src/components/investment/PortfolioCombinedView.tsx` | Vorher/Nachher Charts |

### Wiederverwendung

| Komponente | Quelle | Verwendung |
|------------|--------|------------|
| `sot-investment-engine` | Zone 1 Edge Function | Suche + Favoriten Berechnung |
| `InvestmentSearchCard` | Zone 3 Kaufy | Such-Ergebniskarten |
| `ComposedChart` | MOD-04 PortfolioSummaryModal | Simulation Charts |
| `DetailTable40Jahre` | MOD-04 | Simulation Tabelle |
| `Haushaltsrechnung` | MOD-04 | Simulation EÜR |

### Datenbank-Änderungen

```sql
-- investment_favorites erweitern
ALTER TABLE investment_favorites 
ADD COLUMN IF NOT EXISTS search_params JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS calculated_burden NUMERIC,
ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id);

COMMENT ON COLUMN investment_favorites.search_params IS 
  'Gespeicherte zVE, EK, Familienstand, Kirchensteuer';
```

---

## Abgrenzung der Workflows (KRITISCH)

| Aspekt | Workflow A (Suche/Favoriten/Simulation) | Workflow B (Mandat) |
|--------|----------------------------------------|---------------------|
| **Zweck** | Selbstständig Objekte finden & bewerten | Akquise-Manager beauftragen |
| **Datenquelle** | `v_public_listings` (MOD-06) | `acq_mandates` (eigenständig) |
| **Ziel** | Kauf eines konkreten Objekts | Professionelle Objektsuche |
| **Downstream** | → MOD-07 Finanzierung | → Zone 1 Acquiary → MOD-12 |
| **Output** | Favorit + Simulation | Suchmandat-Record |

---

## Fertigstellungsgrad nach Plan

| Bereich | Vorher | Nachher |
|---------|--------|---------|
| Suche | 5% | **100%** |
| Favoriten | 5% | **100%** |
| Simulation | 30% | **100%** |
| Mandat | 95% | **100%** |
| **Gesamt MOD-08** | **48%** | **100%** |

---

## Implementierungs-Reihenfolge

| Phase | Task | Dateien | Aufwand |
|-------|------|---------|---------|
| **1** | DB-Migration: investment_favorites erweitern | Migration | Klein |
| **2** | `useInvestmentFavorites` Hook | 1 neue Datei | Klein |
| **3** | `SucheTab.tsx` mit Investment-Engine Toggle | 1 neue Datei | Mittel |
| **4** | `FavoritenTab.tsx` mit Aktionen | 1 neue Datei | Mittel |
| **5** | `usePortfolioSummary` Hook (MOD-04 Extraktion) | 1 neue Datei | Klein |
| **6** | `SimulationTab.tsx` komplett neu | 4 Komponenten | Groß |
| **7** | InvestmentsPage.tsx Integration | 1 Datei anpassen | Klein |
