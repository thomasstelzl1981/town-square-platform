

# Filter MOD-08 und MOD-09 auf Kaufy-Showcase-Units

**UNFREEZE MOD-08** und **UNFREEZE MOD-09** akzeptiert.

## Analyse

Aktuell:
- **MOD-08 SucheTab**: Fragt ALLE aktiven Listings ab (kein Channel-Filter)
- **MOD-09 KatalogTab**: Fragt alle `partner_network`-Publikationen ab (72 Stück)
- **MOD-09 BeratungTab**: Gleiche Logik wie KatalogTab

Ziel: Nur die 5 Kaufy-Showcase-Units anzeigen.

## Änderungen (3 Dateien)

### 1. `src/pages/portal/investments/SucheTab.tsx`
Query erweitern: Vor dem Listings-Fetch zuerst die `listing_ids` aus `listing_publications` holen, gefiltert auf `channel = 'kaufy'` und `status = 'active'`. Dann nur diese Listings laden.

### 2. `src/pages/portal/vertriebspartner/KatalogTab.tsx`
Channel-Filter von `'partner_network'` auf `'kaufy'` ändern (Zeile 100):
```tsx
.eq('channel', 'kaufy')
```

### 3. `src/pages/portal/vertriebspartner/BeratungTab.tsx`
Gleiche Änderung wie KatalogTab — Channel-Filter auf `'kaufy'` (Zeile 139):
```tsx
.eq('channel', 'kaufy')
```

## Ergebnis

Alle drei Module zeigen nur noch die 5 explizit für Kaufy freigegebenen Showcase-Units.

