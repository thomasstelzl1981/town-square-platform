
# Erweiterung Demo-Daten Engine: MOD-13 Projekte + MOD-12 Akquise + Funktionstest

## Ueberblick

Drei Kernaufgaben:

1. **Demo-Daten Engine erweitern** um MOD-13 (Projekte/Aufteiler) und MOD-12 (Akquise) Referenzen
2. **Bestehende DB-Daten bereinigen**: Akquise-Mandat "Familie Investorius" und Rendsburg-Offer durch Mustermann-konsistente Daten ersetzen, Developer Context umbenennen
3. **Funktionstest**: Screenshots aller Module mit aktivierten/deaktivierten Demo-Daten, tabellarische Auswertung

## 1. Story-Erweiterung: Max Mustermann ist auch Bautraeger

Max Mustermann ist neben seiner IT-Beratung auch als Bautraeger/Aufteiler taetig. Die bestehende Developer-Gesellschaft "Meine Gesellschaft" (`f5071801-...`) wird umbenannt zu **"Mustermann Projektentwicklung GmbH"** und gehoert zum Demo-Tenant.

### Aenderungen an der Developer-Seite

| Entitaet | Aktion | Details |
|---|---|---|
| `developer_contexts` (`f5071801-...`) | UPDATE | name -> "Mustermann Projektentwicklung GmbH", managing_director -> "Max Mustermann" |
| `dev_projects` | INSERT | Demo-Projekt "Residenz am Stadtpark" mit fester UUID, verknuepft mit der Gesellschaft |

Das Demo-Projekt in `demoProjectData.ts` referenziert aktuell `id: 'demo-project-001'` (kein UUID-Format). Da MOD-13 bereits ein funktionierendes clientseitiges Demo-System hat (DEMO_PROJECT, DEMO_UNITS etc.), bleibt dieses bestehen. Die Developer-Context-Verknuepfung wird ueber die DB hergestellt, und in `demoProjectData.ts` wird `DEMO_DEVELOPER_CONTEXT` auf "Mustermann Projektentwicklung GmbH" / "Max Mustermann" aktualisiert.

### Aenderungen an der Akquise-Seite

| Entitaet | Aktion | Details |
|---|---|---|
| `acq_mandates` (`e0000000-...-e001`) | UPDATE | client_display_name -> "Max Mustermann (Demo)", notes aktualisieren |
| `acq_offers` (`f0000000-...-f001`) | UPDATE | title beibehalten (Rendsburg ist ein realistisches Akquise-Objekt fuer den Aufteiler Max) ODER umbenennen auf ein Mustermann-konsistentes Objekt |

Da der User explizit sagte "loeschen wir das Rendsburg-Objekt" und stattdessen ein Mustermandat der Aufteilerfirma anlegen: Die bestehenden Daten werden per UPDATE umbenannt, sodass sie zur Mustermann-Geschichte passen.

## 2. Engine-Erweiterung: `src/engines/demoData/`

### `spec.ts` — Neue Interfaces

```typescript
/** Demo-Akquise-Mandat */
export interface DemoAcqMandate {
  readonly id: string;
  readonly code: string;
  readonly clientDisplayName: string;
  readonly searchArea: { region: string; cities: string[] };
  readonly assetFocus: string[];
  readonly priceRange: { min: number; max: number };
  readonly yieldTarget: number;
}

/** Demo-Projekt (Developer) */
export interface DemoDevProject {
  readonly projectId: string;  // demo-project-001 (clientseitig)
  readonly developerContextId: string;
  readonly developerContextName: string;
  readonly projectName: string;
  readonly city: string;
}
```

### `data.ts` — Neue Konstanten

- `DEMO_ACQ_MANDATE_ID = 'e0000000-0000-4000-e000-000000000001'`
- `DEMO_ACQ_OFFER_ID = 'f0000000-0000-4000-f000-000000000001'`
- `DEMO_DEVELOPER_CONTEXT_ID = 'f5071801-351a-4067-849b-f042af5a247a'`
- Diese IDs werden in `ALL_DEMO_IDS` aufgenommen
- `DEMO_ACQ_MANDATE` und `DEMO_DEV_PROJECT` Konstanten

### `engine.ts` — Keine neuen Funktionen noetig

`isDemoId()` erkennt automatisch die neuen IDs durch die erweiterte `ALL_DEMO_IDS`-Liste.

## 3. Clientseitige Anpassungen

