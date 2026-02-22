

## PIN-Gate Toggle im Office-Bereich (Zone 1)

### Ziel

Ein Admin-Toggle im Office-Bereich, mit dem das PIN-Gate fuer alle 5 Brand-Websites ein-/ausgeschaltet werden kann. Aktuell ist der PIN immer aktiv — nach dieser Aenderung kann er zentral deaktiviert werden (z.B. wenn die Beta-Phase endet).

### Architektur

```text
Zone 1 (Office/SystemWidgetsTab)         Zone 3 (Brand Layouts)
         |                                        |
    Toggle ON/OFF                          Liest pin_gate_enabled
         |                                        |
         v                                        v
    ┌──────────────────────────────────────────────────┐
    │  DB: zone3_website_settings                      │
    │  key: 'pin_gate_enabled', value: 'true'/'false'  │
    │  RLS: SELECT fuer anon, UPDATE fuer authenticated │
    └──────────────────────────────────────────────────┘
```

### Schritte

**1. Neue DB-Tabelle: `zone3_website_settings`**

Einfache Key-Value-Tabelle:
- `id` (uuid, PK)
- `key` (text, unique) -- z.B. `pin_gate_enabled`
- `value` (text) -- `true` oder `false`
- `updated_at` (timestamptz)
- `updated_by` (uuid, FK profiles)

RLS-Policies:
- `SELECT` fuer `anon` und `authenticated` (Websites muessen den Wert lesen koennen)
- `INSERT/UPDATE` nur fuer `authenticated`

Seed: Ein Eintrag `pin_gate_enabled = 'true'` (aktueller Zustand).

**2. Neuer Hook: `src/hooks/useZone3Settings.ts`**

- `useZone3Setting(key)` — liest einen Wert aus `zone3_website_settings`
- `useUpdateZone3Setting()` — Mutation zum Aktualisieren
- Nutzt `@tanstack/react-query` mit Cache

**3. UI-Toggle: `src/pages/portal/office/SystemWidgetsTab.tsx` erweitern**

Am Anfang der Seite (vor der Widget-Liste) eine Karte "Website-Einstellungen" mit:
- Switch-Toggle "PIN-Gate aktiv" mit aktuellem Status
- Untertitel: "Zugangscode 2710 fuer alle Brand-Websites"
- Badge: "Beta" oder "Aktiv"

**4. Zone 3 Layouts anpassen (alle 5)**

In jedem Layout (`SotLayout`, `Kaufy2026Layout`, `FutureRoomLayout`, `AcquiaryLayout`, `LennoxLayout`):
- `useZone3Setting('pin_gate_enabled')` importieren
- PIN-Gate nur anzeigen, wenn der DB-Wert `'true'` ist
- Waehrend des Ladens: kurzer Ladeindikator (kein Flash des Gates)

### Betroffene Dateien

| Datei | Art |
|-------|-----|
| Migration: `zone3_website_settings` Tabelle + Seed | DB |
| `src/hooks/useZone3Settings.ts` | Neu |
| `src/pages/portal/office/SystemWidgetsTab.tsx` | Edit |
| `src/pages/zone3/sot/SotLayout.tsx` | Edit |
| `src/pages/zone3/kaufy2026/Kaufy2026Layout.tsx` | Edit |
| `src/pages/zone3/futureroom/FutureRoomLayout.tsx` | Edit |
| `src/pages/zone3/acquiary/AcquiaryLayout.tsx` | Edit |
| `src/pages/zone3/lennox/LennoxLayout.tsx` | Edit |

### Verhalten

- Toggle ON (Standard): PIN-Gate aktiv, Besucher muessen Code 2710 eingeben
- Toggle OFF: Websites sofort ohne Code zugaenglich
- Aenderung wirkt sofort (naechster Seitenaufruf der Website)
- Kein Publish noetig fuer Toggle-Aenderung (DB-basiert)

