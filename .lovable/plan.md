
# MOD-02 (KI-Office) in die Missions-Area verschieben

## Aenderung

Nur eine Datei betroffen: `src/manifests/areaConfig.ts`

### 1. MOD-02 aus Base entfernen (Zeile 43)
Vorher: `modules: ['MOD-05', 'MOD-02', 'MOD-03', 'MOD-16', 'MOD-01']`
Nachher: `modules: ['MOD-05', 'MOD-03', 'MOD-16', 'MOD-01']`

### 2. MOD-02 in Missions einfuegen — als erstes Element (Zeile 29)
Vorher: `modules: ['MOD-04', 'MOD-07', 'MOD-06', 'MOD-08']`
Nachher: `modules: ['MOD-02', 'MOD-04', 'MOD-07', 'MOD-06', 'MOD-08']`

### Ergebnis Level 2 (Missions-Area)

```text
KI-Office | Immobilien | Finanzierung | Verkauf | Immo Suche
```

### Keine weiteren Aenderungen noetig
- Routen bleiben unveraendert (`/portal/ki-office/*`)
- Komponenten bleiben unveraendert
- `deriveAreaFromPath` erkennt MOD-02 automatisch als "missions"
