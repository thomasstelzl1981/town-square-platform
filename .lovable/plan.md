
# Sanierung: Widgets oben beibehalten, Akte darunter oeffnen

## Aktuelle Situation
Klick auf eine Sanierungsakte navigiert weg vom Dashboard (`/portal/immobilien/sanierung/:caseId`). Die Widgets verschwinden komplett.

## Neue Struktur
Wie bei den anderen Manager-Modulen: Widgets bleiben oben sichtbar zum Durchklicken, die ausgewaehlte Akte oeffnet sich darunter auf derselben Seite.

```text
+---------------------------------------------+
|  Header: Sanierung                          |
+---------------------------------------------+
|  [+ Neue]  [Fall A]  [Fall B]  [Fall C]     |  <-- WidgetGrid (bleibt immer sichtbar)
+---------------------------------------------+
|                                             |
|  Sanierungsakte (Detail)                    |  <-- oeffnet sich darunter
|  Stepper, Uebersicht, Leistungsumfang ...  |
|                                             |
+---------------------------------------------+
```

## Aenderungen

### 1. `src/pages/portal/immobilien/SanierungTab.tsx` — Komplett umbauen

- Routes-basierte Navigation entfernen (kein `<Routes>`, kein `navigate()`)
- Stattdessen `useState<string | null>(null)` fuer `selectedCaseId`
- WidgetGrid bleibt immer sichtbar; Klick auf eine Karte setzt `selectedCaseId`
- Aktive Karte wird visuell hervorgehoben (Ring/Border)
- Unterhalb des Grids: wenn `selectedCaseId` gesetzt, wird `SanierungDetailInline` gerendert

### 2. `src/components/sanierung/SanierungDetail.tsx` — Anpassen

- Neue Props-Variante: `caseId` als Prop statt aus `useParams()`
- "Zurueck"-Button wird zu "Schliessen" und ruft `onClose` Callback auf
- `PageShell`-Wrapper entfernen (wird vom uebergeordneten Tab bereitgestellt)
- Export einer neuen `SanierungDetailInline`-Komponente die `caseId` und `onClose` als Props nimmt

### 3. `src/components/sanierung/ServiceCaseCard.tsx` — Selektion anzeigen

- Neue optionale Prop `isSelected?: boolean`
- Bei `isSelected` visuellen Ring/Border hinzufuegen (z.B. `ring-2 ring-primary`)

### Keine Datenbank-Aenderungen
Nur UI-Refactoring, keine Schema- oder RLS-Aenderungen.
