

## Lennox Shop -- Ueberarbeitung

### 1. Sektionsbeschreibungen hinzufuegen

Jede Produktkategorie bekommt einen erklaerenden Textblock zwischen Ueberschrift und Produktgrid:

**Ernaehrung (Lakefields):**
- Erklaerung, warum Lakefields empfohlen wird: Manufaktur am Bodensee, Lebensmittelqualitaet, mit Tieraerzten entwickelt, ohne Getreide/Zusatzstoffe/Zucker, Fleisch aus artgerechter Haltung, ohne Tierversuche
- Link zur Lakefields-Website

**Lennox Style:**
- Kurzer Text: "Fuer unsere Fans haben wir eine kleine Kollektion an Accessoires gestaltet — mit Liebe zum Detail und dem unverwechselbaren Lennox-Style."

**Fressnapf:**
- Text anpassen auf Spielzeug und Hundezubehoer statt Zahnpflege

### 2. Produktkacheln gleichmaessig gestalten

Das aktuelle Grid zeigt Kacheln mit unterschiedlicher Hoehe, weil Texte und Badges unterschiedlich lang sind. Loesung:

- Feste Hoehe fuer die Produktkarten (`h-full` mit `flex flex-col` und `flex-1` auf den Textbereich)
- Einheitliches `aspect-square` fuer alle Bildcontainer (bereits vorhanden)
- Textbereich mit `min-h-[3.5rem]` damit alle Karten gleich hoch sind
- `justify-between` auf der gesamten Card fuer gleichmaessige Verteilung

### 3. Fressnapf-Produkte austauschen (DB-Update)

Die aktuellen Fressnapf-Eintraege haben:
- Generische Kategorie-Flyout-Bilder (Katze, Vogel, Fisch, Kleintier, etc.) statt echte Produktbilder
- Zahnpflege-Produkte statt Hundespielzeug

**DB-Migration:** Alle 9+ Fressnapf-Produkte werden aktualisiert mit:
- Echten Fressnapf-Produktbildern (von den Produktseiten, Format: `https://media.os.fressnapf.com/products-v2/...`)
- Hundespielzeug und -zubehoer statt Zahnpflege:
  1. AniOne Spielzeug Herz zum Kauen und Zerren -- Seilspielzeug
  2. KONG Classic S -- Kauspielzeug-Klassiker
  3. AniOne Kuschelspielzeug -- Plueschtier
  4. Tennisbaelle fuer Hunde
  5. Wurfspielzeug / Frisbee
  6. Intelligenzspielzeug
- Neue `external_url`s zu den richtigen Fressnapf-Produktseiten
- Passende Preise und Badges

### 4. Code-Aenderung in LennoxShop.tsx

Die `ProductSection`-Komponente wird erweitert:
- Neues optionales Prop `intro` (React-Node oder String) fuer den Erklaerungstext
- `SHOP_SECTIONS`-Array bekommt ein `intro`-Feld pro Kategorie
- Card-Styling: `h-full flex flex-col` mit `flex-1` auf dem Textbereich

### Technische Aenderungen

| Datei / Bereich | Aenderung |
|-----------------|-----------|
| `LennoxShop.tsx` | `SHOP_SECTIONS` um `intro`-Texte erweitern; `ProductSection` um Intro-Block erweitern; Card-Layout fuer gleichmaessige Hoehe anpassen |
| DB: `pet_shop_products` | Fressnapf-Produkte loeschen und durch Hundespielzeug/Zubehoer mit echten Produktbildern ersetzen |

