

## Pet Manager -- routesManifest.ts synchronisieren

### Problem

Die Sub-Tab-Navigation wird ueber `src/manifests/routesManifest.ts` gesteuert (Zeilen 556-562). Dort stehen noch die alten 5 Eintraege:

- Dashboard
- Kalender & Buchungen
- Leistungen
- Kunden & Tiere
- Finanzen

Die `moduleContents.ts` (Sidebar) wurde bereits korrekt auf 6 Eintraege aktualisiert, aber das routesManifest wurde nicht angepasst.

### Loesung

Die `tiles`-Eintraege in `routesManifest.ts` fuer MOD-22 (Zeilen 556-562) werden auf die 6 neuen Kernbereiche aktualisiert:

| Bisheriger Eintrag | Neuer Eintrag |
|---------------------|---------------|
| Dashboard (dashboard) | Dashboard (dashboard) -- bleibt |
| Kalender & Buchungen (buchungen) | Pension (pension) |
| Leistungen (leistungen) | Services (services) |
| Kunden & Tiere (kunden) | Mitarbeiter (mitarbeiter) |
| Finanzen (finanzen) | Kunden (kunden) |
| -- | Finanzen (finanzen) |

### Technische Umsetzung

**Datei:** `src/manifests/routesManifest.ts` (Zeilen 556-562)

Aenderung der `tiles` von:
```
tiles: [
  { path: "dashboard", component: "PMDashboard", title: "Dashboard", default: true },
  { path: "buchungen", component: "PMBuchungen", title: "Kalender & Buchungen" },
  { path: "leistungen", component: "PMLeistungen", title: "Leistungen" },
  { path: "kunden", component: "PMKunden", title: "Kunden & Tiere" },
  { path: "finanzen", component: "PMFinanzen", title: "Finanzen" },
]
```

Zu:
```
tiles: [
  { path: "dashboard", component: "PMDashboard", title: "Dashboard", default: true },
  { path: "pension", component: "PMPension", title: "Pension" },
  { path: "services", component: "PMServices", title: "Services" },
  { path: "mitarbeiter", component: "PMPersonal", title: "Mitarbeiter" },
  { path: "kunden", component: "PMKunden", title: "Kunden" },
  { path: "finanzen", component: "PMFinanzen", title: "Finanzen" },
]
```

Nur eine einzige Datei wird geaendert. Danach stimmen Sub-Tabs und Sidebar ueberein.

