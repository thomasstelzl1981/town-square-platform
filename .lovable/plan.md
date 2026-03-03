

# Analyse & Plan: Lennox Shop Sichtbarkeit + Bildformat

## Problem 1: Produkte in Zone 3 nicht sichtbar

**Ursache gefunden:** Die RLS-Policy auf `service_shop_products` erlaubt SELECT nur fuer `authenticated`-Nutzer. Zone 3 ist oeffentlich (kein Login) — daher werden keine Produkte geladen.

**Loesung:** Eine zusaetzliche RLS-Policy fuer `anon` (oeffentlichen Lesezugriff) anlegen:

```sql
CREATE POLICY "Public can read active products"
ON public.service_shop_products
FOR SELECT
TO anon
USING (is_active = true);
```

Damit koennen Zone-3-Besucher aktive Produkte sehen, aber nur eingeloggte Admins koennen schreiben.

## Problem 2: Produkte in Zone 2

**Kein Problem:** Die bestehende Policy erlaubt SELECT fuer `authenticated` mit `USING (true)`. Zone-2-Nutzer sind eingeloggt — Produkte sollten sichtbar sein. Falls nicht, liegt es daran, dass kein Widget aktiv ist (Toggle-Klick noetig).

## Problem 3: See-Bild in Galerie abgeschnitten

**Ursache:** In `LennoxLennox.tsx` Zeile 177 hat das See-Bild `aspect-[3/4]` (Portrait-Format). Das Foto ist aber ein Landschaftsbild — `object-cover` schneidet es stark ab.

**Loesung:** Fuer das See-Bild ein breiteres Seitenverhaeltnis verwenden, z.B. `aspect-[4/3]`, oder `object-position: top` setzen, damit der relevante Bildteil (Person) sichtbar bleibt. Da alle drei Galerie-Bilder im gleichen Grid sind, kann man auch gemischte Aspect-Ratios nutzen:

- See-Bild: `aspect-[4/5]` + `object-position: center top`
- Pferd-Bild: bleibt `aspect-[3/4]`
- Lennox-Bild: bleibt `aspect-[3/4]`

Oder alternativ alle auf `aspect-square` setzen fuer Einheitlichkeit.

## Zusammenfassung der Aenderungen

| Datei | Aenderung |
|---|---|
| DB Migration | Neue RLS-Policy: anon SELECT auf active products |
| `src/pages/zone3/lennox/LennoxLennox.tsx` | Zeile 177: See-Bild Aspect-Ratio + object-position anpassen |

