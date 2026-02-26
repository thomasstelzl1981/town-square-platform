

# Analyse: Schutzluecken und technische Optionen

## Ist-Zustand

Der aktuelle Freeze schuetzt **ausschliesslich Modul-Pages und Modul-Components** (Zone 2). Drei Kategorien von Code, die fuer die Stabilitaet der fertigen Features entscheidend sind, liegen **ausserhalb** des Freeze-Perimeters:

```text
┌─────────────────────────────────────────────────────────┐
│  GESCHUETZT (Module Freeze)                             │
│  src/pages/portal/<modul>/*                             │
│  src/components/<modul>/*                               │
├─────────────────────────────────────────────────────────┤
│  NICHT GESCHUETZT (Regressions-Risiko)                  │
│                                                         │
│  1. src/engines/*          ← Berechnungslogik           │
│  2. src/pages/zone3/*      ← Kaufy, SoT, Miety, etc.   │
│  3. src/goldenpath/*       ← Guard, Resolvers, Engine   │
│  4. src/manifests/*        ← Routing, Tiles, Areas      │
│  5. src/hooks/*            ← Shared Hooks               │
│  6. src/components/investment/*  ← Shared UI            │
│  7. supabase/functions/*   ← Edge Functions             │
└─────────────────────────────────────────────────────────┘
```

## Vorgeschlagene Loesung: Erweiterter Freeze mit 3 neuen Layern

### Layer 1: Engine Freeze (`engines_freeze.json`)

Neue Datei `spec/current/00_frozen/engines_freeze.json` mit derselben Struktur wie `modules_freeze.json`. Jede Engine (ENG-AKQUISE, ENG-FINANCE, ENG-PROVISION, etc.) kann individuell eingefroren werden. Pfade: `src/engines/<name>/*`.

AI-Instruktion in Custom Knowledge erweitert: Vor jeder Aenderung an `src/engines/*` muss `engines_freeze.json` geprueft werden.

### Layer 2: Zone 3 Freeze (`zone3_freeze.json`)

Neue Datei `spec/current/00_frozen/zone3_freeze.json`. Jede Website (KAUFY, SOT, MIETY, FUTUREROOM, ACQUIARY, LENNOX) kann individuell eingefroren werden. Pfade: `src/pages/zone3/<site>/*`.

### Layer 3: Infrastructure Freeze (`infra_freeze.json`)

Neue Datei `spec/current/00_frozen/infra_freeze.json` fuer:
- `goldenpath` -- `src/goldenpath/*`
- `manifests` -- `src/manifests/*`
- `shared_investment` -- `src/components/investment/*`
- `shared_listings` -- `src/components/listings/*`
- `edge_functions` -- `supabase/functions/*`
- `validation` -- `src/validation/*`

### Aenderung an Custom Knowledge (Regel A)

Regel A erweitern um drei zusaetzliche Pruefschritte:
1. `engines_freeze.json` pruefen bei Aenderungen in `src/engines/*`
2. `zone3_freeze.json` pruefen bei Aenderungen in `src/pages/zone3/*`
3. `infra_freeze.json` pruefen bei Aenderungen an Golden Path, Manifests, Shared Components, Edge Functions

## Umsetzungsschritte

1. Erstelle `spec/current/00_frozen/engines_freeze.json` mit allen 12 Engines, initial `frozen: true`
2. Erstelle `spec/current/00_frozen/zone3_freeze.json` mit allen 6 Websites, initial `frozen: true`
3. Erstelle `spec/current/00_frozen/infra_freeze.json` mit den 6 Infrastruktur-Bereichen, initial `frozen: true`
4. Aktualisiere die Custom Knowledge Regel A um die drei neuen Freeze-Checks

