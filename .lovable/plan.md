
# Demo-Daten Systemtest & Konsistenz-Fix

## Zusammenfassung

Die Demo-Daten-Filterung ist in vielen Modulen nicht implementiert. Beim Deaktivieren der Demo-Toggles bleiben die Daten sichtbar, weil `isDemoId()` und `useDemoToggles()` nicht in alle relevanten Komponenten integriert sind.

## Befunde (Backlog)

| ID | Modul | Problem | Toggle-Prozess | Fix-Typ |
|-----|-------|---------|-----------------|---------|
| DT-001 | Fahrzeuge (CarsFahrzeuge) | Demo-Widgets haben keinen Emerald-Glow, werden immer gezeigt wenn keine DB-Daten | GP-FAHRZEUG | Glow hinzufuegen, Toggle-Logik fixen |
| DT-002 | Fahrzeuge (CarsAutos) | Kein Toggle-Check, Demo-Daten immer sichtbar wenn keine DB-Daten | GP-FAHRZEUG | useDemoToggles integrieren |
| DT-003 | Photovoltaik (AnlagenTab) | Demo-Widget korrekt per Toggle gesteuert, aber DB-geseedete PV-Anlage wird nicht gefiltert | GP-PV-ANLAGE | isDemoId auf plants-Query anwenden |
| DT-004 | Abonnements (AbonnementsTab) | Kein Toggle-Check, alle DB-Demo-Abos sichtbar | GP-KONTEN | useDemoToggles + isDemoId integrieren |
| DT-005 | Zuhause (UebersichtTile) | Kein Toggle-Check, Auto-Create-Logik, kein Demo-Filtering | GP-PORTFOLIO | Kein direkter Demo-Datensatz, aber Zuhause ist echte Profildaten (kein Fix noetig) |
| DT-006 | Projekte (ProjekteDashboard) | Demo-Widget korrekt per Toggle gesteuert, Projekte-Daten in PortfolioTab ebenfalls | GP-PROJEKT | Bereits korrekt implementiert |
| DT-007 | Akquise (AkquiseMandate) | Demo-Mandat per Toggle gesteuert, aber DB-geseedetes Mandat wird zusaetzlich geladen | GP-AKQUISE-MANDAT | isDemoId auf mandates-Query anwenden |
| DT-008 | Immobilien Portfolio | Demo-Widget wird angezeigt aber DB-Properties gefiltert (inkonsistent) | GP-PORTFOLIO | Properties per isDemoId filtern wenn Toggle off |
| DT-009 | Selbstauskunft (MOD-07) | Demo-Applicant-Profiles in DB nicht gefiltert, Mustermann-Daten bleiben sichtbar | GP-FINANZIERUNG | isDemoId auf applicant_profiles anwenden |
| DT-010 | Finanzierungsanfrage (FinanceRequestWidgets) | Demo-Widget korrekt disabled (grayed out), aber DB-geseedete finance_requests bleiben | GP-FINANZIERUNG | isDemoId auf requests-Query anwenden |
| DT-011 | KV-Tab | Clientseitige Demo-KV-Daten nicht per Toggle gefiltert | GP-KONTEN | useDemoToggles check hinzufuegen |

## Implementierungsplan

### Phase 1: Fehlende isDemoId-Filterung in DB-Queries (6 Dateien)

**1. `src/pages/portal/finanzanalyse/AbonnementsTab.tsx`**
- Import `isDemoId` und `useDemoToggles`
- Query-Ergebnis (`subs`) filtern: wenn GP-KONTEN Toggle OFF, alle Records mit `isDemoId(s.id)` ausblenden

**2. `src/components/portal/cars/CarsAutos.tsx`**
- Import `useDemoToggles`
- Wenn GP-FAHRZEUG Toggle OFF: leeres Array statt DEMO_VEHICLES als Fallback

**3. `src/components/portal/cars/CarsFahrzeuge.tsx`**
- Bereits teilweise implementiert (Zeile 165-167), aber die Logik prueft nur `dbVehicles?.length` -- wenn DB-Fahrzeuge (geseedet) existieren, wird der Demo-Fallback nie erreicht
- Fix: Auch DB-Ergebnisse per `isDemoId` filtern wenn Toggle OFF

**4. `src/pages/portal/photovoltaik/AnlagenTab.tsx`**
- `plants`-Array filtern: wenn GP-PV-ANLAGE Toggle OFF, geseedete PV-Anlagen (mit Demo-IDs) ausblenden

**5. `src/components/finanzierung/FinanceRequestWidgets.tsx`**
- `requests`-Array filtern: wenn GP-FINANZIERUNG Toggle OFF, Demo-finance_requests per isDemoId ausblenden

**6. `src/pages/portal/finanzierung/SelbstauskunftTab.tsx`**
- Wenn GP-FINANZIERUNG Toggle OFF: Demo-Applicant-Profiles (Mustermann-Daten) leeren oder nicht laden
- Hier muessen die Demo-Profile-IDs (`DEMO_SELBSTAUSKUNFT_PRIMARY_ID`, `DEMO_SELBSTAUSKUNFT_CO_ID`) geprueft werden

### Phase 2: KV-Tab clientseitige Filterung (1 Datei)

**7. `src/pages/portal/finanzanalyse/KrankenversicherungTab.tsx`**
- Import `useDemoToggles`
- Wenn GP-KONTEN Toggle OFF: Demo-KV-Daten nicht rendern

### Phase 3: Akquise-Mandate DB-Filterung (1 Datei)

**8. `src/pages/portal/akquise-manager/AkquiseMandate.tsx`**
- Die `mandates`-Query filtern: wenn GP-AKQUISE-MANDAT Toggle OFF, Demo-Mandate per isDemoId ausblenden

### Phase 4: Glow-Konsistenz Fahrzeuge (2 Dateien)

**9. `src/components/portal/cars/CarsFahrzeuge.tsx`** und **`CarsAutos.tsx`**
- Demo-Fahrzeug-Widgets mit Emerald-Glow und Demo-Badge versehen (DESIGN.DEMO_WIDGET.CARD)

### Phase 5: Backlog-Datei + Test-Update

**10. Neue Backlog-Datei**: `spec/audit/demo_toggle_consistency_backlog.json`
- Alle DT-001 bis DT-011 Befunde dokumentieren

**11. Test-Datei aktualisieren**: `src/test/demoDataSystem.test.ts`
- Neue Tests fuer Toggle-OFF State in allen Modulen
- State-Matrix-Tests erweitern

## Technische Details

### Pattern fuer DB-Filterung (wiederkehrend)

```typescript
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';

// Im Component:
const { isEnabled } = useDemoToggles();
const demoEnabled = isEnabled('GP-XXXX');

// Nach Query:
const filteredData = useMemo(
  () => demoEnabled ? rawData : rawData.filter(item => !isDemoId(item.id)),
  [rawData, demoEnabled]
);
```

### Reihenfolge

1. Phase 1 (DB-Filterung) -- hoechste Prioritaet, behebt die Kernprobleme
2. Phase 2-3 (KV + Akquise) -- ergaenzend
3. Phase 4 (Glow) -- visuell
4. Phase 5 (Dokumentation + Tests) -- Abschluss
