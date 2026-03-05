
# Refactoring-Masterplan: TSX-Monolithen → Modulare Architektur

> **Datum**: 2026-03-05 (aktualisiert)
> **Status**: Wave 1 ABGESCHLOSSEN (R-1 bis R-6) — Wave 2 Tranche 1 ABGESCHLOSSEN (R-7–R-10 ✅) — Tranche 2 IN ARBEIT (R-11–R-14)
> **Methode**: Bewährtes Orchestrator + Sub-Components Pattern

---

## Gesamtstatistik

| Metrik | Wave 1 (done) | Wave 2 (geplant) | Gesamt |
|--------|--------------|-----------------|--------|
| Dateien | 6 | 29 | 35 |
| Zeilen vorher | 5.530 | ~14.800 | ~20.330 |
| Zeilen nachher | ~1.350 | ~5.200 | ~6.550 |
| Reduktion | 76% | ~65% | ~68% |
| Neue Dateien | 37 | ~115 | ~152 |

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

## Wave 2 — GEPLANT

### Tranche 1: Kritische Monolithen (>1000 Zeilen)

#### R-7: EmailTab.tsx (1506 Z, MOD-02) ✅ DONE — 1506→~180 Z, 8 neue Dateien in src/components/office/email/
**Pfad:** `src/pages/portal/office/EmailTab.tsx`  
**Extraktionen → `src/components/office/email/`:**
1. `emailTypes.ts` — Thread, Message, DraftMessage Interfaces
2. `emailHelpers.ts` — formatEmailDate, truncateBody, getInitials
3. `EmailThreadList.tsx` — Thread-Liste mit Suche und Filter (~200 Z)
4. `EmailThreadDetail.tsx` — Einzelner Thread mit Nachrichten (~250 Z)
5. `EmailComposeDialog.tsx` — Neue E-Mail / Antwort verfassen (~180 Z)
6. `EmailToolbar.tsx` — Such-, Filter- und Aktionsleiste (~80 Z)
7. `EmailEmptyState.tsx` — Empty State (~20 Z)
8. `EmailAttachments.tsx` — Anhangverwaltung (~60 Z)
9. `EmailSignature.tsx` — Signaturblock (~30 Z)
10. `useEmailQueries.ts` — React-Query Hooks (~80 Z)
**Ziel:** Orchestrator ~180 Z

#### R-8: PortfolioTab.tsx (1511 Z, MOD-04)
**Pfad:** `src/pages/portal/immobilien/PortfolioTab.tsx`  
**Extraktionen → `src/components/immobilien/portfolio/`:**
1. `portfolioTypes.ts` — PropertySummary, FilterState
2. `portfolioHelpers.ts` — Sortier-/Filter-Logik, Aggregation
3. `PortfolioKPIGrid.tsx` — KPI-Karten (Marktwert, Rendite, etc.) (~80 Z)
4. `PortfolioPropertyCard.tsx` — Einzelne Immobilien-Kachel (~100 Z)
5. `PortfolioPropertyTable.tsx` — Tabellenansicht (~150 Z)
6. `PortfolioFilterBar.tsx` — Filter- und Suchleiste (~80 Z)
7. `PortfolioMapView.tsx` — Kartenansicht (~80 Z)
8. `usePortfolioData.ts` — Daten-Hook (~60 Z)
**Ziel:** Orchestrator ~200 Z

#### R-9: BriefTab.tsx (1012 Z, MOD-02)
**Pfad:** `src/pages/portal/office/BriefTab.tsx`  
**Extraktionen → `src/components/office/brief/`:**
1. `briefTypes.ts` — BriefTemplate, BriefDraft
2. `briefHelpers.ts` — Template-Variablen, Formatierung
3. `BriefTemplateSelector.tsx` — Template-Auswahl (~100 Z)
4. `BriefEditor.tsx` — Briefbearbeitung (~200 Z)
5. `BriefPreview.tsx` — PDF-Vorschau (~100 Z)
6. `BriefHistoryList.tsx` — Versandte Briefe (~120 Z)
7. `BriefAddressBlock.tsx` — Adressblock-Formular (~80 Z)
**Ziel:** Orchestrator ~180 Z

