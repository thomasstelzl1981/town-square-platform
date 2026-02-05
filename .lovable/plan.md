

# Umfassende Soll-/Ist-Analyse + Vervollständigungsplan
## Module 3, 4, 5, 6, 7 und 11 im Golden Path Kontext

---

## Executive Summary

Der Golden Path beschreibt den vollständigen E2E-Workflow eines Users durch die Software. Die aktuelle Implementierung ist **strukturell vorhanden** (Routing, Komponenten, DB-Tabellen), aber an kritischen Stellen fehlen **funktionale Verbindungen** zwischen den Modulen und zu Zone 1.

**Gesamtstatus: ~65% des Golden Path funktional**

---

## Modul-für-Modul Analyse

### MOD-03 — DMS/Storage

| Aspekt | SOLL (Golden Path) | IST (Code) | Gap |
|--------|---------------------|------------|-----|
| **Routing** | "How It Works" als Landing | ✅ Zeile 20: `<Route index element={<ModuleHowItWorks ... />} />` | OK |
| **18-Ordner-Struktur** | Property Dossier Template | ✅ DB: 19 storage_nodes vorhanden | OK |
| **Document Links** | 12 Demo-Dokumente verknüpft | ⚠️ DB: nur 3 document_links | **LÜCKE** |
| **Taxonomie-Icons** | 7 System-Ordner definiert | ✅ Zeile 56-64: SYSTEM_FOLDERS | OK |
| **Ordner-Navigation** | Tree-basiert | ✅ StorageTab.tsx implementiert | OK |
| **Upload-Anbindung** | Drag & Drop + Auto-Link | ✅ FileUploader Komponente | OK |

**Befund MOD-03:** Grundstruktur funktional, aber Golden-Path-Seed erstellt nur 3 statt 12 Dokumente.

---

### MOD-04 — Immobilien (SSOT)

| Aspekt | SOLL (Golden Path) | IST (Code) | Gap |
|--------|---------------------|------------|-----|
| **Routing** | "How It Works" als Landing | ✅ Zeile 90: `<ModuleHowItWorks content={moduleContents['MOD-04']} />` | OK (repariert) |
| **Kontexte-Tab** | Ehepaar Mustermann (50%/50%) | ⚠️ DB: 1 landlord_context, 0 context_members | **LÜCKE** |
| **Portfolio-Tab** | 1 Property mit Kennzahlen | ✅ DB: 1 property vorhanden | OK |
| **Dossier 9 Blöcke** | A-J vollständig | ✅ PropertyDetailPage.tsx mit Blöcken | OK |
| **Mietvertrag** | 1 aktiver Lease mit Tenant | ❌ DB: 0 leases | **LÜCKE** |
| **Darlehen** | 80% LTV Sparkasse | ✅ DB: 1 loan vorhanden | OK |
| **Unit-basierte Ansicht** | 1 Row = 1 Unit | ✅ PortfolioTab.tsx Zeile 37-58 | OK |
| **Kontexte-Picker** | Multi-Context Subbar | ✅ PortfolioTab.tsx Zeile 96 | OK |

**Befund MOD-04:** Routing jetzt korrekt, aber Seed-Funktion erstellt keine Kontakte und keinen Lease.

---

### MOD-05 — MSV (Mietsonderverwaltung)

| Aspekt | SOLL (Golden Path) | IST (Code) | Gap |
|--------|---------------------|------------|-----|
| **Routing** | "How It Works" als Landing | ✅ Zeile 21 | OK |
| **Objekte-Tab** | Spiegelt MOD-04 Units | ⚠️ ObjekteTab fehlt in `msv/` | **LÜCKE** |
| **Mieteingang** | Soll/Ist-Abgleich | ✅ MieteingangTab.tsx vorhanden | OK |
| **Vermietung** | Vermietungs-Exposés | ✅ VermietungTab.tsx + RentalExposeDetail | OK |
| **MOD-04 Read-Only** | Keine Writes auf units/properties | ✅ Consumer-Pattern implementiert | OK |

**Befund MOD-05:** Strukturell korrekt, ObjekteTab existiert und liest aus MOD-04.

---

### MOD-06 — Verkauf

