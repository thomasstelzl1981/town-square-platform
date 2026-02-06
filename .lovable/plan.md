

# MOD-12 AkquiseManager Erweiterungen

## Übersicht

Erweiterung des MOD-12 AkquiseManager um zwei kritische Funktionen:

1. **Eigene Mandate erstellen** — Manager können selbstständig Kunden akquirieren
2. **Tools-Seite** — Eigenständige Werkzeuge für Portal-Suche und Immobilienbewertung

---

## 1. Dashboard-Erweiterung: Eigene Mandate

### Aktueller Zustand
Das Dashboard zeigt nur:
- Pending Acceptance (zugewiesene Mandate)
- Aktive Mandate

### Neue Komponenten

**Neue Kachel "Eigenes Mandat erstellen"**
```text
┌────────────────────────────────────────────────────┐
│  📋 Dashboard                                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │  + Neues Mandat │  │  ⏱️ Warten auf Annahme  │ │
│  │    erstellen    │  │     (zugewiesen)        │ │
│  └─────────────────┘  └─────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  ✅ Aktive Mandate                            │ │
│  │     (bereits angenommen)                      │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  📋 Meine selbst erstellten Mandate          │ │
│  │     (eigene Akquise)                         │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Implementierung

1. **Erweiterung `AkquiseDashboard`:**
   - Neue Kachel-Karte für "Eigenes Mandat erstellen"
   - Bei Klick → Weiterleitung zu `MandatCreateWizardManager`
   - Neuer Query `useAcqMandatesCreatedByManager()` für selbst erstellte Mandate

2. **Neuer Query-Hook:**
   ```typescript
   // Mandate, die der Manager selbst erstellt hat (created_by_user_id = current user)
   export function useAcqMandatesCreatedByManager()
   ```

3. **Neuer Flow:**
   - Manager erstellt Mandat → Status = `draft`
   - Manager reicht ein → Status = `submitted_to_zone1`
   - Zone 1 kann dem gleichen Manager zuweisen → Status = `assigned`
   - Manager akzeptiert (Split-Gate) → Status = `active`

### Dateien

| Datei | Änderung |
|-------|----------|
| `src/pages/portal/AkquiseManagerPage.tsx` | Dashboard-Erweiterung mit 4. Sektion |
| `src/hooks/useAcqMandate.ts` | Neuer Hook `useAcqMandatesCreatedByManager` |
| `src/pages/portal/akquise-manager/MandatCreateWizardManager.tsx` | Kopie/Anpassung des MOD-08 Wizards |

---

## 2. Tools-Seite: Vollständige Implementierung

### Aktueller Zustand
Die `AkquiseTools` Komponente ist nur ein Placeholder:
```tsx
function AkquiseTools() {
  return <ModuleTilePage ... emptyTitle="Tools entdecken" />
}
```

### Neue Struktur

```text
┌─────────────────────────────────────────────────────────┐
│  🔧 Akquise-Tools                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │  🔍 PORTAL-RECHERCHE                                ││
│  │                                                     ││
│  │  ┌───────────────────────────────────────────────┐ ││
│  │  │  Portal: [ ImmoScout24 ▼ ]                    │ ││
│  │  │  Suche:  [ __________________ ]               │ ││
│  │  │  Region: [ Berlin ▼ ]  Preis: [ 500k - 2M ]   │ ││
│  │  │                                               │ ││
│  │  │  [ 🔎 Objekte suchen ]  [ 👥 Makler suchen ]  │ ││
│  │  └───────────────────────────────────────────────┘ ││
│  │                                                     ││
│  │  Ergebnisse:                                        ││
│  │  ┌─────────────────────────────────────────────────┐││
│  │  │ MFH Berlin Mitte | 1.2M € | 8 WE | [Details] │ ││
│  │  │ ETW München      | 450k € | 3 Zi | [Details] │ ││
│  │  └─────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │  🏠 IMMOBILIENBEWERTUNG                             ││
│  │                                                     ││
│  │  ┌───────────────────────────────────────────────┐ ││
│  │  │  Freitext-Suche:                              │ ││
│  │  │  [ MFH Berliner Allee 45, 10115 Berlin     ] │ ││
│  │  │                                               │ ││
│  │  │  [ 🧠 KI-Recherche starten ]                  │ ││
│  │  │  [ 📍 GeoMap-Analyse starten ]                │ ││
│  │  └───────────────────────────────────────────────┘ ││
│  │                                                     ││
│  │  Tabs: [ Standort | Markt | Risiken | Empfehlung ] ││
│  │                                                     ││
│  │  ┌─────────────────────────────────────────────────┐││
│  │  │  Standortbewertung: ⭐⭐⭐⭐⭐⭐⭐⭐ 8/10         ││
│  │  │                                                 ││
│  │  │  Makrolage: Berlin-Mitte ist einer der...      ││
│  │  │  Mikrolage: Gute ÖPNV-Anbindung, S-Bahn...     ││
│  │  │                                                 ││
│  │  │  Marktdaten:                                    ││
│  │  │  • Durchschnittsmiete: 14.50 €/m²              ││
│  │  │  • Kaufpreis-Niveau: 5.200 €/m²                ││
│  │  │  • Leerstandsquote: 0.8%                       ││
│  │  │  • Trend: ↗️ steigend                          ││
│  │  │                                                 ││
│  │  │  Risiko-Score: 3/10 (niedrig)                  ││
│  │  │  • Keine Hochwasserzone                        ││
│  │  │  • Geringe wirtschaftliche Abhängigkeit        ││
│  │  │                                                 ││
│  │  │  Investment-Empfehlung:                        ││
│  │  │  ✅ Geeignet für: Bestand + Aufteilung         ││
│  │  │  Stärken: Zentrale Lage, hohe Nachfrage        ││
│  │  │  Schwächen: Hoher Kaufpreis, Mietpreisbremse   ││
│  │  └─────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │  📊 QUICK-KALKULATOREN                              ││
│  │                                                     ││
│  │  [ Bestandskalkulation ]  [ Aufteilerkalkulation ] ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Komponenten