#### R-10: GeldeingangTab.tsx (1018 Z, MOD-04)
**Pfad:** `src/components/portfolio/GeldeingangTab.tsx`  
**Extraktionen → `src/components/portfolio/geldeingang/`:**
1. `geldeingangTypes.ts` — Transaction, MatchResult
2. `geldeingangHelpers.ts` — matchTransaction, categorize
3. `GeldeingangImport.tsx` — CSV/MT940 Import (~120 Z)
4. `GeldeingangTransactionTable.tsx` — Buchungsliste (~200 Z)
5. `GeldeingangMatchDialog.tsx` — Zuordnungsdialog (~150 Z)
6. `GeldeingangStatsRow.tsx` — Zusammenfassungszeile (~60 Z)
**Ziel:** Orchestrator ~200 Z

---

### Tranche 2: Hohe Monolithen (700-904 Zeilen)

#### R-11: TenancyTab.tsx (904 Z, MOD-04)
**Pfad:** `src/components/portfolio/TenancyTab.tsx`  
**Extraktionen → `src/components/portfolio/tenancy/`:**
1. `tenancyTypes.ts` — TenancyContract, TenantInfo
2. `tenancyHelpers.ts` — Mietberechnung, Vertragsstatus
3. `TenancyContractCard.tsx` — Einzelner Mietvertrag (~120 Z)
4. `TenancyRentHistory.tsx` — Mietentwicklung-Timeline (~100 Z)
5. `TenancyFormDialog.tsx` — Vertrag anlegen/bearbeiten (~150 Z)
6. `TenancyKPIRow.tsx` — Leerstandsquote, Soll-Ist (~60 Z)
**Ziel:** Orchestrator ~180 Z

#### R-12: UnitDetailPage.tsx (708 Z, MOD-13)
**Pfad:** `src/pages/portal/projekte/UnitDetailPage.tsx`  
**Extraktionen → `src/components/projekte/unit/`:**
1. `unitTypes.ts` — UnitData, PricingInfo
2. `UnitHeader.tsx` — Breadcrumb + Statuszeile (~60 Z)
3. `UnitPricingCard.tsx` — Preis- und Provisionsdaten (~100 Z)
4. `UnitDocuments.tsx` — Zugehörige Dokumente (~80 Z)
5. `UnitBuyerCard.tsx` — Käufer-Zuordnung (~80 Z)
**Ziel:** Orchestrator ~150 Z

#### R-13: TileCatalog.tsx (646 Z, Admin)
**Pfad:** `src/pages/admin/TileCatalog.tsx`  
**Extraktionen → `src/components/admin/tilecatalog/`:**
1. `tileCatalogTypes.ts` — TileEntry, Category
2. `TileCatalogTable.tsx` — Haupttabelle (~180 Z)
3. `TileEditDialog.tsx` — Bearbeitungsdialog (~120 Z)
4. `TileCatalogFilter.tsx` — Such-/Filterleiste (~60 Z)
**Ziel:** Orchestrator ~150 Z

#### R-14: ManagerFreischaltung.tsx (635 Z, Admin)
**Pfad:** `src/pages/admin/ManagerFreischaltung.tsx`  
**Extraktionen → `src/components/admin/freischaltung/`:**
1. `freischaltungTypes.ts` — ManagerRequest, ApprovalPayload
2. `FreischaltungTable.tsx` — Anfragen-Tabelle (~180 Z)
3. `FreischaltungApprovalDialog.tsx` — Genehmigungsdialog (~120 Z)
4. `FreischaltungStatsGrid.tsx` — KPI-Kacheln (~60 Z)
**Ziel:** Orchestrator ~140 Z

---

### Tranche 3: Mittlere Monolithen (530-630 Zeilen)

#### R-15: PropertyDetailPage.tsx (628 Z, MOD-04)
**Extraktionen → `src/components/immobilien/detail/`:**
1. `PropertyDetailHeader.tsx` — Breadcrumb, Status, Quick Actions (~80 Z)
2. `PropertyDetailTabRouter.tsx` — Tab-Navigation (~60 Z)
3. `PropertyQuickFacts.tsx` — Kompakte Fakten-Leiste (~60 Z)
4. `propertyDetailTypes.ts` — Shared types
**Ziel:** Orchestrator ~160 Z

#### R-16: CaringProviderDetail.tsx (599 Z, MOD-22)
**Extraktionen → `src/components/petmanager/provider/`:**
1. `providerTypes.ts` — ProviderProfile, ServiceOffering
2. `ProviderInfoCard.tsx` — Stammdaten (~80 Z)
3. `ProviderServicesGrid.tsx` — Leistungsübersicht (~100 Z)
4. `ProviderBookingDialog.tsx` — Buchungsdialog (~120 Z)
**Ziel:** Orchestrator ~140 Z

