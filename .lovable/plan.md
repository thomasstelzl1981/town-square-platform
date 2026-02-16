
# Demo-Daten Systemweite Konsistenz-Analyse & Fix

## Kernproblem: ID-Mismatch zwischen Engine und Datenbank

Die Demo-Engine (`src/engines/demoData/data.ts`) registriert IDs, die **nicht mit den tatsaechlichen Datenbank-IDs uebereinstimmen**. Dadurch greift `isDemoId()` bei den meisten DB-Datensaetzen ins Leere.

### ID-Mismatch-Tabelle

```text
Entity          | Engine-ID (ALL_DEMO_IDS)              | DB-ID                                  | Match?
----------------|---------------------------------------|----------------------------------------|-------
Properties      | a0000000-...-000000000010/020/030     | d0000000-...-000000000001/002/003      | NEIN
Vehicles        | a0000000-...-000000000050/051         | 00000000-...-000000000301/302          | NEIN
PV Plants       | a0000000-...-000000000060             | 00000000-...-000000000901              | NEIN
Landlord Ctx    | a0000000-...-000000000040             | d0000000-...-000000000010              | NEIN
Contacts        | NICHT REGISTRIERT                     | 00000000-...-000000000101-105          | FEHLT
Finance Req     | NICHT REGISTRIERT                     | 00000000-...-000000000004              | FEHLT
Personen        | b1f6d204-..., e0000000-...-101/102/103| Gleich                                 | OK
Acq Mandate     | e0000000-...-e000-000000000001        | Gleich                                 | OK
Selbstauskunft  | a23366ab-..., 703e1648-...            | Gleich                                 | OK
```

## Vollstaendige Befundliste (16 Findings)

| ID | Modul | Problem | Ursache |
|----|-------|---------|---------|
| DT-100 | Engine (data.ts) | DEMO_PORTFOLIO.propertyIds stimmen nicht mit DB | IDs `a0000000-...010/020/030` vs DB `d0000000-...001/002/003` |
| DT-101 | Engine (data.ts) | DEMO_PORTFOLIO.vehicleIds stimmen nicht mit DB | IDs `a0000000-...050/051` vs DB `00000000-...301/302` |
| DT-102 | Engine (data.ts) | DEMO_PORTFOLIO.pvPlantIds stimmen nicht mit DB | ID `a0000000-...060` vs DB `00000000-...901` |
| DT-103 | Engine (data.ts) | DEMO_PORTFOLIO.landlordContextId stimmt nicht mit DB | ID `a0000000-...040` vs DB `d0000000-...010` |
| DT-104 | Engine (data.ts) | Demo-Kontakte (5 Stueck) nicht in ALL_DEMO_IDS registriert | IDs `00000000-...101-105` fehlen komplett |
| DT-105 | Engine (data.ts) | Demo-Finance-Request nicht in ALL_DEMO_IDS registriert | ID `00000000-...004` fehlt |
| DT-106 | KontakteTab | Keine Demo-Filterung, 5 Demo-Kontakte immer sichtbar | Kein isDemoId/useDemoToggles |
| DT-107 | KrankenversicherungTab | Toggle-Key falsch: `GP-18` statt `GP-KONTEN` | Toggle greift nie |
| DT-108 | Projekte PortfolioTab | Kein useDemoToggles, Demo-Projekt immer sichtbar | isDemoProject wird ohne Toggle geprueft |
| DT-109 | Projekte LandingPageTab | Kein useDemoToggles, Demo-Projekt immer sichtbar | Gleich wie DT-108 |
| DT-110 | Projekte VertriebTab | Kein useDemoToggles, Demo-Projekt immer sichtbar | Gleich wie DT-108 |
| DT-111 | useVerwaltungData | showDemo wird geholt aber nie zum Filtern genutzt | is_demo Properties werden nicht gefiltert |
| DT-112 | CarsFahrzeuge | isDemoId greift nicht (falsche IDs in Engine) | Siehe DT-101 |
| DT-113 | CarsAutos | isDemoId greift nicht (falsche IDs in Engine) | Siehe DT-101 |
| DT-114 | AnlagenTab (PV) | isDemoId greift nicht (falsche IDs in Engine) | Siehe DT-102 |
| DT-115 | FinanceRequestWidgets | isDemoId greift nicht (falsche ID in Engine) | Siehe DT-105 |

