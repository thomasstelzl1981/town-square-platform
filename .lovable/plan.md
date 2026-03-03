

# Plan: Pet Manager Navigation korrigieren — Reihenfolge und Benennung

## Ist-Zustand (10 Tiles)

```text
dashboard  → PMDashboard   "Dashboard"
profil     → PMProfil      "Profil"
pension    → PMPension     "Pension"
services   → PMServices    "Services"       ← irrefuehrender Name
leistungen → PMLeistungen  "Leistungen"
mitarbeiter→ PMPersonal    "Mitarbeiter"
buchungen  → PMBuchungen   "Buchungen"
kalender   → PMKalender    "Kalender"
kunden     → PMKunden      "Kunden"
finanzen   → PMFinanzen    "Finanzen"
```

## Soll-Zustand (10 Tiles, gleiche Komponenten, neue Reihenfolge + Umbenennung)

```text
dashboard   → PMDashboard   "Dashboard"
profil      → PMProfil      "Profil"
leistungen  → PMLeistungen  "Leistungen"
buchungen   → PMBuchungen   "Buchungen"
pension     → PMPension     "Pension"
kalender    → PMKalender    "Pensions-Kalender"
mitarbeiter → PMPersonal    "Mitarbeiter"
dienstplan  → PMServices    "Dienstplan"        ← umbenannt von "Services"
kunden      → PMKunden      "Kunden"
finanzen    → PMFinanzen    "Finanzen"
```

## Aenderungen

### 1. Manifest aktualisieren (`src/manifests/routesManifest.ts`, Zeilen 595-606)

Tiles-Array in neuer Reihenfolge, "Services" wird zu "Dienstplan" mit Pfad `dienstplan`:

```typescript
tiles: [
  { path: "dashboard", component: "PMDashboard", title: "Dashboard", default: true },
  { path: "profil", component: "PMProfil", title: "Profil" },
  { path: "leistungen", component: "PMLeistungen", title: "Leistungen" },
  { path: "buchungen", component: "PMBuchungen", title: "Buchungen" },
  { path: "pension", component: "PMPension", title: "Pension" },
  { path: "kalender", component: "PMKalender", title: "Pensions-Kalender" },
  { path: "mitarbeiter", component: "PMPersonal", title: "Mitarbeiter" },
  { path: "dienstplan", component: "PMServices", title: "Dienstplan" },
  { path: "kunden", component: "PMKunden", title: "Kunden" },
  { path: "finanzen", component: "PMFinanzen", title: "Finanzen" },
],
```

### 2. Routing aktualisieren (`src/pages/portal/PetManagerPage.tsx`)

- Route `services` durch `dienstplan` ersetzen (zeigt weiterhin `PMServices`)
- Alte Route `services` als Redirect auf `dienstplan` behalten (Abwaertskompatibilitaet)

```typescript
<Route path="dienstplan" element={<Suspense ...><PMServices /></Suspense>} />
<Route path="services" element={<Navigate to="../dienstplan" replace />} />
```

### Was sich NICHT aendert

- Keine Backend-Aenderungen, keine neuen Tabellen
- Keine Komponenten-Dateien werden geloescht oder umgeschrieben
- `PMServices.tsx` bleibt unveraendert (nur der Menuepunkt-Name und Pfad aendern sich)
- `PMKalender.tsx` bleibt unveraendert (nur der angezeigte Titel aendert sich)

| Datei | Aenderung |
|---|---|
| `src/manifests/routesManifest.ts` | Tiles-Array: Reihenfolge + "Services"→"Dienstplan" + "Kalender"→"Pensions-Kalender" |
| `src/pages/portal/PetManagerPage.tsx` | Route `dienstplan` hinzufuegen, `services` als Redirect |

