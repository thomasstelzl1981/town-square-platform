
# Systemwidgets: Analyse & Implementierungsplan

## Teil 1: Root Cause Analyse — Warum Toggle bei neuen Widgets nicht funktioniert

### Befund: UI-Blockade (NICHT DB-Problem)

**Evidence:**
- Die Datenbank zeigt alle 7 Widget-Preferences korrekt (alle widget_codes sind eingetragen)
- RLS-Policies sind vollständig konfiguriert (SELECT, INSERT, UPDATE, DELETE erlaubt für eigene Daten)
- Unique Constraint auf `(user_id, widget_code)` existiert und Upsert funktioniert

**Root Cause identifiziert in `SystemWidgetsTab.tsx` Zeile 151:**
```tsx
<Switch
  checked={enabled}
  onCheckedChange={onToggle}
  disabled={widget.status === 'stub'}  // ← PROBLEM!
/>
```

**Ergebnis:** Der Switch ist für alle Widgets mit `status: 'stub'` **UI-seitig deaktiviert**. Das ist kein DB-Fehler, sondern ein bewusstes Design — **aber der Fehler liegt darin, dass der Nutzer erwartet, dass er toggeln kann**.

### Lösungsoption

Die Stub-Widgets sollten togglebar sein (ON/OFF für die Position im Dashboard), auch wenn sie nur einen "Coming Soon"-Platzhalter zeigen. Der User soll die Reihenfolge vorbereiten können.

---

## Teil 2: Technisches Fix-Konzept

### Änderung A: Switch freischalten (P0)

**Datei:** `src/pages/portal/office/SystemWidgetsTab.tsx`

```tsx
// Vorher (Zeile 151):
disabled={widget.status === 'stub'}

// Nachher:
// disabled entfernen oder auf false setzen
// Alternativ: Nur live-Widgets togglebar, aber dann klare Kommunikation
```

**Empfehlung:** Switch aktivieren + Badge "Coming Soon" als Info beibehalten.

### Änderung B: Persistenzmodell bestätigt (bereits korrekt)

| Aspekt | Status |
|--------|--------|
| Tabelle `widget_preferences` | ✅ existiert |
| Unique Key `(user_id, widget_code)` | ✅ korrekt |
| Upsert mit `onConflict` | ✅ im Hook implementiert |
| RLS Policies | ✅ vollständig |
| Defaults (sort_order, config_json) | ✅ korrekt |

### Änderung C: MOD-00 Rendering (bereits korrekt)

Das Dashboard rendert bereits alle enabled Widgets über den `enabledWidgets`-Array und das `WIDGET_CODE_TO_ID`-Mapping. Keine Änderung erforderlich.

### Zusammenfassung der Änderungen

| # | Datei | Änderung |
|---|-------|----------|
| 1 | `src/pages/portal/office/SystemWidgetsTab.tsx` | `disabled`-Prop vom Switch entfernen |

---

## Teil 3: Zone 1 — Integrations-Dokumentation

### Neue Governance-Regel (als Armstrong Policy)

**Policy-Code:** `POL.GUARD.EXT_INTEGRATION_DOC`  
**Kategorie:** `guardrail`  
**Titel:** Externe Integrations-Dokumentationspflicht

**Inhalt (Content):**
```
REGEL (verbindlich):

Jede neue externe Quelle (API, RSS, Connector, SDK) die für Systemwidgets, Armstrong oder 
andere Plattform-Features verwendet wird, MUSS vor Produktivschaltung in der Zone 1 
Integration Registry dokumentiert werden.

PFLICHTFELDER:
- integration_code (eindeutig, z.B. "FINNHUB", "NASA_APOD")
- name (Anzeigename)
- type (api | rss | connector | sdk)
- base_url (Basis-URL der API)
- auth_type (none | api_key | oauth | bearer)
- data_scope (markets | news | space | audio | quotes | geo | documents)
- caching_policy (TTL in Minuten)
- rate_limit_notes (Rate-Limit-Hinweise)
- cost_model (free | metered | premium)
- status (planned | stub | active | deprecated)
- owner (system | tenant)
- risks (PII-Risiko, Datenschutz-Hinweise)
- guardrails (z.B. "no-autoplay", "no-clickbait")
- last_reviewed_at (Datum der letzten Prüfung)

AUSNAHMEN:
Keine. Auch "free" APIs müssen dokumentiert werden.

GOVERNANCE:
Zone 1 Admins können den Status von "planned" auf "active" ändern.
Ohne "active"-Status darf eine Integration nicht in Produktion genutzt werden.
```