| Aspekt | SOLL (Golden Path) | IST (Code) | Gap |
|--------|---------------------|------------|-----|
| **Routing** | "How It Works" als Landing | ✅ Zeile 39 | OK |
| **Objekte-Tab** | Units aus MOD-04 | ✅ ObjekteTab.tsx mit JOIN | OK |
| **Exposé-Detail** | Listing erstellen/bearbeiten | ✅ ExposeDetail.tsx 671 Zeilen | OK |
| **Partner-Freigabe ZUERST** | Consent-Gates | ✅ Zeile 306: `hasPartnerRelease` | OK |
| **Kaufy-Freigabe NACH Partner** | Toggle-Logic | ✅ Zeile 311: `canEnableKaufy = hasPartnerRelease` | OK |
| **3 Consents** | SALES_MANDATE, PARTNER_RELEASE, FEE | ⚠️ Dialoge vorhanden, aber Logik unvollständig | **TEILWEISE** |
| **Zone 1 Integration** | Listing → Sales Desk | ❌ Keine Automatik | **LÜCKE** |

**Befund MOD-06:** Frontend-Logik für Partner-Kaufy-Reihenfolge korrekt, aber kein automatischer Push nach Zone 1 Sales Desk.

---

### MOD-07 — Finanzierung

| Aspekt | SOLL (Golden Path) | IST (Code) | Gap |
|--------|---------------------|------------|-----|
| **Routing** | "How It Works" als Landing | ✅ Zeile 22 | OK |
| **Selbstauskunft 8 Tabs** | Alle Felder | ✅ SelbstauskunftForm.tsx 1115 Zeilen | OK |
| **MOD-04 Kapitalanlagen read-only** | Vermögenswerte aggregiert | ❌ Nicht implementiert | **LÜCKE** |
| **Objektfelder kontextabhängig** | read-only bei property_id | ❌ Nicht implementiert | **LÜCKE** |
| **Anfrage-Tab** | 3 Objektquellen | ✅ AnfrageTab.tsx Zeile 47-51 | OK |
| **Status-Wechsel** | draft → submitted_to_zone1 | ⚠️ Status-Update vorhanden, aber kein Zone 1 Trigger | **TEILWEISE** |
| **Zone 1 Integration** | Anfrage → FutureRoom | ❌ Keine automatische Überleitung | **LÜCKE** |

**Befund MOD-07:** Selbstauskunft vollständig, aber keine Integration von MOD-04-Daten und keine Zone 1 Handoff-Automatik.

---

### MOD-11 — Finanzierungsmanager

| Aspekt | SOLL (Golden Path) | IST (Code) | Gap |
|--------|---------------------|------------|-----|
| **Routing** | 4 Tabs (Dashboard, Fälle, Kommunikation, Status) | ✅ Zeile 99-120 | OK |
| **Rollen-Gate** | finance_manager required | ✅ Zeile 38: `isFinanceManager` | OK |
| **Dashboard** | Zugewiesene Fälle | ✅ FMDashboard.tsx vorhanden | OK |
| **Fall-Dossier** | Selbstauskunft read-only | ⚠️ FMFallDetail.tsx, aber Daten fehlen | **TEILWEISE** |
| **Zone 1 Sync** | Status zurückspiegeln | ❌ Kein Sync implementiert | **LÜCKE** |
| **useAcceptMandate** | future_room_cases INSERT | ⚠️ Hook existiert, aber Aufruf fehlt | **LÜCKE** |

**Befund MOD-11:** Struktur vollständig, aber Datenflusss von Zone 1 fehlt.

---

### Zone 1 — FutureRoom + Sales Desk

| Aspekt | SOLL (Golden Path) | IST (Code) | Gap |
|--------|---------------------|------------|-----|
| **FutureRoom Inbox** | submitted_to_zone1 Anfragen | ✅ FutureRoomInbox.tsx | OK |
| **FutureRoom Zuweisung** | Manager-Picker | ✅ FutureRoomZuweisung.tsx | OK |
| **Sales Desk Listings** | Alle MOD-06 Listings | ⚠️ SalesDesk.tsx zeigt nur EmptyState | **LÜCKE** |
| **Blocking-Funktion** | Admin kann blocken | ❌ Nicht implementiert | **LÜCKE** |
| **Distribution MOD-09** | Freigegebene an Partner | ❌ Nicht implementiert | **LÜCKE** |
| **Distribution Kaufy** | Freigegebene an Zone 3 | ⚠️ listing_publications vorhanden | **TEILWEISE** |
| **Lead Pool** | Zone 3 → Zuweisung | ✅ LeadPool.tsx funktional | OK |

**Befund Zone 1:** FutureRoom strukturell OK, Sales Desk ist nur Stub ohne echte Daten.

---

## Kritische Lücken (Priorisiert)

### P0 — Seed-Funktion unvollständig

