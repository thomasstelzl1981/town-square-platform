

# Fix: "Rechtliches" im Stammdaten-Menue sichtbar machen

## Problem

Die Sub-Tab-Navigation in Zone 2 wird aus `routesManifest.ts` (SSOT) generiert. Der Eintrag fuer "Rechtliches" fehlt im `tiles`-Array von MOD-01 (Zeile 213-219). Die Route selbst existiert bereits in `StammdatenPage.tsx` und der HowItWorks-Eintrag in `moduleContents.ts` ist auch da — aber die Navigation liest ausschliesslich das Manifest.

## Aenderung

**Eine Datei, eine Zeile:**

`src/manifests/routesManifest.ts` — MOD-01 tiles-Array (Zeile 213-219):

Neuen Tile-Eintrag einfuegen:
```text
{ path: "rechtliches", component: "RechtlichesTab", title: "Rechtliches" }
```

Eingefuegt nach "sicherheit" und vor "demo-daten", sodass die Reihenfolge ist:
1. Profil
2. Vertraege
3. Abrechnung
4. Sicherheit
5. Rechtliches  (NEU)
6. Demo-Daten

Keine weiteren Dateien betroffen — Route, Component, Export und HowItWorks-Eintrag existieren bereits.
