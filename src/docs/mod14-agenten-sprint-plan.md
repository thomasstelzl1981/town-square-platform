# MOD-14 Agenten-Sprint: Architektur & Implementierungsplan

> Erstellt: 2026-02-12 | Status: Entwurf | Priorität: Zurückgestellt

## Vision

MOD-14 ("Agenten") soll als Verwaltungs- und Monitoring-Interface für Armstrong AI-Aktionen dienen.
Das Modul gibt dem Nutzer Transparenz darüber, welche KI-Aktionen verfügbar sind, wie sie genutzt werden und welche Kosten entstehen.

## Architektur-Grundlage

### Bestehende DB-Tabellen
- `armstrong_action_runs` — Ausführungsprotokoll (action_code, status, tokens, cost)
- `armstrong_action_overrides` — Admin-Steuerung (enable/disable pro Org)
- `armstrong_billing_events` — Kostenabrechnung pro Action
- `armstrong_command_events` — Command-Quelle und Ergebnis
- `armstrong_knowledge_items` — Wissensbasis-Einträge

### Bestehende Manifeste
- `src/manifests/armstrongManifest.ts` — Action-Registry (Codes, Zonen, Beschreibungen)

## Modul-Struktur: 4 Tabs

### Tab 1: Aktions-Katalog
**Ziel:** Alle verfügbaren Armstrong-Aktionen auflisten
- Datenquelle: `armstrongManifest.ts` + `armstrong_action_overrides`
- Anzeige: Card-Grid mit Action-Code, Beschreibung, Zone, Status (aktiv/deaktiviert)
- Filter: Nach Zone (Z1/Z2/Z3), nach Status
- Action: Override-Toggle (Admin-only)

### Tab 2: Ausführungs-Log
**Ziel:** Transparenz über alle KI-Ausführungen
- Datenquelle: `armstrong_action_runs`
- Anzeige: DataTable mit Zeitstempel, Action, Status, Dauer, Tokens
- Filter: Zeitraum, Status (success/error), Action-Code
- Detail-Drawer: Input/Output-Context anzeigen

### Tab 3: Kosten-Dashboard
**Ziel:** Billing-Übersicht für KI-Nutzung
- Datenquelle: `armstrong_billing_events`
- KPI-Cards: Gesamtkosten (Monat), Durchschnitt pro Action, Top-5 Actions
- Chart: Kosten-Verlauf (Recharts)
- Tabelle: Detaillierte Abrechnung

### Tab 4: Wissensbasis
**Ziel:** Knowledge Items verwalten
- Datenquelle: `armstrong_knowledge_items`
- Anzeige: Searchable List mit Titel, Kategorie, Status
- Actions: Neuer Eintrag, Bearbeiten, Veröffentlichen
- Preview: Markdown-Rendering des Contents

## Implementierungs-Reihenfolge

```
Phase A: Grundgerüst (1 Sprint)
├── PhotovoltaikPage.tsx → AgentsPage.tsx umbenennen
├── 4 Tab-Komponenten erstellen (Skeleton)
├── PageShell + ModulePageHeader integrieren
└── SubTabNav für 4 Tabs

Phase B: Aktions-Katalog (1 Sprint)
├── armstrongManifest.ts als Datenquelle anbinden
├── Card-Grid mit Filtering
└── Override-Status aus DB laden

Phase C: Ausführungs-Log (1 Sprint)
├── armstrong_action_runs Query + DataTable
├── Filter-UI (Zeitraum, Status)
└── Detail-Drawer mit JSON-Viewer

Phase D: Kosten + Wissensbasis (1 Sprint)
├── Billing-KPIs + Recharts
├── Knowledge Items CRUD
└── Markdown-Preview
```

## Abhängigkeiten
- Armstrong-Manifest muss vollständig sein
- RLS-Policies für armstrong_* Tabellen prüfen
- Admin-Role-Check für Override-Funktionen

## Offene Fragen
1. Soll MOD-14 auch für Nicht-Admins sichtbar sein (read-only)?
2. Billing: Credits-System oder reine Kosten-Anzeige?
3. Knowledge Items: Sollen Nutzer eigene Einträge erstellen können?
