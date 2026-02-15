
# MOD-09 Umbenennung: "Vertriebspartner" zu "Immomanager"

## Uebersicht

Das Modul MOD-09 soll in der Navigation und auf den Area-Kacheln (Manager-Bereich) von "Vertriebsmanager" bzw. "Vertriebspartner" auf **"Immomanager"** umbenannt werden. Die Routen bleiben unveraendert (`/portal/vertriebspartner/...`).

## Aenderungen

### 1. Label-Override in `areaConfig.ts`

In `moduleLabelOverrides` einen neuen Eintrag hinzufuegen:

```
'MOD-09': 'Immomanager'
```

Dies aendert den Anzeigenamen ueberall dort, wo `getModuleDisplayLabel()` verwendet wird (Area-Kacheln, Navigation).

### 2. Name in `routesManifest.ts`

Den `name`-Wert von MOD-09 von `"Vertriebsmanager"` auf `"Immomanager"` aendern (Zeile 339). Dies ist der Fallback-Name, der verwendet wird wenn kein Label-Override greift.

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/areaConfig.ts` | Neuer Eintrag `'MOD-09': 'Immomanager'` in `moduleLabelOverrides` |
| `src/manifests/routesManifest.ts` | `name: "Vertriebsmanager"` zu `name: "Immomanager"` (Zeile 339) |

Die Routen (`/portal/vertriebspartner/...`) und alle Dateinamen bleiben unveraendert — es handelt sich um eine reine Anzeige-Umbenennung.