### Integrations Registry Schema (erweitertes JSON-Beispiel)

Für die neuen Widget-APIs wird die bestehende `integration_registry`-Tabelle erweitert:

```json
[
  {
    "code": "FINNHUB",
    "name": "Finnhub Markets API",
    "type": "api",
    "description": "Echtzeit-Finanzdaten für DAX, S&P 500, Währungen, Krypto",
    "base_url": "https://finnhub.io/api/v1",
    "auth_type": "api_key",
    "data_scope": "markets",
    "caching_policy": 30,
    "rate_limit_notes": "60 calls/min (free tier)",
    "cost_model": "free",
    "cost_hint": "Premium ab $50/mo für Realtime",
    "status": "planned",
    "owner": "system",
    "risks": "Keine PII",
    "guardrails": "no-trading-advice, display-only",
    "widget_code": "SYS.FIN.MARKETS"
  },
  {
    "code": "NASA_APOD",
    "name": "NASA Astronomy Picture of the Day",
    "type": "api",
    "description": "Tägliches Astronomiebild mit Erklärung",
    "base_url": "https://api.nasa.gov/planetary/apod",
    "auth_type": "api_key",
    "data_scope": "space",
    "caching_policy": 1440,
    "rate_limit_notes": "1000 calls/h (mit Key)",
    "cost_model": "free",
    "cost_hint": null,
    "status": "planned",
    "owner": "system",
    "risks": "Keine PII",
    "guardrails": "cache-aggressive, single-daily-fetch",
    "widget_code": "SYS.SPACE.DAILY"
  },
  {
    "code": "RADIO_BROWSER",
    "name": "Radio Browser API",
    "type": "api",
    "description": "Internet-Radio-Streams weltweit",
    "base_url": "https://de1.api.radio-browser.info",
    "auth_type": "none",
    "data_scope": "audio",
    "caching_policy": 60,
    "rate_limit_notes": "Keine harten Limits, Fair Use",
    "cost_model": "free",
    "cost_hint": null,
    "status": "planned",
    "owner": "system",
    "risks": "Keine PII, externe Stream-URLs",
    "guardrails": "no-autoplay, user-initiated-playback-only",
    "widget_code": "SYS.AUDIO.RADIO"
  },
  {
    "code": "ZENQUOTES",
    "name": "ZenQuotes API",
    "type": "api",
    "description": "Inspirierende Zitate",
    "base_url": "https://zenquotes.io/api",
    "auth_type": "none",
    "data_scope": "quotes",
    "caching_policy": 1440,
    "rate_limit_notes": "5 calls/30sec (free tier)",
    "cost_model": "free",
    "cost_hint": null,
    "status": "planned",
    "owner": "system",
    "risks": "Keine PII",
    "guardrails": "no-clickbait, professional-quotes-only",
    "widget_code": "SYS.MINDSET.QUOTE"
  },
  {
    "code": "OPEN_METEO",
    "name": "Open-Meteo Weather API",
    "type": "api",
    "description": "Wetterdaten ohne API-Key",
    "base_url": "https://api.open-meteo.com/v1",
    "auth_type": "none",
    "data_scope": "geo",
    "caching_policy": 30,
    "rate_limit_notes": "Keine Limits für non-commercial",
    "cost_model": "free",
    "cost_hint": null,
    "status": "active",
    "owner": "system",
    "risks": "Nutzt Geolocation (Browser-Permission)",
    "guardrails": "location-permission-required",
    "widget_code": "SYS.WEATHER.SUMMARY"
  }
]
```

### SSOT-Speicherort

**Option A (empfohlen für MVP):** Bestehende `integration_registry`-Tabelle erweitern

Neue Spalten hinzufügen:
- `base_url` (text)
- `auth_type` (text)
- `data_scope` (text)
- `caching_policy_min` (integer)
- `rate_limit_notes` (text)
- `cost_hint` (text)
- `risks` (text)
- `guardrails` (text)
- `widget_code` (text, nullable — Link zu Systemwidget)
- `last_reviewed_at` (timestamptz)

**Option B:** Separate Konfigurationsdatei `src/config/integrationRegistry.ts`

Für MVP kann die Registry auch als statische TypeScript-Datei geführt werden (ähnlich wie `systemWidgets.ts`).

