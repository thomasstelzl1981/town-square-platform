

## Persoenliche Berater-Sektion auf Otto² Advisory Homepage

### Freeze-Check
- Zone 3 / Otto: Nicht in `zone3_freeze.json` gelistet → **nicht frozen** ✅

### Aenderungen

**1. Bilder kopieren nach `src/assets/otto/`**
- `user-uploads://1B02E279-...` → `src/assets/otto/otto-stelzl.jpg` (Otto Stelzl)
- `user-uploads://B0FCC94C-...` → `src/assets/otto/thomas-stelzl.jpg` (Thomas Otto Stelzl)

**2. Neue Berater-Sektion in `src/pages/zone3/otto/OttoHome.tsx`**

Zwischen der "Warum Otto²"-Sektion (Zeile 114) und der "Fuer Unternehmer & Privathaushalte"-Sektion (Zeile 117) eine kompakte Berater-Vorstellung einfuegen:

```
Ihre Berater

[Foto Otto]              [Foto Thomas]
Otto Stelzl              Thomas Otto Stelzl
Geschäftsführer          Finanzberater

"Herzlich willkommen bei Otto² Advisory! Wir freuen uns
darauf, Sie kennenzulernen. Unser Versprechen: Pragmatisch
und ehrlich beraten — immer. Wir laden Sie herzlich ein
zu einem unverbindlichen Kennenlernen."

                [Kontakt aufnehmen →]
```

Design:
- Weisser Hintergrund, `border-t border-slate-100`
- Zwei runde Portraitfotos nebeneinander (ca. 160x160px, `rounded-full`, `object-cover`)
- Darunter Name + Rolle in Slate-800 / Slate-500
- Zitat-Text zentriert in Slate-600, kursiv
- CTA-Link zu `/website/otto-advisory/kontakt`
- Responsive: auf Mobile untereinander

**Keine weiteren Dateien betroffen.**

