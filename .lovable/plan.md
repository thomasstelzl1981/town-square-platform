# Plan: MOD-09 Beratung — Engine-Refaktorierung

## Status: ✅ ABGESCHLOSSEN

---

## Durchgeführte Änderungen

### 1. BeratungTab komplett neu geschrieben
- **Gelöscht:** HowItWorks, QuickActions, Portfolio-Übersicht, Objekt/Kunde-Dropdowns, Beratungsmaterialien
- **Neu:** Kompakte Eingabemaske (zVE, EK, Güterstand, Kirche) + Property-Grid mit Live-Metrics

### 2. Neue Komponenten erstellt
| Komponente | Datei | Funktion |
|------------|-------|----------|
| `PartnerSearchForm` | `src/components/vertriebspartner/PartnerSearchForm.tsx` | Kompakte Eingabemaske |
| `PartnerPropertyGrid` | `src/components/vertriebspartner/PartnerPropertyGrid.tsx` | Objekt-Kacheln mit Metrics |
| `PartnerExposeModal` | `src/components/vertriebspartner/PartnerExposeModal.tsx` | Interaktives Exposé mit Reglern |

### 3. Katalog-Logik invertiert
- **Alt:** ♥ = Objekt auswählen (Opt-In)
- **Neu:** ♥ = Objekt ausblenden (Opt-Out)
- Alle Objekte sind standardmäßig sichtbar
- Hook `useToggleExclusion` ersetzt `useToggleSelection`

### 4. Dateien geändert
- `src/pages/portal/vertriebspartner/BeratungTab.tsx` — Kompletter Rewrite
- `src/pages/portal/vertriebspartner/KatalogTab.tsx` — ♥-Logik invertiert
- `src/hooks/usePartnerListingSelections.ts` — Exclusion statt Selection
- `src/components/vertriebspartner/index.ts` — Neue Exports

---

## Ergebnis

✅ **Beratung ist jetzt identisch mit Zone 3 Kaufy** im Look & Feel
✅ **Eine zentrale Engine** für alle Berechnungen (useInvestmentEngine)
✅ **Kein Dropdown-Auswählen** — direkte Kachel-Ansicht
✅ **Interaktive Simulation** vor den Augen des Kunden (Modal mit Slidern)
✅ **Partner sieht standardmäßig ALLE Objekte** (opt-out statt opt-in)
