
# Reparaturplan: Investment-Engine Homogenisierung v2.1

## Identifizierte Kernprobleme

Nach tiefgehender Analyse aller drei Investment-Ansichten wurden folgende kritische Probleme identifiziert:

| # | Problem | Betroffene Dateien | Priorität |
|---|---------|-------------------|-----------|
| 1 | **Bilder nicht sichtbar** — `ExposeImageGallery` erhält `listing.id` statt `property_id` | `InvestmentExposePage.tsx`, `ExposeImageGallery.tsx` | KRITISCH |
| 2 | **Metrics zeigen 0 €** — Cache wird nach Render gefüllt, Kacheln zeigen leere Werte | `SucheTab.tsx`, `InvestmentResultTile.tsx` | KRITISCH |
| 3 | **MOD-09 keine Ergebnisse** — Race-Condition bei `refetch()` und State-Update | `BeratungTab.tsx` | KRITISCH |
| 4 | **Google Maps falsch positioniert** — Mitten im Content statt ganz unten | `InvestmentExposePage.tsx` | HOCH |
| 5 | **Kachel-Design falsch** — 4 gleiche Quadranten statt Bild oben, T-Konto unten | `InvestmentResultTile.tsx` | HOCH |
| 6 | **Kein Titelbild in Suchergebnissen** — `hero_image_path: null` fest gesetzt | `SucheTab.tsx`, `BeratungTab.tsx` | HOCH |

---

## Detaillierte Reparaturen

### 1. Bilder-Query korrigieren (KRITISCH)

**Problem:** Die Bildergalerie fragt nach `object_id = listing.id`, aber Bilder sind an `property_id` gebunden.

**Lösung A: Property-ID in der Query extrahieren**

In `InvestmentExposePage.tsx`:
- Die Query liefert bereits `properties.id` — diesen Wert an `ExposeImageGallery` übergeben
- Änderung: `propertyId={listing.property_id}` statt `propertyId={listing.id}`

**Lösung B: ExposeImageGallery flexibler machen**
- Falls `propertyId` nicht übergeben wird, eine zusätzliche Query ausführen um `property_id` aus dem Listing zu holen

**Betroffene Dateien:**
- `src/pages/portal/investments/InvestmentExposePage.tsx`
- `src/components/investment/ExposeImageGallery.tsx` (optional: Fallback-Logik)

---

### 2. Metrics-Berechnung synchronisieren (KRITISCH)

**Problem:** Die Investment-Engine-Berechnung läuft asynchron. Die Kacheln rendern bevor die Ergebnisse da sind.

**Lösung:**
1. Berechnung blockierend vor dem Setzen von `hasSearched` abschließen
2. `metricsCache` initial mit "loading" State füllen
3. Fallback-Werte basierend auf Standard-Finanzierungsparametern anzeigen

**Betroffene Dateien:**
- `src/pages/portal/investments/SucheTab.tsx`

**Änderung:**
```typescript
const handleInvestmentSearch = useCallback(async () => {
  await refetch();
  
  const newCache: Record<string, any> = {};
  
  // Alle Berechnungen ABWARTEN
  await Promise.all(listings.slice(0, 20).map(async (listing) => {
    const result = await calculate(input);
    if (result) {
      newCache[listing.listing_id] = {
        monthlyBurden: result.summary.monthlyBurden,
        // ...
      };
    }
  }));
  
  setMetricsCache(newCache);
  setHasSearched(true);  // NACH dem Cache-Update
}, [...]);
```

---

### 3. MOD-09 Race-Condition beheben (KRITISCH)

**Problem:** `handleSearch` ruft `refetch()` auf, aber iteriert dann über die alte `rawListings` Variable.

**Lösung:**
```typescript
const handleSearch = useCallback(async () => {
  const { data: freshListings } = await refetch();  // Nutze die frischen Daten
  const listings = freshListings || [];
  
  // Iteriere über listings, nicht rawListings
  for (const listing of listings) {
    // ...calculate
  }
}, [refetch, calculate, searchParams]);  // rawListings NICHT in Dependencies
```

**Betroffene Dateien:**
- `src/pages/portal/vertriebspartner/BeratungTab.tsx`

---

### 4. Google Maps an das Ende verschieben (HOCH)

**Problem:** Map ist bei Zeile 285 platziert, sollte nach allen Tabs/Dokumenten sein.

**Lösung:** Map-Block ans Ende des Left-Column Containers verschieben (nach `DetailTable40Jahre`).

**Betroffene Dateien:**
- `src/pages/portal/investments/InvestmentExposePage.tsx`

**Vorher:**
```
[Image Gallery]
[Property Details]
[Map]  ← HIER IST SIE JETZT
[MasterGraph]
[Haushaltsrechnung]
[DetailTable]
```

