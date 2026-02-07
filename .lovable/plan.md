

# Reparaturplan: Home-Button zurück zum Dashboard

## Das Problem

Durch die letzten Änderungen führen jetzt **beide** Buttons (Home und Base) zur selben Seite:
- Home → `/portal/area/base`
- Base → `/portal/area/base`

Das ursprüngliche `PortalDashboard` mit "Willkommen, {username}" wird gar nicht mehr angezeigt.

---

## Die Lösung

**Home** soll wieder zur **Dashboard-Seite** führen (`/portal`), die als Platzhalter für künftige Widgets und Armstrong-Integration dient.

| Button | Ziel | Seite |
|--------|------|-------|
| Home | `/portal` | PortalDashboard (Willkommen + Widgets) |
| Base | `/portal/area/base` | Area Overview (Modul-Karten) |
| Missions | `/portal/area/missions` | Area Overview |
| Operations | `/portal/area/operations` | Area Overview |
| Services | `/portal/area/services` | Area Overview |

---

## Änderungen

### 1. MobileBottomNav.tsx — Home-Button korrigieren

**Zeile 26-31:**
```tsx
// AKTUELL (FALSCH):
const handleHomeClick = () => {
  navigate('/portal/area/base');
  setActiveArea('base');
  setMobileNavView('areas');
  setSelectedMobileModule(null);
};

// KORRIGIERT:
const handleHomeClick = () => {
  navigate('/portal');  // ← Zurück zum Dashboard
  setActiveArea(null);  // Kein Area aktiv auf Dashboard
  setMobileNavView('areas');
  setSelectedMobileModule(null);
};
```

### 2. ManifestRouter.tsx — Portal Index zurücksetzen

**Zeile 445:**
```tsx
// AKTUELL (FALSCH):
<Route index element={<Navigate to="/portal/area/base" replace />} />

// KORRIGIERT:
<Route index element={<PortalDashboard />} />
```

### 3. App.tsx — Root Redirect anpassen

**Zeile 42:**
```tsx
// AKTUELL:
<Route path="/" element={<Navigate to="/portal/area/base" replace />} />

// KORRIGIERT:
<Route path="/" element={<Navigate to="/portal" replace />} />
```

---

## Ergebnis nach der Korrektur

### Mobile Navigation

```text
┌─────────────────────────────────────┐
│  Home  │  Base  │ Miss │ Ops │ Serv │
└─────────────────────────────────────┘
    ↓        ↓        ↓      ↓      ↓
 /portal  /area/   /area/  /area/  /area/
          base   missions  ops   services
    ↓        ↓        ↓      ↓      ↓
Dashboard  Area    Area   Area   Area
(Widgets)  Cards   Cards  Cards  Cards
```

### Nutzererlebnis
- **Nach Login** → Dashboard mit "Willkommen, {Name}"
- **Home-Button** → Zurück zum Dashboard
- **Area-Buttons** → Jeweilige Area Overview mit Modul-Karten

### Zukunft
Das Dashboard (`PortalDashboard.tsx`) wird zur zentralen "Tafel" für:
- Widgets
- Armstrong-Integration
- Aufgabenfeld
- Schnellzugriffe

