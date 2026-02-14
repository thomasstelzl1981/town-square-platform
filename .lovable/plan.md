
# Konsolidierung: Doppelte Module unter Operative Desks

## Problem-Analyse

Aktuell erscheinen in der Sidebar unter "Operative Desks" folgende doppelte/ueberfluessige Eintraege:

### 1. Lead Pool + Provisionen → Lead Desk

| Menüpunkt | Route | Funktion | Status |
|-----------|-------|----------|--------|
| **Lead Pool** | `/admin/leadpool` | Vollstaendige Lead-Verwaltung (560 Zeilen): DB-Abfragen auf `leads` + `lead_assignments`, Lead-Erstellung, Partner-Zuweisung, KPI-Stats | Funktional, aber veraltet |
| **Provisionen** | `/admin/commissions` | Provisions-Freigabe-Tabelle | Funktional, soll in Lead Desk |
| **Lead Desk** | `/admin/lead-desk` | Neuer Platzhalter (nur statische KPI-Karten, keine DB-Anbindung) | Platzhalter |

**Loesung**: Die gesamte Logik aus `LeadPool.tsx` (Lead-Tabelle, Zuweisungen, Dialoge) und `CommissionApproval.tsx` (Provisionen) wird in `LeadDesk.tsx` als Tab-Struktur integriert. Die alten Routen `leadpool` und `commissions` werden entfernt.

### 2. Landing Pages + Website Hosting

| Menüpunkt | Route | Datenquelle | Funktion |
|-----------|-------|-------------|----------|
| **Landing Pages** | `/admin/landing-pages` | `landing_pages` Tabelle | Projekt-Websites (MOD-13): Slug-basierte Seiten mit Vorschau-Countdown, Sperr-Funktion |
| **Website Hosting** | `/admin/website-hosting` | `hosting_contracts` Tabelle | Tenant-Websites (MOD-05): Hosting-Vertraege, Suspendierung, Credit-Monitoring |

**Loesung**: Beide verwalten "veroeffentlichte Web-Inhalte" aus Admin-Sicht. Konsolidierung in **Website Hosting** mit zwei Tabs: "Hosting-Vertraege" (bisheriges WebHosting) und "Projekt-Websites" (bisherige Landing Pages). Die Route `landing-pages` wird entfernt.

---

## Umsetzungsplan

### Schritt 1: Lead Desk mit Tab-Struktur aufbauen

**Datei**: `src/pages/admin/desks/LeadDesk.tsx`

Den bisherigen Platzhalter ersetzen durch eine vollwertige 3-Tab-Ansicht:

- **Tab "Lead Pool"**: Gesamte Logik aus `src/pages/admin/LeadPool.tsx` uebernehmen (Lead-Tabelle, Erstell-Dialog, Zuweisungs-Dialog, KPI-Stats)
- **Tab "Zuweisungen"**: Zuweisungs-Tabelle (bisher zweiter Tab innerhalb LeadPool)
- **Tab "Provisionen"**: Inhalte aus `src/pages/admin/CommissionApproval.tsx` uebernehmen

Die KPI-Leiste oben bleibt erhalten, wird aber mit echten DB-Daten gespeist.

### Schritt 2: Website Hosting mit Landing Pages zusammenfuehren

**Datei**: `src/pages/admin/website-hosting/WebHostingDashboard.tsx`

Zwei Tabs hinzufuegen:

- **Tab "Hosting-Vertraege"**: Bestehende Funktionalitaet (hosting_contracts)
- **Tab "Projekt-Websites"**: Logik aus `src/pages/admin/AdminLandingPages.tsx` uebernehmen (landing_pages Tabelle, Status, Countdown, Lock/Unlock)

### Schritt 3: Veraltete Routen und Sidebar-Eintraege entfernen

**Datei**: `src/manifests/routesManifest.ts`
- Route `leadpool` entfernen (Zeile 111)
- Route `commissions` entfernen (Zeile 114)
- Route `landing-pages` entfernen (Zeile 170)

**Datei**: `src/components/admin/AdminSidebar.tsx`
- `LeadPool` und `CommissionApproval` aus ICON_MAP entfernen
- `leadpool`, `commissions`, `landing-pages` aus `getGroupKey()` und `shouldShowInNav()` entfernen

**Datei**: `src/router/ManifestRouter.tsx`
- Lazy-Imports fuer `LeadPool`, `CommissionApproval`, `AdminLandingPages` entfernen
- Eintraege aus `adminComponentMap` entfernen

### Schritt 4: Redirect fuer alte URLs (optional)

**Datei**: `src/hooks/useActionHandoff.ts`
- Redirect von `/admin/leadpool` auf `/admin/lead-desk` aendern (Zeile 102)

---

## Ergebnis: Bereinigte Sidebar "Operative Desks"

Vorher (7 Eintraege):
- Sales Desk
- Lead Pool (redundant)
- Provisionen (redundant)
- Lead Desk
- FutureRoom
- Acquiary
- Projekt Desk
- Landing Pages (redundant)
- Website Hosting

Nachher (6 Eintraege):
- Sales Desk
- **Lead Desk** (konsolidiert: Lead Pool + Provisionen)
- FutureRoom
- Acquiary
- Projekt Desk
- **Website Hosting** (konsolidiert: Hosting + Landing Pages)

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/admin/desks/LeadDesk.tsx` | Neuschreiben: 3-Tab-Struktur mit DB-Anbindung |
| `src/pages/admin/website-hosting/WebHostingDashboard.tsx` | Erweitern: Tab "Projekt-Websites" hinzufuegen |
| `src/manifests/routesManifest.ts` | 3 Routen entfernen |
| `src/components/admin/AdminSidebar.tsx` | Bereinigung ICON_MAP + Routing-Logik |
| `src/router/ManifestRouter.tsx` | 3 Component-Mappings entfernen |
| `src/hooks/useActionHandoff.ts` | Redirect-Pfad aktualisieren |

### Was sich NICHT aendert
- Datenbank-Tabellen (`leads`, `lead_assignments`, `landing_pages`, `hosting_contracts`) — bleiben unveraendert
- Zone 2 Module (MOD-09, MOD-10, MOD-13) — keine Aenderung
- Bestehende Hooks (`useLandingPage.ts`) — werden weiterverwendet