## Implementierungsplan

### Phase 1: Engine-IDs korrigieren (SSOT-Fix) — 1 Datei

**`src/engines/demoData/data.ts`**

Die `DEMO_PORTFOLIO`-Referenzen muessen auf die tatsaechlichen DB-IDs aktualisiert werden:

```typescript
export const DEMO_PORTFOLIO: DemoPortfolioRefs = {
  propertyIds: [
    'd0000000-0000-4000-a000-000000000001', // Berlin
    'd0000000-0000-4000-a000-000000000002', // Muenchen
    'd0000000-0000-4000-a000-000000000003', // Hamburg
  ],
  vehicleIds: [
    '00000000-0000-4000-a000-000000000301', // Porsche 911
    '00000000-0000-4000-a000-000000000302', // BMW M5
  ],
  pvPlantIds: [
    '00000000-0000-4000-a000-000000000901', // PV 32.4 kWp
  ],
  landlordContextId: 'd0000000-0000-4000-a000-000000000010',
};
```

Neue IDs in `ALL_DEMO_IDS` hinzufuegen:
- 5 Demo-Kontakte: `00000000-0000-4000-a000-000000000101` bis `...105`
- Demo-Finance-Request: `00000000-0000-4000-a000-000000000004`

### Phase 2: Fehlende Toggle-Checks einbauen (5 Dateien)

**1. `src/pages/portal/office/KontakteTab.tsx`**
- `useDemoToggles` + `isDemoId` importieren
- Kontakte-Query-Ergebnis filtern wenn GP-KONTEN Toggle OFF

**2. `src/pages/portal/finanzanalyse/KrankenversicherungTab.tsx`**
- Toggle-Key von `GP-18` auf `GP-KONTEN` korrigieren

**3. `src/pages/portal/projekte/PortfolioTab.tsx`**
- `useDemoToggles` importieren, bei Toggle OFF Demo-Projekt nicht anzeigen

**4. `src/pages/portal/projekte/LandingPageTab.tsx`**
- `useDemoToggles` importieren, bei Toggle OFF Demo-Projekt nicht anzeigen

**5. `src/pages/portal/projekte/VertriebTab.tsx`**
- `useDemoToggles` importieren, bei Toggle OFF Demo-Projekt nicht anzeigen

### Phase 3: Verwaltung Demo-Filter aktivieren (1 Datei)

**`src/hooks/useVerwaltungData.ts`**
- `showDemo` wird bereits abgefragt, aber nicht genutzt
- `verwaltungProperties` filtern: wenn `showDemo === false`, Eintraege mit `isDemo: true` ausschliessen

### Phase 4: Fahrzeuge-ID-Fix (2 Dateien)

**`src/components/portal/cars/CarsFahrzeuge.tsx`** und **`CarsAutos.tsx`**
- Die hardcodierten Demo-ID-Checks (`['demo-1','demo-2','demo-3']`) durch `isDemoId()` ersetzen
- Nach Phase 1 greifen die korrekten DB-IDs automatisch

### Phase 5: Backlog + Test-Update (2 Dateien)

**`spec/audit/demo_toggle_consistency_backlog.json`**
- Aktualisieren auf v2.0 mit allen 16 Findings

**`src/test/demoDataSystem.test.ts`**
- Tests fuer korrekte ID-Zuordnung (DB-IDs vs Engine-IDs)
- Tests fuer Kontakte-Filterung
- Tests fuer Projekte-Toggle in Sub-Tabs

## Zusammenfassung

Das Hauptproblem ist, dass die Demo-Engine falsche IDs registriert hat (Phase 1). Dadurch funktioniert `isDemoId()` nicht fuer Properties, Vehicles, PV-Anlagen und den Landlord-Context. Zusaetzlich fehlen Kontakte und Finance-Requests komplett in der ID-Registry. Phase 1 behebt die Ursache, die weiteren Phasen schliessen die verbliebenen Luecken in Kontakten, KV-Toggle, Projekt-Tabs und Verwaltung.
