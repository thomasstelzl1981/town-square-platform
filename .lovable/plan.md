

## Darlehen-Widgets: Glow-Farbe korrigieren (rot → gruen)

### Problem

Im Darlehen-Tab gibt es zwei Widgets mit rotem Glow, obwohl sie zur Demo-Datenbank gehoeren:

1. **Hausdarlehen (Sparkasse Muenchen)** — Die `miety_loans`-Tabelle wurde mit `gen_random_uuid()` geseedet, daher hat der Datensatz eine zufaellige UUID (`6db3e303-...`), die nicht in der Demo-ID-Liste registriert ist. Ergebnis: `isDemoId()` gibt `false` zurueck, deshalb roter Glow.

2. **PV-Darlehen (KfW)** — Die PV-ID (`00000000-...000901`) IST in der Demo-Liste registriert, aber der Code bei den PV-Widgets prueft `isDemoId` gar nicht — stattdessen wird `'rose'` (rot) fest einprogrammiert.

### Loesung

Zwei Aenderungen:

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/finanzanalyse/DarlehenTab.tsx` (PV-Sektion, ca. Zeile 320-355) | `isDemoId(pv.id)` pruefen und Glow/Ring dynamisch setzen, genau wie bei Hausdarlehen und Privatkrediten. Auch DEMO-Badge anzeigen wenn `isDemoId` true. |
| `src/pages/portal/finanzanalyse/DarlehenTab.tsx` (Hausdarlehen-Sektion, ca. Zeile 242-277) | Zusaetzlich zum bestehenden `isDemoId(loan.id)` einen Fallback auf `demoEnabled` einfuegen, da die miety_loans eine zufaellige UUID haben. Logik: `const isDemo = isDemoId(loan.id) \|\| demoEnabled;` — wenn Demo-Modus aktiv ist und der Datensatz nicht manuell angelegt wurde, wird er als Demo behandelt. |

### Ergebnis

- Hausdarlehen: gruener Glow + DEMO Badge
- PV-Darlehen: gruener Glow + DEMO Badge
- Privatkredite: bleiben wie sie sind (bereits korrekt gruen)
- Manuell angelegte Darlehen: weiterhin roter Glow (korrektes Verhalten)