#### R-17: FMFinanzierungsakte.tsx (596 Z, MOD-11)
**Extraktionen → `src/components/finanzierungsmanager/akte/`:**
1. `akteTypes.ts` — CaseFile, ConditionBlock
2. `AkteOverviewCard.tsx` — Zusammenfassungskarte (~80 Z)
3. `AkteConditionsTable.tsx` — Konditionenvergleich (~120 Z)
4. `AkteDocumentChecklist.tsx` — Dokumenten-Checkliste (~80 Z)
**Ziel:** Orchestrator ~140 Z

#### R-18: MasterTemplates.tsx (585 Z, Admin)
**Extraktionen → `src/components/admin/templates/`:**
1. `templateTypes.ts` — TemplateCategory, DossierTemplate
2. `TemplateGrid.tsx` — Kachel-Übersicht (~120 Z)
3. `TemplatePreviewDialog.tsx` — Vorschau + Bearbeitung (~120 Z)
4. `TemplateVersionHistory.tsx` — Versionierung (~60 Z)
**Ziel:** Orchestrator ~140 Z

#### R-19: OrganizationDetail.tsx (581 Z, Admin)
**Extraktionen → `src/components/admin/org/`:**
1. `orgDetailTypes.ts` — OrgInfo, Subscription
2. `OrgInfoCard.tsx` — Stammdaten (~80 Z)
3. `OrgMembersTable.tsx` — Mitglieder-Tabelle (~120 Z)
4. `OrgSubscriptionCard.tsx` — Abo-Details (~80 Z)
**Ziel:** Orchestrator ~140 Z

#### R-20: FMFallDetail.tsx (579 Z, MOD-11)
**Extraktionen → `src/components/finanzierungsmanager/fall/`:**
1. `fallTypes.ts` — CaseDetail, BankSubmission
2. `FallOverviewSection.tsx` — Header + Status-Timeline (~100 Z)
3. `FallBankSubmissions.tsx` — Bankeinreichungen (~120 Z)
4. `FallDocumentSection.tsx` — Zugehörige Dokumente (~80 Z)
**Ziel:** Orchestrator ~140 Z

#### R-21: LeadManagerKampagnen.tsx (576 Z, MOD-10)
**Extraktionen → `src/components/leads/kampagnen/`:**
1. `kampagnenTypes.ts` — Campaign, CampaignStats
2. `KampagnenTable.tsx` — Kampagnen-Tabelle (~150 Z)
3. `KampagnenCreateDialog.tsx` — Neue Kampagne (~120 Z)
4. `KampagnenStatsGrid.tsx` — KPI-Kacheln (~60 Z)
**Ziel:** Orchestrator ~130 Z

#### R-22: LeadPool.tsx (560 Z, Admin)
**Extraktionen → `src/components/admin/leadpool/`:**
1. `leadPoolTypes.ts` — PoolLead, AssignPayload
2. `LeadPoolTable.tsx` — Lead-Tabelle (~150 Z)
3. `LeadAssignDialog.tsx` — Zuweisungsdialog (~120 Z)
4. `LeadPoolStatsGrid.tsx` — KPI-Kacheln (~60 Z)
**Ziel:** Orchestrator ~130 Z

#### R-23: ObjekteingangDetail.tsx (539 Z, MOD-12)
**Extraktionen → `src/components/akquise/objekteingang/`:**
1. `objekteingangTypes.ts` — OfferDetail, AnalysisResult
2. `ObjektHeader.tsx` — Titel + Status + Quick Actions (~60 Z)
3. `ObjektDatenGrid.tsx` — Objektdaten-Übersicht (~100 Z)
4. `ObjektAnalysisPanel.tsx` — KI-Analyse-Ergebnis (~100 Z)
**Ziel:** Orchestrator ~130 Z

#### R-24: Oversight.tsx (531 Z, Admin)
**Extraktionen → `src/components/admin/oversight/`:**
1. `OversightKPIs.tsx` — System-KPIs (~60 Z)
2. `OversightTable.tsx` — Log-Tabelle (~120 Z)
3. `OversightFilters.tsx` — Filter (~60 Z)
**Ziel:** Orchestrator ~140 Z

