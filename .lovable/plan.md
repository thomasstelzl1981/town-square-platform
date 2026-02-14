

# Fix: Doppeltes Submenü in Finanzanalyse entfernen

## Problem

Die Finanzanalyse-Seite zeigt zwei Sub-Navigationen:
1. **TopNavigation > SubTabs** (Level 3, automatisch aus dem Routes-Manifest) -- die obere Leiste
2. **SubTabNav in FinanzanalysePage.tsx** (Zeile 24) -- eine zweite, redundante Leiste

## Loesung

Die `SubTabNav` aus `FinanzanalysePage.tsx` entfernen. Die Top-Navigation (SubTabs-Komponente) uebernimmt bereits die Tab-Darstellung.

## Aenderung

**Datei:** `src/pages/portal/FinanzanalysePage.tsx`

- Import von `SubTabNav` entfernen (Zeile 6)
- `TABS`-Konstante entfernen (Zeilen 14-19)
- `<SubTabNav tabs={TABS} />` entfernen (Zeile 24)
- Rest (Routes, Suspense) bleibt unveraendert

