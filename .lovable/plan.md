
# MOD-17 Fahrtenbuch — Implementierung abgeschlossen

## Status: ✅ DONE

### Phase 1 — DB & Engine ✅
- 8 DB-Tabellen erstellt, `cars_trips` erweitert
- Trip Engine (`spec.ts` + `engine.ts`) erstellt
- `VimcarLogbook` entfernt, `LogbookSection` mit Collapsed Widgets eingebaut

### Phase 2 — Edge Function `sot-telematics-sync` ✅
- Edge Function erstellt und deployed
- Pollt Traccar REST API, normalisiert Positionen, führt Trip-Detection aus

### Phase 3 — UI Expanded View ✅
- 6 Sektionen implementiert: DeviceInfo, OpenTrips, TripList, MonthClose, Export, AuditLog
- LogbookCreateFlow für Fahrzeug-Tracker-Verknüpfung

### Phase 4 — Cleanup ✅
- `CarsFahrtenbuch.tsx` gelöscht
- `LOGBOOK_OFFERS` entfernt

### Final Cleanup ✅
- VehicleDetailPage: Legacy-Fahrtenbuch-Tab + Queries entfernt
- CarsFahrzeuge: Toter Kommentar entfernt
- DB: `cars_logbook_connections` Tabelle gedroppt