---

### Tranche 4: Leichte Monolithen (400-510 Zeilen)

#### R-25: Agreements.tsx (506 Z, Admin)
→ `AgreementsList.tsx` + `AgreementDetail.tsx` + `AgreementForm.tsx`
**Ziel:** Orchestrator ~120 Z

#### R-26: Dashboard.tsx Admin (491 Z, Admin)
→ `AdminKPIGrid.tsx` + `AdminQuickActions.tsx` + `AdminActivityFeed.tsx`
**Ziel:** Orchestrator ~120 Z

#### R-27: Delegations.tsx (486 Z, Admin)
→ `DelegationTable.tsx` + `DelegationCreateDialog.tsx` + `DelegationStatsRow.tsx`
**Ziel:** Orchestrator ~120 Z

#### R-28: ArmstrongWorkspace.tsx (479 Z, MOD-00)
→ `WorkspaceInput.tsx` + `WorkspaceHistory.tsx` + `WorkspaceActions.tsx`
**Ziel:** Orchestrator ~120 Z

#### R-29: FMDashboard.tsx (472 Z, MOD-11)
→ `FMDashboardKPIs.tsx` + `FMDashboardCaseList.tsx` + `FMDashboardQuickActions.tsx`
**Ziel:** Orchestrator ~120 Z

#### R-30: VerwaltungTab.tsx (456 Z, MOD-04)
→ `VerwaltungHeader.tsx` + `VerwaltungGrid.tsx` + `VerwaltungActions.tsx`
**Ziel:** Orchestrator ~120 Z

#### R-31: ProjectDetailPage.tsx (456 Z, MOD-13)
→ `ProjectHeader.tsx` + `ProjectTabRouter.tsx` + `ProjectQuickFacts.tsx`
**Ziel:** Orchestrator ~120 Z

#### R-32: SanierungTab.tsx (451 Z, MOD-04)
→ `SanierungOverview.tsx` + `SanierungMassnahmen.tsx` + `SanierungKostenRechner.tsx`
**Ziel:** Orchestrator ~120 Z

#### R-33: MasterTemplatesImmobilienakte.tsx (444 Z, Admin)
→ `ImmoTemplateFields.tsx` + `ImmoTemplatePreview.tsx` + `ImmoTemplateActions.tsx`
**Ziel:** Orchestrator ~120 Z

#### R-34: StorageFileManager.tsx (434 Z, MOD-03)
→ `FileManagerToolbar.tsx` + `FileManagerGrid.tsx` + `FileManagerUpload.tsx`
**Ziel:** Orchestrator ~120 Z

#### R-35: RolesManagement.tsx (419 Z, Admin)
→ `RolesTable.tsx` + `RoleEditDialog.tsx` + `RolePermissionMatrix.tsx`
**Ziel:** Orchestrator ~120 Z

---

## Freeze-Anforderungen pro Tranche

| Tranche | Module-Unfreezes benötigt | Admin (kein Unfreeze) |
|---------|--------------------------|----------------------|
| 1 | MOD-02 (EmailTab, BriefTab), MOD-04 (PortfolioTab, GeldeingangTab) | — |
| 2 | MOD-04 (TenancyTab), MOD-13 (UnitDetail) | TileCatalog, ManagerFreischaltung |
| 3 | MOD-04 (PropertyDetail), MOD-22 (CaringProvider), MOD-11 (FMFinanzierungsakte, FMFallDetail), MOD-10 (Kampagnen), MOD-12 (Objekteingang) | MasterTemplates, OrgDetail, LeadPool, Oversight |
| 4 | MOD-04 (Verwaltung, Sanierung), MOD-13 (ProjectDetail), MOD-00 (Armstrong), MOD-11 (FMDashboard), MOD-03 (StorageFileManager) | Agreements, Dashboard, Delegations, MasterTemplatesImmo, Roles |

---

## Regeln

1. **Keine funktionalen Änderungen** — Reine Extraktion
2. **Keine DB-Änderungen** — Kein Migrations-Tool nötig
3. **Keine neuen Routes** — Bestehende Routen bleiben
4. **Module sofort re-freezen** nach Abschluss jeder Phase
5. **TSX Creation Check** (Regel F) — vor jeder neuen Datei auf Duplikate prüfen
6. **Zone Separation** (Regel G) — keine Cross-Zone-Imports
