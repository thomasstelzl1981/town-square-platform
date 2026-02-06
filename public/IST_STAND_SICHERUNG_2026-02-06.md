# IST-STAND SICHERUNG — System of a Town
**Datum:** 2026-02-06  
**Status:** ENTWICKLUNGS-ZWISCHENSTAND  
**Agent:** Stabilisierungs- und Sicherungsagent

---

## EXECUTIVE SUMMARY

Dieser Bericht dokumentiert den aktuellen Entwicklungsstand ohne Änderungen vorzunehmen.
Das Projekt befindet sich **mitten in der Entwicklung** — der Stand ist bewusst **NICHT final**.

---

## 1. MODUL- & TILE-KATALOG-STATUS

### 1.1 Zone 1 (Admin Portal) — Implementierungsstatus

| Route | Komponente | Status | Zweck |
|-------|------------|--------|-------|
| `/admin` | Dashboard | ✅ Implementiert | Admin-Übersicht |
| `/admin/organizations` | Organizations | ✅ Implementiert | Mandantenverwaltung |
| `/admin/organizations/:id` | OrganizationDetail | ✅ Implementiert | Mandantendetails |
| `/admin/users` | Users | ✅ Implementiert | Benutzerverwaltung |
| `/admin/delegations` | Delegations | ✅ Implementiert | Delegationsverwaltung |
| `/admin/contacts` | MasterContacts | ✅ Implementiert | Zentrale Kontakte |
| `/admin/master-templates` | MasterTemplates | ✅ Implementiert | Mastervorlagen-Index |
| `/admin/master-templates/immobilienakte` | MasterTemplatesImmobilienakte | ✅ Implementiert | A-J Block-Schema (READ-ONLY) |
| `/admin/master-templates/selbstauskunft` | MasterTemplatesSelbstauskunft | ✅ Implementiert | 8-Sektionen-Schema (READ-ONLY) |
| `/admin/tiles` | TileCatalog | ✅ Implementiert | Modul-Aktivierung + Testdaten |
| `/admin/integrations` | Integrations | ✅ Implementiert | API-Konfiguration |
| `/admin/communication` | CommunicationHub | 🔸 Teilweise | Kommunikationszentrale |
| `/admin/oversight` | Oversight | 🔸 Teilweise | Überwachung |
| `/admin/audit` | AuditLog | ✅ Implementiert | Audit-Protokoll |
| `/admin/billing` | Billing | 🔸 Teilweise | Abrechnung |
| `/admin/agreements` | Agreements | 🔸 Teilweise | Vereinbarungen |
| `/admin/inbox` | Inbox | 🔸 Teilweise | Posteingang |
| `/admin/leadpool` | LeadPool | 🔸 Teilweise | Lead-Pool |
| `/admin/partner-verification` | PartnerVerification | 🔸 Teilweise | Partner-Verifizierung |
| `/admin/commissions` | CommissionApproval | 🔸 Teilweise | Provisionen |
| `/admin/support` | Support | 🔸 Teilweise | Support-Desk |

#### FutureRoom (Finance Governance Hub)
| Route | Komponente | Status |
|-------|------------|--------|
| `/admin/futureroom` | FutureRoom | ✅ Implementiert |
| `/admin/futureroom/inbox` | FutureRoomInbox | 🔸 Teilweise |
| `/admin/futureroom/zuweisung` | FutureRoomZuweisung | 🔸 Teilweise |
| `/admin/futureroom/finanzierungsmanager` | FutureRoomManagers | 🔸 Teilweise |
| `/admin/futureroom/bankkontakte` | FutureRoomBanks | 🔸 Teilweise |
| `/admin/futureroom/monitoring` | FutureRoomMonitoring | 🔸 Teilweise |

