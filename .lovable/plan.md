
# Refactoring-Masterplan: TSX-Monolithen → Modulare Architektur

> **Datum**: 2026-03-05
> **Status**: ANALYSE ABGESCHLOSSEN — Bereit zur schrittweisen Umsetzung
> **Methode**: Bewährtes Orchestrator + Sub-Components Pattern (aus AkquiseMandate B-4)

---

## Übersicht

| # | Datei | Zeilen | Zone | Modul | Priorität |
|---|-------|--------|------|-------|-----------|
| 1 | `FMEinreichung.tsx` | 1039 | Z2 | MOD-11 | KRITISCH |
| 2 | `ExposeDetail.tsx` | 1008 | Z2 | MOD-06 | KRITISCH |
| 3 | `Inbox.tsx` | 976 | Z1 | Admin | KRITISCH |
| 4 | `KontexteTab.tsx` | 923 | Z2 | MOD-04 | KRITISCH |
| 5 | `AnfrageFormV2.tsx` | 904 | Z2 | MOD-07 | KRITISCH |
| 6–22 | 17 weitere Dateien | 491–680 | Z1/Z2 | Diverse | HOCH |
| 23–35 | 13 weitere Dateien | 348–478 | Z1/Z2 | Diverse | MITTEL |

---

## R-1: FMEinreichung.tsx (1039 → ~200 Zeilen)

**Pfad:** `src/pages/portal/finanzierungsmanager/FMEinreichung.tsx`
**Modul:** MOD-11 (Finanzierungsmanager)
**Freeze:** Muss UNFREEZE MOD-11

### Ist-Analyse

| Bereich | Zeilen | Beschreibung |
|---------|--------|-------------|
| Imports + Types + Helpers | 1–83 | `TR`, `EmptyHint`, `SelectedBank`, Configs |
| State + Hooks | 85–155 | ~20 useState, 6 Hooks, Europace-State |
| Handler: Bank-Logik | 157–182 | addBank, removeBank, addManualBank, filterContacts |
| Handler: E-Mail | 184–302 | generateEmailBody, handleSendEmail, handleSendAll |
| Handler: Europace | 304–412 | handleEuropaceRequest, pollEuropace, handleExternalHandoff |
| JSX: Kachel 1 (Exposé) | 458–525 | Finanzierungs-Exposé-Tabelle |
| JSX: Kachel 2 (Bankauswahl) | 527–816 | 4-Grid (Kontaktbuch, KI, Manuell, Sammlung) + E-Mail-Client |
| JSX: Kachel 3 (Status) | 819–902 | Submission-Log-Tabelle mit Statusauswahl |
| JSX: Kachel 4 (Europace) | 905–1036 | API-Konditionen, Vorschlags-Karten, LeadRating |

### Extraktionsplan

#### 1. `FinanzExposeeCard.tsx` (Kachel 1)
**Zeilen 458–525** (~70 Zeilen JSX)
- Finanzierungs-Exposé als read-only Tabelle
- Props: `request, applicant, property, selectedId, reqLoading`

#### 2. `BankSelectionCard.tsx` (Kachel 2, oberer Teil)
**Zeilen 537–729** (~190 Zeilen JSX)
- 4-Quellen-Grid: Kontaktbuch, KI-Suche, Manuelle Eingabe, Ausgewählte Banken
- Props: `selectedBanks, onAddBank, onRemoveBank, bankContacts, bankSearchQuery, setBankSearchQuery, manualBankName/Email, setters, researchEngine, aiSearchInput, setAiSearchInput, onSearch, selectedId, MAX_BANKS`

#### 3. `EmailDraftsSection.tsx` (Kachel 2, unterer Teil)
**Zeilen 734–815** (~80 Zeilen JSX)
- E-Mail-Entwürfe pro Bank mit editierbarem Body
- Props: `selectedBanks, emailDrafts, setEmailDrafts, emailSubject, generateEmailBody, onUpdateBankEmail, onSendEmail, onSendAll, isSending`

