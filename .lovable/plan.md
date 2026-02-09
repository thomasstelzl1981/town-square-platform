

# Enterprise-Readiness Tiefenanalyse: Vollstaendiger Code-Audit

Analyse nach allen bisherigen Aenderungen (6 Akten, ID-System, 2. Antragsteller).

---

## KATEGORIE A: CODE-FEHLER (Muss sofort gefixt werden)

### A1 — MOD-00 "Dashboard" ist ein Phantom-Modul

**Problem:** MOD-00 wurde in `routesManifest.ts` deklariert (4 Tiles: widgets, shortcuts, aktivitaet, einstellungen), aber:
- `portalModulePageMap` in ManifestRouter.tsx hat **keinen Eintrag** fuer `dashboard`
- `areaConfig.ts` enthaelt **kein MOD-00** — es existiert in keiner der 4 Areas
- Es gibt keine Datei `src/pages/portal/DashboardPage.tsx` (nur `PortalDashboard.tsx` als Index)

**Effekt:** Jeder Zugriff auf `/portal/dashboard/*` erzeugt `console.warn("Missing module page for: dashboard")` und rendert nichts. Das Portal-Dashboard (`/portal`) funktioniert, aber MOD-00 als eigenstaendiges Modul tut es nicht.

**Fix:** Entweder MOD-00 aus dem Manifest entfernen (Dashboard bleibt als Portal-Index), oder eine `DashboardPage.tsx` mit interner Routing-Logik erstellen und in `portalModulePageMap` eintragen.

### A2 — 3 Manifest-Routen ohne Component-Mapping

| Route (routesManifest.ts) | Component-Name | In adminComponentMap? | Importiert? |
|--|--|--|--|
| `roles` | `RolesManagement` | NEIN | NEIN |
| `masterdata` (Index) | `MasterTemplates` | JA (im Map) | JA | 
| (kein Pfad) | `MasterContacts` | JA (im Map) | JA |

- **`RolesManagement`**: Deklariert als `{ path: "roles", component: "RolesManagement" }` im Manifest, aber WEDER importiert noch in `adminComponentMap` eingetragen. `/admin/roles` rendert **nichts**.
- **`MasterContacts`**: Importiert und in der Map, aber **kein Manifest-Eintrag**. Toter Code — die Seite existiert, ist aber unerreichbar.
- **`MasterTemplates` (Index-Seite)**: Importiert und in der Map, aber **kein Manifest-Eintrag fuer `masterdata`** (nur die 6 Unter-Pfade). Die Hauptseite mit den 6 Karten hat keine eigene Route — erreichbar nur wenn direkt verlinkt.

### A3 — `self_disclosures` fehlt public_id

Die Migration hat `public_id` + Trigger fuer `dev_projects`, `dev_project_units`, `applicant_profiles`, `pv_plants`, `leases` erstellt. Aber `self_disclosures` (Prefix `SD` laut KB.SYSTEM.009) wurde **nicht migriert**. Die Spalte existiert nicht, kein Trigger vorhanden.

### A4 — Deprecated Hook-Datei ohne Konsumenten

`src/hooks/useSmartUpload.ts` re-exportiert `useUniversalUpload`, wird aber von **keiner einzigen Datei** importiert. Toter Code.

---

## KATEGORIE B: SICHERHEIT (Kritisch fuer Enterprise)

### B1 — 4 SECURITY DEFINER Views

Betroffene Views:
- `v_armstrong_costs_daily`
- `v_armstrong_dashboard_kpis`
- `v_public_knowledge`
- `v_public_listings`

Diese Views umgehen RLS. Bei `v_public_listings` und `v_public_knowledge` ist das **beabsichtigt** (oeffentliche Daten fuer Zone 3). Bei den Armstrong-Views muss geprueft werden, ob `SECURITY INVOKER` ausreichend ist.

**Fix:** Armstrong-Views auf `SECURITY INVOKER` umstellen. Zone-3-Views behalten DEFINER, aber mit expliziter Begruendung im Code.

### B2 — 8 Custom Functions ohne search_path

| Funktion | Risiko |
|--|--|
| `generate_acq_mandate_code` | Mittel |
| `generate_acq_routing_token` | Mittel |
| `generate_claim_public_id` | Mittel |
| `generate_contact_dedupe_key` | Mittel |
| `generate_property_code` | Mittel |
| `generate_vehicle_public_id` | Mittel |
| `update_admin_updated_at` | Niedrig |
| `update_applicant_liabilities_updated_at` | Niedrig |

**Fix:** Allen 8 Funktionen `SET search_path = public` hinzufuegen.

### B3 — 2 RLS-Policies mit "always true"

| Tabelle | Policy | Problem |
|--|--|--|
| `knowledge_base` | "Admins can manage knowledge base" | `USING (true)` auf ALL-Operationen |
| `listing_views` | "Allow insert for tracking" | `WITH CHECK (true)` auf INSERT |

