
# Demodaten-Bereinigung: Duplikate und Halluzinationen beseitigen

## Problem-Analyse

### Problem 1: Doppelte Eintraege in Katalog und Suche
Die Demo-Immobilien (BER-01, MUC-01, HH-01) existieren **doppelt**:
- Als Client-seitige Demo-Daten im Hook `useDemoListings.ts` (4 Eintraege: 3 Wohnungen + Residenz am Stadtpark)
- Als echte Datenbank-Eintraege in `properties`, `listings` und `listing_publications`

Beide werden zusammengefuehrt und angezeigt — daher sieht man z.B. im Katalog 7 statt 4 Eintraege.

**Betroffene Module:**
- MOD-09 Katalog (`KatalogTab.tsx` Zeile 145: `[...demoPartnerListings, ...listings]`)
- MOD-08 Suche (`SucheTab.tsx`: `demoListings` + DB-Ergebnisse)
- MOD-08 Kaufy Zone 3 (`Kaufy2026Home.tsx`)
- Zone 1 Sales Desk (`SalesDesk.tsx`)

### Problem 2: "MFH Duesseldorf" — Phantom-Immobilie in Verwaltung
In `useMSVData.ts` ist ein hardcodiertes Demo-Objekt "MFH Duesseldorf, Koenigsallee 42" definiert (Zeile 84-94), das in keiner Datenbank existiert. Es wird bei aktivem Toggle immer eingefuegt.

### Problem 3: Beratung zeigt keine Ergebnisse
Die Beratung (`BeratungTab.tsx`) zeigt standardmaessig nichts, weil `hasSearched` auf `false` startet. Der User muss erst "Ergebnisse anzeigen" klicken. Es werden aber **keine Demo-Daten** eingeblendet (im Gegensatz zum Katalog). Wenn gesucht wird, sollten die DB-Listings korrekt erscheinen.

## Loesung: Deduplizierung und Bereinigung

### Strategie
Da die 3 Kern-Immobilien (BER-01, MUC-01, HH-01) bereits als echte DB-Eintraege existieren (`is_demo=true`), muss der Client-seitige Demo-Layer diese **nicht nochmals** hinzufuegen, wenn die DB sie bereits liefert. Die Loesung: **DB-Ergebnisse pruefen und nur fehlende Demo-Eintraege ergaenzen** (Deduplizierung).

### Aenderung 1: `KatalogTab.tsx` — Deduplizierung
In Zeile 145 wird aktuell blind zusammengefuehrt:
```
const allListings = [...demoPartnerListings, ...listings]
```
Neu: Nur Demo-Eintraege einmischen, deren `public_id` nicht bereits in den DB-Ergebnissen enthalten ist.

### Aenderung 2: `SucheTab.tsx` (MOD-08) — Deduplizierung
Gleiche Logik: Demo-Kaufy-Listings nur einmischen, wenn die DB sie nicht bereits liefert.

### Aenderung 3: `Kaufy2026Home.tsx` (Zone 3) — Deduplizierung
Gleiche Dedup-Logik anwenden.

### Aenderung 4: `SalesDesk.tsx` (Zone 1) — Deduplizierung
Gleiche Dedup-Logik fuer `salesDeskListings` und `mandateListings`.

### Aenderung 5: `useMSVData.ts` — MFH Duesseldorf entfernen
Das hardcodierte Demo-Objekt "MFH Duesseldorf" hat keinen Gegenpart in der Datenbank. Es wird entfernt. Die 3 echten Demo-Properties (BER-01, MUC-01, HH-01) erscheinen korrekt aus der DB, wenn sie `rental_managed=true` haben. Alternativ: Nur das `isDemo`-Badge von den DB-Properties beibehalten, den hardcodierten Duesseldorf-Eintrag aber streichen.

### Aenderung 6: `BeratungTab.tsx` — Demo-Listings einblenden
Die Beratung zeigt aktuell nur DB-Ergebnisse nach Klick auf "Suche". Demo-Partner-Listings (ohne Provision) sollen **sofort sichtbar** sein, wie im Katalog — aber dedupliziert.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/vertriebspartner/KatalogTab.tsx` | Dedup: DB-IDs pruefen vor Demo-Merge |
| `src/pages/portal/investments/SucheTab.tsx` | Dedup: DB-IDs pruefen vor Demo-Merge |
| `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx` | Dedup: DB-IDs pruefen vor Demo-Merge |
| `src/pages/admin/desks/SalesDesk.tsx` | Dedup: DB-IDs pruefen vor Demo-Merge |
| `src/hooks/useMSVData.ts` | MFH Duesseldorf hardcoded Demo entfernen |
| `src/pages/portal/vertriebspartner/BeratungTab.tsx` | Demo-Listings als Sofort-Ansicht integrieren |

## Technischer Ansatz: Dedup-Helper

Ein wiederverwendbarer Helper in `useDemoListings.ts`:

```typescript
export function deduplicateByField<T>(
  demoItems: T[], 
  dbItems: T[], 
  keyFn: (item: T) => string
): T[] {
  const dbKeys = new Set(dbItems.map(keyFn));
  const uniqueDemo = demoItems.filter(d => !dbKeys.has(keyFn(d)));
  return [...uniqueDemo, ...dbItems];
}
```

Dieser wird in allen betroffenen Modulen anstelle des blinden Spread-Operators verwendet.
