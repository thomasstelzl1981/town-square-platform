

## PIN-Gate Toggle im Admin-Bereich (Zone 1)

### Status: ✅ Implementiert

### Ziel

Ein Admin-Toggle im Zone-1-Dashboard (`/admin`), mit dem das PIN-Gate fuer alle 5 Brand-Websites ein-/ausgeschaltet werden kann.

### Architektur

```text
Zone 1 (/admin Dashboard)                Zone 3 (Brand Layouts)
         |                                        |
    Toggle ON/OFF                          Liest pin_gate_enabled
         |                                        |
         v                                        v
    ┌──────────────────────────────────────────────────┐
    │  DB: zone3_website_settings                      │
    │  key: 'pin_gate_enabled', value: 'true'/'false'  │
    │  RLS: SELECT fuer alle, UPDATE fuer authenticated │
    └──────────────────────────────────────────────────┘
```

### Umgesetzte Schritte

1. ✅ DB-Tabelle `zone3_website_settings` mit RLS + Seed (`pin_gate_enabled = 'true'`)
2. ✅ Hook `src/hooks/useZone3Settings.ts` (read + update mit react-query)
3. ✅ Toggle-Karte im Admin-Dashboard (`src/pages/admin/Dashboard.tsx`)
4. ✅ Alle 5 Zone-3-Layouts lesen DB-Wert und zeigen PIN-Gate nur wenn `'true'`
5. ✅ PIN-Code-Referenz auf 2710 korrigiert (war 4409)

### Betroffene Dateien

| Datei | Art |
|-------|-----|
| Migration: `zone3_website_settings` Tabelle + Seed | DB |
| `src/hooks/useZone3Settings.ts` | Neu |
| `src/pages/admin/Dashboard.tsx` | Edit (Zone 1) |
| `src/pages/zone3/sot/SotLayout.tsx` | Edit |
| `src/pages/zone3/kaufy2026/Kaufy2026Layout.tsx` | Edit |
| `src/pages/zone3/futureroom/FutureRoomLayout.tsx` | Edit |
| `src/pages/zone3/acquiary/AcquiaryLayout.tsx` | Edit |
| `src/pages/zone3/lennox/LennoxLayout.tsx` | Edit |
