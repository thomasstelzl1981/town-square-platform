

# Vollstaendige Modul-Analyse und GAP-Report

## 1. Manifest-Abgleich: 3-Quellen-Vergleich

### Aktuelle Module (22 Stueck — NICHT 20, NICHT 23)

| MOD | Name (Manifest) | Name (DB) | Base-Route | Tiles (Manifest) | Status |
|-----|-----------------|-----------|------------|-------------------|--------|
| 00 | Dashboard | Dashboard | dashboard | 0 (kein Modul) | OK |
| 01 | Stammdaten | Stammdaten | stammdaten | 5 (profil, vertraege, abrechnung, sicherheit, demo-daten) | OK |
| 02 | KI Office | KI Office | office | 7 (email, brief, kontakte, kalender, widgets, whatsapp, videocalls) | OK |
| 03 | DMS | DMS | dms | 4 (intelligenz, storage, posteingang, sortieren) | OK |
| 04 | Immobilien | Immobilien | immobilien | 4 (zuhause, portfolio, verwaltung, sanierung) | OK |
| 05 | Pets | Pets | pets | 4 (meine-tiere, caring, shop, mein-bereich) | OK |
| 06 | Verkauf | Verkauf | verkauf | 4 (objekte, anfragen, vorgaenge, reporting) | OK |
| 07 | Finanzierung | Finanzierung | finanzierung | 5 (selbstauskunft, dokumente, anfrage, status, privatkredit) | OK |
| 08 | Investment-Suche | Investment-Suche | investments | 4 (suche, favoriten, mandat, simulation) | OK |
| 09 | Immomanager | Vertriebsmanager | vertriebspartner | 5+6 dynamic (katalog, beratung, kunden, network, leads + selfie-ads) | NAME MISMATCH |
| 10 | Provisionen | Leadmanager | provisionen | 1 (uebersicht) | NAME MISMATCH |
| 11 | Finanzierungsmanager | Finanzierungsmanager | finanzierungsmanager | 5+7 dynamic (dashboard, finanzierungsakte, einreichung, provisionen, archiv) | OK |
| 12 | Akquisemanager | Akquisemanager | akquise-manager | 5+3 dynamic (dashboard, mandate, objekteingang, datenbank, tools) | OK |
| 13 | Projektmanager | Projektmanager | projekte | 4+2 dynamic (dashboard, projekte, vertrieb, landing-page) | OK |
| 14 | Communication Pro | Communication Pro | communication-pro | 4 (serien-emails, recherche, social, ki-telefon) | OK |
| 15 | Fortbildung | Fortbildung | fortbildung | 4 (buecher, fortbildungen, vortraege, kurse) | OK |
| 16 | Shop | Shops | services | 5 (amazon, otto-office, miete24, smart-home, bestellungen) | NAME MISMATCH |
| 17 | Car-Management | Car-Management | cars | 4 (fahrzeuge, boote, privatjet, angebote) | OK |
| 18 | Finanzen | Finanzanalyse | finanzanalyse | 9 (dashboard, konten, investment, kv, sachversicherungen, vorsorge, darlehen, abonnements, vorsorgedokumente) | NAME MISMATCH |
| 19 | Photovoltaik | Photovoltaik | photovoltaik | 4+2 dynamic (anlagen, enpal, dokumente, einstellungen) | OK |
| 20 | Miety | Zuhause | miety | 4+1 dynamic (uebersicht, versorgung, smarthome, kommunikation) | NAME MISMATCH |
| 21 | (entfernt) | — | — | — | GELOESCHT |
| 22 | Pet Manager | Pet Manager | petmanager | 7 (dashboard, profil, pension, services, mitarbeiter, kunden, finanzen) | OK |

### Veraltete Datei: `artifacts/audit/zone2_modules.json`

Diese Datei ist **komplett veraltet** und muss aktualisiert werden:
- Listet nur 20 Module (MOD-01 bis MOD-20)
- Fehlt: MOD-00 (Dashboard), MOD-22 (Pet Manager)
- MOD-05 falsch: "KI-Telefon-Assistent" mit base "msv" — ist jetzt "Pets" mit base "pets"
- Diverse Namens- und Tile-Abweichungen

**Aktion:** `zone2_modules.json` komplett neu generieren aus dem Manifest.

---

## 2. Zone 1 Admin Desks — Counterpart-Analyse

### Vorhandene Desks und ihre Zone-2-Counterparts

