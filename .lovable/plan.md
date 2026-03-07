# Refactoring-Masterplan: TSX-Monolithen → Modulare Architektur

> **Datum**: 2026-03-05 (aktualisiert)
> **Status**: Wave 1 ✅ (R-1–R-6) — Wave 2 Tranche 1 ✅ (R-7–R-10) — Tranche 2 ✅ (R-11–R-14) — Tranche 3 ✅ (R-15–R-24) — Tranche 4 ✅ (R-25–R-35)
> **Methode**: Bewährtes Orchestrator + Sub-Components Pattern

---

## Gesamtstatistik

| Metrik | Wave 1 (done) | Wave 2 T1-T3 (done) | Wave 2 T4 (geplant) | Gesamt |
|--------|--------------|---------------------|---------------------|--------|
| Dateien | 6 | 18 | 11 | 35 |
| Zeilen vorher | 5.530 | ~10.800 | ~4.900 | ~21.230 |
| Zeilen nachher | ~1.350 | ~3.200 | ~1.320 | ~5.870 |
| Reduktion | 76% | ~70% | ~73% | ~72% |

---

## Wave 1 — ABGESCHLOSSEN ✅

| # | Phase | Datei | Vorher | Nachher | Modul |
|---|-------|-------|--------|---------|-------|
| 1 | R-1 ✅ | FMEinreichung.tsx | 1039 | 295 | MOD-11 |
| 2 | R-2 ✅ | ExposeDetail.tsx | 1008 | 299 | MOD-06 |
| 3 | R-3 ✅ | Inbox.tsx | 976 | 180 | Admin |
| 4 | R-4 ✅ | KontexteTab.tsx | 923 | 214 | MOD-04 |
| 5 | R-5 ✅ | AnfrageFormV2.tsx | 904 | 183 | MOD-07 |
| 6 | R-6 ✅ | Users.tsx | 680 | 178 | Admin |

---

## Wave 2 — Tranche 1 ✅ (R-7–R-10)

| # | Phase | Datei | Vorher | Nachher | Modul |
|---|-------|-------|--------|---------|-------|
| 7 | R-7 ✅ | EmailTab.tsx | 1506 | ~180 | MOD-02 |
| 8 | R-8 ✅ | PortfolioTab.tsx | 1511 | ~200 | MOD-04 |
| 9 | R-9 ✅ | BriefTab.tsx | 1012 | ~200 | MOD-02 |
| 10 | R-10 ✅ | GeldeingangTab.tsx | 1018 | ~200 | MOD-04 |

## Wave 2 — Tranche 2 ✅ (R-11–R-14)

| # | Phase | Datei | Vorher | Nachher | Modul |
|---|-------|-------|--------|---------|-------|
| 11 | R-11 ✅ | TenancyTab.tsx | 904 | ~200 | MOD-04 |
| 12 | R-12 ✅ | UnitDetailPage.tsx | 708 | ~150 | MOD-13 |
| 13 | R-13 ✅ | TileCatalog.tsx | 646 | ~150 | Admin |
| 14 | R-14 ✅ | ManagerFreischaltung.tsx | 635 | ~140 | Admin |

## Wave 2 — Tranche 3 ✅ (R-15–R-24)

| # | Phase | Datei | Vorher | Nachher | Modul | Neue Dateien |
|---|-------|-------|--------|---------|-------|-------------|
| 15 | R-15 ✅ | PropertyDetailPage.tsx | 628 | ~200 | MOD-04 | PropertyDetailHeader, PropertyTabRouter |
| 16 | R-16 ✅ | CaringProviderDetail.tsx | 599 | ~160 | MOD-22 | ProviderGallery, ProviderProfileCard, ProviderServicesCard, ProviderBookingSection |
| 17 | R-17 ✅ | FMFinanzierungsakte.tsx | 596 | ~200 | MOD-11 | AkteKaufySearch |
| 18 | R-18 ✅ | MasterTemplates.tsx | 585 | ~140 | Admin | 3 sub-components |
| 19 | R-19 ✅ | OrganizationDetail.tsx | 581 | ~160 | Admin | 3 sub-components |
| 20 | R-20 ✅ | FMFallDetail.tsx | 579 | ~160 | MOD-11 | FallHeaderBlock, FallContentBlocks |
| 21 | R-21 ✅ | LeadManagerKampagnen.tsx | 576 | ~100 | MOD-10 | KampagnenKPIs, KampagnenLeadInbox, KampagnenCampaignList, KampagnenCreator |
| 22 | R-22 ✅ | LeadPool.tsx | 560 | ~140 | Admin | 3 sub-components |
| 23 | R-23 ✅ | ObjekteingangDetail.tsx | 539 | ~200 | MOD-12 | ObjektKPIRow, ObjektBasisdaten |
| 24 | R-24 ✅ | Oversight.tsx | 531 | ~140 | Admin | 3 sub-components |

