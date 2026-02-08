# Systemwidgets Feature — Implementierungs-Statusreport

## Übersicht

Das KI-Office → Widgets Feature wurde erfolgreich implementiert. Nutzer können nun Systemwidgets für ihr Dashboard aktivieren/deaktivieren und per Drag & Drop sortieren.

---

## Was ist LIVE?

| Widget | Code | Status |
|--------|------|--------|
| Google Earth (Globus) | `SYS.GLOBE.EARTH` | ✅ LIVE |
| Wetter | `SYS.WEATHER.SUMMARY` | ✅ LIVE |

Diese Widgets sind voll funktionsfähig und werden auf dem Dashboard angezeigt, wenn aktiviert.

---

## Was ist STUB (UI-Platzhalter)?

| Widget | Code | Status | Geplante Datenquelle |
|--------|------|--------|---------------------|
| Finanzüberblick | `SYS.FIN.MARKETS` | 🔄 STUB | Finnhub API |
| News Briefing | `SYS.NEWS.BRIEFING` | 🔄 STUB | RSS / NewsAPI |
| Space Update | `SYS.SPACE.DAILY` | 🔄 STUB | NASA APOD / ISS |
| Zitat des Tages | `SYS.MINDSET.QUOTE` | 🔄 STUB | ZenQuotes API |
| Radio | `SYS.AUDIO.RADIO` | 🔄 STUB | Radio Browser API |

Stub-Widgets zeigen einen eleganten "Coming Soon" Platzhalter. Sie können aktiviert werden, um die Sortierung vorzubereiten.

---

## Erstellte Dateien

### Konfiguration & Hooks
- `src/config/systemWidgets.ts` — Widget-Registry (7 Widgets)
- `src/hooks/useWidgetPreferences.ts` — DB-Hook für Preferences

### UI-Komponenten
- `src/pages/portal/office/SystemWidgetsTab.tsx` — Systemwidget-Verwaltung mit Drag & Drop
- `src/components/dashboard/widgets/FinanceWidget.tsx` — Stub
- `src/components/dashboard/widgets/NewsWidget.tsx` — Stub
- `src/components/dashboard/widgets/SpaceWidget.tsx` — Stub
- `src/components/dashboard/widgets/QuoteWidget.tsx` — Stub
- `src/components/dashboard/widgets/RadioWidget.tsx` — Stub

### Zone 1 Governance
- `src/pages/admin/armstrong/ArmstrongIntegrations.tsx` — Widget Registry Viewer

---

## Modifizierte Dateien

- `src/pages/portal/office/WidgetsTab.tsx` — 2-Tab-Struktur (System/Aufgaben)
- `src/pages/portal/PortalDashboard.tsx` — Integration von useWidgetPreferences
- `src/router/ManifestRouter.tsx` — Route für Integrations-Page
- `src/manifests/routesManifest.ts` — Neue Route hinzugefügt
- `src/pages/admin/armstrong/ArmstrongDashboard.tsx` — Quick-Link zu Integrationen

---

## Datenbank

- **Neue Tabelle:** `widget_preferences`
  - `user_id`, `widget_code`, `enabled`, `sort_order`, `config_json`
  - RLS-Policies: User können nur eigene Preferences lesen/schreiben

---

## API-Status

| API | Status |
|-----|--------|
| Open-Meteo (Wetter) | ✅ Angebunden |
| Google Maps 3D | ✅ Angebunden |
| Finnhub | 📋 Blueprint (Edge Function geplant) |
| NewsAPI/RSS | 📋 Blueprint (Edge Function geplant) |
| NASA APOD | 📋 Blueprint (Edge Function geplant) |
| ZenQuotes | 📋 Blueprint (Edge Function geplant) |
| Radio Browser | 📋 Blueprint (Edge Function geplant) |

---

## Governance eingehalten

- ✅ Keine Write-Aktionen in SSOT
- ✅ Kein Autoplay bei Audio-Widgets
- ✅ API-Adapter Blueprint dokumentiert
- ✅ Zone 1 Registry Viewer zeigt alle Widgets

---

## Nächste Schritte (Phase 2)

1. Edge Functions für externe APIs implementieren
2. Echte Daten in Stub-Widgets laden
3. Org-weite Widget-Preferences (optional)