#### Agents, Acquiary, Sales Desk
| Bereich | Status | Hinweis |
|---------|--------|---------|
| `/admin/agents/*` | ⬜ Platzhalter | AdminStubPage verwendet |
| `/admin/acquiary/*` | ⬜ Platzhalter | AdminStubPage verwendet |
| `/admin/sales-desk/*` | ⬜ Platzhalter | AdminStubPage verwendet |
| `/admin/finance-desk` | 🔄 Legacy-Redirect | → `/admin/futureroom` |

---

### 1.2 Zone 2 (User Portal) — 20-Modul-Architektur

#### Modul-Übersicht nach Implementierungsgrad

| Code | Name | Base Route | Tiles | Status |
|------|------|------------|-------|--------|
| **MOD-01** | Stammdaten | `/portal/stammdaten` | profil, firma, abrechnung, sicherheit | ✅ Implementiert |
| **MOD-02** | KI Office | `/portal/office` | email, brief, kontakte, kalender | 🔸 Teilweise |
| **MOD-03** | DMS | `/portal/dms` | storage, posteingang, sortieren, einstellungen | ✅ Implementiert |
| **MOD-04** | Immobilien | `/portal/immobilien` | portfolio, kontexte, sanierung, bewertung | ✅ Implementiert (SSOT) |
| **MOD-05** | MSV | `/portal/msv` | objekte, mieteingang, vermietung, einstellungen | 🔸 Teilweise |
| **MOD-06** | Verkauf | `/portal/verkauf` | objekte, vorgaenge, reporting, einstellungen | 🔸 Teilweise |
| **MOD-07** | Finanzierung | `/portal/finanzierung` | selbstauskunft, dokumente, anfrage, status | ✅ Implementiert |
| **MOD-08** | Investment-Suche | `/portal/investments` | suche, favoriten, mandat, simulation | 🔸 Teilweise |
| **MOD-09** | Vertriebspartner | `/portal/vertriebspartner` | katalog, beratung, kunden, network | 🔸 Teilweise |
| **MOD-10** | Leads | `/portal/leads` | inbox, meine, pipeline, werbung | 🔸 Teilweise |
| **MOD-11** | Finanzierungsmanager | `/portal/finanzierungsmanager` | dashboard, faelle, kommunikation, status | 🔸 Teilweise |
| **MOD-12** | Akquise-Manager | `/portal/akquise-manager` | dashboard, kunden, mandate, tools | ⬜ Platzhalter |
| **MOD-13** | Projekte | `/portal/projekte` | uebersicht, timeline, dokumente, einstellungen | ⬜ Platzhalter |
| **MOD-14** | Communication Pro | `/portal/communication-pro` | serien-emails, recherche, social, agenten | ⬜ Platzhalter |
| **MOD-15** | Fortbildung | `/portal/fortbildung` | katalog, meine-kurse, zertifikate, settings | ⬜ Platzhalter |
| **MOD-16** | Services | `/portal/services` | katalog, anfragen, auftraege, settings | ⬜ Platzhalter |
| **MOD-17** | Car-Management | `/portal/cars` | uebersicht, fahrzeuge, service, settings | ⬜ Platzhalter |
| **MOD-18** | Finanzanalyse | `/portal/finanzanalyse` | dashboard, reports, szenarien, settings | ⬜ Platzhalter |
| **MOD-19** | Photovoltaik | `/portal/photovoltaik` | angebot, checkliste, projekt, settings | ⬜ Platzhalter |
| **MOD-20** | Miety | `/portal/miety` | 6 Tiles (Ausnahme) | ⬜ Platzhalter |

**Legende:**
- ✅ Implementiert = Funktionale Komponenten mit DB-Anbindung
- 🔸 Teilweise = Struktur vorhanden, nicht alle Features aktiv
- ⬜ Platzhalter = ModuleStubPage oder ModuleHowItWorks

---

### 1.3 Zone 3 (Websites) — Status

| Website | Base | Status |
|---------|------|--------|
| KAUFY | `/kaufy` | ⬜ Platzhalter (Routes deklariert) |
| Miety | `/miety` | ⬜ Platzhalter (Routes deklariert) |
| FutureRoom | `/futureroom` | ⬜ Platzhalter (Routes deklariert) |
| SOT | `/sot` | ⬜ Platzhalter (Routes deklariert) |