#### 4. `SubmissionStatusCard.tsx` (Kachel 3)
**Zeilen 819–902** (~85 Zeilen JSX)
- Submission-Log-Tabelle mit Statusänderung und Bankauswahl
- Props: `selectedId, submissionLogs, onUpdateLogStatus, onSelectBank, onArchiveCase`

#### 5. `EuropaceCard.tsx` (Kachel 4)
**Zeilen 905–1036** (~130 Zeilen JSX)
- Europace-API: Konditionen ermitteln, Vorschlags-Karten, LeadRating, manuelle Übergabe
- Props: `selectedId, request, epLoading, epVorschlaege, epLeadRating, epError, epAnfrageId, onEuropaceRequest, externalSoftwareName, setExternalSoftwareName, onExternalHandoff, createLogPending`

#### 6. Helpers auslagern
- `TR`, `EmptyHint` → `src/components/finanzierungsmanager/fmHelpers.tsx`
- `eurFormat`, `READY_STATUSES`, `getRequestStatus` → `src/components/finanzierungsmanager/fmConfigs.ts`

### Ergebnis

```text
FMEinreichung.tsx (~200 Zeilen)
├── State + Hooks (~80 Zeilen)
├── Handler orchestrieren (~70 Zeilen)
└── JSX: WidgetGrid + 5 Cards (~50 Zeilen)

Neue Dateien:
├── components/FinanzExposeeCard.tsx (~90 Zeilen)
├── components/BankSelectionCard.tsx (~210 Zeilen)
├── components/EmailDraftsSection.tsx (~100 Zeilen)
├── components/SubmissionStatusCard.tsx (~100 Zeilen)
├── components/EuropaceCard.tsx (~150 Zeilen)
├── src/components/finanzierungsmanager/fmHelpers.tsx (~25 Zeilen)
└── src/components/finanzierungsmanager/fmConfigs.ts (~15 Zeilen)
```

---

## R-2: ExposeDetail.tsx (1008 → ~220 Zeilen)

**Pfad:** `src/pages/portal/verkauf/ExposeDetail.tsx`
**Modul:** MOD-06 (Verkauf)
**Freeze:** Muss UNFREEZE MOD-06

### Ist-Analyse

| Bereich | Zeilen | Beschreibung |
|---------|--------|-------------|
| Types + Formatters | 64–129 | UnitData, PropertyData, ListingData, Helpers |
| Hooks + Queries | 131–262 | 5 useQuery (unit, property, accounting, listing, publications) |
| Mutations | 264–378 | save, partnerRelease, kaufyToggle, generateDescription |
| Berechnungen + Loading | 380–432 | grossYield, pricePerSqm, viewTracking, Skeleton |
| JSX: Header + KeyFacts | 434–496 | Zurück-Button, StatusBadge, 4-KPI-Bar |
| JSX: Tab Verkaufsdaten | 507–598 | Titel, Beschreibung (KI), Preis, Provision |
| JSX: Tab Objektdaten | 601–693 | 3-Spalten-Grid read-only aus MOD-04 |
| JSX: Tab Rendite & AfA | 695–757 | Mietrendite + AfA-Kennzahlen |
| JSX: Tab Energie | 759–793 | Energieausweis (minimal) |
| JSX: Map + Sidebar | 796–993 | ExposeLocationMap, Status-Card, Partner-Release, Kaufy, IS24, Kennzahlen |
| JSX: Dialoge | 994–1006 | PartnerReleaseDialog |

### Extraktionsplan

#### 1. `ExposeKeyFacts.tsx`
**Zeilen 472–496** (~25 Zeilen)
- 4-KPI-Bar: Kaufpreis, Wohnfläche, Zimmer, Bruttorendite
- Props: `askingPrice, areaSqm, grossYield, marketValue`

#### 2. `ExposeVerkaufTab.tsx`
**Zeilen 507–598** (~90 Zeilen)
- Titel, KI-Beschreibung, Preis + Provision-Slider
- Props: `formData, onFieldChange, onGenerateDescription, isGeneratingDescription, isReadOnly`