### Zone 1 UI-Anpassung

Die bestehende `ArmstrongIntegrations.tsx` zeigt bereits die Widget-Registry. Für vollständige Integrations-Dokumentation:

1. Tab hinzufügen: "Externe APIs" neben "Widget-Registry"
2. Tabelle mit allen `integration_registry`-Einträgen
3. Filter nach `status` (planned | stub | active | deprecated)
4. Badge-Anzeige für Guardrails

---

## Teil 4: Design-Guidelines für Systemwidgets

### Widget Container (Standard)

```text
┌─────────────────────────────────────────────────────┐
│  [Icon] Titel                          [Badge]      │  ← Header
├─────────────────────────────────────────────────────┤
│                                                     │
│                  Content Area                       │  ← Flex-1
│              (Zahlen, Charts, Text)                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Meta: Quelle · Letzte Aktualisierung               │  ← Footer
└─────────────────────────────────────────────────────┘
```

### Komponenten-Wiederverwendung

| Komponente | Verwendung |
|------------|------------|
| `Card` | Container für jedes Widget |
| `CardContent` | Padding und Layout |
| `Badge` | Status (Live/Coming Soon), Trend-Indikatoren |
| `Skeleton` | Loading State |
| `IconButton` | Refresh (optional), Settings |
| Theme Tokens | `text-foreground`, `text-muted-foreground`, `bg-muted` |

### Farben & Dark Mode

- **Keine hardcodierten Farben** — nur Gradient-Klassen aus dem Design-System
- Positive Trends: `text-green-500` (subtil)
- Negative Trends: `text-red-500` (subtil)
- Neutral: `text-muted-foreground`

### Layout-Grid (bereits implementiert)

```tsx
// DashboardGrid.tsx
<div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
  {/* Widgets */}
</div>
```

### Error/Empty States

**API nicht erreichbar:**
```tsx
<div className="text-center py-4">
  <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
  <p className="text-sm text-muted-foreground">Quelle temporär nicht verfügbar</p>
  <Button variant="ghost" size="sm" onClick={refetch}>
    <RefreshCw className="h-4 w-4 mr-2" />
    Erneut versuchen
  </Button>
</div>
```

**Widget deaktiviert:**
- Widget wird einfach nicht gerendert (kein Platzhalter)

### Radio-Widget Besonderheit

```tsx
<div className="text-center">
  <Button onClick={handlePlay} disabled={isLoading}>
    <Play className="h-5 w-5 mr-2" />
    Abspielen
  </Button>
  <p className="text-[10px] text-muted-foreground mt-2">
    Startet erst nach Klick
  </p>
</div>
```

**Kein Autoplay** — explizit dokumentiert in Governance.

---

## Teil 5: Akzeptanzkriterien

### P0 (Kritisch)

| # | Test | Erwartung |
|---|------|-----------|
| 1 | Neue Systemwidgets (Finance, News, Space, Quote, Radio) toggeln | ✅ Kein Fehler, Toggle funktioniert |
| 2 | Toggle-Status wird persistiert | ✅ Nach Reload korrekt |
| 3 | MOD-00 zeigt enabled Stub-Widgets | ✅ "Coming Soon" Card wird angezeigt |
| 4 | Keine RLS/Constraint Fehler in Console | ✅ Keine Errors |

### P1 (Wichtig)

| # | Test | Erwartung |
|---|------|-----------|
| 5 | Zone 1 Integration Registry enthält neue APIs | ✅ Finnhub, NASA, Radio, ZenQuotes dokumentiert |
| 6 | Armstrong Policy für Integrations-Dokumentation | ✅ Guardrail erstellt |
| 7 | Widget Cards optisch konsistent (Light/Dark) | ✅ Theme Tokens verwendet |
| 8 | Error States in Stub-Widgets | ✅ Eleganter "Coming Soon" Platzhalter |

---

## Zusammenfassung: Änderungen

| # | Datei/Bereich | Änderung | Priorität |
|---|---------------|----------|-----------|
| 1 | `SystemWidgetsTab.tsx` | `disabled`-Prop vom Switch entfernen | P0 |
| 2 | `integration_registry` (DB) | 5 neue Einträge für Widget-APIs | P1 |
| 3 | `armstrong_policies` (DB) | Neue Guardrail-Policy einfügen | P1 |
| 4 | `ArmstrongIntegrations.tsx` | Tab "Externe APIs" hinzufügen (optional) | P2 |

