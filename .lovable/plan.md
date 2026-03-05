
# Refactoring-Masterplan: TSX-Monolithen → Modulare Architektur

> **Datum**: 2026-03-05 (aktualisiert)
> **Status**: Wave 1 ✅ (R-1–R-6) — Wave 2 Tranche 1 ✅ (R-7–R-10) — Tranche 2 ✅ (R-11–R-14) — Tranche 3 ✅ (R-15–R-24) — Tranche 4 OFFEN (R-25–R-35)
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

## Wave 2 — Tranche 4: Leichte Monolithen (400-510 Zeilen) — OFFEN

| # | Datei | Zeilen | Modul | Extraktionen |
|---|-------|--------|-------|-------------|
| R-25 | Agreements.tsx | 506 | Admin | AgreementsList + AgreementDetail + AgreementForm → Orchestrator ~120 Z |
| R-26 | Dashboard.tsx (Admin) | 491 | Admin | AdminKPIGrid + AdminQuickActions + AdminActivityFeed → Orchestrator ~120 Z |
| R-27 | Delegations.tsx | 486 | Admin | DelegationTable + DelegationCreateDialog + DelegationStatsRow → Orchestrator ~120 Z |
| R-28 | ArmstrongWorkspace.tsx | 479 | MOD-00 | WorkspaceInput + WorkspaceHistory + WorkspaceActions → Orchestrator ~120 Z |
| R-29 | FMDashboard.tsx | 472 | MOD-11 | FMDashboardKPIs + FMDashboardCaseList + FMDashboardQuickActions → Orchestrator ~120 Z |
| R-30 | VerwaltungTab.tsx | 456 | MOD-04 | VerwaltungHeader + VerwaltungGrid + VerwaltungActions → Orchestrator ~120 Z |
| R-31 | ProjectDetailPage.tsx | 456 | MOD-13 | ProjectHeader + ProjectTabRouter + ProjectQuickFacts → Orchestrator ~120 Z |
| R-32 | SanierungTab.tsx | 451 | MOD-04 | SanierungOverview + SanierungMassnahmen + SanierungKostenRechner → Orchestrator ~120 Z |
| R-33 | MasterTemplatesImmobilienakte.tsx | 444 | Admin | ImmoTemplateFields + ImmoTemplatePreview + ImmoTemplateActions → Orchestrator ~120 Z |
| R-34 | StorageFileManager.tsx | 434 | MOD-03 | FileManagerToolbar + FileManagerGrid + FileManagerUpload → Orchestrator ~120 Z |
| R-35 | RolesManagement.tsx | 419 | Admin | RolesTable + RoleEditDialog + RolePermissionMatrix → Orchestrator ~120 Z |

### Freeze-Anforderungen Tranche 4

| Module | Dateien |
|--------|---------|
| MOD-00 | ArmstrongWorkspace |
| MOD-03 | StorageFileManager |
| MOD-04 | VerwaltungTab, SanierungTab |
| MOD-11 | FMDashboard |
| MOD-13 | ProjectDetailPage |
| Admin (kein Unfreeze) | Agreements, Dashboard, Delegations, MasterTemplatesImmo, Roles |

---

## Regeln

1. **Keine funktionalen Änderungen** — Reine Extraktion
2. **Keine DB-Änderungen** — Kein Migrations-Tool nötig
3. **Keine neuen Routes** — Bestehende Routen bleiben
4. **Module sofort re-freezen** nach Abschluss jeder Phase
5. **TSX Creation Check** (Regel F) — vor jeder neuen Datei auf Duplikate prüfen
6. **Zone Separation** (Regel G) — keine Cross-Zone-Imports
