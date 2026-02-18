

# Mobile Startseite: Header vergroessern, Menuepunkte konsolidieren, Sticky Layout

## Problem

1. **SystemBar zu kurz**: Die mobile SystemBar hat nur `h-10` (40px) — Icons und Text sind zu klein und wirken gedraengt
2. **Falsche Labels**: "Sparen" (MOD-15) fuehrt zu Fortbildung, "Versicherungen" (MOD-16) fuehrt zu Shops — die Bezeichnungen stimmen nicht mit den Modulen ueberein
3. **Zu viele Eintraege**: 12 Menuepunkte erfordern Scrollen auf kleinen Bildschirmen
4. **Kein Sticky-Verhalten**: Die Modulliste scrollt frei, statt den gesamten sichtbaren Bereich souveraen auszufuellen

## Loesung

### 1. SystemBar vergroessern

In `src/components/portal/SystemBar.tsx` wird die mobile Hoehe von `h-10` auf `h-12` angehoben. Die Buttons bekommen `h-9 w-9` statt `h-8 w-8`, die ARMSTRONG-Schrift wird von `text-xs` auf `text-sm` vergroessert.

### 2. Menuepunkte konsolidieren: 12 → 10

In `src/config/mobileHomeConfig.ts`:

**Entfernt:**
- `{ type: 'module', code: 'MOD-15', label: 'Sparen', icon: 'PiggyBank' }` (Label war falsch — MOD-15 ist Fortbildung)
- `{ type: 'module', code: 'MOD-16', label: 'Versicherungen', icon: 'Shield' }` (Label war falsch — MOD-16 ist Shop)

**Neu (zusammengefuehrt):**
- `{ type: 'module', code: 'MOD-16', label: 'Shops & Fortbildung', icon: 'ShoppingBag' }` — ein einziger Menuepunkt, der zum Shop-Modul fuehrt (dort sind Fortbildungsinhalte ueber die Sub-Tabs erreichbar bzw. verlinkbar)

Damit sinkt die Liste von 12 auf 10 Eintraege:
1. Finanzen
2. Immobilien
3. Briefe
4. Dokumente
5. Posteingang
6. Fahrzeuge
7. Haustiere
8. Finanzierung
9. Immo Suche
10. Shops und Fortbildung

### 3. Kompaktere Zeilen + Sticky Full-Height Layout

In `src/components/portal/MobileHomeModuleList.tsx`:

- Zeilen-Padding von `py-3.5` auf `py-2.5` reduzieren (kompakter, aber noch gut tippbar)
- Icon-Container von `h-9 w-9` auf `h-8 w-8` verkleinern
- Aeusserer Container: `flex-1 overflow-y-auto` bleibt, aber der innere Container bekommt `flex flex-col justify-between min-h-full` — damit die Liste den verfuegbaren Platz gleichmaessig ausfuellt wenn alle Punkte hineinpassen, und nur scrollt wenn noetig
- `ShoppingBag` Icon zum iconMap hinzufuegen

### 4. Icon-Map erweitern

`ShoppingBag` wird in die Imports und den `iconMap` in `MobileHomeModuleList.tsx` aufgenommen.

---

## Technische Uebersicht

| Datei | Aenderung |
|-------|-----------|
| `src/components/portal/SystemBar.tsx` | Mobile Hoehe `h-10` → `h-12`, Button-Groessen und Schrift anpassen |
| `src/config/mobileHomeConfig.ts` | MOD-15 + MOD-16 Eintraege durch einen kombinierten Eintrag "Shops und Fortbildung" ersetzen |
| `src/components/portal/MobileHomeModuleList.tsx` | Kompaktere Zeilen, `ShoppingBag` Icon, Sticky-Full-Height Layout |

## Reihenfolge

1. `mobileHomeConfig.ts` — Eintraege konsolidieren (12 → 10)
2. `MobileHomeModuleList.tsx` — Kompaktere Zeilen + neues Icon + Sticky Layout
3. `SystemBar.tsx` — Mobile Header vergroessern