#### 3. `ExposeObjektdatenTab.tsx`
**Zeilen 601–693** (~90 Zeilen)
- Read-only 3-Spalten-Grid aus MOD-04
- Props: `property, unit`

#### 4. `ExposeRenditeTab.tsx`
**Zeilen 695–757** (~65 Zeilen)
- Mietrendite + AfA-Daten
- Props: `unit, accounting, grossYield, annualRent`

#### 5. `ExposePublishSidebar.tsx`
**Zeilen 806–993** (~190 Zeilen)
- Status-Card, Partner-Release, Kaufy-Toggle, IS24, Kennzahlen, Fee-Summary
- Props: `listing, publications, formData, property, unit, onPartnerRelease, onKaufyToggle, hasPartnerRelease, isKaufyActive, grossYield, annualRent, pricePerSqm`

#### 6. Helpers auslagern
- `formatCurrency`, `formatPercent` → `src/components/verkauf/exposeHelpers.ts`
- Types (UnitData, PropertyData, etc.) → `src/components/verkauf/exposeTypes.ts`

### Ergebnis

```text
ExposeDetail.tsx (~220 Zeilen)
├── Hooks + Queries (~110 Zeilen)
├── Mutations + Handlers (~60 Zeilen)
└── JSX: Layout + Tabs + Sidebar-Orchestrierung (~50 Zeilen)

Neue Dateien:
├── components/ExposeKeyFacts.tsx (~40 Zeilen)
├── components/ExposeVerkaufTab.tsx (~110 Zeilen)
├── components/ExposeObjektdatenTab.tsx (~100 Zeilen)
├── components/ExposeRenditeTab.tsx (~80 Zeilen)
├── components/ExposePublishSidebar.tsx (~210 Zeilen)
├── src/components/verkauf/exposeHelpers.ts (~15 Zeilen)
└── src/components/verkauf/exposeTypes.ts (~50 Zeilen)
```

---

## R-3: Inbox.tsx (976 → ~180 Zeilen)

**Pfad:** `src/pages/admin/Inbox.tsx`
**Modul:** Zone 1 Admin (nicht frozen)

### Ist-Analyse

| Bereich | Zeilen | Beschreibung |
|---------|--------|-------------|
| Types + Interfaces | 71–126 | InboundItem, RoutingRule, PostserviceMandate, Organization |
| State (~20 useState) | 128–161 | Items, Rules, Mandates, Dialoge, Filter |
| fetchData + Helpers | 163–230 | Parallele Queries, getOrgName, getStatusBadge, getMandateStatusBadge |
| Handler: Assign + Route | 232–292 | handleAssign, handleRoute, handleUpdateStatus |
| Handler: Rules CRUD | 294–356 | openCreateRule, openEditRule, handleSaveRule, handleDeleteRule |
| Handler: Mandates | 358–382 | openMandate, handleSaveMandate |
| JSX: Stats-Grid | 406–474 | 4 KPI-Cards (Offen, Zugestellt, Regeln, Aufträge) |
| JSX: Tab Posteingang | 493–599 | Tabelle mit Filterung + Aktionen |
| JSX: Tab Routing-Regeln | 602–675 | Tabelle mit CRUD |
| JSX: Tab Aufträge | 677–742 | Tabelle mit Status |
| JSX: 4 Dialoge | 745–976 | Assignment, View, Rule, Mandate |

### Extraktionsplan

#### 1. `InboxStatsGrid.tsx`
**Zeilen 427–474** (~50 Zeilen)
- 4 KPI-Cards
- Props: `pendingCount, assignedCount, activeRulesCount, openMandatesCount`

#### 2. `InboxPostTab.tsx`
**Zeilen 493–599** (~110 Zeilen)
- Posteingang-Tabelle mit Filter + Aktionen
- Props: `items, statusFilter, setStatusFilter, onView, onRoute, onUpdateStatus, getOrgName, getStatusBadge`

