

## MOD-13 Demo-Daten vervollstaendigen: 24 Units + InvestEngine-Flag

### Ist-Zustand
- Demo-Projekt "Eisenacher Straße 12" existiert in `dev_projects` (ID: `f0000000-...013001`)
- **0 Units** in `dev_project_units` — daher keine Preisliste sichtbar
- `invest_engine_analyzed = false` — daher kein InvestEngine-Zugang
- Die Datei `demoProjectData.ts` hat 24 hardcoded Demo-Units, aber die werden nur im UI-Fallback (kein DB-Projekt) gezeigt — sobald ein DB-Projekt existiert, erwartet das UI echte `dev_project_units`-Rows

### Soll-Zustand
- 24 Units in `dev_project_units` mit realistischen Daten (4x 1-Zimmer, 8x 2-Zimmer, 8x 3-Zimmer, 4x 4-Zimmer)
- Projekt-Flag `invest_engine_analyzed = true`
- Weitere Projekt-Felder befuellt: `address`, `construction_year`, `afa_model`, `land_share_percent`, `afa_rate_percent`
- Seed-Engine erweitert, damit Cleanup + Re-Seed funktioniert

### Umsetzung

| # | Datei / Aktion | Detail |
|---|----------------|--------|
| 1 | `public/demo-data/demo_dev_project_units.csv` | **Neue CSV** mit 24 Units (Semicolon-delimited), IDs `f0000000-0000-4000-a000-000000013101` bis `...013124` |
| 2 | `src/engines/demoData/data.ts` | Projekt-Konstanten erweitern: `address`, `constructionYear`, `afaModel`, `landSharePercent` |
| 3 | `src/hooks/useDemoSeedEngine.ts` | `seedDevProject()` erweitern: fehlende Felder setzen + `invest_engine_analyzed: true`; Neue Funktion `seedDevProjectUnits()` die CSV parsed und upserted; Cleanup erweitern fuer `dev_project_units`; Zaehler aktualisieren |
| 4 | `src/hooks/useDemoCleanup.ts` | `dev_project_units` in Cleanup-Reihenfolge einfuegen (vor `dev_projects`) |
| 5 | `public/demo-data/demo_manifest.json` | Neuen Entity-Eintrag `dev_project_units` registrieren |
| 6 | DB: `dev_projects` UPDATE | `invest_engine_analyzed = true`, `address = 'Eisenacher Straße 12'`, `construction_year = 1912` fuer Demo-Tenant |
| 7 | DB: `dev_project_units` INSERT | 24 Units direkt einfuegen fuer bestehenden Demo-Tenant |

### Unit-Verteilung (24 Einheiten)

```text
Typ       | Anzahl | Flaeche | Listenpreis-Range | Miete netto
1-Zimmer  |   4    |  30 m²  | 140k - 150k       | 420 - 450 EUR
2-Zimmer  |   8    |  55 m²  | 260k - 280k       | 770 - 810 EUR
3-Zimmer  |   8    |  75 m²  | 355k - 375k       | 1.050 - 1.100 EUR
4-Zimmer  |   4    |  95 m²  | 450k - 470k       | 1.330 - 1.390 EUR
```

### Kein Freeze-Verstoss
- MOD-13 Code wird nicht geaendert (frozen)
- Aenderungen betreffen nur: `src/hooks/` (Shared), `src/engines/demoData/` (Shared), `public/demo-data/` (Data), DB-Daten
