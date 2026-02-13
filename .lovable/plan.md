

# Missions-Reihenfolge und Umbenennung

## Aktuelle Reihenfolge (areaConfig.ts)

1. MOD-04 — Immobilien
2. MOD-20 — Zuhause (Display) / Miety (intern)
3. MOD-06 — Verkauf
4. MOD-07 — Finanzierung
5. MOD-08 — Investment-Suche

## Neue Reihenfolge

1. MOD-20 — **Haus** (umbenennen von "Zuhause")
2. MOD-04 — Immobilien
3. MOD-07 — Finanzierung
4. MOD-06 — Verkauf
5. MOD-08 — **Immo Suche** (umbenennen von "Investment-Suche")

## Betroffene Dateien

### 1. `src/manifests/areaConfig.ts`
- Missions-Array neu ordnen: `['MOD-20', 'MOD-04', 'MOD-07', 'MOD-06', 'MOD-08']`
- `moduleLabelOverrides`: MOD-20 von "Zuhause" auf "Haus" aendern
- `moduleLabelOverrides`: MOD-08 hinzufuegen mit Wert "Immo Suche"

### 2. `src/components/portal/HowItWorks/moduleContents.ts`
- MOD-08 title: "Investment-Suche" auf "Immo Suche" aendern
- MOD-20 title: "Miety" bleibt (interner Name), aber oneLiner/Darstellung wird durch moduleLabelOverrides gesteuert

### 3. `artifacts/audit/zone2_modules.json`
- MOD-08 name: "Investment-Suche" auf "Immo Suche" aendern

### 4. Spec-Dateien (sofern vorhanden)
- `spec/current/02_modules/mod-08_investment-suche.md` — Titel aktualisieren
- Frozen-Audit-Dateien — MOD-08 Bezeichnung anpassen

## Keine Routing-Aenderungen

Die internen Routen (`base: "investments"`, `base: "miety"`) bleiben unveraendert. Die Aenderungen sind rein praesentationsbezogen (Display-Labels und Reihenfolge in der Navigation).

## Technische Details

Die Reihenfolge der Module im Missions-Submenue wird ausschliesslich durch die Array-Position in `areaConfig.ts` bestimmt. Der `display_order` in `routesManifest.ts` betrifft die globale Modul-Sortierung und wird hier nicht geaendert — die Area-Navigation nutzt die Array-Reihenfolge aus `areaConfig`.