**1. PortalSearchTool**
- Dropdown für Portal-Auswahl (ImmoScout24, Immowelt, eBay-Kleinanzeigen)
- Freitext-Suche für Region/Keywords
- Filter: Preisspanne, Objektart
- Zwei Aktionen: "Objekte suchen" (→ Apify) + "Makler suchen" (→ Apify)
- Ergebnisliste mit Schnellaktionen

**2. PropertyResearchTool**
- Freitext-Eingabe für Adresse/Objekt
- Buttons: "KI-Recherche starten" + "GeoMap-Analyse"
- Ergebnis-Tabs:
  - Standort (Location Score, Makro-/Mikrolage)
  - Markt (Mietpreis, Kaufpreis, Trend)
  - Risiken (Flood Zone, Noise, Economic)
  - Empfehlung (Strategie, Stärken/Schwächen)

**3. QuickCalcTool**
- Vereinfachte Rechner (analog AnalysisTab)
- Bestandskalkulation: Eingabe → Rendite, Cash-Flow
- Aufteilerkalkulation: Eingabe → Gewinn, ROI

### Edge Functions

Bereits vorhanden und nutzbar:
- `sot-apify-portal-job` — Portal-Scraping
- `sot-acq-ai-research` — KI-Immobilienanalyse
- `sot-geomap-snapshot` — Standort-KPIs

**Neu zu erstellen:**
- `sot-acq-standalone-research` — KI-Recherche ohne Offer-Kontext (für Tools-Seite)

### Hooks

**Neue Hooks für Tools:**
```typescript
// src/hooks/useAcqTools.ts

// Standalone KI-Recherche (nicht an Offer gebunden)
export function useStandaloneAIResearch()

// Standalone GeoMap (nicht an Offer gebunden)
export function useStandaloneGeoMap()

// Portal-Suche starten
export function usePortalSearch()
```

---

## 3. Technische Details

### Neue/Geänderte Dateien

```text
src/pages/portal/AkquiseManagerPage.tsx
├── AkquiseDashboard (erweitert)
│   ├── Neue Kachel "Eigenes Mandat erstellen"
│   └── Neue Sektion "Meine selbst erstellten Mandate"
├── AkquiseTools (neu implementiert)
│   ├── PortalSearchTool
│   ├── PropertyResearchTool
│   └── QuickCalcTool
└── Route für MandatCreateWizardManager

src/pages/portal/akquise-manager/
├── MandatCreateWizardManager.tsx (NEU)
└── components/
    ├── PortalSearchTool.tsx (NEU)
    ├── PropertyResearchTool.tsx (NEU)
    └── QuickCalcTool.tsx (NEU)

src/hooks/
├── useAcqMandate.ts (erweitert)
│   └── useAcqMandatesCreatedByManager()
└── useAcqTools.ts (NEU)
    ├── useStandaloneAIResearch()
    ├── useStandaloneGeoMap()
    └── usePortalSearch()

supabase/functions/
└── sot-acq-standalone-research/ (NEU)
    └── index.ts
```

