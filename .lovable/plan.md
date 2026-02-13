
# MOD-17 (Fahrzeuge) von Service nach Base verschieben

## Aenderung

Eine einzige Datei muss angepasst werden: `src/manifests/areaConfig.ts`

- **Services-Array** (Zeile 50): `MOD-17` entfernen
  - Vorher: `['MOD-14', 'MOD-15', 'MOD-05', 'MOD-16', 'MOD-17']`
  - Nachher: `['MOD-14', 'MOD-15', 'MOD-05', 'MOD-16']`

- **Base-Array** (Zeile 43): `MOD-17` hinzufuegen
  - Vorher: `['MOD-03', 'MOD-18', 'MOD-19', 'MOD-01']`
  - Nachher: `['MOD-03', 'MOD-18', 'MOD-19', 'MOD-01', 'MOD-17']`

Keine weiteren Dateien betroffen. Die Routen, Labels und alle anderen Referenzen bleiben unveraendert, da `areaConfig` rein praesentationsbezogen ist.