#### 3. `InboxRulesTab.tsx`
**Zeilen 602–675** (~75 Zeilen)
- Routing-Regeln-Tabelle
- Props: `rules, onCreateRule, onEditRule, onDeleteRule, getOrgName`

#### 4. `InboxMandatesTab.tsx`
**Zeilen 677–742** (~65 Zeilen)
- Aufträge-Tabelle
- Props: `mandates, onOpenMandate, onCreateRule, getOrgName, getMandateStatusBadge`

#### 5. `InboxDialogs.tsx`
**Zeilen 745–976** (~230 Zeilen → kann weiter in 4 einzelne Dialoge gesplittet werden)
- Assignment, View, Rule, Mandate — alle 4 Dialoge in einer Datei
- Props: Alle Dialog-State-Props

#### 6. Helpers auslagern
- Types → `src/components/admin/inboxTypes.ts`
- `getStatusBadge`, `getMandateStatusBadge`, `getOrgName` → `src/components/admin/inboxHelpers.tsx`

### Ergebnis

```text
Inbox.tsx (~180 Zeilen)
├── State + fetchData (~60 Zeilen)
├── Handler delegieren (~50 Zeilen)
└── JSX: Tabs + Dialoge orchestrieren (~70 Zeilen)

Neue Dateien:
├── src/components/admin/InboxStatsGrid.tsx (~60 Zeilen)
├── src/components/admin/InboxPostTab.tsx (~120 Zeilen)
├── src/components/admin/InboxRulesTab.tsx (~85 Zeilen)
├── src/components/admin/InboxMandatesTab.tsx (~75 Zeilen)
├── src/components/admin/InboxDialogs.tsx (~240 Zeilen)
├── src/components/admin/inboxTypes.ts (~60 Zeilen)
└── src/components/admin/inboxHelpers.tsx (~40 Zeilen)
```

---

## R-4: KontexteTab.tsx (923 → ~180 Zeilen)

**Pfad:** `src/pages/portal/immobilien/KontexteTab.tsx`
**Modul:** MOD-04 (Immobilien)
**Freeze:** Muss UNFREEZE MOD-04

### Ist-Analyse

| Bereich | Zeilen | Beschreibung |
|---------|--------|-------------|
| Types + Interfaces | 22–96 | LandlordContext, ContextMember, ContextFormData, OwnerData |
| State + Queries | 98–167 | 3 useQuery (contexts, members, propertyCounts), edit-state |
| Update Mutation | 170–263 | Komplexe Mutation: Context-Update + Members delete-reinsert |
| Handler | 265–345 | handleStartEdit, handleCancelEdit, handleSave, updateOwner, addOwner, removeOwner, formatAddress, formatCurrency |
| Inline-Komponente: ContextCardView | 347–480 | ~135 Zeilen — View-Ansicht der Kontext-Karte |
| Inline-Komponente: ContextCardEdit | 483–847 | ~365 Zeilen — Edit-Formular (Privat/Business, Eigentümer, Registerdaten, Adresse) |
| JSX: Grid + AddCard | 849–923 | Rendering-Loop + Add-Button |

### Extraktionsplan

#### 1. `ContextCardView.tsx`
**Zeilen 347–480** (~135 Zeilen)
- Read-only Kontext-Card (Privat/Business)
- Props: `ctx, members, propertyCount, onEdit, onAssign, formatAddress, formatCurrency`

#### 2. `ContextCardEdit.tsx`
**Zeilen 483–847** (~365 Zeilen → eigenständige Komponente, die ggf. noch weiter gesplittet wird)
- Edit-Formular mit allen Sektionen
- Props: `editFormData, setEditFormData, editOwners, updateOwner, addOwner, removeOwner, onSave, onCancel, isPending`

#### 3. Types + Helpers auslagern
- Types → `src/components/immobilien/kontexteTypes.ts`
- `formatAddress`, `formatCurrency` → `src/components/immobilien/kontexteHelpers.ts`

### Ergebnis