---

## 2. ROUTING & UI-STRUKTUR (IST)

### 2.1 Routing-SSOT

**Single Source of Truth:** `src/manifests/routesManifest.ts`

- 561 Zeilen
- Enthält alle Zonen-Definitionen
- ManifestRouter generiert Routen dynamisch
- Legacy-Redirects für Abwärtskompatibilität

### 2.2 Canonical Einstiegspunkte

| Modul | Einstieg | Verhalten |
|-------|----------|-----------|
| MOD-04 | `/portal/immobilien` | ModuleHowItWorks Landingpage |
| MOD-04 Dossier | `/portal/immobilien/:id` | PropertyDetailPage (SSOT) |
| MOD-07 | `/portal/finanzierung` | ModuleHowItWorks Landingpage |
| MOD-07 Selbstauskunft | `/portal/finanzierung/selbstauskunft` | SelbstauskunftTab |
| Zone 1 | `/admin` | Dashboard |

### 2.3 Legacy-Redirects (aktiv)

```
/portfolio → /portal/immobilien/portfolio
/portal/finanzierung/vorgaenge → /portal/finanzierung/anfrage
/portal/finanzierung/readiness → /portal/finanzierung/selbstauskunft
/admin/finance-desk → /admin/futureroom
```

### 2.4 Bekannte Provisorien

1. **ModuleStubPage** — Platzhalter für MOD-12 bis MOD-20
2. **AdminStubPage** — Platzhalter für Agents, Acquiary, Sales Desk
3. **ModuleHowItWorks** — Standard-Landingpage für alle Module

---

## 3. IMMOBILIENAKTE — VORLAGENSTATUS

### 3.1 Zone 1 Mastervorlage

**Datei:** `src/pages/admin/MasterTemplatesImmobilienakte.tsx`  
**Status:** ✅ Vollständig implementiert als READ-ONLY Viewer

**Struktur:** 10 Blöcke (A–J)
| Block | Titel | Felder | Entitäten |
|-------|-------|--------|-----------|
| A | Identität / Zuordnung | 12 | property, unit |
| B | Adresse | 8 | property |
| C | Gebäude / Technik | 14 | property, unit |
| D | Recht / Erwerb | 11 | property |
| E | Investment / KPIs | 5 | derived |
| F | Mietverhältnisse | 17 | lease |
| G | WEG / Nebenkosten | 14 | property, unit, nk_period |
| H | Finanzierung | 12 | loan |
| I | Accounting | 12 | accounting |
| J | Dokumente | 17 | document |

**Gesamt:** 106 Felder katalogisiert

### 3.2 Zone 2 MOD-04 Rendering

**Komponenten:**
- `src/pages/portal/immobilien/PropertyDetailPage.tsx` — Haupt-Dossier-View
- `src/components/immobilienakte/UnitDossierView.tsx` — Aggregierte Ansicht
- `src/components/immobilienakte/EditableUnitDossierView.tsx` — Inline-Editing

**Block-Komponenten:**
| Komponente | Blocks abgedeckt |
|------------|------------------|
| IdentityBlock.tsx | A (Identität) |
| CoreDataBlock.tsx | B (Adresse), C (Gebäude) |
| LegalBlock.tsx | D (Recht/Erwerb) |
| InvestmentKPIBlock.tsx | E (Investment) |
| TenancyBlock.tsx | F (Mietverhältnisse) |
| NKWEGBlock.tsx | G (WEG/NK) |
| FinancingBlock.tsx | H (Finanzierung) |
| (kein UI) | I (Accounting) — **UI PENDING** |
| DocumentChecklist.tsx | J (Dokumente) |

### 3.3 Abweichungen Zone 1 ↔ Zone 2

