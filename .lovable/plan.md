

## Lennox & Friends — Logo-Korrekturen

### 1. Hero: Logo entfernen

Das Patch-Logo im Hero-Bereich (Zeile 86-88 in `LennoxStartseite.tsx`) verdeckt den Hund im Bild. Es wird komplett entfernt.

### 2. Header: Rechteckiges Logo statt rundem

Im Header (`LennoxLayout.tsx`, Zeile 40) wird das Logo aktuell quadratisch mit `rounded-lg` angezeigt, was das Bild beschneidet. Stattdessen wird ein rechteckiger Container verwendet (`h-9 w-auto`), damit das komplette Logo sichtbar ist. Dasselbe gilt fuer das kleine Logo im Footer (Zeile 107).

### 3. Partner-CTA: Logo ebenfalls entfernen

Weiter unten auf der Startseite (Zeile 339) wird das Patch nochmal im "Werde Teil der Lennox-Familie"-Block angezeigt. Dieses bleibt bestehen, da es dort das Branding unterstuetzt und nichts verdeckt.

### Technische Aenderungen

| Datei | Zeilen | Aenderung |
|-------|--------|-----------|
| `LennoxStartseite.tsx` | 86-88 | `img`-Tag mit `lennoxPatch` im Hero entfernen |
| `LennoxLayout.tsx` | 40 | Logo-Klassen aendern: `h-9 w-9 rounded-lg` wird zu `h-9 w-auto rounded-md` (rechteckig, volles Bild) |
| `LennoxLayout.tsx` | 107 | Footer-Logo ebenfalls: `h-7 w-7 rounded-lg` wird zu `h-7 w-auto rounded-md` |

