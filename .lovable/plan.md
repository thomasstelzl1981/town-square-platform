

# Produktbilder fuer Smart Home Kameras

## Problem
Die Smart Home Kamera-Produktkarten zeigen aktuell nur ein graues Kamera-Icon als Platzhalter statt echte Produktbilder.

## Loesung
Fuer jedes der 10 Produkte wird ein Amazon-Produktbild direkt per URL eingebunden. Amazon stellt oeffentliche Produktbilder bereit, die ueber die ASIN-basierte Bild-URL geladen werden koennen (z.B. `https://m.media-amazon.de/images/I/...`).

### Aenderungen

**Datei: `src/pages/portal/services/ShopTab.tsx`**

1. Das `SmartHomeProduct`-Interface erhaelt ein neues Feld `imageUrl: string`
2. Jedes Produkt im `SMART_HOME_PRODUCTS`-Array bekommt die passende Amazon-Produktbild-URL
3. Der Platzhalter-Bereich (Zeilen 190-192, das graue Camera-Icon) wird durch ein echtes `<img>`-Tag ersetzt -- identisch zum Pattern der anderen Shops (Zeile 314)

### Produktbilder (Amazon Media URLs)

| Produkt | ASIN | Bildquelle |
|---------|------|------------|
| Reolink RLC-810A | B08B7XWKM3 | Amazon Produktbild |
| Reolink RLC-520A | B09KZG8GG5 | Amazon Produktbild |
| Reolink RLC-842A | B0B5C5MVGL | Amazon Produktbild |
| Amcrest IP4M-1026B | B083G9KT4C | Amazon Produktbild |
| Reolink E1 Zoom | B07VD1DWG3 | Amazon Produktbild |
| Amcrest IP2M-841 | B0145OQTPG | Amazon Produktbild |
| Reolink Argus PT Ultra | B0BXJNJ58D | Amazon Produktbild |
| Amcrest ASH21 | B094GVYQFC | Amazon Produktbild |
| Amcrest IP2M-841B | B0145OQTPG | Amazon Produktbild (weiss) |
| Reolink E1 Pro | B084BNNRL6 | Amazon Produktbild |

Die konkreten Bild-URLs werden von den jeweiligen Amazon-Produktseiten entnommen.

### Fallback
Falls ein Bild nicht laedt (z.B. URL-Aenderung bei Amazon), wird per `onError`-Handler auf das bestehende Camera-Icon zurueckgefallen -- so bleibt die UI stabil.

### Kein Datenbankzugriff noetig
Reine Frontend-Aenderung in einer einzigen Datei.
