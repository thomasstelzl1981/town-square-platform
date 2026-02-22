

## Lennox & Friends -- Design-Konsistenz wiederherstellen

### Befund (aus den Screenshots)

1. **Startseite Hero zu hoch**: Mit `minHeight: 85vh` nimmt das Hero-Bild den gesamten Bildschirm ein. Die Suchleiste und der Shop-Bereich darunter sind im Vollbildmodus nicht sichtbar.

2. **Shop-Seite ohne Bild**: Der Shop-Hero zeigt nur einen dunkelgruenen Hintergrund mit einem blassen Shopping-Icon. Frueher war hier ein schoenes generiertes Bild. Hoehe ebenfalls inkonsistent (`60vh`).

3. **Partner-werden Hero**: Hat zwar ein Bild (`partner_hero.jpg`), aber mit `70vh` ebenfalls zu hoch und nicht konsistent mit den anderen Seiten.

### Loesung

#### A. Einheitliche Hero-Hoehe auf allen Seiten

Alle Hero-Sections werden auf eine einheitliche Hoehe von **50vh** gesetzt (statt 85vh, 70vh, 60vh). Das sorgt dafuer, dass im Vollbildmodus immer der naechste Inhalt (Suchleiste, Produkte, Formular) sichtbar ist.

| Seite | Vorher | Nachher |
|-------|--------|---------|
| Startseite | 85vh | 50vh |
| Shop | 60vh | 50vh |
| Partner werden | 70vh | 50vh |

#### B. Shop-Hero: Bild hinzufuegen

Ein neues Hero-Bild fuer den Shop wird benoetigt. Da kein Shop-Bild mehr in `src/assets/lennox/` vorhanden ist, wird ein passendes Bild mit dem bestehenden `section_cozy.jpg` als Hintergrund verwendet (gemuetliches Hunde-Ambiente passt zum Shop-Kontext). Alternativ kann ein neues Bild generiert werden.

Der Shop-Hero wird vom reinen Gradient-Hintergrund auf ein Bild mit Overlay umgestellt -- analog zur Startseite und Partner-Seite.

#### C. Konsistentes Hero-Pattern

Alle drei Unterseiten bekommen das gleiche Hero-Muster:
- Bild als Hintergrund (object-cover)
- Gradient-Overlay (from-black/30 via-black/10 to-black/50)
- Zentrierter weisser Text
- Gleiche Hoehe (50vh)

---

### Technische Aenderungen

| Nr | Datei | Aenderung |
|----|-------|-----------|
| 1 | `src/pages/zone3/lennox/LennoxStartseite.tsx` | Hero `minHeight` von `85vh` auf `50vh` (2 Stellen: Container + Flex) |
| 2 | `src/pages/zone3/lennox/LennoxShop.tsx` | Hero `minHeight` von `60vh` auf `50vh`, Gradient-Hintergrund durch Bild ersetzen (`section_cozy.jpg`), Overlay hinzufuegen |
| 3 | `src/pages/zone3/lennox/LennoxPartnerWerden.tsx` | Hero `minHeight` von `70vh` auf `50vh` (2 Stellen) |

Alle Dateien sind Zone-3-Dateien und nicht vom Modul-Freeze betroffen.