### Datenbank

**Keine neuen Tabellen erforderlich.**

Die Standalone-Recherchen können:
- Temporär im State gehalten werden (kein DB-Eintrag)
- Optional in `acq_analysis_runs` gespeichert werden (mit `offer_id = null`)

### RLS-Erweiterung

Die bestehenden RLS-Policies decken bereits ab:
- Manager kann eigene Mandate erstellen (`created_by_user_id = auth.uid()`)
- Manager sieht nur zugewiesene Mandate (`assigned_manager_user_id = auth.uid()`)

---

## 4. Implementierungs-Reihenfolge

### Phase A: Dashboard-Erweiterung (Prio 1)
1. Hook `useAcqMandatesCreatedByManager` erstellen
2. `AkquiseDashboard` erweitern mit neuer Kachel + Sektion
3. `MandatCreateWizardManager` erstellen (Kopie/Anpassung von MOD-08)
4. Route hinzufügen: `/portal/akquise-manager/mandat-erstellen`

### Phase B: Tools — Portal-Recherche (Prio 1)
1. `PortalSearchTool` Komponente erstellen
2. Integration mit `sot-apify-portal-job`
3. Ergebnis-Anzeige mit Schnellaktionen

### Phase C: Tools — Immobilienbewertung (Prio 1)
1. `sot-acq-standalone-research` Edge Function erstellen
2. `PropertyResearchTool` Komponente erstellen
3. Integration mit KI + GeoMap
4. Tabs für strukturierte Ergebnis-Darstellung

### Phase D: Tools — Quick-Kalkulatoren (Prio 2)
1. `QuickCalcTool` Komponente erstellen
2. Vereinfachte Bestandskalkulation
3. Vereinfachte Aufteilerkalkulation

---

## 5. UI/UX Details

### Portal-Recherche

| Feld | Typ | Optionen |
|------|-----|----------|
| Portal | Select | ImmoScout24, Immowelt, eBay-Kleinanzeigen |
| Suchbegriff | Text | Freitext |
| Region | Text/Select | Freitext oder Dropdown |
| Preis min | Number | EUR |
| Preis max | Number | EUR |
| Objektart | Multi-Select | MFH, ETW, ZFH, Gewerblich |

**Aktionen:**
- "Objekte suchen" → `sot-apify-portal-job` mit `searchType: 'listings'`
- "Makler suchen" → `sot-apify-portal-job` mit `searchType: 'brokers'`

### Immobilienbewertung

**Eingabe:**
- Freitext-Feld für Adresse/Objekt-Beschreibung
- Beispiel: "MFH Berliner Allee 45, 10115 Berlin, 8 WE, Baujahr 1965"

**Ausgabe-Tabs:**

1. **Standort**
   - Location Score (1-10) mit Visualisierung
   - Makrolage (Region, Wirtschaft, Demografie)
   - Mikrolage (Infrastruktur, ÖPNV, Schulen)

2. **Markt**
   - Durchschnittsmiete €/m²
   - Durchschnittspreis €/m²
   - Leerstandsquote
   - Preistrend (steigend/stabil/fallend)

3. **Risiken**
   - Risiko-Score (1-10)
   - Flood Zone
   - Lärmbelastung
   - Wirtschaftliche Abhängigkeit

4. **Empfehlung**
   - Geeignete Strategie (Bestand/Aufteilung)
   - Stärken (Bullet-Liste)
   - Schwächen (Bullet-Liste)
   - Handlungsempfehlung

---

## 6. Acceptance Criteria

| # | Szenario | Erwartung |
|---|----------|-----------|
| A | Manager öffnet Dashboard | Sieht Kachel "Eigenes Mandat erstellen" |
| B | Manager klickt auf Kachel | Wizard öffnet sich |
| C | Manager erstellt Mandat | Status = draft, sichtbar in "Meine Mandate" |
| D | Manager reicht Mandat ein | Status = submitted_to_zone1 |
| E | Manager öffnet Tools | Sieht Portal-Recherche + Bewertungstool |
| F | Manager sucht nach Objekten | Apify wird aufgerufen, Ergebnisse angezeigt |
| G | Manager gibt Adresse ein | KI-Recherche + GeoMap liefern strukturierte Ergebnisse |
| H | Manager nutzt Quick-Calc | Rendite/ROI wird berechnet |