| Zone 1 Desk | Route | Sub-Routen | Z2-Counterpart | Readiness |
|-------------|-------|------------|-----------------|-----------|
| **Sales Desk** | /admin/sales-desk | 5 (Dashboard, Veroeffentlichungen, Inbox, Partner, Audit) | MOD-06 Verkauf, MOD-09 Immomanager | GUT |
| **Lead Desk** | /admin/lead-desk | 1 (nur Dashboard) | MOD-10 Provisionen | LUECKE — nur 1 Route |
| **FutureRoom** | /admin/futureroom | 9 (Dashboard, Inbox, Zuweisung, Manager, Banks, Monitoring, Templates, WebLeads, Contracts) | MOD-07 Finanzierung, MOD-11 Finanzierungsmanager | GUT — tiefste Struktur |
| **Acquiary** | /admin/acquiary | 9 (Dashboard, Kontakte, Datenbank, Mandate, Routing, Monitor + 3 Legacy) | MOD-08 Investment-Suche, MOD-12 Akquisemanager | GUT |
| **Projekt Desk** | /admin/projekt-desk | 4 (Dashboard, Projekte, Listings, Landing Pages) | MOD-13 Projektmanager | GUT |
| **Pet Desk** | /admin/pet-desk | 5 (Governance, Vorgaenge, Kunden, Shop, Billing) | MOD-05 Pets, MOD-22 Pet Manager | GUT |
| **Finance Desk** | /admin/finance-desk | 1 (nur Dashboard) | MOD-18 Finanzen | LUECKE — nur 1 Route |
| **Armstrong Console** | /admin/armstrong | 11 Sub-Routen | Quer-Modul (KI-Governance) | GUT |
| **Fortbildung Admin** | /admin/fortbildung | 1 | MOD-15 Fortbildung | MINIMAL |
| **Website Hosting** | /admin/website-hosting | 1 | Zone 3 Websites | MINIMAL |

### Zone-2-Module OHNE Zone-1-Desk

| MOD | Name | Benoetigt Desk? | Begruendung |
|-----|------|-----------------|-------------|
| 01 | Stammdaten | Nein | Self-Service, kein Cross-Zone-Flow |
| 02 | KI Office | Nein | Operativ, Zone 1 hat eigene KI-Office-Routes |
| 03 | DMS | Nein | Self-Service Dokumentenmanager |
| 04 | Immobilien | Nein | Daten bleiben in Z2, Verkauf geht ueber Sales Desk |
| 14 | Communication Pro | Nein | Operativ, kein Governance noetig |
| 16 | Shop | Nein | Affiliate-Modell, kein operatives Desk |
| 17 | Car-Management | Nein | Self-Service CRUD |
| 19 | Photovoltaik | Nein | Self-Service + Partner-Referral |
| 20 | Miety/Zuhause | Nein | Mieter-Self-Service |

---

## 3. GAP-Analyse — Entwicklungsluecken

### PRIO 1: Operative Luecken (blockieren Beta)

**GAP-1: Lead Desk — nur 1 Route, keine operative Tiefe**
- Aktuell: Nur `/admin/lead-desk` (Dashboard-Seite)
- Soll: Lead-Pool, Zuweisungen, Provisionen, Kampagnen-Monitor
- Impact: MOD-10 (Leadmanager/Provisionen) hat keinen Governance-Counterpart
- Z3-Leads (Kaufy, SoT, FutureRoom) haben kein Ziel in Zone 1

**GAP-2: Finance Desk — nur 1 Route, keine operative Tiefe**
- Aktuell: Nur `/admin/finance-desk` (Dashboard-Seite)
- Soll: Inbox (Beratungsanfragen), Zuweisung, Faelle, Monitor
- Impact: Private Finanzberatungs-Leads aus Zone 3 haben kein operatives Desk

**GAP-3: zone2_modules.json komplett veraltet**
- 20 statt 22 Module, falsche Namen und Tiles
- Wird moeglicherweise von Audit-Tools oder Docs-Export referenziert

### PRIO 2: Funktionale Luecken (beeintraechtigen Nutzererlebnis)

**GAP-4: MOD-10 Name-Inkonsistenz**
- Manifest: "Provisionen" mit base "provisionen"
- DB tile_catalog: "Leadmanager"
- Verwirrend: Ist es ein Lead-Modul oder ein Provisions-Modul?
- Loesung: Klare Entscheidung treffen und synchronisieren

**GAP-5: MOD-09 Name-Inkonsistenz**
- Manifest: "Immomanager"
- DB tile_catalog: "Vertriebsmanager"
- Route: "vertriebspartner"
- Drei verschiedene Namen fuer dasselbe Modul

**GAP-6: MOD-18 Name-Inkonsistenz**
- Manifest: "Finanzen"
- DB tile_catalog: "Finanzanalyse"
- Route: "finanzanalyse"

