
# Plan: Entwicklungsmodus-Login erzwingen + Mobile wie Desktop

## Ziel

1. **Login-Zwang in Entwicklungsumgebung**: Auch in Lovable-Preview muss man sich anmelden. Kein Dev-Bypass mehr.
2. **Mobile /portal wie Desktop**: Die mobile Startseite zeigt `PortalDashboard` (mit "Willkommen, {Name}"), nicht nur die Card-Navigation.

Damit ist garantiert: **Desktop und Mobile = derselbe eingeloggte User = identische Anzeige**.

---

## Änderung 1: Dev-Bypass entfernen

**Datei:** `src/contexts/AuthContext.tsx`

**Was wird geändert:**
- Die Funktion `isDevelopmentEnvironment()` wird entfernt oder gibt immer `false` zurück
- Der gesamte Dev-Mock-Code (Mock-Profil, Mock-Membership, Mock-Org) wird deaktiviert
- Das System verhält sich wie Produktion: Ohne Login → Redirect zu `/auth`

**Code-Änderung (Zeilen 34-42):**

Vorher:
```typescript
const isDevelopmentEnvironment = () => {
  const hostname = window.location.hostname;
  return hostname.includes('lovable.app') || 
         hostname.includes('lovableproject.com') ||
         hostname.includes('localhost') || 
         hostname.includes('127.0.0.1') ||
         hostname.includes('preview') ||
         hostname.includes('id-preview');
};
```

Nachher:
```typescript
// DEV-BYPASS DEAKTIVIERT — Login wird immer erzwungen
const isDevelopmentEnvironment = () => {
  return false;
};
```

**Auswirkung:**
- `isDevelopmentMode` ist immer `false`
- Kein Mock-Profil, keine Mock-Org
- Alle Geräte müssen sich einloggen
- Identischer Auth-State auf allen Geräten

---

## Änderung 2: Mobile /portal zeigt PortalDashboard

**Datei:** `src/components/portal/PortalLayout.tsx`

**Was wird geändert:**
Die Logik für die mobile Ansicht wird angepasst, sodass auf `/portal` (Root) das `PortalDashboard` via `<Outlet />` gerendert wird — genau wie auf Desktop.

**Vorher (Zeilen 77-94):**
```tsx
{/* Content Area */}
<main className="flex-1 overflow-y-auto pb-28 relative">
  {/* ... loading overlay ... */}
  
  {/* Show card navigation when on /portal root, otherwise show module content */}
  {!isOnModulePage ? (
    <MobileCardView />
  ) : (
    <Outlet />
  )}
</main>
```

**Nachher:**
```tsx
{/* Content Area */}
<main className="flex-1 overflow-y-auto pb-28 relative">
  {/* ... loading overlay ... */}
  
  {/* Mobile: Always use Outlet for consistent routing (Dashboard or Module) */}
  <Outlet />
</main>
```

**Zusätzlich:** Die `MobileCardView` wird in die Modul-Navigation integriert (über `MobileBottomNav` aktiviert), aber nicht mehr als Ersatz für das Dashboard.

**Alternative Lösung (falls gewünscht):** Dashboard + Cards kombinieren:
```tsx
{/* Show Dashboard content, then card navigation below */}
{!isOnModulePage ? (
  <>
    <PortalDashboard />
    {activeArea && <MobileCardView />}
  </>
) : (
  <Outlet />
)}
```

Ich empfehle die erste Variante (reines `<Outlet />`), da das konsistenter mit Desktop ist.

---

## Änderung 3: Mobile Card-Navigation weiterhin verfügbar

Da `MobileCardView` jetzt nicht mehr automatisch auf `/portal` angezeigt wird, muss sie über die `MobileBottomNav` erreichbar bleiben.

**Datei:** `src/components/portal/MobileBottomNav.tsx`

Keine Code-Änderung nötig — die Navigation funktioniert bereits: Klick auf "Base" → `setActiveArea('base')` → `setMobileNavView('modules')`.

Die Cards erscheinen dann über einen **MobileDrawer** oder als **Overlay**, nicht als Ersatz für das Dashboard.

**Optional (falls gewünscht):** Ein separater `MobileModuleDrawer` kann geöffnet werden, wenn ein Area-Button geklickt wird. Das ist aber ein separates Feature und nicht Teil dieses Plans.

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/contexts/AuthContext.tsx` | `isDevelopmentEnvironment()` → `return false` |
| `src/components/portal/PortalLayout.tsx` | Mobile: `<Outlet />` statt bedingtem `MobileCardView` |

---

## Test-Plan

1. **Hard Refresh** auf beiden Geräten (Desktop + Mobile)
2. **Redirect zu /auth**: Beide Geräte werden zur Login-Seite weitergeleitet
3. **Einloggen**: Mit denselben Credentials auf beiden Geräten
4. **Verifizieren**:
   - Initiale im Avatar: Beide zeigen z.B. "T" (oder "TS")
   - `/portal`: Beide zeigen "Willkommen, Thomas"
   - `/admin/tiles`: Beide zeigen dieselbe Organisation/Badge

---

## Hinweis: Test-Login

Da der Dev-Bypass entfernt wird, benötigst du einen **echten Supabase-User**. Falls du keinen hast:
1. Gehe zu `/auth`
2. Registriere dich mit einer E-Mail (z.B. deine echte oder eine Test-Mail)
3. Bestätige die E-Mail (oder deaktiviere "Confirm email" in Supabase Auth Settings)
4. Logge dich ein

Alternativ: Falls du bereits einen User in der Datenbank hast, nutze diese Credentials.

---

## Risiken

- **Breaking Change für andere Entwickler**: Jeder, der die App testet, muss sich jetzt einloggen
- **Mitigation**: Ein optionaler Query-Param `?dev=1` könnte später eingebaut werden, um den Bypass bewusst zu aktivieren (aber das ist nicht Teil dieses Plans)

---

## Zusammenfassung

| Vorher | Nachher |
|--------|---------|
| Desktop: Eingeloggt → "T" | Desktop: Eingeloggt → "T" |
| Mobile: Dev-Bypass → "SOAT" | Mobile: **Eingeloggt → "T"** |
| Mobile /portal: MobileCardView | Mobile /portal: **PortalDashboard** |
| Unterschiedliche UIs | **Identische UIs** |
