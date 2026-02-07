
# Reparaturplan: Home-Button auf Area Overview umleiten

## Diagnose

### Aktuelles Verhalten
Der Home-Button in `MobileBottomNav.tsx` navigiert zu `/portal`, was das `PortalDashboard` rendert — ein leerer Platzhalter mit dem Text "Wählen Sie ein Modul aus dem Menü links".

### Gewünschtes Verhalten
Der Home-Button soll zur **Area Overview Seite** (`/portal/area/base`) navigieren, die eine visuell ansprechende Einstiegsseite mit:
- Promo-Card (News/Werbung)
- 5 Modul-Karten mit Bildern und Beschreibungen

Dies soll auch beim Login der Standard-Einstieg sein.

---

## Betroffene Stellen

### 1. MobileBottomNav.tsx (Zeile 27)
**Aktuell:**
```tsx
const handleHomeClick = () => {
  navigate('/portal');
  setActiveArea('base');
  setMobileNavView('areas');
  setSelectedMobileModule(null);
};
```

**Änderung:**
```tsx
const handleHomeClick = () => {
  navigate('/portal/area/base');  // ← Neue Ziel-Route
  setActiveArea('base');
  setMobileNavView('areas');
  setSelectedMobileModule(null);
};
```

### 2. App.tsx — Root Redirect (Zeile 42)
**Aktuell:**
```tsx
<Route path="/" element={<Navigate to="/portal" replace />} />
```

**Änderung:**
```tsx
<Route path="/" element={<Navigate to="/portal/area/base" replace />} />
```

### 3. ManifestRouter.tsx — Portal Index (Zeile 445)
**Aktuell:**
```tsx
<Route index element={<PortalDashboard />} />
```

**Option A:** Auf Area Overview redirecten:
```tsx
<Route index element={<Navigate to="/portal/area/base" replace />} />
```

**Option B:** PortalDashboard beibehalten für Desktop, nur Mobile ändern

---

## Empfohlene Lösung

### Variante: Konsistentes Verhalten (Mobile + Desktop)

Die Area Overview Seite (`/portal/area/base`) wird zum universellen Einstiegspunkt:
- Home-Button → `/portal/area/base`
- Root `/` → `/portal/area/base`
- Portal Index `/portal` → Redirect zu `/portal/area/base`

Das `PortalDashboard` wird obsolet oder kann später als personalisiertes Dashboard weiterentwickelt werden.

---

## Zusammenfassung der Änderungen

| Datei | Zeile | Änderung |
|-------|-------|----------|
| `src/components/portal/MobileBottomNav.tsx` | 27 | `navigate('/portal')` → `navigate('/portal/area/base')` |
| `src/App.tsx` | 42 | Redirect `/` → `/portal/area/base` |
| `src/router/ManifestRouter.tsx` | 445 | Index → Redirect zu `/portal/area/base` |

---

## Erwartetes Ergebnis

### Mobile
- Home-Button führt zur Area Overview mit Modul-Karten
- Visuell ansprechender Einstieg statt leerer Platzhalter

### Desktop
- Gleicher Einstiegspunkt für konsistente UX
- Benutzer sehen sofort die verfügbaren Module

### Nach Login
- Benutzer landen direkt auf der Area Overview
- Kein "leeres Dashboard" mehr als erster Eindruck
