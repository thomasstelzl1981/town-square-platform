

# Bewertung: Light Mode Input-Surface Token

## Meine Einschätzung: Guter Vorschlag, mit einer Anpassung

Der Vorschlag ist sinnvoll — ein dedizierter `--input-bg` Token gibt zentrale Kontrolle über Input-Hintergründe, unabhängig von `--muted`.

**Allerdings:** Eure Inputs nutzen aktuell bereits `hsl(var(--muted) / 0.6)` in `.input-ios` (Zeile 579) und `bg-muted/40` in den Shadcn-Komponenten (`input.tsx`, `textarea.tsx`). Die sind also nicht transparent, sondern haben schon einen definierten Hintergrund.

Ein reines Weiss (`0 0% 100%`) könnte im Light Mode **zu kontrastlos** wirken, wenn euer Background schon weiss oder nahe-weiss ist — die Inputs verschwinden dann visuell.

## Empfehlung: Token ja, aber mit leichtem Grauton

```css
/* :root */
--input-bg: 210 20% 97%;   /* Hauch von Blau-Grau, nicht reines Weiss */

/* .dark */
--input-bg: 215 15% 18%;   /* Dunkler als Surface, aber erkennbar */
```

## Umsetzung (3 Stellen)

1. **Token einfügen** in `src/index.css` unter `:root` und `.dark`
2. **`.input-ios`** (Zeile 579): `background: hsl(var(--input-bg));` statt `hsl(var(--muted) / 0.6)`
3. **Shadcn Input/Textarea** (`src/components/ui/input.tsx`, `textarea.tsx`): `bg-muted/40` durch eine Klasse mit `hsl(var(--input-bg))` ersetzen — oder alternativ den Token direkt in `.input-ios` belassen und die Shadcn-Komponenten mit der Klasse `input-ios` versehen

Kein Risiko, rein kosmetisch, keine Logik betroffen.

