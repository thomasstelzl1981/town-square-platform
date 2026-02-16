

# Caring-Seite: 3 Korrekturen

## 1. Emerald-Glow und DEMO-Badge von den 4 Service-Kacheln entfernen

Die oberen 4 Kategorie-Kacheln (Pension, Tagesstaette, Gassi-Service, Hundesalon) sind **keine Demo-Daten** — sie sind statische UI-Elemente zur Service-Auswahl. Der Emerald-Glow und das DEMO-Badge werden entfernt. Die Kacheln erhalten stattdessen ein neutrales Styling (border + hover-Effekt), mit einer aktiven Hervorhebung (z.B. `ring-2 ring-primary`) wenn ausgewaehlt.

## 2. Service-Typ-Dropdown entfernen

Das Dropdown "Service-Typ waehlen..." in der Suchleiste ist redundant, da der Service-Typ bereits ueber die 4 Kacheln gewaehlt wird. Die Suchleiste wird vereinfacht auf:
- PLZ/Ort-Eingabe (volle Breite minus Suchen-Button)
- Suchen-Button

## 3. Ueberschrift "Unsere Partner" ueber den Suchergebnissen

Vor dem Ergebnis-Grid wird eine Ueberschrift eingefuegt: **"Unsere Partner"** als `text-lg font-semibold`, mit einem kurzen Trennstrich oder Abstand darunter.

## Betroffene Datei

| Datei | Aenderung |
|---|---|
| `src/pages/portal/pets/PetsCaring.tsx` | Glow/Badge von Kacheln entfernen, Dropdown entfernen, Ueberschrift hinzufuegen |