```text
KontexteTab.tsx (~180 Zeilen)
├── State + Queries (~70 Zeilen)
├── Mutation + Handler (~60 Zeilen)
└── JSX: Grid + View/Edit-Routing (~50 Zeilen)

Neue Dateien:
├── src/components/immobilien/ContextCardView.tsx (~150 Zeilen)
├── src/components/immobilien/ContextCardEdit.tsx (~380 Zeilen)
├── src/components/immobilien/kontexteTypes.ts (~80 Zeilen)
└── src/components/immobilien/kontexteHelpers.ts (~20 Zeilen)
```

**Hinweis:** `ContextCardEdit.tsx` ist mit ~380 Zeilen selbst noch groß. Kann in Phase 2 weiter aufgeteilt werden in:
- `ContextEditPrivateSection.tsx` (Steuerbasis + Eigentümer)
- `ContextEditBusinessSection.tsx` (GF + Registerdaten + Steuersatz)
- `ContextEditAddressSection.tsx` (gemeinsame Adresse)

---

## R-5: AnfrageFormV2.tsx (904 → ~200 Zeilen)

**Pfad:** `src/components/finanzierung/AnfrageFormV2.tsx`
**Modul:** MOD-07 (Finanzierung)
**Freeze:** Muss UNFREEZE MOD-07

### Ist-Analyse

| Bereich | Zeilen | Beschreibung |
|---------|--------|-------------|
| Types | 63–102 | FinanceRequestData, AnfrageFormV2Props |
| Options-Arrays | 108–145 | 6 Konfigurations-Arrays (purpose, objectType, equipment, location, fixedRate) |
| Helper-Komponenten | 151–252 | SectionHeader, FormField, CurrencyInput, PercentInput |
| State + Queries | 258–351 | formData, completionData, request, portfolioProperties |
| Mutations + Handlers | 353–431 | saveMutation, prefillFromProperty, updateField, Berechnungen |
| JSX: Header + Prefill | 443–496 | Status-Badge, Portfolio-Selector |
| JSX: Section A (Vorhaben) | 498–529 | Purpose-Select |
| JSX: Section B (Objekt) | 531–657 | Adresse, Typ, Baujahr, Flächen, Ausstattung, Lage |
| JSX: Section C (Kosten) | 659–728 | Kaufpreis, Modernisierung, NK, GrESt, Makler, Gesamt |
| JSX: Section D (Finanzierung) | 731–830 | EK, Darlehen, Zinsbindung, Tilgung, Rate |
| JSX: Footer + Submit-Dialog | 832–904 | Speichern, Einreichen, AlertDialog |

### Extraktionsplan

#### 1. Options + Types auslagern
- `anfrageFormOptions.ts` — Alle 6 Options-Arrays
- `anfrageFormTypes.ts` — FinanceRequestData Interface

#### 2. Helper-Komponenten bereits isoliert
- `SectionHeader`, `FormField`, `CurrencyInput`, `PercentInput` → nach `src/components/finanzierung/formPrimitives.tsx`
- Diese sind generisch und könnten langfristig nach `src/components/shared/` wandern

#### 3. `AnfrageFormSectionA.tsx` (Vorhaben)
**Zeilen 498–529** (~30 Zeilen)
- Props: `formData, updateField, isReadOnly`

#### 4. `AnfrageFormSectionB.tsx` (Objektdaten)
**Zeilen 531–657** (~125 Zeilen)
- Props: `formData, updateField, isReadOnly`

#### 5. `AnfrageFormSectionC.tsx` (Kosten)
**Zeilen 659–728** (~70 Zeilen)
- Props: `formData, updateField, isReadOnly, totalCosts`

#### 6. `AnfrageFormSectionD.tsx` (Finanzierung)
**Zeilen 731–830** (~100 Zeilen)
- Props: `formData, updateField, isReadOnly, financingGap`

#### 7. `AnfrageFormFooter.tsx` (Submit-Bereich)
**Zeilen 832–904** (~70 Zeilen)
- Props: `isDirty, isReadOnly, canSubmit, completionScore, onSave, onSubmit, savePending, showSubmitDialog, setShowSubmitDialog`