| Aspekt | Zone 1 (Mastervorlage) | Zone 2 (MOD-04) |
|--------|------------------------|-----------------|
| Block I (Accounting) | Dokumentiert (12 Felder) | **Kein editierbarer Block** |
| Datenquelle | Statische TypeScript-Definition | DB-Queries (properties, units, leases, loans) |
| Editierung | READ-ONLY | Inline-Editing via EditableUnitDossierView |

**Offener Punkt:** Block I (Accounting) hat in Zone 2 **keinen UI-Block**. Felder existieren in `property_accounting` Tabelle.

---

## 4. SELBSTAUSKUNFT — VORLAGENSTATUS

### 4.1 Zone 1 Mastervorlage

**Datei:** `src/pages/admin/MasterTemplatesSelbstauskunft.tsx`  
**Status:** ✅ Vollständig implementiert als READ-ONLY Viewer

**Struktur:** 8 Sektionen
| Sektion | Titel | Felder |
|---------|-------|--------|
| 1 | Identität | 15 |
| 2 | Haushalt | 8 |
| 3 | Einkommen | 9 |
| 4 | Firma (bedingt) | 10 |
| 5 | Ausgaben | 5 |
| 6 | Vermögen | 6 |
| 7 | Finanzierungswunsch | 17 |
| 8 | Erklärungen | 4 |

### 4.2 Zone 2 MOD-07 Rendering

**Hauptkomponente:** `src/components/finanzierung/SelbstauskunftForm.tsx`  
**Zeilen:** 1327 (⚠️ **Refactoring empfohlen**)

**Implementierte Tabs:**
1. identity — ✅ vollständig
2. household — ✅ vollständig
3. employment — ✅ vollständig
4. company — ✅ bedingt (entrepreneur)
5. expenses — ✅ vollständig
6. assets — ✅ vollständig
7. financing — ✅ vollständig
8. declarations — ✅ vollständig

**Neu hinzugefügt (2026-02-06):**
- `taxable_income_yearly`
- `church_tax`
- `tax_assessment_type`
- `marginal_tax_rate`
- Datenübernahme aus Vermietereinheiten (landlord_contexts)

---

## 5. REPO-IST-STAND

### 5.1 Verzeichnisstruktur (Kernbereiche)

```
src/
├── manifests/
│   └── routesManifest.ts          [STABIL — SSOT]
├── pages/
│   ├── admin/                      [STABIL bis TEILWEISE]
│   │   ├── MasterTemplatesImmobilienakte.tsx  [STABIL]
│   │   ├── MasterTemplatesSelbstauskunft.tsx  [STABIL]
│   │   ├── TileCatalog.tsx                    [STABIL]
│   │   └── futureroom/                        [WIP]
│   └── portal/
│       ├── immobilien/             [STABIL]
│       │   ├── PortfolioTab.tsx    [STABIL]
│       │   ├── KontexteTab.tsx     [STABIL]
│       │   └── PropertyDetailPage.tsx [STABIL]
│       ├── finanzierung/           [STABIL]
│       └── [MOD-12 bis MOD-20]/    [PLATZHALTER]
├── components/
│   ├── immobilienakte/             [STABIL]
│   │   ├── UnitDossierView.tsx     [STABIL]
│   │   ├── InventoryInvestmentSimulation.tsx [STABIL]
│   │   └── editable/               [STABIL]
│   ├── finanzierung/               [STABIL]
│   │   └── SelbstauskunftForm.tsx  [STABIL aber GROSS — 1327 Zeilen]
│   └── shared/                     [STABIL]
├── types/
│   ├── immobilienakte.ts           [STABIL — 570 Zeilen]
│   └── finance.ts                  [STABIL]
├── lib/
│   └── taxCalculator.ts            [STABIL — 184 Zeilen, Fix 2026-02-06]
└── integrations/
    └── supabase/
        ├── client.ts               [AUTO-GENERIERT — NICHT ÄNDERN]
        └── types.ts                [AUTO-GENERIERT — NICHT ÄNDERN]
```

