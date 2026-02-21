

# Plan: Kalkulator-Fix — Kaufy (Zone 3) und MOD-09 PartnerExposePage

## Analyse

Der InvestmentSliderPanel (Kalkulator fuer Zins, Tilgung, Eigenkapital) ist an 4 Stellen im Einsatz:

| Seite | Sticky Desktop | Mobile Slider | Status |
|---|---|---|---|
| MOD-08 InvestmentExposePage | sticky top-20 + isMobile-Fallback | Ja (inline) | OK |
| MOD-09 PartnerExposePage | sticky top-20, aber `hidden lg:block` | Nein — komplett unsichtbar | FEHLT |
| Zone 3 Kaufy2026Expose | sticky top-24, aber `hidden lg:block` | Nein — komplett unsichtbar | FEHLT |
| MOD-09 PartnerExposeModal | In ScrollArea-Sidebar | N/A (Modal) | OK |

### Problem 1: Kein Kalkulator auf Mobile (Kaufy + MOD-09)

Auf Bildschirmen unter `lg` (1024px) ist der Kalkulator komplett ausgeblendet (`hidden lg:block`). Der User kann Zins, Tilgung und Eigenkapital nicht aendern. MOD-08 loest das korrekt mit einer `isMobile`-Abfrage und zeigt den Slider inline an.

### Problem 2: Kein konsistentes sticky-Verhalten

- MOD-08: `sticky top-20`
- MOD-09: `sticky top-20`
- Kaufy: `sticky top-24`

Kaufy hat `top-24` wegen des eigenen Headers (sticky top-0, ca. 64px). Das ist korrekt. MOD-08/09 nutzen `top-20` fuer den Portal-Header. Das passt ebenfalls.

Das Sticky funktioniert technisch — es liegt kein CSS-Bug vor. Das Problem ist ausschliesslich, dass auf Mobile der Slider gar nicht gerendert wird.

---

## Loesung

### Kaufy2026Expose.tsx (Zone 3)

Das gleiche Pattern wie MOD-08 einbauen:

1. `useIsMobile()` Hook importieren
2. Vor dem Grid: Mobile-Slider inline rendern (ohne sticky, ohne hidden)
3. Desktop: bestehender `hidden lg:block` mit sticky bleibt

Position des Mobile-Sliders: **Nach der Bildergalerie und den Key Facts, vor MasterGraph** — damit der User zuerst das Objekt sieht, dann die Parameter anpasst, und darunter die Ergebnisse live aktualisiert werden.

### PartnerExposePage.tsx (MOD-09)

Identische Aenderung:

1. `useIsMobile()` Hook importieren
2. Mobile-Slider inline rendern
3. Desktop: bestehender sticky-Block bleibt

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/zone3/kaufy2026/Kaufy2026Expose.tsx` | useIsMobile + Mobile-Slider-Block hinzufuegen |
| `src/pages/portal/vertriebspartner/PartnerExposePage.tsx` | useIsMobile + Mobile-Slider-Block hinzufuegen (MOD-09) |

Keine DB-Aenderung. Keine neue Datei. Kein Engine-Change. MOD-09 ist bereits UNFROZEN. Kaufy liegt in Zone 3 (kein Freeze).

