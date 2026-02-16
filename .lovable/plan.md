

# MOD-18 (Finanzen) von Base nach Client verschieben

## Aenderungen

### 1. `src/manifests/areaConfig.ts` (Zeilen 30-35 und 51-56)

**Client (missions):** MOD-18 wird an erster Stelle eingefuegt:
```
modules: ['MOD-18', 'MOD-02', 'MOD-04', 'MOD-07', 'MOD-06', 'MOD-08']
```
Das ergibt 6 Module unter Client.

**Base:** MOD-18 wird entfernt:
```
modules: ['MOD-03', 'MOD-17', 'MOD-19', 'MOD-01']
```
Base hat dann 4 Module.

### 2. `src/pages/portal/AreaOverviewPage.tsx` (Zeile ~82)

Das Promo-Widget fuer den Bereich Client (missions) wird unterdrueckt. Aenderung der Bedingung:
```
{!isMobile && promo && validAreaKey !== 'missions' && <AreaPromoCard promo={promo} />}
```
So bleibt die Promo-Konfiguration erhalten (kein Datenverlust), wird aber auf der Client-Uebersichtsseite nicht angezeigt. Die anderen Bereiche behalten ihre Promo-Karten.

### 3. Keine Route-Aenderungen

Alle Routen bleiben unveraendert. Es handelt sich ausschliesslich um eine Neugruppierung in der Navigationsdarstellung.

## Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/areaConfig.ts` | MOD-18 von base.modules nach missions.modules (Position 0) |
| `src/pages/portal/AreaOverviewPage.tsx` | Promo-Widget fuer missions ausblenden |

