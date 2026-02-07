
# Plan: MOD-09 Beratung — Engine-Refaktorierung

## Zusammenfassung

Das Beratungsmodul wird komplett auf den "Geldmaschinen-Flow" umgestellt, der bereits in Zone 3 (Kaufy) implementiert ist. Dieser Flow ist das Kerngeschäft und muss identisch in MOD-08 (Investor), MOD-09 (Beratung) und Zone 3 (Marktplatz) funktionieren.

---

## Ist-Zustand Probleme

| Problem | Beschreibung |
|---------|--------------|
| Doppelte UI | `HowItWorks` + `QuickActions` + "Beratungsmaterialien"-Card zeigen alle dasselbe |
| Portfolio-Übersicht | Nimmt Platz weg, gehört nicht in den Beratungsflow |
| Objekt/Kunde-Dropdowns | Unterbrechen den Flow, gehören nicht hierher |
| Falsche Katalog-Logik | ♥ bedeutet aktuell "anwählen" — sollte "abwählen" bedeuten |
| InvestmentCalculator | Ist ein Block am Ende statt interaktives Exposé-Layout |

---

## Soll-Zustand: Der "Geldmaschinen-Flow"

```text
┌─────────────────────────────────────────────────────────────────┐
│ BERATUNGS-TAB (NEU)                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ EINGABEZEILE (compact)                                      ││
│  │ [zVE: ___€] [Eigenkapital: ___€] [Güterstand ▼] [Kirche ▢]  ││
│  │                                            [Suche starten]  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ OBJEKT-    │  │ OBJEKT-    │  │ OBJEKT-    │ ...            │
│  │ KACHEL     │  │ KACHEL     │  │ KACHEL     │                │
│  │            │  │            │  │            │                │
│  │ [Bild]     │  │ [Bild]     │  │ [Bild]     │                │
│  │ Preis/m²   │  │ Preis/m²   │  │ Preis/m²   │                │
│  │ ───────────│  │ ───────────│  │ ───────────│                │
│  │ Cashflow   │  │ Cashflow   │  │ Cashflow   │                │
│  │ Steuervort.│  │ Steuervort.│  │ Steuervort.│                │
│  │ ═══════════│  │ ═══════════│  │ ═══════════│                │
│  │ NETTO-BEL. │  │ NETTO-BEL. │  │ NETTO-BEL. │                │
│  └────────────┘  └────────────┘  └────────────┘                │
│                                                                 │
│  [Klick auf Kachel → öffnet Objekt-Detail-Modal/Page]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ OBJEKT-DETAIL (Modal oder eigene Route)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────┐  ┌───────────────────────────┐ │
│  │ HAUPTBEREICH (2/3)          │  │ SIDEBAR (1/3)             │ │
│  │                             │  │                           │ │
│  │ ┌─────────────────────────┐ │  │ ┌───────────────────────┐ │ │
│  │ │ 40-JAHRES-GRAFIK        │ │  │ │ INVESTMENT-REGLER     │ │ │
│  │ │ (Wert, Vermögen, Schuld)│ │  │ │                       │ │ │
│  │ └─────────────────────────┘ │  │ │ [zVE Slider]          │ │ │
│  │                             │  │ │ [Eigenkapital Slider] │ │ │
│  │ ┌─────────────────────────┐ │  │ │ [Zinssatz Slider]     │ │ │
│  │ │ HAUSHALTSRECHNUNG       │ │  │ │ [Tilgung Slider]      │ │ │
│  │ │ (Einnahmen/Ausgaben)    │ │  │ │ [Wertsteigerung]      │ │ │
│  │ │ ──────────────────────  │ │  │ │                       │ │ │
│  │ │ + Miete                 │ │  │ │ ═══════════════════   │ │ │
│  │ │ - Zins                  │ │  │ │ Monatsbelastung:      │ │ │
│  │ │ - Tilgung               │ │  │ │ [GROSS: XX €]         │ │ │
│  │ │ - Verwaltung            │ │  │ └───────────────────────┘ │ │
│  │ │ = Cashflow              │ │  │                           │ │
│  │ │ + Steuervorteil         │ │  │ ┌───────────────────────┐ │ │
│  │ │ ════════════════════    │ │  │ │ AKTIONEN              │ │ │
│  │ │ NETTO-BELASTUNG         │ │  │ │ [PDF Export]          │ │ │
│  │ └─────────────────────────┘ │  │ │ [Deal starten]        │ │ │
│  │                             │  │ │ [Kunden zuordnen]     │ │ │
│  │ ┌─────────────────────────┐ │  │ └───────────────────────┘ │ │
│  │ │ 40-JAHRES-DETAILTABELLE │ │  │                           │ │
│  │ │ (Excel-Style)           │ │  └───────────────────────────┘ │
│  │ │ Jahr | Miete | Zins...  │ │                                │
│  │ └─────────────────────────┘ │                                │
│  └─────────────────────────────┘                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technische Umsetzung

### Phase 1: BeratungTab bereinigen

**Zu löschen:**
- `HowItWorks` Import und Verwendung (Zeile 24, 115)
- `QuickActions` Import und Verwendung (Zeile 24, 118)
- "Portfolio-Übersicht" Card (Zeile 120-191)
- "Objekt auswählen" Card (Zeile 194-236)
- "Kunde auswählen" Card (Zeile 238-275)
- "Beratungsmaterialien" Card (Zeile 277-309)
- Alter `InvestmentCalculator` (Zeile 311-318)

### Phase 2: Neues Layout implementieren

**Zu erstellen/wiederverwenden:**

1. **InvestmentSearchForm** (compact)
   - Felder: zVE, Eigenkapital, Güterstand (Select), Kirchensteuer (Switch)
   - Wiederverwendbar: `src/pages/portal/investments/SucheTab.tsx` Zeile 250-330

2. **PartnerPropertyGrid**
   - Zeigt alle `sale_enabled` Listings als Kacheln
   - Wiederverwendbar: `KaufyPropertyCard` aus Zone 3
   - Berechnet Metrics über `useInvestmentEngine`

3. **PartnerExposeModal** (oder Route)
   - Wiederverwendbar: Layout von `KaufyExpose.tsx`
   - Komponenten:
     - `MasterGraph` (40-Jahres-Chart)
     - `Haushaltsrechnung` (Einnahmen/Ausgaben)
     - `InvestmentSliderPanel` (Regler)
     - `DetailTable40Jahre` (Excel-Tabelle)
   - Zusätzlich: Aktionsleiste (PDF, Deal, Kunde)

### Phase 3: Katalog-Logik anpassen

**Aktuell (falsch):**
- ♥ = Objekt in Auswahl hinzufügen
- Beratung zeigt nur ♥-Objekte

**Neu (richtig):**
- Alle `sale_enabled` Objekte sind standardmäßig sichtbar
- ♥ = Objekt ABWÄHLEN (ausblenden für diesen Partner)
- Optional: Filter "Nur nicht-ausgeblendete anzeigen"

### Phase 4: Wiederverwendbare Engine

Die Engine-Komponenten existieren bereits in `src/components/investment/`:
- `MasterGraph.tsx` — 40-Jahres-Vermögensverlauf
- `Haushaltsrechnung.tsx` — Einnahmen/Ausgaben
- `InvestmentSliderPanel.tsx` — Interaktive Regler
- `DetailTable40Jahre.tsx` — Excel-Tabelle
- `InvestmentSearchCard.tsx` — Property-Kachel

Diese werden in allen 3 Kontexten verwendet:
- Zone 3 Kaufy (öffentlich)
- MOD-08 Investment-Suche (Investor)
- MOD-09 Beratung (Partner)

---

## Dateien-Änderungen

### Zu ändern:

| Datei | Änderung |
|-------|----------|
| `src/pages/portal/vertriebspartner/BeratungTab.tsx` | Kompletter Rewrite |
| `src/pages/portal/vertriebspartner/KatalogTab.tsx` | ♥-Logik invertieren (Abwahl statt Auswahl) |
| `src/hooks/usePartnerListingSelections.ts` | Logic für "excluded" statt "selected" |

### Wiederzuverwendende Komponenten:

| Komponente | Quelle | Verwendung |
|------------|--------|------------|
| `KaufyPropertyCard` | `src/components/zone3/kaufy/` | Objektkacheln in Beratung |
| `MasterGraph` | `src/components/investment/` | Exposé-Detail |
| `Haushaltsrechnung` | `src/components/investment/` | Exposé-Detail |
| `InvestmentSliderPanel` | `src/components/investment/` | Exposé-Detail |
| `DetailTable40Jahre` | `src/components/investment/` | Exposé-Detail |

### Neue Dateien:

| Datei | Zweck |
|-------|-------|
| `src/components/vertriebspartner/PartnerSearchForm.tsx` | Kompakte Eingabemaske (zVE, EK, Status, Kirche) |
| `src/components/vertriebspartner/PartnerPropertyGrid.tsx` | Grid aus Property-Kacheln mit Metrics |
| `src/pages/portal/vertriebspartner/BeratungExposeDetail.tsx` | Exposé-Detailansicht mit Reglern |

---

## UI-Prinzipien (FROZEN)

1. **Eingabe zuerst:** zVE + Eigenkapital + Güterstand + Kirche
2. **Kacheln mit Mini-Metrics:** Bild, Facts, Cashflow, Steuervorteil, Netto-Belastung
3. **Interaktives Exposé:** Grafik, Haushaltsrechnung, Regler, Excel-Tabelle
4. **Slider-Updates live:** Jede Änderung berechnet sofort neu
5. **Keine doppelten UI-Elemente:** Eine "How-it-Works" ist genug (oder gar keine)

---

## Prioritäten

| Prio | Aufgabe | Aufwand |
|------|---------|---------|
| P0 | BeratungTab bereinigen (überflüssige Kacheln löschen) | 30min |
| P0 | Eingabemaske oben platzieren | 30min |
| P0 | Property-Kacheln mit Metrics anzeigen | 1h |
| P1 | Exposé-Detail mit Reglern implementieren | 2h |
| P1 | Katalog ♥-Logik invertieren | 1h |
| P2 | PDF-Export implementieren | 1h |
| P2 | Deal-Start + Kunden-Zuordnung | 1h |

**Geschätzter Gesamtaufwand: 6-8 Stunden**

---

## Ergebnis

Nach Umsetzung:
- **Beratung ist identisch mit Zone 3 Kaufy** im Look & Feel
- **Eine zentrale Engine** für alle Berechnungen
- **Kein Dropdown-Auswählen** — direkte Kachel-Ansicht
- **Interaktive Simulation** vor den Augen des Kunden
- **Partner sieht standardmäßig ALLE Objekte** (opt-out statt opt-in)
