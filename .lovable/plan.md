

# Reparaturplan: MOD-08, MOD-09 und Kaufy SearchBar

Drei Probleme wurden identifiziert. Der Plan ist in drei Phasen unterteilt.

---

## Phase 1: MOD-09 Kalkulator Auto-Start unterbinden

**Problem:** Auf der `PartnerExposePage` (Beratungs-Expose) startet die Kalkulation automatisch, sobald das Listing geladen wird (Zeile 216-220: `useEffect` triggert `calculate()` wenn `purchasePrice > 0`). Das gleiche Verhalten existiert auch in MOD-08 (`InvestmentExposePage`).

**Loesung:** Den automatischen `useEffect`-Trigger entfernen und stattdessen einen expliziten "Berechnen"-Button einfuegen. Die Kalkulation startet erst, wenn der Nutzer bewusst klickt.

**Dateien:**
- `src/pages/portal/vertriebspartner/PartnerExposePage.tsx` — useEffect (Zeile 216-220) entfernen, Button "Jetzt berechnen" hinzufuegen, der `calculate(params)` aufruft
- `src/pages/portal/investments/InvestmentExposePage.tsx` — gleiche Aenderung fuer Konsistenz

**Details:**
- Der useEffect in Zeile 216-220 (`if (params.purchasePrice > 0) calculate(params)`) wird entfernt
- Ein neuer State `hasCalculated` wird eingefuehrt
- Ein prominenter Button "Jetzt berechnen" wird oberhalb des MasterGraph platziert
- Nach erstem Klick: Button aendert sich zu "Neu berechnen" und Ergebnisse bleiben sichtbar
- Slider-Aenderungen loesen KEINE automatische Neuberechnung aus

---

## Phase 2: Kaufy2026 SearchBar — Collapsible bleibt stabil

**Problem:** Wenn der Nutzer den erweiterten Bereich (Familienstand, Kirchensteuer) oeffnet und dort Werte aendert, scrollt die Seite nach unten und der Bereich wird unzugaenglich. Vermutlich verursacht durch:
1. Die SearchBar hat `position: relative` und liegt in einem `margin: -60px auto` Container
2. Beim Oeffnen/Schliessen des Collapsible aendert sich die Gesamthoehe, was den Browser-Scroll verschiebt

**Loesung:**
- Den SearchBar-Container mit `position: sticky` oder festem z-index versehen, damit er beim Scrollen sichtbar bleibt
- Dem `CollapsibleContent` eine CSS-Transition mit fester Hoehe geben statt `auto`
- `onOpenChange` mit `e.preventDefault()` auf Scroll-Events schuetzen

**Dateien:**
- `src/components/zone3/kaufy2026/Kaufy2026SearchBar.tsx` — Collapsible-Verhalten stabilisieren
- `src/components/zone3/kaufy2026/Kaufy2026Hero.tsx` — searchFloat-Container mit `position: sticky` und `top` versehen

**Details:**
- `heroStyles.searchFloat` erhaelt `position: 'sticky'`, `top: 16`, `zIndex: 50`
- Die Buttons innerhalb CollapsibleContent erhalten `onClick` mit `e.stopPropagation()` (bereits vorhanden, aber type="button" sicherstellen)
- Testen, ob der Scroll-Sprung durch Layout-Shift entsteht, und ggf. `min-height` auf den SearchBar-Wrapper setzen

---

## Phase 3: Katalog — Objektauswahl fuer Beratung

**Problem:** Im KatalogTab (MOD-09) fehlt eine UI-Moeglichkeit, Objekte fuer die Beratungsansicht ein- oder auszuschliessen. Der Hook `usePartnerSelections` existiert bereits (wird in BeratungTab genutzt), aber im Katalog gibt es keine Steuerung dafuer.

**Loesung:** Eine neue Spalte "Beratung" in der PropertyTable einfuegen mit einem Toggle (Eye/EyeOff Icon), mit dem der Partner Objekte fuer die Beratungsansicht aktivieren oder deaktivieren kann.

**Dateien:**
- `src/pages/portal/vertriebspartner/KatalogTab.tsx` — Neue Spalte mit Toggle-Button, `usePartnerSelections`-Hook einbinden
- `src/hooks/usePartnerListingSelections.ts` — Pruefen, ob write-Funktionen (toggle) vorhanden sind; ggf. ergaenzen

**Details:**
- Neue Spalte in `columns` Array: Key `beratung_visible`, Header "Beratung", mit Eye/EyeOff Button
- Klick auf den Button ruft `toggleSelection(listingId)` auf
- Visuelles Feedback: gruenes Eye = sichtbar in Beratung, graues EyeOff = ausgeblendet
- Daten aus `usePartnerSelections` werden als Set geladen und in der Spalte abgefragt

---

## Technische Zusammenfassung

| Phase | Datei | Aenderung |
|-------|-------|-----------|
| 1 | PartnerExposePage.tsx | Auto-calc useEffect entfernen, "Berechnen"-Button |
| 1 | InvestmentExposePage.tsx | Gleiche Aenderung |
| 2 | Kaufy2026SearchBar.tsx | Scroll-Stabilisierung |
| 2 | Kaufy2026Hero.tsx | Sticky-Positionierung |
| 3 | KatalogTab.tsx | Beratungs-Toggle-Spalte |
| 3 | usePartnerListingSelections.ts | Toggle-Funktion pruefen |

Alle Aenderungen betreffen MOD-08 (unfrozen) und MOD-09 (unfrozen). Keine frozen Module werden beruehrt.
