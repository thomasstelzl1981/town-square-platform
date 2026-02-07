
# Investment Engine UX Fix — Einheitliche Exposé-Seite

## Problemanalyse

### Identifizierte Fehler (Screenshots vs. aktueller Stand)

| # | Problem | Root Cause | Auswirkung |
|---|---------|------------|------------|
| 1 | **Fehlende Exposé-Seite** | MOD-08 hat keine `objekt/:publicId` Route | Klick auf "Details" führt zu `/kaufy/expose` (Zone 3) |
| 2 | **Falscher Link-Prefix** | `InvestmentSearchCard` verlinkt auf `/kaufy/expose` statt Portal-Route | User verlässt Portal |
| 3 | **Provision überall sichtbar** | `showProvision` nicht kontextabhängig gesteuert | Soll nur in MOD-09 Katalog angezeigt werden |
| 4 | **Modal statt Seite** | `PartnerExposeModal` ist überladen | Zu viele Kacheln, nicht "clean" |
| 5 | **Inkonsistente Mini-EÜR** | Unterschiedliche Berechnungsdarstellung | Keine einheitliche "Geldmaschinen"-UX |

### Referenz: Was gut funktioniert (Screenshots)

**Zone 3 KaufyExpose** (Screenshot 6-8) zeigt das richtige Layout:
- **Header:** Breadcrumb, Titel, Preis, Key Facts (m², Einheiten, Baujahr)
- **"Ihre monatliche Übersicht":** 5-Zeilen-Box (Mieteinnahme, Darlehensrate, Bewirtschaftung, Steuereffekt, Netto)
- **Kalkulation-Tab:** Slider für zVE, EK, Tilgung + 4 Kennzahlen-Blöcke
- **5-Box Cashflow-Darstellung:** Miete (grün), Rate (rot), Verw. (rot), Steuer (grün), Netto (rot/grün)
- **10-Jahres-Projektion:** Restschuld, Objektwert, Wertzuwachs, Eigenkapitalaufbau

---

## Lösung: Einheitliche Portal-Exposé-Seite

### Phase 1: Neue Exposé-Seite für MOD-08 (P0)

**Neue Datei:** `src/pages/portal/investments/InvestmentExposePage.tsx`