**GAP-7: MOD-20 Name-Inkonsistenz**
- Manifest: "Miety"
- DB tile_catalog: "Zuhause"
- Display sollte "Zuhause" sein, Route bleibt "miety"

### PRIO 3: Inhaltliche Luecken

**GAP-8: MOD-15 (Fortbildung) — kein User-Progress-Tracking**
- Zeigt kuratierte Inhalte (Buecher, Kurse, Vortraege)
- Kein "Meine Kurse" oder "Zertifikate" Tracking
- Manifest-Tiles (buecher, fortbildungen, vortraege, kurse) weichen von zone2_modules.json ab (katalog, meine-kurse, zertifikate, settings)

**GAP-9: MOD-16 (Shop) — reine Affiliate-Links**
- BestellungenTab existiert, aber keine systematische Erfassung
- Akzeptabel als Affiliate-Modell, aber "Bestellungen" Tab ist leer/nicht nutzbar

**GAP-10: MOD-19 (Photovoltaik) — Enpal-Integration ist Stub**
- EnpalTab existiert, aber kein echtes Partner-API
- Anlagen-CRUD und Dokumente funktionieren

---

## 4. Umsetzungsplan

### Schritt 1: zone2_modules.json aktualisieren
Datei `artifacts/audit/zone2_modules.json` komplett neu generieren mit allen 22 Modulen, korrekten Namen, Bases und Tiles — direkt aus dem Manifest abgeleitet.

### Schritt 2: Lead Desk aufwerten (Zone 1)
Den Lead Desk von 1 Route auf eine vollstaendige Tab-Struktur erweitern:

```text
/admin/lead-desk              → Dashboard (KPIs, Quick-Actions)
/admin/lead-desk/pool         → Lead-Pool (alle Leads, Filter, Status)
/admin/lead-desk/zuweisungen  → Zuweisungen (Lead → Partner Matching)
/admin/lead-desk/provisionen  → Provisionen (Aggregation, Freigabe)
/admin/lead-desk/monitor      → Monitor (Kampagnen, Conversion-KPIs)
```

Pattern: Analog zum Acquiary-Desk (Tab-basiert mit OperativeDeskShell). Nutzt bestehende DB-Tabellen: `leads`, `lead_assignments`, `commissions`.

### Schritt 3: Finance Desk aufwerten (Zone 1)
Den Finance Desk von 1 Route auf eine Tab-Struktur erweitern:

```text
/admin/finance-desk              → Dashboard (KPIs)
/admin/finance-desk/inbox        → Inbox (Beratungsanfragen)
/admin/finance-desk/zuweisung    → Zuweisung (Anfrage → Berater)
/admin/finance-desk/faelle       → Aktive Faelle
/admin/finance-desk/monitor      → Pipeline-Monitor
```

### Schritt 4: Namens-Synchronisation (DB tile_catalog ← Manifest)
SQL-Migration um die 5 Namens-Inkonsistenzen zwischen tile_catalog und Manifest zu beheben:

| tile_code | DB-Titel aktuell | Neuer Titel (= Manifest) |
|-----------|-----------------|--------------------------|
| MOD-09 | Vertriebsmanager | Immomanager |
| MOD-10 | Leadmanager | Provisionen (oder Leadmanager — Entscheidung noetig) |
| MOD-16 | Shops | Shop |
| MOD-18 | Finanzanalyse | Finanzen |
| MOD-20 | Zuhause | Zuhause (bleibt — Manifest sollte angepasst werden) |

**Entscheidungsbedarf bei MOD-09 und MOD-10**: Der korrekte Display-Name muss festgelegt werden. Empfehlung: DB als SSOT fuer Display-Names verwenden.

### Schritt 5: Fortbildung Admin aufwerten
Die Admin-Fortbildung hat nur 1 Route. Fuer die Verwaltung von Kursinhalten, Zertifikaten und Teilnehmern sollte sie erweitert werden — aber nur wenn MOD-15 auch User-Tracking erhaelt.

### Zusammenfassung der Prioritaeten

| Prio | GAP | Aufwand | Impact |
|------|-----|---------|--------|
| 1 | zone2_modules.json aktualisieren | Klein (1 Datei) | Audit-Konsistenz |
| 1 | Lead Desk aufwerten | Mittel (5 Sub-Seiten) | Operativer Lead-Flow |
| 1 | Finance Desk aufwerten | Mittel (5 Sub-Seiten) | Operativer Beratungs-Flow |
| 2 | Namens-Synchronisation | Klein (1 SQL Migration) | Datenkonsistenz |
| 3 | Fortbildung Tracking | Gross | Nutzererlebnis |
| 3 | Shop Bestellungen | Mittel | Nutzererlebnis |
| 3 | Enpal Integration | Extern (API) | Partner-Flow |