### 5.2 Kritische Dateien — Nicht anfassen

| Datei | Grund |
|-------|-------|
| `src/integrations/supabase/client.ts` | Auto-generiert |
| `src/integrations/supabase/types.ts` | Auto-generiert |
| `supabase/config.toml` | Auto-generiert |
| `.env` | Auto-generiert |

### 5.3 Work-in-Progress Bereiche

| Bereich | Status | Hinweis |
|---------|--------|---------|
| FutureRoom (Zone 1) | WIP | Governance-Hub noch nicht vollständig |
| MOD-11 Finanzierungsmanager | WIP | Workbench-Funktionen ausstehend |
| MOD-12 bis MOD-20 | Platzhalter | ModuleStubPage verwendet |
| Zone 3 Websites | Platzhalter | Routes deklariert, keine Inhalte |
| Block I (Accounting) in MOD-04 | UI PENDING | Daten existieren, kein Editor |

### 5.4 Manifest-Dateien

| Datei | Zeilen | Status |
|-------|--------|--------|
| `manifests/tile_catalog.yaml` | 772 | ⚠️ Groß, Refactoring erwägen |
| `manifests/routes_manifest.yaml` | - | Wird nach routesManifest.ts konvertiert |
| `manifests/action_catalog.yaml` | - | Vorhanden |

---

## 6. NICHT ANFASSEN — SPERRVERMERKE

### 6.1 Architektur-Invarianten

1. **Manifest-driven Routing** — Keine Routen außerhalb von routesManifest.ts
2. **4-Tile-Pattern** — Alle Module haben 4 Tiles (Ausnahme: MOD-20 mit 6)
3. **tenant_id Invariant** — Alle Business-Tabellen referenzieren client orgs
4. **Zone-3-Boundary** — Keine direkten DB-Writes aus Zone 3

### 6.2 Dateien mit Sperrvermerk

| Datei | Grund |
|-------|-------|
| `src/manifests/routesManifest.ts` | SSOT für Routing |
| `src/types/immobilienakte.ts` | Masterschema für MOD-04 |
| `src/types/finance.ts` | Masterschema für MOD-07 |
| `src/lib/taxCalculator.ts` | BMF-PAP-Implementierung (gerade gefixt) |

---

## 7. BEKANNTE OFFENE PUNKTE

### 7.1 Priorität 1 (P0)
- [ ] Block I (Accounting) UI für MOD-04 fehlt
- [ ] SelbstauskunftForm.tsx ist zu groß (1327 Zeilen) — Refactoring empfohlen

### 7.2 Priorität 2 (P1)
- [ ] FutureRoom Sub-Pages nicht vollständig
- [ ] MOD-11 Workbench-Funktionen
- [ ] Zone 3 Websites haben keine Inhalte

### 7.3 Priorität 3 (P2)
- [ ] MOD-12 bis MOD-20 sind Platzhalter
- [ ] tile_catalog.yaml ist sehr groß (772 Zeilen)

---

## 8. ÜBERGABE-CHECKLISTE

Für den GitHub-Analyse-Agenten:

- [x] Modul-Katalog dokumentiert
- [x] Routing-SSOT identifiziert
- [x] Mastervorlagen-Status erfasst
- [x] Zone 1 ↔ Zone 2 Abweichungen dokumentiert
- [x] WIP-Bereiche markiert
- [x] Sperrvermerke definiert
- [x] Offene Punkte gelistet

---

## BESTÄTIGUNG

**Der Sicherungsstand ist hiermit abgeschlossen.**

Dieses Dokument repräsentiert den IST-Zustand zum Zeitpunkt 2026-02-06.
Es wurden **keine Änderungen** am Codebase vorgenommen.
Das Projekt befindet sich in einem **Entwicklungs-Zwischenstand**.

---

*Erstellt von: Stabilisierungs- und Sicherungsagent*  
*Lovable AI — System of a Town*