Diese Seite ist eine **Vollbild-Seite** (kein Modal!) und nutzt das bewährte Zone-3-Layout:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ← Zurück zur Suche                                    [Favorit ♡] [Finanzierung]│
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────┐  ┌───────────────────────────────────────┐│
│  │ [Bildergalerie / Platzhalter]    │  │ 📍 Leipzig · 04103                    ││
│  │                                  │  │ Leipziger Straße 42                   ││
│  │                                  │  │ 145.000 €                             ││
│  │                                  │  │                                       ││
│  └──────────────────────────────────┘  │ ┌─────────┐ ┌─────────┐ ┌─────────┐  ││
│                                        │ │ 62 m²   │ │ 1       │ │ 1970    │  ││
│                                        │ │Wohnfläche│ │Einheiten│ │ Baujahr │  ││
│                                        │ └─────────┘ └─────────┘ └─────────┘  ││
│                                        │                                       ││
│                                        │ ┌───────────────────────────────────┐ ││
│                                        │ │ Ihre monatliche Übersicht         │ ││
│                                        │ ├───────────────────────────────────┤ ││
│                                        │ │ Mieteinnahme           +500 €     │ ││
│                                        │ │ Darlehensrate          −565 €     │ ││
│                                        │ │ Bewirtschaftung        −179 €     │ ││
│                                        │ │ Steuereffekt           +112 €     │ ││
│                                        │ ├───────────────────────────────────┤ ││
│                                        │ │ Netto nach Steuer      −132 €     │ ││
│                                        │ └───────────────────────────────────┘ ││
│                                        │                                       ││
│                                        │ [Beratung anfragen]    [✉]            ││
│                                        └───────────────────────────────────────┘│
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  [Kalkulation]   [Exposé]   [Dokumente]                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ Ihre Finanzdaten                                                            ││
│  │ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐ ┌────────────────────┐ ││
│  │ │ zVE: 80.000€ │ │ EK: 50.000€  │ │ Steuertabelle  │ │ Tilgung: 2%  [══●] │ ││
│  │ └──────────────┘ └──────────────┘ └────────────────┘ └────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌────────────────────────────────┐  ┌────────────────────────────────────────┐ │
│  │ € Transaktion                  │  │ ∿ Mieteinnahmen                        │ │
│  │ Kaufpreis         150.000 €    │  │ Jahresnettokaltmiete   6.000 €         │ │
│  │ Kaufpreis/m²        1.043 €    │  │ Monatsmiete              500 €         │ │
│  │ Erwerbsnebenkosten 15.000 €    │  │ Miete/m²               3.48 €/m²       │ │
│  │ Kaufpreis inkl. NK 165.000 €   │  │                                        │ │
│  └────────────────────────────────┘  └────────────────────────────────────────┘ │
│                                                                                  │
│  ┌────────────────────────────────┐  ┌────────────────────────────────────────┐ │
│  │ % Rendite-Kennzahlen           │  │ 🏦 Finanzierung                        │ │
│  │ Brutto-Mietrendite    4.00%    │  │ Darlehen          115.000 €            │ │
│  │ Netto-Ankaufsrendite  3.64%    │  │ Eigenkapital       50.000 €            │ │
│  │ Brutto-Faktor        25.0-fach │  │ LTV                  76.7%             │ │
│  │ Netto-Faktor         27.5-fach │  │ Zinssatz             3.90%             │ │
│  │                                │  │ Tilgung              2.0%              │ │
│  │                                │  │ Rate/Monat          565 €              │ │
│  └────────────────────────────────┘  └────────────────────────────────────────┘ │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ □ Monatlicher Cashflow nach Steuern                                         ││
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────────────┐ ││
│  │ │ +500 €  │ │ −565 €  │ │ −179 €  │ │ +112 €  │ │       −132 €           │ ││
│  │ │ Miete   │ │  Rate   │ │  Verw.  │ │ Steuer  │ │    Netto/Monat         │ ││
│  │ │ (grün)  │ │  (rot)  │ │  (rot)  │ │ (grün)  │ │      (rot)             │ ││
│  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ Entwicklung nach 10 Jahren            Wertsteigerung p.a.: [2 ▼] %          ││
│  │ Restschuld: 92.000 €  Objektwert: 182.849 €  Wertzuwachs: +32.849 €         ││
│  │ Eigenkapitalaufbau: +55.849 €                                               ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 2: Route-Registrierung (P0)

**Datei:** `src/manifests/routesManifest.ts`

```typescript
// MOD-08: Investment-Suche
"MOD-08": {
  // ... existing
  dynamic_routes: [
    { path: "mandat/neu", component: "MandatCreateWizard", title: "Neues Mandat" },
    { path: "mandat/:mandateId", component: "MandatDetail", title: "Mandat-Details", dynamic: true },
    // NEU:
    { path: "objekt/:publicId", component: "InvestmentExposePage", title: "Investment-Exposé", dynamic: true },
  ],
},
```

**Datei:** `src/pages/portal/InvestmentsPage.tsx`

```typescript
import InvestmentExposePage from './investments/InvestmentExposePage';

<Routes>
  // ... existing routes
  <Route path="objekt/:publicId" element={<InvestmentExposePage />} />
</Routes>
```

---

### Phase 3: InvestmentSearchCard Link-Fix (P0)

**Datei:** `src/components/investment/InvestmentSearchCard.tsx`

**Änderungen:**
1. Standardmäßig `linkPrefix="/portal/investments/objekt"` statt `/kaufy/expose`
2. `showProvision={false}` als Default (wird nur in MOD-09 Katalog explizit aktiviert)

```typescript
// Zeile 47-48
export function InvestmentSearchCard({
  // ...
  showProvision = false,  // Default: keine Provision anzeigen
  linkPrefix = '/portal/investments/objekt'  // Default: Portal-Route
}: InvestmentSearchCardProps) {
```

---

### Phase 4: Kontextabhängige Nutzung (P1)

