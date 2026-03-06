

## Google Maps in Gutachten — CORS-Fix für PDF-Einbettung

### Problem
Die Google Maps Bilder (Satellite, StreetView) werden vom Valuation-Engine korrekt als URLs generiert und im **Web-Reader** korrekt angezeigt (`<img src>` unterliegt keinem CORS). Beim **PDF-Export** scheitert jedoch `fetchImageAsBase64()` stumm, weil `fetch(googleMapsUrl, { mode: 'cors' })` von Google blockiert wird. Ergebnis: PDF ohne Kartenbilder.

### Lösung
Die Bilder werden **server-seitig** (Edge Function) als Base64 gefetcht und direkt im Ergebnis mitgeliefert. Der PDF-Generator nutzt dann die fertigen Base64-Strings statt selbst zu fetchen.

### Änderungen

**1. `supabase/functions/sot-valuation-engine/index.ts` — Base64-Prefetch server-seitig**

Nach Zeile 752 (wo `maps: { micro, macro, street_view }` gesetzt wird):
- Neue Hilfsfunktion `fetchImageBase64(url)` die im Edge Function Context (kein CORS) fetcht und als `data:image/...;base64,...` zurückgibt
- Die 3 Map-URLs parallel fetchen und als `maps_base64: { micro, macro, street_view }` dem `locationAnalysis` Objekt hinzufügen
- Die URLs bleiben zusätzlich erhalten für den Web-Reader

**2. `src/hooks/useValuationCase.ts` — Base64-Daten durchreichen**

Im Location-Mapping (Zeile 431-454):
- Neue Felder `microMapBase64`, `macroMapBase64`, `streetViewBase64` aus `loc.maps_base64` mappen

**3. `src/engines/valuation/spec.ts` — Type erweitern**

`LocationAnalysis` Interface um 3 optionale Felder erweitern:
- `microMapBase64?: string | null`
- `macroMapBase64?: string | null`  
- `streetViewBase64?: string | null`

**4. `src/components/shared/valuation/ValuationPdfGenerator.ts` — Base64 direkt nutzen**

`prefetchMapImages()` ändern: Wenn `location.microMapBase64` vorhanden → direkt verwenden, sonst Fallback auf URL-Fetch (bestehende Logik). Damit funktioniert das PDF sofort ohne CORS-Problem.

### Betroffene Dateien

| Datei | Zone | Änderung |
|---|---|---|
| `supabase/functions/sot-valuation-engine/index.ts` | Edge Function | Base64-Prefetch hinzufügen |
| `src/engines/valuation/spec.ts` | Engine (shared) | 3 optionale Base64-Felder |
| `src/hooks/useValuationCase.ts` | Hook (shared) | Base64-Mapping durchreichen |
| `src/components/shared/valuation/ValuationPdfGenerator.ts` | Shared | Base64-Felder bevorzugen |

### Ergebnis
- PDF-Gutachten enthält StreetView-Hero auf Seite 1 und Mikro-/Makrolage-Karten auf Seite 3
- Web-Reader funktioniert weiterhin über URL-basierte `<img>` Tags
- Keine zusätzlichen API-Calls nötig — die Bilder werden beim Erstellen des Gutachtens einmalig gefetcht

