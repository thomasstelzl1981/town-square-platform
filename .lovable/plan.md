
# Plan: Zone-1 Navigation Fix (P0)

## Zusammenfassung der Analyse

**Datenbank:** Vollständig korrekt. Keine Änderungen erforderlich.  
**AuthContext:** Bereits korrekt implementiert (internal org prioritisiert).  
**Problem:** Nur AdminSidebar.tsx zeigt FutureRoom falsch an.

---

## Konkrete Änderungen

### Datei: `src/components/admin/AdminSidebar.tsx`

#### 1. Gruppierung korrigieren (Zeile 105)

**Vorher:**
```typescript
if (path.startsWith('futureroom') || path === 'billing' || ...) {
  return 'backbone';
}
```

**Nachher:**
```typescript
// FutureRoom gehört zu Operative Desks, nicht Backbone
if (path.startsWith('futureroom')) {
  return 'desks';
}
if (path === 'billing' || path === 'agreements' || path === 'inbox') {
  return 'backbone';
}
```

#### 2. Sub-Navigation verstecken (Zeile 143)

**Vorher:**
```typescript
// Show futureroom sub-items
if (path === 'futureroom/bankkontakte' || path === 'futureroom/finanzierungsmanager') {
  return true;
}
```

**Nachher:**
```typescript
// FutureRoom sub-items are accessed via internal tabs, NOT sidebar
if (path.startsWith('futureroom/')) {
  return false;
}
```

---

## Erwartetes Ergebnis

### Sidebar VORHER (falsch):

```
📁 Backbone
  ├─ Future Room
  ├─ Bankkontakte        ❌ (separat)
  ├─ Finanzierungsmanager ❌ (separat)
  ├─ Billing
  └─ ...
```

### Sidebar NACHHER (korrekt):

```
📁 Backbone
  ├─ Billing
  ├─ Agreements
  └─ Inbox

📁 Operative Desks
  ├─ Future Room         ✅ (mit interner Tab-Nav)
  ├─ Acquiary
  ├─ Sales Desk
  └─ Finance Desk
```

### FutureRoom interne Tabs (unverändert):

```
[Mandate-Eingang] [Bankkontakte] [Manager]
```

---

## BEFORE/AFTER Tabelle

| Item | Before | After | Status |
|------|--------|-------|--------|
| Internal Org existiert | ✅ Vorhanden | Keine Änderung | OK |
| thomas.stelzl platform_admin | ✅ Korrekt | Keine Änderung | OK |
| active_tenant_id = internal | ✅ Korrekt | Keine Änderung | OK |
| Dev-Mode priorisiert internal | ✅ Korrekt | Keine Änderung | OK |
| FutureRoom Gruppe | backbone | **desks** | FIX |
| Bankkontakte separat | ❌ Sichtbar | Versteckt (Tab) | FIX |
| Finanzierungsmanager separat | ❌ Sichtbar | Versteckt (Tab) | FIX |
| FutureRoom Tab-Navigation | ✅ Korrekt | Keine Änderung | OK |

---

## Technische Umsetzung

1. AdminSidebar.tsx Zeile 105-107 anpassen (Gruppierung)
2. AdminSidebar.tsx Zeile 141-146 anpassen (Visibility)
3. Keine weiteren Dateien betroffen

---

## Acceptance Checks (nach Implementierung)

- [ ] Zone-1 Sidebar: FutureRoom unter "Operative Desks"
- [ ] Zone-1 Sidebar: Bankkontakte NICHT separat sichtbar
- [ ] Zone-1 Sidebar: Finanzierungsmanager NICHT separat sichtbar
- [ ] /admin/futureroom lädt mit Tab-Navigation
- [ ] /admin/futureroom/bankkontakte via Tab erreichbar
- [ ] /admin/futureroom/finanzierungsmanager via Tab erreichbar
- [ ] /portal/finanzierungsmanager (MOD-11) bleibt Zone-2

---

**Marker: P0 READY FOR IMPLEMENTATION**
