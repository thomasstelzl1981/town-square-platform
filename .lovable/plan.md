
# Konsolidierung Zone 1 KI-Office: 3-Menuepunkte-Architektur

## Status: ✅ Phase 1 abgeschlossen (Routing + UI-Konsolidierung + DB-Migration)

## Neue Architektur: 3 Menuepunkte

```text
KI Office (Zone 1)
├── 1. Recherche      → /admin/ki-office/recherche
├── 2. Kontaktbuch    → /admin/ki-office/kontakte
└── 3. E-Mail Agent   → /admin/ki-office/email (3 Tabs: Posteingang, Kampagnen, Templates)
```

## Was wurde implementiert

### DB-Migration ✅
- `soat_search_orders` Tabelle (Auftraege mit Phasen-Tracking)
- `soat_search_results` Tabelle (Treffer/Kandidaten) mit Realtime
- Compliance-Spalten auf `contacts`: permission_status, legal_basis, unsubscribe_token, do_not_contact, last_contacted_at
- RLS Policies (platform_admin via memberships)
- Indexes

### Routing ✅
- 7 Routes → 3 Routes konsolidiert in routesManifest.ts
- ManifestRouter.tsx: Neue lazy imports (AdminRecherche, AdminKontaktbuch, AdminEmailAgent)
- Alte Imports entfernt

### UI-Seiten ✅
- `AdminEmailAgent.tsx` — 3-Tab Seite (Posteingang, Kampagnen, Templates)
- `AdminRecherche.tsx` — Wrapper fuer bestehende Recherche (SOAT-Upgrade pending)
- `AdminKontaktbuch.tsx` — Wrapper fuer bestehendes Kontaktbuch (Compliance-UI pending)

### Sidebar ✅
- ICON_MAP aktualisiert
- Gruppierung auf 3 Items reduziert
- Navigation funktioniert

## Naechste Schritte (Phase 2)

1. AdminRecherche aufwerten: Widget-Grid + SOAT Phasen-Tracking + Live-Progress + Ergebnis-Tabelle
2. AdminKontaktbuch: Compliance-Felder in UI integrieren (permission_status Filter, legal_basis Anzeige)
3. SOAT Edge Function: sot-soat-run-order Orchestrator
4. Kampagnen-System: soat_email_campaigns Tabellen + Kalenderplanung
5. Alte Dateien aufraeumen (AdminKiOfficeDashboard.tsx, CommunicationHub.tsx)
