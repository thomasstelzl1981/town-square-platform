

# Demo-Daten Reparatur -- Runde 2

## Befund-Analyse und Massnahmen

### Befund 1: PV-Darlehen bleibt in Finanzanalyse

**Ursache:** In `useFinanzberichtData.ts` werden `pvPlants` zwar gefiltert (Zeile 187), aber die `portfolioLoans` (Zeile 189) und vor allem die `mietyContracts` und `homes` / `mietyLoans` werden NICHT durch `isDemoId` gefiltert. Das PV-Darlehen kommt aus `pv_plants.loan_*` Feldern oder aus `miety_loans` — beides wird ungefiltert an die Engine weitergereicht.

**Fix:** In `useFinanzberichtData.ts` auch `homes`, `mietyLoans`, `tenancies`, `portfolioProperties` und `legalDocs` filtern:
```typescript
const filteredHomes = demoEnabled ? homes : homes.filter(r => !isDemoId(r.id));
const filteredMietyLoans = demoEnabled ? mietyLoans : mietyLoans.filter(r => !isDemoId(r.id));
const filteredProperties = demoEnabled ? portfolioProperties : portfolioProperties.filter(r => !isDemoId(r.id));
```

---

### Befund 2: Pet-Manager Daten bleiben bei Toggle OFF

**Ursache:** `usePetCustomers.ts` Zeile 78 und 87 liefern **immer** Demo-Kunden als Fallback — ohne Demo-Toggle-Pruefung. Wenn kein Provider existiert ODER keine DB-Kunden vorhanden sind, werden hardcodierte `DEMO_PM_CUSTOMERS` zurueckgegeben.

**Fix:** In `usePetCustomers.ts` den `useDemoToggles` Hook importieren und die Demo-Fallback-Logik an `demoEnabled` koppeln:
```typescript
const { isEnabled } = useDemoToggles();
const demoEnabled = isEnabled('GP-PET');

// Zeile 78: if (!provider) return demoEnabled ? mapDemoCustomers() : [];
// Zeile 87: return dbCustomers.length > 0 ? dbCustomers : (demoEnabled ? mapDemoCustomers() : []);
```

Gleiches Muster fuer `usePetBookings.ts` und alle Pet-Hooks die Demo-Daten als Fallback nutzen.

---

### Befund 3: Projekte-Manager Daten bleiben

Pet-Manager und Projekte-Manager nutzen dasselbe Pattern. Die Cleanup-Engine loescht `acq_mandates` bereits (Zeile 43 in CLEANUP_ORDER). Das Problem ist die **invertierte Filter-Logik** in `AkquiseMandate.tsx` Zeile 551:

```typescript
// FALSCH (aktuell): Filtert Demo-Mandate WENN Demo aktiv ist
mandates.filter(m => !(demoEnabled && isDemoId(m.id)))

// RICHTIG: Filtert Demo-Mandate WENN Demo NICHT aktiv ist
mandates.filter(m => demoEnabled || !isDemoId(m.id))
```

**Fix:** Filter-Logik in `AkquiseMandate.tsx` Zeile 551 korrigieren.

---

### Befund 4: Max Mustermann bleibt in Stammdaten

**Ursache:** `useFinanzanalyseData.ts` filtert `persons` korrekt (Zeile 343-345). Aber die `household_persons`-Records werden trotzdem in der DB gehalten, weil die Cleanup entweder fehlschlaegt oder die DB-Daten noch nicht geloescht wurden. Zudem wird `useFinanzanalyseData` korrekt gefiltert -- das Problem liegt wahrscheinlich in einem **anderen Hook oder einer anderen Seite**, die `household_persons` direkt liest ohne `isDemoId`-Filter.

**Fix:** Alle Stellen die `household_persons` lesen pruefen und sicherstellen, dass sie den Demo-Toggle respektieren. Falls die Daten aus der Cleanup nicht geloescht werden, greift der ID-Pattern-Fallback (bereits implementiert).

---

### Befund 5: Falsche Toast-Nachricht beim Deaktivieren

**Ursache:** In `DemoDatenTab.tsx` Zeile 69-70:
```typescript
{isSeedingOrCleaning 
  ? (allEnabled ? 'Demo-Daten werden eingespielt…' : 'Demo-Daten werden entfernt…')
```

