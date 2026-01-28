

# Fix-Plan: AdminLayout Development-Bypass

## Zusammenfassung
Der Login wird derzeit erzwungen, weil im `AdminLayout.tsx` der Development-Mode-Bypass fehlt, der im `PortalLayout.tsx` bereits korrekt implementiert ist. Fix 2 (Mock-Tenant) ist **nicht nötig**, da der AuthContext bereits korrekt die echte Organisation (`thomas.stelzl`) lädt.

## Änderung 1: AdminLayout.tsx

### Vorher (Zeile 10-16):
```typescript
const { user, isLoading, memberships } = useAuth();

useEffect(() => {
  if (!isLoading && !user) {
    navigate('/auth');
  }
}, [user, isLoading, navigate]);
```

### Nachher:
```typescript
const { user, isLoading, memberships, isDevelopmentMode } = useAuth();

useEffect(() => {
  if (!isLoading && !user && !isDevelopmentMode) {
    navigate('/auth');
  }
}, [user, isLoading, navigate, isDevelopmentMode]);
```

### Zusätzliche Änderung (Zeile 26-28):
```typescript
// Vorher:
if (!user) {
  return null;
}

// Nachher:
if (!user && !isDevelopmentMode) {
  return null;
}
```

### Zusätzliche Änderung (Zeile 35):
```typescript
// Vorher:
if (!hasAdminAccess && memberships.length > 0) {

// Nachher:
if (!hasAdminAccess && memberships.length > 0 && !isDevelopmentMode) {
```

## Erwartetes Ergebnis
Nach dieser Änderung:
1. Zone 1 (Admin) ist ohne Login im Development-Modus erreichbar
2. Der TestDataManager unter `/admin/tiles` ist zugänglich
3. Du kannst prüfen, ob Testdaten noch vorhanden sind
4. Falls nicht, kannst du die Portfolio-Excel erneut hochladen

## Technische Details

### AuthContext funktioniert korrekt
Der AuthContext versucht bei Development-Mode:
1. Zuerst echte Organisation laden (`organizations` Tabelle)
2. Wenn gefunden → `thomas.stelzl` (UUID: `e808a01b-728e-4ac3-88fe-6edeeae69d6e`)
3. Nur bei Fehler → Fallback auf Mock

### Datenbank-Status (aktuell)
| Tabelle | Anzahl |
|---------|--------|
| organizations | 2 (thomas.stelzl, test) |
| test_data_registry | 0 |
| properties | 0 |
| units | 0 |
| contacts | 0 |

Die Testdaten sind nicht mehr in der Datenbank. Die "fremden Daten" in Zone 3 (Kaufy) waren hardcoded Mock-Daten in `KaufyHome.tsx`, nicht aus der Datenbank.

## Betroffene Dateien
- `src/components/admin/AdminLayout.tsx` (4 kleine Änderungen)

## Nicht betroffen
- `src/contexts/AuthContext.tsx` - funktioniert bereits korrekt
- Zone 2 Portal - hat bereits den Bypass
- Zone 3 Websites - keine Auth-Prüfung