### Ergebnis

```text
AnfrageFormV2.tsx (~200 Zeilen)
├── State + Queries (~70 Zeilen)
├── Mutations + Calculations (~60 Zeilen)
└── JSX: 4 Sections + Footer orchestrieren (~70 Zeilen)

Neue Dateien:
├── src/components/finanzierung/anfrageFormOptions.ts (~40 Zeilen)
├── src/components/finanzierung/anfrageFormTypes.ts (~40 Zeilen)
├── src/components/finanzierung/formPrimitives.tsx (~100 Zeilen)
├── src/components/finanzierung/AnfrageFormSectionA.tsx (~45 Zeilen)
├── src/components/finanzierung/AnfrageFormSectionB.tsx (~140 Zeilen)
├── src/components/finanzierung/AnfrageFormSectionC.tsx (~85 Zeilen)
├── src/components/finanzierung/AnfrageFormSectionD.tsx (~115 Zeilen)
└── src/components/finanzierung/AnfrageFormFooter.tsx (~85 Zeilen)
```

---

## R-6 bis R-22: HOCH-Priorität (500–680 Zeilen)

Diese Dateien folgen dem gleichen Pattern, werden aber erst nach R-1 bis R-5 umgesetzt. Hier die Kurz-Konzepte:

### R-6: Users.tsx (680 Z, Z1 Admin)
→ `UserTable.tsx` + `UserRoleDialog.tsx` + `UserSearchBar.tsx` + `userTypes.ts`

### R-7: TileCatalog.tsx (646 Z, Z1 Admin)
→ `TileCatalogTable.tsx` + `TileEditDialog.tsx` + `tileCatalogHelpers.ts`

### R-8: ManagerFreischaltung.tsx (635 Z, Z1 Admin)
→ `FreischaltungTable.tsx` + `FreischaltungDialog.tsx` + `FreischaltungFilters.tsx`

### R-9: PropertyDetailPage.tsx (628 Z, MOD-04)
→ Tab-Orchestrator bleibt, Sidebar + Header in eigene Komponenten

### R-10: UebersichtTab.tsx (616 Z, MOD-18)
→ `HouseholdPersonsCard.tsx` + `DrvReferenceCard.tsx` + `uebersichtHelpers.ts`

### R-11: SelbstauskunftFormV2.tsx (614 Z, MOD-07)
→ Gleiche Section-Pattern wie AnfrageFormV2: 4-5 FormSection-Komponenten

### R-12: CarsFahrzeuge.tsx (603 Z, MOD-17)
→ `VehicleTable.tsx` + `VehicleInlineEditor.tsx` + `VehicleFilters.tsx`

### R-13: FMFinanzierungsakte.tsx (596 Z, MOD-11)
→ `AkteHeader.tsx` + `AkteSections.tsx` (3-4 FormSection-Komponenten)

### R-14: MasterTemplates.tsx (585 Z, Z1 Admin)
→ `TemplateTable.tsx` + `TemplatePreviewDialog.tsx`

### R-15: OrganizationDetail.tsx (581 Z, Z1 Admin)
→ `OrgInfoCard.tsx` + `OrgMembersTab.tsx` + `OrgSettingsTab.tsx`

### R-16: FMFallDetail.tsx (579 Z, MOD-11)
→ `FallDetailHeader.tsx` + `FallDetailTabs.tsx` (3-4 Tab-Komponenten)

### R-17: ObjekteingangDetail.tsx (539 Z, MOD-12)
→ Bereits analysiert, ähnlich wie AkquiseMandate-Pattern

### R-18: Oversight.tsx (531 Z, Z1 Admin)
→ `OversightMetrics.tsx` + `OversightSystemHealth.tsx` + `OversightLogs.tsx`

### R-19: CarServiceFlow.tsx (529 Z, MOD-17)
→ 6-Schritt-Wizard: `ServiceStep1.tsx` bis `ServiceStep6.tsx` + `ServiceFlowOrchestrator.tsx`