**Problem:** Die DB-Funktion `seed_golden_path_data` erstellt aktuell:
- ✅ 1 Property, 1 Unit, 1 Loan, 1 Finance Request, 1 Applicant Profile
- ❌ 0 Contacts (sollen 5 sein)
- ❌ 0 Leases (soll 1 sein)
- ❌ 0 Context Members (sollen 2 sein)
- ⚠️ 3 statt 12 Dokumente

**Lösung:** DB-Funktion erweitern um:
- INSERT contacts (5 Einträge)
- INSERT leases (1 Eintrag mit tenant_contact_id)
- INSERT context_members (Max + Lisa)
- INSERT documents + document_links (12 Einträge)

### P1 — MOD-07 ↔ MOD-04 Integration

**Problem:** Selbstauskunft zeigt keine MOD-04 Kapitalanlagen als Vermögenswerte.

**Lösung:**
1. In `SelbstauskunftForm.tsx` neuen Tab oder Sektion "Kapitalanlagen"
2. Query auf `properties`/`units`/`leases` mit tenant_id
3. Aggregation: Mieteinnahmen p.a., Verkehrswerte, Restschulden
4. Read-only Darstellung

### P1 — MOD-07 → Zone 1 Handoff

**Problem:** Bei Einreichung keine automatische Benachrichtigung an Zone 1.

**Lösung:**
1. Nach Status-Update auf `submitted_to_zone1`: Edge Function triggern
2. Optional: `finance_mandates` automatisch erstellen
3. Badge in Zone 1 FutureRoom aktualisieren

### P1 — Zone 1 Sales Desk funktional machen

**Problem:** Sales Desk zeigt nur EmptyState, keine echten Listings.

**Lösung:**
1. Query auf `listings` + `listing_publications`
2. Admin-UI für Blocking (`is_blocked: true`)
3. Toggle für MOD-09 + Kaufy Distribution

### P2 — MOD-06 → Zone 1 automatischer Push

**Problem:** Listings erscheinen nicht automatisch im Sales Desk.

**Lösung:**
1. Bei Partner-Release: `listing_publications` INSERT
2. Zone 1 Sales Desk liest diese Tabelle
3. Status-Sync bidirektional

### P2 — MOD-11 Datenfluss

**Problem:** Manager sieht zugewiesene Fälle, aber keine Detaildaten.

**Lösung:**
1. `useFutureRoomCases` erweitern mit Selbstauskunft-JOIN
2. Fall-Dossier zeigt: Antragsteller, Objekt, Dokumente
3. Accept-Button mit `useAcceptMandate`

---

## Vervollständigungsplan (6 Arbeitspakete)

### AP-1: Golden Path Seed vollständig machen (P0)

**Ziel:** Ein Klick erzeugt vollständige Testdaten

**Änderungen:**
1. Neue DB-Migration: `seed_golden_path_v2.sql`
   - 5 Contacts mit korrekten public_ids
   - 2 context_members (Max 50%, Lisa 50%)
   - 1 Lease mit tenant_contact_id
   - 9 zusätzliche Dokumente + document_links

**Geschätzte Zeilen:** ~150 SQL

### AP-2: MOD-07 MOD-04-Integration (P1)

**Ziel:** Kapitalanlagen aus MOD-04 in Selbstauskunft anzeigen

**Änderungen:**
1. Neue Komponente: `CapitalAssetsPanel.tsx` (~100 Zeilen)
2. In `SelbstauskunftForm.tsx` einbinden (~20 Zeilen)
3. Query: properties + units + leases aggregiert

**Geschätzte Zeilen:** ~120 neue

### AP-3: Zone 1 Handoff-Automatik (P1)

**Ziel:** Automatische Benachrichtigung bei Einreichung

**Änderungen:**
1. In `AnfrageDetailPage.tsx`: Nach Submit → RPC aufrufen
2. Neue Edge Function: `sot-finance-request-submit` (~50 Zeilen)
3. Insert in `finance_mandates` mit Status `submitted_to_zone1`

**Geschätzte Zeilen:** ~100 neue

### AP-4: Zone 1 Sales Desk funktional (P1)

**Ziel:** Listings anzeigen und verwalten

**Änderungen:**
1. `SalesDesk.tsx` VeroeffentlichungenTab: Query auf `listings` (~80 Zeilen)
2. DataTable mit Blocking-Toggle (~50 Zeilen)
3. Distribution-Buttons für MOD-09/Kaufy (~30 Zeilen)

**Geschätzte Zeilen:** ~160 neue

