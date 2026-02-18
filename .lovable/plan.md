

## Lennox & Friends — Shop-Header und Partner-werden-Redesign

### 1. Shop-Hero vergroessern

Die Shop-Seite (`LennoxShop.tsx`) hat aktuell nur `35vh` Hoehe fuer den Hero-Bereich. Das wird auf `50vh` erhoegt, damit der Header visuell gleichwertig zur Startseite wirkt und das Bild nicht abgeschnitten ist.

### 2. Partner-werden: Neues Hero-Bild generieren

Ein neues AI-generiertes Bild wird erstellt: Menschen und Hunde in alpiner Umgebung, die zusammenarbeiten — Teamwork, Netzwerk-Charakter, famililaer. Wird als `src/assets/lennox/partner_hero.jpg` gespeichert.

### 3. Partner-werden: Komplettes Redesign

Die Seite `LennoxPartnerWerden.tsx` wird grundlegend ueberarbeitet:

**Neuer Hero-Bereich:**
- Vollbreites Bild (50vh) mit Overlay, wie bei Shop und Startseite
- Titel: "Werde Partner in deiner Region"
- Untertitel: Netzwerk-Botschaft

**Neue Inhalts-Sektion "Unsere Vision":**
- Text ueber das Ziel: deutschlandweites Netzwerk geprüfter Hundeprofis
- Gruenderin mit langjahhriger Erfahrung in Bayern
- Zentrale Plattform fuer jeden Hundehalter
- Exklusiver Regionalpartner werden

**Ueberarbeitete Benefits (5 statt 3):**
- Exklusivitaet fuer deine Region
- Buchungen ueber die Plattform
- Teil einer wachsenden Community
- Professionelle Sichtbarkeit
- Kuratierte Produkttipps

**Formular:**
- Alpine-Chic-Farbpalette (forest, cream, bark) wie Startseite
- Dunkle Labels, helle Hintergruende — Kontrast-Problem behoben
- Eingabefelder mit sichtbarem Border und dunklem Text

### Technische Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `LennoxShop.tsx` | Hero-Hoehe von `35vh` auf `50vh` erhoehen |
| `LennoxPartnerWerden.tsx` | Komplett ueberarbeiten: Hero-Bild, neue Texte, Alpine-Chic-Palette, Formular-Kontrast fixen |
| `src/assets/lennox/partner_hero.jpg` | Neues AI-generiertes Bild (Menschen + Hunde, alpine Teamwork-Szene) |

