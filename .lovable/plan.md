
# Cleanup: Fahrtenbuch-Altlasten bereinigen

## Befund

1. **VehicleDetailPage.tsx** (Zeile 227-241, 361-364, 512-586): Enthalt noch den alten "Fahrtenbuch"-Tab mit `cars_logbook_connections`-Query und Vimcar-UI ("Vimcar verbinden", Provider-Verbindung). Das ist Legacy-Code — das Fahrtenbuch ist jetzt eigenständig in `LogbookSection`.

2. **`cars_logbook_connections`** Tabelle: Existiert noch in der DB. Wird nur von VehicleDetailPage referenziert. Kann gedroppt werden.

3. **CarsFahrzeuge.tsx Zeile 603**: Toter Kommentar `// VimcarLogbook removed — replaced by LogbookSection`.

## Änderungen

### 1. VehicleDetailPage.tsx — Fahrtenbuch-Tab entfernen
- Zeile 227-241: `logbookConnection`-Query entfernen
- Zeile 243-258: `trips`-Query entfernen (Trips werden jetzt über LogbookSection/logbook_id geladen)
- Zeile 361-364: `fahrtenbuch` TabsTrigger entfernen
- Zeile 512-586: `TabsContent value="fahrtenbuch"` komplett entfernen
- Import `BookOpen` kann bleiben (falls anderswo genutzt) oder entfernt werden

### 2. CarsFahrzeuge.tsx — Toter Kommentar entfernen
- Zeile 603: `// VimcarLogbook removed` Kommentar löschen

### 3. DB-Migration: `cars_logbook_connections` droppen
```sql
DROP TABLE IF EXISTS public.cars_logbook_connections CASCADE;
```
Die Tabelle wird nirgends mehr gebraucht — das neue System nutzt `cars_logbooks` + `cars_devices`.

### 4. plan.md aktualisieren
- `.lovable/plan.md` mit Cleanup-Status aktualisieren (Phasen 2-4 abgeschlossen, Cleanup done)