### `demoProjectData.ts`

- `DEMO_DEVELOPER_CONTEXT.name` -> "Mustermann Projektentwicklung GmbH"
- `DEMO_DEVELOPER_CONTEXT.managing_director` -> "Max Mustermann"

### `useDemoAcquisition.ts`

- `clientName` von "Investoren GbR Rhein" -> "Mustermann Projektentwicklung GmbH"
- `mandateCode` -> "ACQ-DEMO-001"
- Suchprofil aktualisieren auf konsistente Mustermann-Story

## 4. SQL-Migration

Eine einzelne Migration:

```sql
-- 1. Developer Context umbenennen
UPDATE developer_contexts 
SET name = 'Mustermann Projektentwicklung GmbH',
    managing_director = 'Max Mustermann'
WHERE id = 'f5071801-351a-4067-849b-f042af5a247a';

-- 2. Akquise-Mandat umbenennen
UPDATE acq_mandates 
SET client_display_name = 'Mustermann Projektentwicklung GmbH (Demo)',
    notes = 'Demo-Mandat: Aufteiler-Akquise fuer Mustermann Projektentwicklung'
WHERE id = 'e0000000-0000-4000-e000-000000000001';

-- 3. Akquise-Offer aktualisieren (Rendsburg -> neues Mustermann-Objekt)
UPDATE acq_offers 
SET title = 'MFH Altbau mit 12 WE — Aufteiler-Potenzial',
    city = 'Muenchen'
WHERE id = 'f0000000-0000-4000-f000-000000000001';
```

## 5. Funktionstest-Plan (Screenshots)

### Runde 1: Demo-Daten AKTIVIERT

Folgende Seiten werden per Browser navigiert und gescreenshottet:

| # | Route | Pruefpunkt |
|---|---|---|
| 1 | `/portal/finanzanalyse/dashboard` | 4 Personen-Widgets (Max, Lisa, Felix, Emma) |
| 2 | `/portal/finanzanalyse/versicherungen` | 7 Versicherungs-Widgets |
| 3 | `/portal/finanzanalyse/vorsorge` | 4 Vorsorge-Widgets |
| 4 | `/portal/finanzanalyse/kv` | PKV (Max) + GKV (Lisa) Widgets |
| 5 | `/portal/finanzanalyse/abos` | 8 Abo-Widgets |
| 6 | `/portal/immobilien/portfolio` | 3 Demo-Properties (BER, MUC, HH) |
| 7 | `/portal/projekte` | Demo-Projekt "Residenz am Stadtpark" |
| 8 | `/portal/projekte/kontexte` | "Mustermann Projektentwicklung GmbH" |
| 9 | `/portal/cars` | 2 Fahrzeuge (Porsche, BMW) |
| 10 | `/portal/photovoltaik` | PV-Anlage |

### Runde 2: Demo-Daten DEAKTIVIERT

Gleiche Routen — Erwartung: Leere Widget-Grids mit Empty-State-CTAs.

### Tabellarische Auswertung

Ergebnis-Tabelle mit Spalten:

| Modul | Route | Demo aktiv: OK? | Demo deaktiviert: Empty State? | Widget-Typ korrekt? | Blauer Rand? |
|---|---|---|---|---|---|

## 6. Dateien-Uebersicht

| Datei | Aktion | Beschreibung |
|---|---|---|
| `src/engines/demoData/spec.ts` | EDIT | Neue Interfaces fuer AcqMandate, DevProject |
| `src/engines/demoData/data.ts` | EDIT | Neue IDs + Konstanten fuer Akquise + Projekte |
| `src/components/projekte/demoProjectData.ts` | EDIT | Developer Context auf Mustermann |
| `src/hooks/useDemoAcquisition.ts` | EDIT | Client auf Mustermann-Firma |
| SQL-Migration | NEU | Developer Context + Akquise-Daten UPDATE |

## 7. Ergebnis

Nach der Umsetzung:
- Max Mustermann ist Privatperson MIT Bautraeger-Gesellschaft "Mustermann Projektentwicklung GmbH"
- Das Demo-Projekt "Residenz am Stadtpark" gehoert zu seiner Firma
- Das Akquise-Mandat gehoert zu seiner Firma (statt "Familie Investorius")
- Alle Demo-IDs sind zentral in der Engine registriert
- Funktionstest mit Screenshots dokumentiert den Ist-Zustand aller Module