---

## Wave 2 — Tranche 4 ✅ (R-25–R-35)

| # | Phase | Datei | Vorher | Nachher | Modul | Neue Dateien |
|---|-------|-------|--------|---------|-------|-------------|
| R-25 | ✅ | Agreements.tsx | 506 | ~90 | Admin | AgreementsTemplateTable, AgreementsConsentLog |
| R-26 | ✅ | Dashboard.tsx (Admin) | 491 | ~100 | Admin | AdminKPIGrid, AdminSessionCard |
| R-27 | ✅ | Delegations.tsx | 486 | ~100 | Admin | DelegationTable |
| R-28 | ✅ | ArmstrongWorkspace.tsx | 479 | ~180 | MOD-00 | WorkspaceChatHeader, WorkspaceChatMessages, WorkspaceChatInput |
| R-29 | ✅ | FMDashboard.tsx | 472 | ~83 | MOD-11 | FMZinsTickerWidget, FMMandateCards, FMProfileEditSheet |
| R-30 | ✅ | VerwaltungTab.tsx | 456 | ~150 | MOD-04 | VerwaltungContextGrid, VerwaltungPropertyAccordion, VerwaltungGesamtergebnis |
| R-31 | ✅ | ProjectDetailPage.tsx | 456 | ~120 | MOD-13 | ProjectDetailHeader, ProjectUnitsTable, ProjectInfoTabs |
| R-32 | ✅ | SanierungTab.tsx | 451 | ~89 | MOD-04 | SanierungDemoDetail |
| R-33 | ✅ | MasterTemplatesImmo.tsx | 444 | ~60 | Admin | ImmoAkteBlockView, immoAkteBlocks.ts |
| R-34 | ⬜ | StorageFileManager.tsx | 434 | — | MOD-03 | Skipped — already modular (5 views) |
| R-35 | ✅ | RolesManagement.tsx | 419 | ~30 | Admin | RolesCatalogTab, RolesMatrixTab, RolesGovernanceTab |

### Ergebnis

- **33 von 35 Dateien** refactored (R-28 ArmstrongWorkspace + R-34 StorageFileManager waren optional, R-28 jetzt done)
- **~80+ Sub-Components** extrahiert
- **Durchschnittliche Reduktion**: ~65%

---

## Regeln

1. **Keine funktionalen Änderungen** — Reine Extraktion
2. **Keine DB-Änderungen** — Kein Migrations-Tool nötig
3. **Keine neuen Routes** — Bestehende Routen bleiben
4. **Module sofort re-freezen** nach Abschluss jeder Phase
5. **TSX Creation Check** (Regel F) — vor jeder neuen Datei auf Duplikate prüfen
6. **Zone Separation** (Regel G) — keine Cross-Zone-Imports

---

## Objektfinder / Portal-Recherche — Phasenplan

> **Modul**: MOD-12 (Akquise-Manager) — Tools → Portal-Recherche
> **Datum**: 2026-03-05

### Phase 1 — Portal-Suche reparieren ✅

**Status**: Implementiert

| Änderung | Datei | Beschreibung |
|----------|-------|--------------|
| URL-Builder mit echten Filtern | `sot-research-engine/index.ts` | `buildPortalUrl()` mit Preis, Fläche, Objektart-Mapping pro Portal |
| Parallele 3-Portal-Suche | `sot-research-engine/index.ts` | `searchAllPortals()` scrapt IS24/Immowelt/Kleinanzeigen parallel |
| Erweiterter Extraktions-Prompt | `sot-research-engine/index.ts` | KI extrahiert: Objektart, Fläche, Zimmer, WE, Baujahr, Rendite, PLZ |
| UI-Rebuild ohne Maklersuche | `PortalSearchTool.tsx` | Objektart-Filter, Flächen-Filter, Portal-Status-Badges, Ergebnis-Cards |
| Hook-Update | `useAcqTools.ts` | Neue `PortalSearchParams` ohne `portal`/`searchType`, mit `areaMin/Max` |

### Phase 2 — Persistierung + Inbox-Workflow (geplant)

**Ziel**: Ergebnisse speichern, deduplizieren, als Lead-Kandidaten verarbeiten.

**Neue DB-Tabellen** (via Migration):

