

# MOD-14 (Kommunikation Pro) von "Manager" nach "Service" verschieben

## Aenderung

Eine einzelne Datei: `src/manifests/areaConfig.ts`

- **Zeile 41** (operations/Manager): `MOD-14` aus dem Array entfernen
- **Zeile 48** (services/Service): `MOD-14` zum Array hinzufuegen

### Vorher

```text
operations: ['MOD-13', 'MOD-09', 'MOD-11', 'MOD-12', 'MOD-10', 'MOD-14']
services:   ['MOD-15', 'MOD-05', 'MOD-16', 'MOD-17', 'MOD-19']
```

### Nachher

```text
operations: ['MOD-13', 'MOD-09', 'MOD-11', 'MOD-12', 'MOD-10']
services:   ['MOD-15', 'MOD-05', 'MOD-16', 'MOD-17', 'MOD-19', 'MOD-14']
```

Keine weiteren Dateien betroffen — Routen, Labels und alles andere bleibt unveraendert, da `areaConfig.ts` rein praesentationsbezogen ist.

