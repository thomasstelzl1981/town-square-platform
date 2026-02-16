
# MOD-18 Finanzanalyse: Einheitliche CI-Kacheln und Glow-Korrektur

## Problem

1. **PersonVisitenkarte** (horizontale Visitenkarten, 2 pro Reihe) werden in Uebersicht, Investment und Vorsorgedokumente verwendet -- diese sollen durch die standard-quadratischen CI-Kacheln (WidgetGrid + WidgetCell, 4 pro Reihe) ersetzt werden.
2. **Glow-System ist falsch**: Aktuell bekommen sowohl Demo-Daten als auch eigene Daten den gleichen `emerald`-Glow. Korrekt waere: Demo = emerald (gruen), eigene Daten = rose (rot).
3. **Vorsorgedokumente**: Die Personen-Auswahl nutzt ebenfalls PersonVisitenkarte statt CI-Kacheln.

## Loesung

### 1. Glow-System korrigieren (`src/config/widgetCategorySpec.ts`)

Die Funktion `getContractWidgetGlow` gibt aktuell fuer ALLE Daten `emerald` zurueck. Aenderung:

- `isDemoId(id)` -> `'emerald'` (gruen) -- bleibt
- Manuelle/eigene Daten -> `'rose'` (rot) -- NEU
- Shop-Angebote -> `null` (kein Glow) -- bleibt

Ebenso `resolveWidgetGlow`: `'manual'` -> `'rose'` statt `'emerald'`

### 2. UebersichtTab: PersonVisitenkarte durch WidgetGrid ersetzen

**Datei: `src/pages/portal/finanzanalyse/UebersichtTab.tsx`**

- `PersonVisitenkarte` Import entfernen
- Personen-Block: `grid grid-cols-1 md:grid-cols-2` ersetzen durch `WidgetGrid` + `WidgetCell`
- Jede Person als quadratische Kachel mit:
  - Farbiger Avatar-Circle (Rollen-Gradient)
  - Name (bold)
  - Rolle (klein)
  - Glass-Card Styling mit Glow (emerald fuer Demo, rose fuer eigene)
  - `onClick` oeffnet weiterhin das Inline-Formular darunter
  - Selection Ring bei geoeffneter Karte
- CTA "Person hinzufuegen" bleibt als dashed WidgetCell

### 3. InvestmentTab: PersonVisitenkarte durch WidgetGrid ersetzen

**Datei: `src/pages/portal/finanzanalyse/InvestmentTab.tsx`**

- `PersonVisitenkarte` Import entfernen
- Person-Auswahl als `WidgetGrid` + `WidgetCell`:
  - Avatar-Circle, Name, Rolle
  - Depot-Status Badge ("Depot aktiv" / "Kein Depot")
  - Selection Ring bei ausgewaehlter Person
  - Kein Edit-Formular -- nur Depot-Umschaltung

### 4. VorsorgedokumenteTab: PersonVisitenkarte durch WidgetGrid ersetzen

**Datei: `src/pages/portal/finanzanalyse/VorsorgedokumenteTab.tsx`**

- `PersonVisitenkarte` Import entfernen
- Personen-Auswahl in Sektion 1 als `WidgetGrid` + `WidgetCell`:
  - Avatar-Circle, Name, Rolle
  - Status-Badge ("Hinterlegt" wenn PV vorhanden)
  - Selection Ring
- Testament-Kacheln (Sektion 2) bleiben unveraendert (nutzen bereits WidgetGrid)

### 5. Glow auf alle Vertrags-Kacheln anwenden

In allen Tabs (Sachversicherungen, Vorsorge, KV, Abonnements) werden die Kacheln aktuell ohne Glow gerendert (nur `CARD.BASE`). Aenderung:

- Demo-Datensaetze (`isDemoId`) bekommen `getActiveWidgetGlow('emerald')` + DEMO Badge
- Eigene Datensaetze bekommen `getActiveWidgetGlow('rose')`
- CTA-Kacheln bleiben ohne Glow (dashed border)

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/config/widgetCategorySpec.ts` | `manual` -> `'rose'` statt `'emerald'` |
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | PersonVisitenkarte -> WidgetGrid/WidgetCell + Glow |
| `src/pages/portal/finanzanalyse/InvestmentTab.tsx` | PersonVisitenkarte -> WidgetGrid/WidgetCell |
| `src/pages/portal/finanzanalyse/VorsorgedokumenteTab.tsx` | PersonVisitenkarte -> WidgetGrid/WidgetCell |
| `src/pages/portal/finanzanalyse/SachversicherungenTab.tsx` | Glow (emerald/rose) auf Kacheln anwenden |
| `src/pages/portal/finanzanalyse/VorsorgeTab.tsx` | Glow (emerald/rose) auf Kacheln anwenden |
| `src/pages/portal/finanzanalyse/KrankenversicherungTab.tsx` | Glow (emerald) auf Demo-Kacheln anwenden |
| `src/pages/portal/finanzanalyse/AbonnementsTab.tsx` | Glow (emerald/rose) auf Kacheln anwenden |

---

## Technische Details

### Kachel-Layout (alle Personen-Widgets)

```text
WidgetGrid (4-col desktop, 2-col tablet, 1-col mobile)
  [WidgetCell]         [WidgetCell]         [WidgetCell]         [WidgetCell]
   Avatar-Circle        Avatar-Circle        Avatar-Circle        + Person
   "Max Mustermann"     "Lisa Mustermann"    "Felix Mustermann"   hinzufuegen
   Hauptperson          Partner/in           Kind
   rose glow            rose glow            rose glow            dashed CTA
```

### Glow-Logik

```text
isDemoId(id) = true  -> getActiveWidgetGlow('emerald') + DEMO Badge
isDemoId(id) = false -> getActiveWidgetGlow('rose')
CTA / Platzhalter    -> border-dashed, kein Glow
```

### PersonVisitenkarte

Die Komponente `src/components/shared/PersonVisitenkarte.tsx` wird NICHT geloescht, da sie moeglicherweise in anderen Modulen verwendet wird. Sie wird nur aus MOD-18 entfernt.
