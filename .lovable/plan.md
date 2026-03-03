

## Befund

Ja — "AWIN Partner" steht aktuell als sichtbares Badge in beiden Shop-Seiten:

- **Zone 3** `LennoxShop.tsx`: Badge `AWIN Partner` (Zeile 22 + 266)
- **Zone 2** `PetsShop.tsx`: Badge `AWIN Partner` (Zeile 36 + 344)

Das ist falsch — AWIN ist unser internes Affiliate-Netzwerk zur Provisionsabrechnung, das darf dem Endkunden **nicht** angezeigt werden.

## Plan

### Änderungen

**1. Zone 3 — `src/pages/zone3/lennox/LennoxShop.tsx`**
- Zeile 22: `badge: 'AWIN Partner'` entfernen → kein Badge oder neutrales Badge wie `'Partner'`
- Zeile 266: Badge `AWIN Partner` entfernen → nur "Zooplus" als Label stehen lassen

**2. Zone 2 — `src/pages/portal/pets/PetsShop.tsx`**
- Zeile 36: `badge: 'AWIN Partner'` entfernen → `badge: 'Partner'` oder komplett weg
- Zeile 344: Badge `AWIN Partner` entfernen → neutrales "Partner"-Badge oder weglassen

### Grundsatz für alle Shops

AWIN (und künftig ADCELL, Impact etc.) sind **interne Affiliate-Netzwerke**. Sie dürfen in keiner kundengerichteten UI erscheinen. Nur im Zone-1-Admin/Service-Desk dürfen diese Bezeichnungen sichtbar sein (dort gehören sie zur operativen Konfiguration).