**Nachher:**
```
[Image Gallery]
[Property Details]
[MasterGraph]
[Haushaltsrechnung]
[DetailTable]
[Map]  ← HIERHIN VERSCHIEBEN
```

---

### 5. Kachel-Design überarbeiten (HOCH)

**Problem:** Aktuelles Design teilt in 4 gleiche Quadranten. Gewünscht: Bild oben (50%), T-Konto unten (50%).

**Gewünschtes Layout:**

```text
┌─────────────────────────────────────┐
│           [BILD]                    │
│         (Titelbild)                 │
│                                     │
├──────────────────┬──────────────────┤
│  € 220.000       │  3,7% Rendite    │
│  Leipzig · ETW   │  62 m²           │
├──────────────────┴──────────────────┤
│  EINNAHMEN       │  AUSGABEN        │
│  + Miete  €682   │  − Zins   €495   │
│  + Steuer €120   │  − Tilg.  €283   │
├─────────────────────────────────────┤
│  MONATSBELASTUNG: +€24/Mo ✓         │
└─────────────────────────────────────┘
```

**Änderungen:**
- Obere Hälfte: Bild (volle Breite, `aspect-[4/3]` oder `aspect-video`)
- Daten-Bar: Kompakte Zeile mit Preis, Ort, Rendite, Fläche
- Untere Hälfte: T-Konto mit Summierung
- Footer: Monatsbelastung prominent

**Betroffene Dateien:**
- `src/components/investment/InvestmentResultTile.tsx`

---

### 6. Titelbilder in Suchergebnissen laden (HOCH)

**Problem:** `hero_image_path` wird fest auf `null` gesetzt statt das Titelbild zu laden.

**Lösung:** Nach dem Laden der Listings eine zusätzliche Query für Titelbilder ausführen:

```typescript
// In SucheTab.tsx
const propertyIds = listings.map(l => l.properties?.id).filter(Boolean);

// Titelbilder laden
const { data: titleImages } = await supabase
  .from('document_links')
  .select(`
    object_id,
    documents!inner (file_path)
  `)
  .in('object_id', propertyIds)
  .eq('is_title_image', true)
  .eq('object_type', 'property');

// Signed URLs generieren und zuordnen
```

**Betroffene Dateien:**
- `src/pages/portal/investments/SucheTab.tsx`
- `src/pages/portal/vertriebspartner/BeratungTab.tsx`

---

## Technische Umsetzung

### Dateien zu ändern

| Datei | Änderungen |
|-------|------------|
| `InvestmentExposePage.tsx` | 1) Property-ID korrekt extrahieren, 2) Map ans Ende verschieben |
| `ExposeImageGallery.tsx` | Optional: Fallback-Query für property_id |
| `SucheTab.tsx` | 1) Metrics-Berechnung synchronisieren, 2) Titelbilder laden |
| `BeratungTab.tsx` | Race-Condition beheben, Titelbilder laden |
| `InvestmentResultTile.tsx` | Komplettes Redesign: Bild oben, T-Konto unten, Summierung |

---

## Akzeptanzkriterien

| # | Test | Status |
|---|------|--------|
| 1 | Bilder werden in MOD-08 Exposé angezeigt | 🔴 Kaputt |
| 2 | Bilder werden in MOD-09 Modal angezeigt | 🔴 Kaputt |
| 3 | Bilder werden in KAUFY Exposé angezeigt | 🟢 OK |
| 4 | Suchergebnis-Kacheln zeigen Titelbilder | 🔴 Kaputt |
| 5 | Zinsen/Tilgung zeigen korrekte Werte (nicht 0€) | 🔴 Kaputt |
| 6 | MOD-09 zeigt Objekte nach "Berechnen" | 🔴 Kaputt |
| 7 | Google Maps ist ganz unten im Exposé | 🔴 Falsch |
| 8 | Kachel hat korrektes Layout (Bild oben, T-Konto unten) | 🔴 Falsch |
| 9 | Monatsbelastung wird korrekt berechnet und angezeigt | 🔴 Kaputt |
| 10 | Slider-Panel bleibt sticky beim Scrollen | 🟢 OK |

---

## Zusammenfassung

Die Hauptprobleme sind:

1. **Daten-Mapping-Fehler:** `listing.id` wird verwendet wo `property_id` nötig ist
2. **Async-Timing-Probleme:** Rendering vor Daten-Laden
3. **UI-Struktur:** Layout entspricht nicht der Spezifikation

Nach diesen Reparaturen werden alle drei Investment-Ansichten konsistent funktionieren mit korrekten Bildern, Berechnungen und dem gewünschten T-Konto-Layout.
