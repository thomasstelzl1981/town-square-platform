
# Kalkulator-Fix: Berechnungslogik + Layout + Demo-Editing

## Gefundene Bugs

### Bug 1: Demo-Modus blockiert Bearbeitung
In `UnitPreislisteTable.tsx`:
- Zeile 126: `opacity-40 select-none` auf der ganzen Tabelle
- Zeile 150: `canEdit = !isDemo || isFirstDemo` — nur Zeile 1 editierbar
- Zeile 159: `pointer-events-none` auf allen anderen Zeilen

**Fix:** Im Demo-Modus die Tabelle trotzdem editierbar machen. Die Opacity und pointer-events-Einschraenkungen entfernen, damit alle Zeilen bearbeitet werden koennen.

### Bug 2: targetYield-Slider hat keine Wirkung
Der Slider aendert den State `targetYield`, aber dieser Wert wird nirgends in der Berechnung verwendet. Die angezeigte Rendite (`effective_yield`) wird immer rueckwaerts aus dem Preis berechnet (Zeile 100).

**Fix:** targetYield wird als Anzeige-KPI im Kalkulator verwendet. Die tatsaechliche Rendite pro Einheit bleibt rueckgerechnet aus dem Preis. Der Kalkulator zeigt beides: die Zielrendite (Slider) und die tatsaechliche Durchschnittsrendite (berechnet). So sieht der Nutzer die Abweichung.

### Bug 3: Layout falsch
Kalkulator steht neben der Objektbeschreibung (grid-cols-5, 3+2). Soll unter die Preisliste, volle Breite, aber der Kalkulator nur 1/3 davon.

---

## Aenderungen

### 1. PortfolioTab.tsx — Layout-Umbau

Neue Reihenfolge:
```text
1. Header + Projekt-Select
2. Objektbeschreibung (volle Breite)
3. Preisliste (volle Breite)
4. Kalkulator-Zeile (volle Breite, grid 1/3 + 2/3)
   - Links 1/3: Kalkulator
   - Rechts 2/3: leer (Platz fuer spaetere Erweiterung)
5. DMS-Widget (volle Breite)
```

Das bisherige `grid-cols-5` Layout (Beschreibung + Kalkulator nebeneinander) wird aufgeloest. Die Objektbeschreibung bekommt volle Breite.

### 2. UnitPreislisteTable.tsx — Demo-Editing freischalten

- `opacity-40` und `select-none` auf dem aeusseren Container entfernen
- `pointer-events-none` auf Nicht-Demo-Zeilen entfernen
- `canEdit` immer auf `true` setzen (alle Zeilen editierbar)
- Die Row-Navigation (`handleRowClick`) bleibt im Demo auf Zeile 1 beschraenkt, aber das Editieren der Preise funktioniert ueberall
- Der Demo-Hinweis "Musterdaten" in der Summenzeile bleibt

### 3. StickyCalculatorPanel.tsx — Rendite-Anzeige verbessern

- Die "Ø Endkundenrendite" KPI zeigt die tatsaechlich berechnete Durchschnittsrendite (aus Preisen)
- Daneben wird die Zielrendite (Slider-Wert) als Vergleich angezeigt
- Farbliche Markierung: gruen wenn tatsaechliche Rendite >= Zielrendite, rot wenn darunter

---

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Aendern | `src/pages/portal/projekte/PortfolioTab.tsx` |
| Aendern | `src/components/projekte/UnitPreislisteTable.tsx` |
| Aendern | `src/components/projekte/StickyCalculatorPanel.tsx` |

## Risiko

Niedrig. Hauptsaechlich Layout-Verschiebung und Entfernung von Demo-Blockaden. Berechnungslogik bleibt gleich.