**Fix:** `knowledge_base` auf `is_platform_admin()` einschraenken. `listing_views` INSERT-Policy mit Rate-Limiting oder Session-Check absichern.

### B4 — 181 fehlende FK-Indizes

Unveraendert seit letzter Analyse. Jeder fehlende Index bedeutet Full-Table-Scan bei JOINs.

**Fix:** Eine einzelne Migration mit `CREATE INDEX IF NOT EXISTS` fuer alle 181.

---

## KATEGORIE C: ARCHITEKTUR-LUECKEN

### C1 — areaConfig.ts: Nur 19 von 21 Modulen zugeordnet

Die 4 Areas enthalten: MOD-01 bis MOD-05, MOD-06 bis MOD-08, MOD-09 bis MOD-13, MOD-14 bis MOD-20 = **20 Module**. **MOD-00 fehlt.** MOD-00 gehoert entweder nirgendwohin (es IST das Dashboard) oder in "Base".

### C2 — Camunda ActionKeys: 5 von 12+ vorhanden

Bestehend: `FIN_SUBMIT`, `MANDATE_DELEGATE`, `SALE_START`, `RENTAL_START`, `SERVICE_REQUEST`.

Fehlend fuer Enterprise-Vollstaendigkeit:
- `ACQ_MANDATE_CREATE` (MOD-08)
- `ACQ_MANDATE_ACCEPT` (MOD-12)
- `LEAD_ASSIGN` (Zone 1)
- `LISTING_PUBLISH` (MOD-06)
- `LISTING_WITHDRAW` (MOD-06)
- `PV_COMMISSION` (MOD-19)
- `PROJECT_PHASE_CHANGE` (MOD-13)

### C3 — GDPR: deleted_at nur auf 6 von ~10 PII-Tabellen

Vorhanden: `applicant_profiles`, `contacts`, `documents`, `leads`, `profiles`, `self_disclosures`

Fehlend: `communication_events`, `renter_invites`, `partner_deals`, `finance_bank_contacts`

### C4 — Golden Path Dokumentation: 3 von 7

Vorhanden: E2E, Finanzierung, Sanierung. Fehlend: Akquise, Lead-Gen, Vermietung, Projekte.

---

## KATEGORIE D: WAS IST KORREKT UND STABIL

| Bereich | Status | Details |
|--|--|--|
| Routing-Manifest SSOT | Stabil | 21 Module + 4 Websites korrekt deklariert |
| Zone-Trennung (1/2/3) | Stabil | Keine Cross-Zone-Leaks |
| Akten-Standard (KB.SYSTEM.009) | Stabil | 6/6 Vorlagen im Accordion-Format |
| ID-System (public_id) | Fast vollstaendig | 16 Trigger aktiv, nur `self_disclosures` fehlt |
| 2. Antragsteller | Funktional | Korrekte Datentrennung, eigener DB-Record |
| Consent-System | Funktional | `user_consents` + `agreement_templates` aktiv |
| DMS-Struktur | Stabil | 20 Modul-Root-Ordner pro Tenant |
| Zone 3 Lead-Capture | Stabil | Read-only mit Edge Function |
| Investment Engine | Konsolidiert | Shared Components, Live-Daten |
| Modul-Dokumentation | Vollstaendig | 20 MOD-Docs in docs/modules/ |

---

## UMSETZUNGSPLAN (Priorisiert)

### Schritt 1: Code-Fehler beheben (Kategorie A)
1. **MOD-00 entscheiden**: Entweder aus Manifest entfernen oder Page erstellen
2. **RolesManagement**: Import + adminComponentMap-Eintrag in ManifestRouter.tsx
3. **MasterTemplates Index**: Route `masterdata` in routesManifest.ts hinzufuegen
4. **MasterContacts**: Toten Import entfernen ODER Route in Manifest aufnehmen
5. **self_disclosures**: public_id + Trigger + Backfill (Prefix SD)
6. **useSmartUpload.ts**: Datei loeschen (kein Konsument)

### Schritt 2: Sicherheits-Migration (Kategorie B)
Eine einzelne DB-Migration:
- 181 FK-Indizes erstellen
- 8 Functions mit search_path versehen
- 2 Armstrong Views auf SECURITY INVOKER umstellen
- 2 RLS-Policies einschraenken

### Schritt 3: Enterprise-Luecken schliessen (Kategorie C)
- areaConfig.ts: MOD-00 Entscheidung umsetzen
- 7 neue Camunda ActionKeys
- deleted_at auf 4 weitere PII-Tabellen
- 4 neue Golden Path Docs

### Risiko-Bewertung

| Schritt | Risiko | Begruendung |
|--|--|--|
| Code-Fehler (A) | Null bis sehr niedrig | Fehlende Importe/Routen hinzufuegen, toten Code entfernen |
| Sicherheits-Migration (B) | Null | Rein additiv: Indizes, search_path, View-Properties |
| Enterprise-Luecken (C) | Null | Additiver Code und Dokumentation |

