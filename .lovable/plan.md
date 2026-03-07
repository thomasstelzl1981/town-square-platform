

# Befund: Exposé-Parsing → Datenrückschreibung in `acq_offers`

## Ergebnis: Pipeline funktioniert grundsätzlich — mit einem Bug

Die Edge Function `sot-acq-offer-extract` (Zeilen 298–319) schreibt extrahierte Daten korrekt in `acq_offers` zurück:

| Feld | Quelle | Rückschreibung |
|---|---|---|
| `extracted_data` (JSON) | Komplettes AI-Ergebnis | ✅ Immer geschrieben |
| `extraction_confidence` | Berechneter Score | ✅ Immer geschrieben |
| `address`, `postal_code`, `city` | AI-Extraktion | ✅ Wenn vorhanden |
| `price_asking`, `yield_indicated`, `noi_indicated` | AI-Extraktion | ✅ Wenn vorhanden |
| `units_count`, `area_sqm`, `year_built` | AI-Extraktion | ✅ Wenn vorhanden |
| `title` | AI-Extraktion | ❌ **BUG — wird NIE geschrieben** |

### Bug: Titel wird nie aktualisiert

**Zeile 305:** `if (extractedData.title && !offer) offerUpdates.title = extractedData.title;`

Die Bedingung `!offer` ist immer `false`, weil `offer` in Zeile 244 abgefragt wird und zu diesem Zeitpunkt bereits existiert (der Offer wurde vor dem Funktionsaufruf angelegt). Der aus dem Exposé extrahierte Titel überschreibt also nie den Dateinamen-basierten Titel.

**Fix:** Ändern zu: `if (extractedData.title) offerUpdates.title = extractedData.title;`

### Durchsuchbarkeit

Da die extrahierten Felder (`address`, `city`, `postal_code`, `provider_name`, `notes`) direkt in die `acq_offers`-Spalten geschrieben werden, sind sie über die Freitext-Suche im Objekteingang durchsuchbar — **vorausgesetzt die Extraktion lief erfolgreich**.

Das JSON-Feld `extracted_data` enthält zusätzliche Felder (`property_type`, `heating_type`, `energy_class`, `highlights`, `contact_broker`), die aktuell NICHT durchsuchbar sind, da die Suche nur auf Top-Level-Spalten filtert.

### Weitere Felder aus AI-Extraktion, die NICHT zurückgeschrieben werden

Die AI extrahiert auch: `property_type`, `floors`, `parking_spaces`, `heating_type`, `energy_class`, `renovation_status`, `monthly_rent_current`, `monthly_rent_potential`, `vacancy_rate`, `contact_broker`, `highlights` — diese landen nur im `extracted_data` JSON, nicht in eigenen Spalten. Das ist akzeptabel, da sie über die Detailseite aus dem JSON gelesen werden können.

## Plan

### Datei: `supabase/functions/sot-acq-offer-extract/index.ts`

1. **Zeile 305 fixen**: `!offer`-Check entfernen, damit der AI-extrahierte Titel den Dateinamen ersetzt
2. **`provider_name` rückschreiben**: `contact_broker.company` → `provider_name`, `contact_broker.name` + `contact_broker.phone` → `provider_contact` (falls diese Spalten existieren)
3. **`notes` rückschreiben**: `extractedData.notes` → `offer.notes`

Keine Freeze-Konflikte — Edge Functions sind infrastrukturunabhängig.

