

# Enterprise-Readiness Analyse v3: Post-Hardening Audit

Stand nach Enterprise-Hardening Migration v2.

---

## STATUS-UEBERSICHT

| Dimension | Status | Delta zur letzten Analyse |
|-----------|--------|--------------------------|
| Routing / Manifest SSOT | Stabil | MOD-00 jetzt in Manifest + areaConfig + portalModulePageMap |
| Zonen-Architektur (1/2/3) | Stabil | Keine Aenderung |
| Akten-Standard (KB.SYSTEM.009) | Stabil | Keine Aenderung |
| ID-System (public_id) | Vollstaendig | self_disclosures (SD) jetzt migriert |
| Golden Path Dokumentation | Vollstaendig | 4 neue Docs erstellt (Akquise, Lead, Vermietung, Projekte) |
| Camunda ActionKeys | Vollstaendig | 12 ActionKeys registriert |
| GDPR deleted_at | Vollstaendig | 9 PII-Tabellen abgedeckt (communication_events existiert nicht) |
| useSmartUpload (toter Code) | Geloescht | Bereinigt |
| RolesManagement Mapping | Gefixt | Import + adminComponentMap Eintrag vorhanden |
| masterdata Index-Route | Gefixt | Route im Manifest vorhanden |
| DB FK-Indizes | Teilweise gefixt | 65 erstellt, aber **116 fehlen noch** |
| SECURITY DEFINER Views | Nicht gefixt | ALTER VIEW SET hat nicht gewirkt — Views muessen neu erstellt werden |
| Functions search_path | Teilweise gefixt | 5 von 8 gefixt, **3 + 5 Trigger-Funktionen fehlen noch** |
| RLS Hardening | Gefixt | knowledge_base + listing_views eingeschraenkt |

---

## OFFENE BEFUNDE (Priorisiert)

### Prioritaet 1: DB-Sicherheit (Migration noetig)

#### P1.1 — 2 Armstrong Views noch SECURITY DEFINER

Die Migration nutzte `ALTER VIEW SET (security_invoker = on)`, aber das ueberschreibt nicht den DEFINER-Modus bei Views, die mit `WITH (security_definer = true)` erstellt wurden. Die Views muessen mit `CREATE OR REPLACE VIEW` neu erstellt werden, um den DEFINER-Modus zu entfernen.

Betroffen:
- `v_armstrong_costs_daily`
- `v_armstrong_dashboard_kpis`

(Die Zone-3-Views `v_public_listings` und `v_public_knowledge` behalten absichtlich DEFINER fuer oeffentlichen Zugriff.)

#### P1.2 — 8 Functions ohne search_path (DB Linter)

Der Linter meldet weiterhin 8 Warnungen. 3 davon sind eigene Funktionen, 5 sind public_id Trigger-Funktionen aus aelteren Migrationen:

| Funktion | Typ |
|----------|-----|
| `generate_claim_public_id` | Generator |
| `generate_property_code` | Generator |
| `generate_vehicle_public_id` | Generator |
| `set_applicant_profiles_public_id` | Trigger |
| `set_dev_project_units_public_id` | Trigger |
| `set_dev_projects_public_id` | Trigger |
| `set_leases_public_id` | Trigger |
| `set_pv_plants_public_id` | Trigger |

(Die restlichen Linter-Warnungen betreffen pg_trgm Extension-Funktionen — nicht aenderbar.)

#### P1.3 — 116 fehlende FK-Indizes

Die erste Migration erstellte 65 Indizes, aber `check_missing_indexes()` meldet weiterhin **116 fehlende**. Darunter:
- `valuation_credits.invoice_id`
- `rent_payments.lease_id`
- `rent_reminders` (4 FK-Spalten)
- `rental_listings` (3 FK-Spalten)
- `cases.created_by`
- `case_events.actor_user_id`
- `acq_inbound_messages` (2 FK-Spalten)
- `service_cases` (6 FK-Spalten)
- `properties` (3 FK-Spalten)
- `customer_projects` (2 FK-Spalten)
- und viele weitere

**Massnahme:** Alle 116 verbleibenden Indizes in einer einzelnen Migration erstellen.

### Prioritaet 2: Auth-Sicherheit (Konfiguration)

#### P2.1 — OTP Expiry zu lang