```sql
-- Suchlauf-Protokoll
CREATE TABLE portal_search_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL,
  search_params_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'running', -- running/partial/success/fail
  metrics_json JSONB, -- {immoscout24: {found: 12, new: 8}, ...}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gefundene Listings (alle Portale)
CREATE TABLE portal_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  run_id UUID REFERENCES portal_search_runs(id),
  source_portal TEXT NOT NULL,
  source_url TEXT,
  source_listing_id TEXT,
  title TEXT NOT NULL,
  price INTEGER,
  object_type TEXT,
  living_area_sqm NUMERIC,
  plot_area_sqm NUMERIC,
  address TEXT,
  city TEXT,
  zip_code TEXT,
  rooms NUMERIC,
  units_count INTEGER,
  year_built INTEGER,
  gross_yield NUMERIC,
  broker_name TEXT,
  raw_extract_json JSONB,
  cluster_fingerprint TEXT, -- Hash(adresse+preis+fläche) für Dedupe
  status TEXT NOT NULL DEFAULT 'new', -- new/seen/saved/rejected/suppressed
  score INTEGER, -- 0-100 Match vs. Suchprofil
  match_reasons_json JSONB,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  linked_offer_id UUID REFERENCES acq_offers(id), -- wenn in Objekteingang übernommen
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Implementierung** (Dateien):

| Datei | Beschreibung |
|-------|--------------|
| DB Migration | `portal_search_runs` + `portal_listings` mit RLS |
| `src/hooks/usePortalListings.ts` | CRUD für portal_listings, Suppression, Status-Updates |
| `src/pages/portal/akquise-manager/components/PortalSearchInbox.tsx` | Inbox-Cards: Neu/Gesehen/Gespeichert/Abgelehnt |
| `sot-research-engine/index.ts` | Ergebnisse in `portal_listings` persistieren, Dedupe via `cluster_fingerprint` |
| Scoring-Logic in `src/engines/akquiseCalc/` | `scoreListingVsProfile()` → Score 0-100 + Reasons |

**Dedupe-Strategie**:
- `cluster_fingerprint = MD5(lower(city) + price_bucket + area_bucket)`
- Bei Match: `last_seen_at` updaten, nicht duplizieren
- Suppression: Abgelehnte Fingerprints bei nächster Suche ignorieren

**Inbox-Actions**:
- "In Objekteingang übernehmen" → erstellt `acq_offers`-Record, setzt `linked_offer_id`
- "Ablehnen" → Status `rejected`, optionale Suppression
- "Merken" → Status `saved`

### Phase 3 — KI-Suchprofil-Erfassung (geplant)

**Ziel**: User beschreibt Wunschobjekt in Freitext, KI erzeugt strukturierte Filter.

**Implementierung**:

| Datei | Beschreibung |
|-------|--------------|
| `PortalSearchAIIntake.tsx` | Freitext-Eingabe + Confidence-Anzeige + Rückfragen |
| `sot-research-engine/index.ts` | Neuer Intent `ai_search_profile` → Gemini 2.5 Pro |
| `useAcqTools.ts` | `useAISearchProfile()` Hook |

**AI Output Contract**:
```typescript
interface AIProfileDraft {
  canonical: {
    region?: string;
    price_min?: number;
    price_max?: number;
    area_min?: number;
    area_max?: number;
    object_types?: string[];
    yield_min?: number;
    units_min?: number;
  };
  confidence: Record<string, number>; // 0-1 pro Feld
  assumptions: string[]; // "Annahme: Preis = Kaltmiete"
  questions?: string[]; // "Meinen Sie Warm- oder Kaltmiete?"
}
```

**Flow**:
1. User gibt Freitext ein: "Suche MFH in Berlin, bis 2 Mio, mindestens 6% Rendite"
2. Gemini 2.5 Pro extrahiert → `AIProfileDraft`
3. UI zeigt extrahierte Filter mit Confidence-Badges
4. User bestätigt oder korrigiert
5. Bestätigte Filter werden als Suchparameter übernommen

---

## ENG-VALUATION: Soll-/Ist-Analyse & Korrekturfahrplan

> **Datum**: 2026-03-06  
> **Verdict**: Core vorhanden (95%), Produkt unvollständig (45%)

### Top 10 Gaps (Priorität)

| # | Gap | Aufwand | Freeze? |
|---|-----|---------|---------|
| 1 | MOD-12: `useRunValuation` verdrahten (throw Error → Edge Function) | Klein | Nein |
| 2 | MOD-04: PropertyValuationTab Query `property_valuations` → `valuation_cases` | Klein | MOD-04 |
| 3 | PDF-Export Button im Report-View | Klein | shared |
| 4 | MOD-12 Objekteingang: Bewertungs-Step befüllen | Mittel | MOD-12 |
| 5 | ReportReader: Location-Block (Scores, POIs, Maps) | Mittel | shared |
| 6 | ReportReader: Comp-Postings-Liste | Klein | shared |
| 7 | ReportReader: LegalBlock rendern | Klein | shared |
| 8 | PDF-Generator: pdfCiTokens importieren | Klein | shared |
| 9 | MOD-13 Inbox: Draft-Bewertungs-Entry-Point | Groß | MOD-05 |
| 10 | Google Routes Matrix + StreetView | Mittel | Edge Function |

### Korrekturreihenfolge

- **Phase A:** Gap 1 (kein Freeze)
- **Phase B:** UNFREEZE MOD-04 → Gaps 2+3
- **Phase C:** UNFREEZE shared/valuation → Gaps 5+6+7+8
- **Phase D:** UNFREEZE MOD-12 → Gap 4
- **Phase E:** Gaps 9+10 (neue Features)

### Root Causes

1. Core-first, Produkt-later (3.228 LOC Engine, 1/3 Entry Points verdrahtet)
2. Phase-Planung nicht durchgezogen (MOD-12 = "Phase 5 TODO")
3. Tabellen-Drift (property_valuations vs valuation_cases)
4. PDF nie an UI angebunden (358 LOC ohne Button)
5. Contract Drift snake/camel (Deep Mapper nachträglich)
6. ReportReader zeigt nur Zahlen (Location/Comps/Legal fehlen)

---

### Abhängigkeiten & Reihenfolge

```
Phase 1 (done) ──→ Phase 2 (DB + Inbox) ──→ Phase 3 (KI-Intake)
                         ↓
                   Scoring-Engine (ENG-AKQUISE erweitern)
