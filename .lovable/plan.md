

## Zentrierung und Armstrong Stripe -- SoT Homepage

### Aufgabe
Drei Anpassungen an der SoT-Startseite:
1. **"Welcome on Board"** mittig zentrieren (text-center)
2. **Kacheln und Investment Engine** mittig zentrieren (items-center auf dem Container)
3. **Armstrong Stripe** rechts sichtbar machen (ist bereits im Layout eingebunden, ggf. Darstellungsproblem beheben)

### Technische Umsetzung

**Datei: `src/pages/zone3/sot/SotHome.tsx`**

- Headline `h1` erhaelt zusaetzlich `text-center`
- Der aeussere Content-Container (`max-w-7xl mx-auto`) bekommt `flex flex-col items-center` damit alle Kinder (Investment Engine Grid, WidgetGrid) mittig sitzen
- Das Investment Engine Grid (4-Spalter mit `lg:col-span-3`) bekommt `w-full` damit es innerhalb des zentrierten Containers seine volle Breite behaelt
- Die WidgetGrid bekommt ebenfalls `w-full`

**Datei: `src/components/zone3/sot/SotArmstrongStripe.tsx`**

- Pruefen ob der Stripe korrekt sichtbar ist (aktuell `hidden lg:flex` -- sollte auf Desktop angezeigt werden)
- Falls noetig: sicherstellen, dass die Glasflaeche, der Sparkles-Button und das vertikale "Armstrong"-Label korrekt gerendert werden mit ausreichend Kontrast zum `bg-atmosphere` Hintergrund

### Aenderungen zusammengefasst

| Datei | Aenderung |
|---|---|
| `SotHome.tsx` | `text-center` auf Headline, `items-center` auf Content-Container |
| `SotArmstrongStripe.tsx` | Sichtbarkeit und Kontrast des Stripes sicherstellen |

Minimaler Eingriff, keine strukturellen Aenderungen.

