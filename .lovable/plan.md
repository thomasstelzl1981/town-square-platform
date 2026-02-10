

# MOD-13: Demo-Wohnung Expose mit Investment Engine (verfeinert)

## Problem

Der vorherige Plan sah ein statisches Tab-Layout fuer das Demo-Expose vor. Die echten Objekt-Exposes auf KAUFY (Zone 3), MOD-08 und MOD-09 verwenden aber das vollstaendige **Investment-Engine-Layout** mit MasterGraph, Haushaltsrechnung, SliderPanel etc. Das Demo-Expose muss exakt diesen Aufbau spiegeln.

## Referenz-Layout (Kaufy2026Expose / PartnerExposePage)

```text
+---------------------------------------+------------------+
| Bildergalerie (Platzhalter)           |                  |
+---------------------------------------+  INVESTMENT      |
| Badge "ETW" · Titel · Adresse        |  SLIDER          |
+---------------------------------------+  PANEL           |
| Key Facts (6 Spalten):                |  (sticky)        |
| Kaufpreis | Flaeche | Baujahr |       |                  |
| Einheiten | Miete   | Rendite |       |                  |
+---------------------------------------+                  |
| Beschreibung                          |                  |
+---------------------------------------+                  |
| MasterGraph (40-Jahres-Projektion)    |                  |
+---------------------------------------+                  |
| Haushaltsrechnung (T-Konto)           |                  |
+---------------------------------------+                  |
| FinanzierungSummary                   |                  |
+---------------------------------------+                  |
| DetailTable40Jahre (Collapsible)      |                  |
+---------------------------------------+------------------+
| Google Maps Platzhalter (volle Breite)                   |
+----------------------------------------------------------+
```

## Aenderungen

### 1. UnitPreislisteTable: Erste Zeile hervorheben + klickbar

**Datei:** `src/components/projekte/UnitPreislisteTable.tsx`

- Zeile 1 (WE-001) bekommt `bg-primary/5 hover:bg-primary/10` Hintergrund
- `pointer-events-none` wird nur auf Zeilen 2-24 angewendet, Zeile 1 bleibt klickbar
- Klick navigiert zu `/portal/projekte/demo-project-001/einheit/demo-unit-001`

### 2. Demo-Daten erweitern

**Datei:** `src/components/projekte/demoProjectData.ts`

Neue Konstante `DEMO_UNIT_DETAIL`:
- `title`: "2-Zimmer-Wohnung, 1. OG links"
- `description`: 2-3 Saetze Beispieltext
- `year_built`: 1998
- `heating_type`: "Zentralheizung (Gas)"
- `energy_class`: "B"
- Alle Werte fuer Key Facts Bar (Kaufpreis, Flaeche, Miete aus DEMO_UNITS[0])

### 3. UnitDetailPage: Demo-Modus mit vollstaendigem Investment-Engine-Layout

**Datei:** `src/pages/portal/projekte/UnitDetailPage.tsx`

Wenn `unitId?.startsWith('demo-unit-')`:
- **Keine DB-Abfragen** ausfuehren
- Demo-Daten aus `DEMO_UNIT_DETAIL` und `DEMO_UNITS[0]` laden
- `useInvestmentEngine()` mit Demo-Werten aufrufen (echte Berechnung, statische Input-Daten)
- Gesamtes Layout in `opacity-60` mit "Musterdaten"-Badge

Das Layout folgt 1:1 dem Kaufy2026Expose-Pattern:

**Linke Spalte (lg:col-span-2):**
1. Bildergalerie-Platzhalter (graue Flaeche mit "Beispielbilder" Text, gleiche Proportionen wie ExposeImageGallery)
2. Property Header: Badge "Eigentumswohnung" + Titel + Adresse + Kaufpreis
3. Key Facts Bar (6 Spalten): Kaufpreis, Wohnflaeche, Baujahr, Zimmer, Miete/Mo, Bruttorendite
4. Beschreibung (Demo-Text)
5. **MasterGraph** (40-Jahres-Projektion) -- echte Komponente mit berechneten Demo-Daten
6. **Haushaltsrechnung** (T-Konto) -- echte Komponente
7. **FinanzierungSummary** -- echte Komponente
8. **DetailTable40Jahre** (Collapsible, defaultOpen=false) -- echte Komponente
9. Karten-Platzhalter (graue Flaeche mit "Standort" Text)

**Rechte Spalte (lg:col-span-1, sticky):**
- **InvestmentSliderPanel** -- echte Komponente, interaktiv auch im Demo-Modus
- Slider-Aenderungen loesen echte Neuberechnung aus (zeigt die Engine in Aktion)

**Wichtig:** Die Investment-Engine-Komponenten (MasterGraph, Haushaltsrechnung, InvestmentSliderPanel, DetailTable40Jahre, FinanzierungSummary) werden als echte, funktionale Komponenten eingebunden -- nicht als Platzhalter. Der Slider ist im Demo-Modus bedienbar, damit der Nutzer die Engine live erleben kann.

### 4. Navigation / Routing

Keine Route-Aenderungen noetig. Die bestehende Route `/portal/projekte/:projectId/einheit/:unitId` in `ProjektePage.tsx` zeigt bereits `UnitDetailPage`. Die Demo-Erkennung erfolgt intern ueber `unitId.startsWith('demo-unit-')`.

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Aendern | `src/components/projekte/UnitPreislisteTable.tsx` |
| Aendern | `src/components/projekte/demoProjectData.ts` |
| Aendern | `src/pages/portal/projekte/UnitDetailPage.tsx` |

## Risiko

Niedrig. Die Investment-Engine-Komponenten werden mit statischen Demo-Daten gefuettert. `useInvestmentEngine()` wird mit festen Input-Werten aufgerufen. Keine DB-Aenderungen, keine neuen Routes.

