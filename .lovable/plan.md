

## SoT Armstrong Stripe und SubBar -- Korrekturen

### Probleme

1. **Stripe zu schmal**: Aktuell 200px, soll ca. 50% breiter = **300px**
2. **Stripe rastet nicht unter SubBar ein**: `top-[88px]` stimmt nicht exakt mit dem SubBar-Ende ueberein. Die SystemBar ist `h-12` (48px), die SubBar hat `py-1` (8px oben/unten) + Inhalt. Der korrekte Wert muss dynamisch passen.
3. **"Dateien hierher ziehen" entfernen**: Die Drop-Zone in der Mitte wird komplett entfernt.
4. **Chat-Eingabe unten fehlt**: Statt nur dem Sparkles-Button soll unten ein richtiges Chat-Eingabefeld mit Send-Button stehen (wie im Portal).

### Aenderungen

**Datei: `src/components/zone3/sot/SotArmstrongStripe.tsx`**

| Was | Vorher | Nachher |
|---|---|---|
| Breite (expanded) | 200px | 300px |
| Breite (minimized) | 45px | 45px (bleibt) |
| Top-Position | `top-[88px]` | Wird praezise berechnet: Die SubBar sitzt innerhalb von `main`, nicht im root Layout. Der Stripe muss sich an der gleichen Hoehe ausrichten wie der SubBar-Unterstrich. Loesung: `top-12` (48px = SystemBar-Hoehe), denn die SubBar gehoert zum Page-Content innerhalb von `main`. Der Stripe beginnt direkt unter der SystemBar, genauso wie `main`. |
| Mittlerer Content | "Dateien hierher ziehen" Drop-Zone | Komplett entfernt, `flex-1` bleibt leer |
| Unterer Bereich | Sparkles-Button + "Fragen" Label | Chat-Eingabefeld: `input` mit Placeholder "Armstrong fragen..." + Send-Button (ArrowUp Icon), beim Klick oeffnet sich der Chat-Panel |

Zur Top-Position-Klaerung: Die SubBar ist Teil von `SotHome.tsx` (innerhalb von `<Outlet />`), nicht Teil des root Layouts. Der Armstrong Stripe ist im root Layout und muss auf gleicher Hoehe wie `main` beginnen = direkt unter der SystemBar = `top-12`. Die SubBar-Linien werden innerhalb des Main-Contents gerendert, und der Stripe sitzt auf gleicher Hoehe daneben -- dadurch rastet er visuell unter den SubBar-Linien ein, weil die SubBar selbst die erste Zeile im Main-Content ist.

**Datei: `src/pages/zone3/sot/SotHome.tsx`**

Keine Aenderungen noetig. SubBar mit `border-y border-border/50` bleibt wie ist.

### Technische Details Armstrong Stripe (neu)

```
aside (expanded, fixed):
  - width: 300px
  - top-12 (48px), right-0, bottom-0
  - Header: "Armstrong" + Minimize/Close Buttons (bleibt)
  - Mitte: leer (flex-1, keine Drop-Zone)
  - Unten: Chat-Eingabezeile
    - input: "Armstrong fragen..." Placeholder
    - button: ArrowUp-Icon, onClick -> setIsChatOpen(true)
    - border-t border-border/30, px-3 py-3
```