`allEnabled` ist zum Zeitpunkt des Cleanups noch `true` (der Toggle-State wird erst NACH dem Cleanup umgeschaltet in `useDemoToggles.ts` Zeile 122). Daher wird beim Deaktivieren faelschlicherweise "eingespielt" angezeigt.

**Fix:** Statt `allEnabled` eine eigene State-Variable verwenden, die die **Zielrichtung** der Operation speichert. In `useDemoToggles.ts` eine `pendingAction: 'seeding' | 'cleaning' | null` exportieren:
```typescript
const [pendingAction, setPendingAction] = useState<'seeding' | 'cleaning' | null>(null);
// In toggleAll: setPendingAction(on ? 'seeding' : 'cleaning');
// In finally: setPendingAction(null);
```

In `DemoDatenTab.tsx`:
```typescript
{isSeedingOrCleaning 
  ? (pendingAction === 'seeding' ? 'Demo-Daten werden eingespielt…' : 'Demo-Daten werden entfernt…')
```

---

### Befund 6: Stammdatenvertraege (unkritisch)

Wie vom User vermutet: Wahrscheinlich echte Entwicklungsdaten, kein Demo-Daten-Problem. Wird zum Schluss beim finalen Clean-Slate-Test manuell bereinigt. **Keine Code-Aenderung noetig.**

---

### Befund 7: Familie Mustermann Widget in Portfolio

**Status:** Bereits im vorherigen Fix behoben (`{demoEnabled && (...)}` um das Widget in `PortfolioTab.tsx` Zeile 702). Falls es weiterhin sichtbar ist, wurde der Build noch nicht aktualisiert. **Keine weitere Aenderung noetig.**

---

### Befund 8: Briefgenerator — CreateContext Widget + Familie Mustermann

**Problem A:** Der "Neuen Kontext hinzufuegen" Button (`onAddContext`) im `SenderSelector` ist im Briefgenerator sichtbar. Das ist ein Feature-Element, kein Demo-Problem — der Button existiert, damit der Nutzer einen neuen Vermieter-Kontext anlegen kann. Falls er entfernt werden soll:

**Fix A:** In `BriefTab.tsx` Zeile 473 die `onAddContext` Prop entfernen.

**Problem B:** Familie Mustermann erscheint als Absender-Option, weil `landlord_contexts` noch in der DB steht. Die Cleanup-Engine loescht `landlord_contexts` bereits (Zeile 51 in CLEANUP_ORDER). Falls die Daten trotzdem bleiben, liegt es am gleichen Registry-Fallback-Problem. Zusaetzlich fehlt ein `isDemoId`-Filter auf der `contexts`-Query in `BriefTab.tsx` Zeile 131-143.

**Fix B:** In `BriefTab.tsx` die `contexts` Query-Ergebnisse durch `isDemoId` filtern wenn Demo OFF:
```typescript
const filteredContexts = demoEnabled ? contexts : contexts.filter(c => !isDemoId(c.id));
```

---

### Befund 9: Demo-Sanierungsmandat bleibt

**Ursache:** Invertierte Filter-Logik in `AkquiseMandate.tsx` (= Befund 3). Bereits oben als Fix beschrieben.

---

## Zusammenfassung der Aenderungen

| Nr | Datei | Aenderung |
|----|-------|-----------|
| 1 | `src/hooks/useFinanzberichtData.ts` | homes, mietyLoans, properties, tenancies durch isDemoId filtern |
| 2 | `src/hooks/usePetCustomers.ts` | Demo-Fallback an demoEnabled koppeln |
| 3 | `src/pages/portal/akquise-manager/AkquiseMandate.tsx` | Filter-Logik invertieren (Zeile 551) |
| 4 | `src/hooks/useDemoToggles.ts` | `pendingAction` State exportieren |
| 5 | `src/pages/portal/stammdaten/DemoDatenTab.tsx` | Toast-Text via `pendingAction` steuern |
| 6 | `src/pages/portal/office/BriefTab.tsx` | landlord_contexts durch isDemoId filtern, onAddContext entfernen |
| 7 | Weitere Pet-Hooks | Demo-Fallback-Logik pruefen und an Toggle koppeln |