```

Phase 2 kann unabhängig von Phase 3 deployed werden. Phase 3 baut auf den Filter-Parametern aus Phase 1 auf.

---

## DMS Architekturentscheidungen (2026-03-07)

### ARCH-DMS-01: Datei-Move-SSOT — BEIDES SYNCHRON

**Regel:** Bei Verschiebung einer Datei in einen anderen Ordner werden BEIDE Felder in einer Transaktion aktualisiert:
1. `storage_nodes.parent_id` → neuer Ordner (für File-Nodes mit `node_type='file'`)
2. `document_links.node_id` → neuer Ordner (zeigt auf den FOLDER-Node)

**Begründung:** Maximale Konsistenz. Beide Tabellen bilden die Ordnerzugehörigkeit ab — `storage_nodes` für die Baumstruktur, `document_links` für die Dokument-Verkettung. Asynchrone Updates würden zu Inkonsistenzen führen.

**RPC-Vertrag:**
- `move_storage_file(p_document_id, p_new_folder_id, p_tenant_id)` → atomare Transaktion
- `move_storage_folder(p_folder_id, p_new_parent_id, p_tenant_id)` → mit Zirkularitätsprüfung

### ARCH-DMS-02: Open-SSOT — MIME-ABHÄNGIG

**Regel:** Doppelklick auf eine Datei löst systemweit MIME-abhängig aus:
- **Preview:** `image/*`, `application/pdf` → Inline-Vorschau (Modal/Lightbox)
- **Download:** Alle anderen MIME-Types → Direkter Download

**Hilfsfunktion:** `isPreviewableMime(mimeType: string): boolean` in `src/components/dms/storageHelpers.ts`

**Betroffene Komponenten:**
- `ColumnView.tsx` → `handleDoubleClickFile` prüft MIME
- `ListView.tsx` → `handleRowDoubleClick` prüft MIME
- `StorageFileManager.tsx` → `onOpen` in SelectionActionBar folgt gleicher Logik
- `EntityStorageTree.tsx` → Keyboard handler (`Enter`) folgt gleicher Logik

---

## Gutachten-Archiv & Premium PDF — Phasenplan (2026-03-07)

### Phase 1: Gutachten-Versionshistorie
- Erweiterte Case-Liste mit Datum, Marktwert, Konfidenz, Wertband
- Wertentwicklungs-Indikator (Delta vs. Vorgänger)
- Quick-Compare (2 Cases nebeneinander)
- **Status:** GEPLANT

### Phase 2: Premium PDF Export (12 Seiten, CI-A)
- Executive Summary auf Seite 2 (nach Cover)
- Leerdaten-Handling ("Keine Daten" statt "0 €")
- Deckblatt-Redesign mit StreetView Hero
- Inhaltsverzeichnis auto-generiert
- Finanzierung: Zinssätze korrekt durchreichen
- Watermark "VERTRAULICH"
- **Status:** GEPLANT

### Phase 3: MFH-Einheitenverwaltung
- Auto-Generierung N Einheiten bei unitCountActual
- Einheiten-Editor (Fläche, Miete, Status)
- Engine-Integration (einheitenbasierter Ertragswert)
- PDF-Sektion Einheiten-Tabelle
- **Status:** GEPLANT

### Phase 4: Marktdaten-Integration
- BORIS-Gateway Edge Function
- Mietspiegel-Lookup via KI
- Cache-Layer (PLZ, 30d TTL)
- PDF-Quellenangaben mit Stichtag
- **Status:** GEPLANT

Diagramm: `spec/current/05_diagrams/valuation-roadmap.md`
