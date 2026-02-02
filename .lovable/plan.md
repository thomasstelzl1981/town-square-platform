# Plan: Zone-1 Navigation Fix (P0)

## Status: ✅ P0 DONE

---

## BEFORE/AFTER Tabelle

| Item | Before | After | Status |
|------|--------|-------|--------|
| Internal Org existiert | ✅ Vorhanden | Keine Änderung | OK |
| thomas.stelzl platform_admin | ✅ Korrekt | Keine Änderung | OK |
| active_tenant_id = internal | ✅ Korrekt | Keine Änderung | OK |
| Dev-Mode priorisiert internal | ✅ Korrekt | Keine Änderung | OK |
| FutureRoom Gruppe | backbone | **desks** | ✅ FIXED |
| Bankkontakte separat | ❌ Sichtbar | Versteckt (Tab) | ✅ FIXED |
| Finanzierungsmanager separat | ❌ Sichtbar | Versteckt (Tab) | ✅ FIXED |
| FutureRoom Tab-Navigation | ✅ Korrekt | Keine Änderung | OK |

---

## Implementierte Änderungen

### `src/components/admin/AdminSidebar.tsx`

1. **Zeile 105-110**: `getGroupKey()` - FutureRoom jetzt unter `desks` statt `backbone`
2. **Zeile 142-145**: `shouldShowInNav()` - FutureRoom Sub-Routes versteckt

---

## Acceptance Checks

- [x] Zone-1 Sidebar: FutureRoom unter "Operative Desks"
- [x] Zone-1 Sidebar: Bankkontakte NICHT separat sichtbar
- [x] Zone-1 Sidebar: Finanzierungsmanager NICHT separat sichtbar
- [x] /admin/futureroom lädt mit Tab-Navigation
- [x] /admin/futureroom/bankkontakte via Tab erreichbar
- [x] /admin/futureroom/finanzierungsmanager via Tab erreichbar
- [x] /portal/finanzierungsmanager (MOD-11) bleibt Zone-2

---

**Marker: P0 DONE**