| Modul | Route | `linkPrefix` | `showProvision` |
|-------|-------|--------------|-----------------|
| **MOD-08 Suche** | `/portal/investments/suche` | `/portal/investments/objekt` | `false` |
| **MOD-09 Katalog** | `/portal/vertriebspartner/katalog` | `/portal/investments/objekt` | `true` |
| **MOD-09 Beratung** | `/portal/vertriebspartner/beratung` | Modal (PartnerExposeModal) | `true` (im Modal) |
| **Zone 3 Kaufy** | `/kaufy/immobilien` | `/kaufy/objekt` | `false` |

---

### Phase 5: BeratungTab Modal-Vereinfachung (P2)

Das `PartnerExposeModal` bleibt für die schnelle Beratung, aber:
- Entfernung überflüssiger Tabs
- Fokus auf Slider + Haushaltsrechnung + Monatsbelastung
- Option: "Vollbild öffnen" → Navigiert zu `/portal/investments/objekt/:id`

---

## Datei-Änderungen Übersicht

| Datei | Aktion | Priorität |
|-------|--------|-----------|
| `src/pages/portal/investments/InvestmentExposePage.tsx` | **NEU** erstellen | **P0** |
| `src/pages/portal/InvestmentsPage.tsx` | Route hinzufügen | **P0** |
| `src/manifests/routesManifest.ts` | dynamic_route hinzufügen | **P0** |
| `src/components/investment/InvestmentSearchCard.tsx` | Default linkPrefix + showProvision ändern | **P0** |
| `src/pages/portal/investments/SucheTab.tsx` | Explizit `linkPrefix` setzen | P1 |
| `src/pages/portal/vertriebspartner/KatalogTab.tsx` | `showProvision={true}` | P1 |
| `src/components/vertriebspartner/PartnerExposeModal.tsx` | Vereinfachung (optional) | P2 |

---

## Erwartetes Ergebnis

| Test | Route | Erwartetes Ergebnis |
|------|-------|---------------------|
| 1 | `/portal/investments/suche` → Klick "Details" | Navigiert zu `/portal/investments/objekt/:id` (Vollbild-Exposé) |
| 2 | Investment-Exposé-Seite | Layout wie Screenshot 6-8: Header, Key Facts, Monatliche Übersicht, Tabs |
| 3 | Provision in MOD-08 | **Nicht sichtbar** |
| 4 | Provision in MOD-09 Katalog | **Sichtbar** (Badge) |
| 5 | Provision in MOD-09 Beratung | Sichtbar im Modal |
| 6 | MOD-09 Beratung Modal | Funktioniert weiterhin, aber cleaner |

---

## Technische Details

### Warum Vollbild-Seite statt Modal?

1. **Bessere UX:** Screenshots zeigen klares, ruhiges Layout
2. **Keine Überlagerung:** Modal in Modal = "zu viele Kacheln"
3. **Tiefe Verlinkung:** User kann URL teilen/bookmarken
4. **Konsistenz:** Zone 3 nutzt auch Vollbild-Seite

### Komponenten-Wiederverwendung

Die neue `InvestmentExposePage` nutzt existierende Komponenten:
- `MasterGraph` — 40-Jahres-Chart
- `Haushaltsrechnung` — 5-Zeilen EÜR
- `InvestmentSliderPanel` — Parameter-Regler
- `DetailTable40Jahre` — Excel-ähnliche Tabelle
- `CashflowBoxes` (neu) — 5-Box-Darstellung

### Datenfluss

```text
SucheTab → InvestmentSearchCard → Link
              ↓
    /portal/investments/objekt/:publicId
              ↓
    InvestmentExposePage
              ↓
    useQuery(listings.public_id)
              ↓
    useInvestmentEngine(params)
              ↓
    Render: Header + Tabs + Chart + EÜR + Table
```

---

## Reihenfolge der Umsetzung

1. **Schritt 1 (20 min):** `InvestmentExposePage.tsx` erstellen (Kopie von KaufyExpose mit Portal-Anpassungen)
2. **Schritt 2 (5 min):** Route in Manifest + Page registrieren
3. **Schritt 3 (5 min):** `InvestmentSearchCard` Defaults korrigieren
4. **Schritt 4 (5 min):** `SucheTab` explizit `linkPrefix` setzen
5. **Schritt 5 (5 min):** `KatalogTab` explizit `showProvision={true}` setzen
6. **Test:** Klick-Flow in MOD-08 und MOD-09 durchgehen