Der Linter warnt, dass die OTP-Ablaufzeit den empfohlenen Schwellenwert uebersteigt. Fuer Enterprise sollte dies auf max. 300 Sekunden (5 Min) gesetzt werden.

#### P2.2 — Leaked Password Protection deaktiviert

Die Pruefung auf kompromittierte Passwoerter ist nicht aktiviert. Fuer Enterprise-Kunden ein Muss.

### Prioritaet 3: Code-Konsistenz

#### P3.1 — MOD-00 Dashboard: Kein eigenes Page-Modul

`portalModulePageMap` mappt `dashboard` auf `PortalDashboard` (Zeile 265-268 in ManifestRouter.tsx). Das bedeutet: `/portal/dashboard/widgets` rendert dasselbe wie `/portal` — es gibt kein eigenstaendiges Dashboard-Modul mit Tile-Routing. Die 4 deklarierten Tiles (widgets, shortcuts, aktivitaet, einstellungen) haben keine eigene Routing-Logik.

**Empfehlung:** Entweder eine eigene `DashboardPage.tsx` mit internem Tile-Routing erstellen (wie alle anderen Module), oder MOD-00 als "Special Module" dokumentieren, das bewusst auf den Portal-Index zeigt.

#### P3.2 — Fehlende MOD-00 Dokumentation

`docs/modules/` enthaelt 20 MOD-Docs (MOD-01 bis MOD-20), aber kein `MOD-00_DASHBOARD.md`. Es existiert nur ein Memory-Eintrag (`features/mod-00-dashboard-spec-v2-0`), aber kein Markdown-Dokument im Repository.

#### P3.3 — Extension in Public Schema

Der Linter warnt, dass eine Extension (pg_trgm) im `public` Schema installiert ist. Best Practice waere ein eigenes `extensions` Schema, aber das ist ein Supabase-internes Setup-Detail und kein Blocker.

---

## WAS IST JETZT STABIL UND KORREKT

| Bereich | Status |
|---------|--------|
| 21 Module in routesManifest.ts | Korrekt (MOD-00 bis MOD-20) |
| areaConfig.ts: 21 Module in 4 Areas | Korrekt (MOD-00 in Base) |
| portalModulePageMap: 21 Eintraege | Korrekt (alle Module gemappt) |
| adminComponentMap: Alle Manifest-Routen gemappt | Korrekt (inkl. RolesManagement, MasterTemplates) |
| Zone-Trennung (1/2/3) | Sauber, keine Cross-Zone-Leaks |
| Camunda ActionKeys | 12/12 vollstaendig |
| Golden Path Dokumentation | 7/7 vollstaendig |
| GDPR deleted_at | 9/9 PII-Tabellen abgedeckt |
| ID-System (public_id) | 18 Prefixe vollstaendig |
| Consent-System | Funktional |
| DMS-Struktur | Stabil |
| RLS knowledge_base + listing_views | Gehaertet |

---

## UMSETZUNGSPLAN

### Schritt 1: DB-Migration (1 einzige Migration)

1. **116 fehlende FK-Indizes** — Alle aus `check_missing_indexes()` erzeugen
2. **2 Armstrong Views** — Mit `CREATE OR REPLACE VIEW` neu erstellen (ohne SECURITY DEFINER)
3. **8 Functions** — `SET search_path = public` auf die 3 Generatoren + 5 Trigger-Funktionen

**Risiko:** Null (rein additiv: Indizes, View-Properties, Function-Properties)

### Schritt 2: MOD-00 Dokumentation

- `docs/modules/MOD-00_DASHBOARD.md` erstellen (basierend auf bestehendem Memory-Eintrag)

### Schritt 3: MOD-00 DashboardPage Entscheidung

- Option A: Eigene `DashboardPage.tsx` mit Tile-Routing (wie alle anderen Module)
- Option B: MOD-00 als "Portal Index Alias" belassen und dokumentieren

**Empfehlung:** Option A, um die 4-Tile-Architektur konsistent zu halten.

---

## GESAMTBEWERTUNG

Die Architektur ist Enterprise-faehig. Die verbleibenden Punkte sind:
- **116 fehlende DB-Indizes** (Performance bei 100.000+ Tenants)
- **2 Views + 8 Functions** (Security-Hygiene)
- **MOD-00 Dokumentation** (Vollstaendigkeit)

Alle Fixes sind rein additiv. Kein Risiko fuer bestehende Funktionalitaet.