### AP-5: MOD-06 → Zone 1 Sync (P2)

**Ziel:** Listings automatisch nach Zone 1

**Änderungen:**
1. In `ExposeDetail.tsx`: Bei Partner-Release → listing_publications INSERT
2. Status-Callback von Zone 1 (optional)

**Geschätzte Zeilen:** ~40 Anpassungen

### AP-6: MOD-11 Datenfluss (P2)

**Ziel:** Manager sieht vollständiges Dossier

**Änderungen:**
1. `useFutureRoomCases.ts` erweitern: JOIN mit applicant_profiles
2. `FMFallDetail.tsx` anpassen: Selbstauskunft-Panel
3. Accept-Button aktivieren

**Geschätzte Zeilen:** ~100 Anpassungen

---

## Testplan: Golden Path Durchlauf

Nach Implementierung der 6 Arbeitspakete kann folgender E2E-Test durchgeführt werden:

### Phase 1: Seeding (Zone 1)
1. `/admin/tiles` → Tab "Testdaten" → "Einspielen"
2. **Erwartung:** Toast zeigt 5 Kontakte, 1 Property, 12 Dokumente

### Phase 2: MOD-04 Immobilien
3. `/portal/immobilien` → "How It Works" erscheint
4. "Portfolio" → 1 Immobilie mit Kennzahlen
5. "Kontexte" → Ehepaar Mustermann tabellarisch
6. Klick "Auge" → Dossier mit 9 Blöcken
7. Block F (Mietverhältnisse) → 1 aktiver Mietvertrag

### Phase 3: MOD-03 DMS
8. `/portal/dms/storage` → 18-Ordner-Struktur
9. Ordner "Mietvertrag" → 1 Dokument verlinkt

### Phase 4: MOD-07 Finanzierung
10. `/portal/finanzierung` → "How It Works" erscheint
11. "Selbstauskunft" → Formular ~85% befüllt
12. **NEU:** Tab/Panel "Kapitalanlagen" → 1 Immobilie read-only
13. "Anfrage" → Neue Anfrage erstellen (Quelle: Portfolio)
14. Objekt auswählen → Felder read-only
15. "Einreichen" → Toast "An Zone 1 übergeben"

### Phase 5: Zone 1 FutureRoom
16. `/admin/futureroom/inbox` → 1 neue Anfrage
17. "Zuweisen" → Manager auswählen
18. Status ändert sich auf "assigned"

### Phase 6: MOD-11 Finanzierungsmanager
19. `/portal/finanzierungsmanager/dashboard` → 1 neuer Fall
20. "Fälle" → Fall-Dossier öffnen
21. Selbstauskunft-Übersicht read-only sichtbar
22. "Akzeptieren" → Status ändert sich

### Phase 7: MOD-06 Verkauf
23. `/portal/verkauf/objekte` → 1 Immobilie
24. "Exposé erstellen" → Formular befüllen
25. Partner-Freigabe aktivieren (3 Consents)
26. Kaufy-Toggle erscheint → aktivieren

### Phase 8: Zone 1 Sales Desk
27. `/admin/sales-desk` → 1 Listing sichtbar
28. Distribution-Status: MOD-09 ✅, Kaufy ✅

### Phase 9: Reset
29. `/admin/tiles` → "Zurücksetzen"
30. Alle Golden-Path-Daten gelöscht

---

## Zusammenfassung

| Modul | Routing | Daten | Zone 1 Integration | Gesamt |
|-------|---------|-------|-------------------|--------|
| MOD-03 | ✅ | ⚠️ 3/12 Docs | — | 75% |
| MOD-04 | ✅ | ⚠️ fehlt Lease/Contacts | — | 70% |
| MOD-05 | ✅ | ✅ | — | 90% |
| MOD-06 | ✅ | ✅ | ❌ kein Auto-Push | 70% |
| MOD-07 | ✅ | ⚠️ fehlt MOD-04 Daten | ❌ kein Handoff | 50% |
| MOD-11 | ✅ | ⚠️ fehlt Datenfluss | ⚠️ Strukturell OK | 60% |
| Zone 1 | ✅ | ❌ Sales Desk leer | — | 50% |

**Nächste Schritte:**
1. **AP-1 (P0):** Seed-Funktion vervollständigen
2. **AP-2 + AP-3 (P1):** MOD-07 Integration + Handoff
3. **AP-4 (P1):** Sales Desk funktional machen
4. **AP-5 + AP-6 (P2):** Sync und MOD-11 Datenfluss