### R-20: VehicleDetailPage.tsx (532 Z, MOD-17)
→ `VehicleHeader.tsx` + `VehicleTabs.tsx` (3-4 Tab-Komponenten)

### R-21: Agreements.tsx (506 Z, Z1 Admin)
→ `AgreementTable.tsx` + `AgreementFormDialog.tsx`

### R-22: Dashboard.tsx (491 Z, Z1 Admin)
→ `AdminKpiGrid.tsx` + `AdminRecentActivity.tsx` + `AdminQuickActions.tsx`

---

## R-23 bis R-35: MITTEL-Priorität (348–478 Zeilen)

Diese Dateien werden **nicht proaktiv refactored**, sondern nur bei der nächsten inhaltlichen Änderung gesplittet. Hier die Regel:

> **Bei jeder Änderung an einer Datei >400 Zeilen:** Prüfe ob ein natürlicher Extraktionspunkt vorliegt und extrahiere mindestens eine Komponente.

| # | Datei | Zeilen | Aktion |
|---|-------|--------|--------|
| 23 | KontenTab.tsx | 478 | Bei nächster Änderung: KontoTable + KontoDialog |
| 24 | FMDashboard.tsx | 472 | Bei nächster Änderung: KPI-Grid + CaseList |
| 25 | VerwaltungTab.tsx | 456 | Bei nächster Änderung: VerwaltungSections |
| 26 | SanierungTab.tsx | 451 | Bei nächster Änderung: SanierungForm + SanierungStatus |
| 27 | MasterTemplatesImmobilienakte.tsx | 444 | Bei nächster Änderung: TemplateGrid |
| 28 | StorageFileManager.tsx | 434 | Bei nächster Änderung: FileTree + FileActions |
| 29 | PortalNav.tsx | 426 | Bei nächster Änderung: NavSection + NavTileGrid |
| 30 | AkquiseMandate.tsx | 415 | ✅ Bereits refactored (B-4) |
| 31 | Organizations.tsx | 410 | Bei nächster Änderung: OrgTable + OrgFilters |
| 32 | HouseholdCalculationCard.tsx | 384 | Bei nächster Änderung: CalcInputs + CalcResults |
| 33 | ObjekteTab.tsx | 368 | Bei nächster Änderung: ObjektTable + ObjektActions |
| 34 | VorgaengeTab.tsx | 358 | Bei nächster Änderung: VorgangList + VorgangDetail |
| 35 | PortalLayout.tsx | 348 | Bei nächster Änderung: LayoutHeader + LayoutSidebar |

---

## Umsetzungsreihenfolge

| Phase | Refactoring | Geschätzter Aufwand | Voraussetzung |
|-------|------------|---------------------|---------------|
| **Phase 1** | R-1: FMEinreichung | 1 Session | UNFREEZE MOD-11 |
| **Phase 2** | R-2: ExposeDetail | 1 Session | UNFREEZE MOD-06 |
| **Phase 3** | R-3: Inbox | 1 Session | Keine (Admin, nicht frozen) |
| **Phase 4** | R-4: KontexteTab | 1 Session | UNFREEZE MOD-04 |
| **Phase 5** | R-5: AnfrageFormV2 | 1 Session | UNFREEZE MOD-07 |
| **Phase 6+** | R-6 bis R-22 | Je 0,5–1 Session | Je nach Modul |

---

## Qualitätskriterien pro Refactoring

- [ ] Orchestrator-Datei ≤ 250 Zeilen
- [ ] Keine Sub-Komponente > 400 Zeilen
- [ ] Types in eigener Datei
- [ ] Configs/Options in eigener Datei
- [ ] Keine Inline-Helfer-Komponenten in Page-Files
- [ ] Barrel-Export über bestehende Index-Dateien
- [ ] Freeze nach Abschluss wieder aktivieren
- [ ] Kein funktionaler Unterschied (pure Extraktion)
