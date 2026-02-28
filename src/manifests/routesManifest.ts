/**
 * ROUTES MANIFEST — SINGLE SOURCE OF TRUTH (Runtime-SSOT)
 * 
 * Diese Datei ist die alleinige, verbindliche Quelle für alle Routen.
 * Die YAML-Dateien (manifests/routes_manifest.yaml, tile_catalog.yaml) sind DEPRECATED.
 * ALL routes must be declared here. App.tsx delegates to ManifestRouter.
 * 
 * RULES:
 * 1. No route exists unless declared here
 * 2. Tile count varies per module (no fixed 4-tile rule)
 * 3. Changes require explicit approval
 */

export interface RouteDefinition {
  path: string;
  component: string;
  title: string;
  dynamic?: boolean;
  /** V1.0: Golden Path Guard Config — manifest-driven route protection */
  goldenPath?: {
    moduleCode: string;
    entityIdParam?: string;
  };
}

export interface SubTile {
  path: string;
  component: string;
  title: string;
  premium?: boolean;
  default?: boolean;
}

export interface ModuleDefinition {
  name: string;
  base: string;
  icon: string;
  display_order: number;
  visibility: {
    default: boolean;
    org_types: string[];
    requires_activation?: boolean;
    requires_role?: string[];
  };
  tiles: SubTile[];
  dynamic_routes?: RouteDefinition[];
  deprecated_routes?: Array<{ path: string; reason: string; remove_in: string }>;
}

export interface ZoneDefinition {
  base: string;
  layout: string;
  requires_role?: string[];
  routes?: RouteDefinition[];
  dashboard?: RouteDefinition;
  modules?: Record<string, ModuleDefinition>;
}

export interface WebsiteDefinition {
  base: string;
  layout: string;
  routes: RouteDefinition[];
}

export interface LegacyRoute {
  path: string;
  redirect_to: string;
  reason: string;
}

export interface SpecialRoute {
  path: string;
  redirect_to?: string;
  component?: string;
  title?: string;
  public?: boolean;
  hidden?: boolean;
}

// =============================================================================
// ZONE 1: ADMIN PORTAL
// =============================================================================
export const zone1Admin: ZoneDefinition = {
  base: "/admin",
  layout: "AdminLayout",
  requires_role: ["platform_admin"],
  routes: [
    { path: "", component: "Dashboard", title: "Admin Dashboard" },
    { path: "organizations", component: "Organizations", title: "Kunden & Tenants" },
    { path: "organizations/:id", component: "OrganizationDetail", title: "Organisation Details", dynamic: true },
    { path: "users", component: "Users", title: "Benutzer" },
    { path: "delegations", component: "Delegations", title: "Delegationen" },
    // Masterdata
    { path: "masterdata", component: "MasterTemplates", title: "Stammdaten-Vorlagen" },
    { path: "masterdata/immobilienakte", component: "MasterTemplatesImmobilienakte", title: "Immobilienakte Vorlage" },
    { path: "masterdata/selbstauskunft", component: "MasterTemplatesSelbstauskunft", title: "Selbstauskunft Vorlage" },
    { path: "masterdata/projektakte", component: "MasterTemplatesProjektakte", title: "Projektakte Vorlage" },
    { path: "masterdata/fahrzeugakte", component: "MasterTemplatesFahrzeugakte", title: "Fahrzeugakte Vorlage" },
    { path: "masterdata/photovoltaikakte", component: "MasterTemplatesPhotovoltaikakte", title: "Photovoltaikakte Vorlage" },
    { path: "masterdata/finanzierungsakte", component: "MasterTemplatesFinanzierungsakte", title: "Finanzierungsakte Vorlage" },
    { path: "masterdata/versicherungsakte", component: "MasterTemplatesVersicherungsakte", title: "Versicherungsakte Vorlage" },
    { path: "masterdata/vorsorgeakte", component: "MasterTemplatesVorsorgeakte", title: "Vorsorgeakte Vorlage" },
    { path: "masterdata/personenakte", component: "MasterTemplatesPersonenakte", title: "Personenakte Vorlage" },
    { path: "masterdata/haustierakte", component: "MasterTemplatesHaustierakte", title: "Haustierakte Vorlage" },
    // KI Office — Konsolidiert: 3 Menüpunkte
    { path: "ki-office/recherche", component: "AdminRecherche", title: "Recherche" },
    { path: "ki-office/kontakte", component: "AdminKontaktbuch", title: "Kontaktbuch" },
    { path: "ki-office/email", component: "AdminEmailAgent", title: "E-Mail Agent" },
    { path: "tiles", component: "TileCatalog", title: "Tile-Katalog" },
    { path: "integrations", component: "Integrations", title: "Integrationen" },
    { path: "oversight", component: "Oversight", title: "Oversight" },
    { path: "audit", component: "AuditHub", title: "Audit Hub" },
    
    { path: "agreements", component: "Agreements", title: "Vereinbarungen" },
    { path: "partner-verification", component: "PartnerVerification", title: "Partner-Verifizierung" },
    { path: "manager-freischaltung", component: "ManagerFreischaltung", title: "Manager-Freischaltung" },
    { path: "roles", component: "RolesManagement", title: "Rollen & Berechtigungen" },
    { path: "support", component: "Support", title: "Support" },
    // =========================================================================
    // FUTUREROOM — GOVERNANCE + INTAKE (5 Sub-Items per Spec)
    // SoT for finance requests after submission until assignment
    // =========================================================================
    { path: "futureroom", component: "FutureRoom", title: "Future Room" },
    { path: "futureroom/inbox", component: "FutureRoomInbox", title: "Inbox" },
    { path: "futureroom/zuweisung", component: "FutureRoomZuweisung", title: "Zuweisung" },
    { path: "futureroom/finanzierungsmanager", component: "FutureRoomManagers", title: "Finanzierungsmanager" },
    { path: "futureroom/bankkontakte", component: "FutureRoomBanks", title: "Bankkontakte" },
    { path: "futureroom/monitoring", component: "FutureRoomMonitoring", title: "Monitoring" },
    { path: "futureroom/vorlagen", component: "FutureRoomTemplates", title: "Vorlagen" },
    { path: "futureroom/website-leads", component: "FutureRoomWebLeads", title: "Website-Leads" },
    { path: "futureroom/contracts", component: "FutureRoomContracts", title: "Contracts" },
    // Agents — ENTFERNT (kein eigenständiges Desk, Armstrong übernimmt KI-Governance)
    // Acquiary (Akquise Governance) — 6-Tab Structure
    { path: "acquiary", component: "AcquiaryDashboard", title: "Acquiary" },
    { path: "acquiary/kontakte", component: "AcquiaryKontakte", title: "Kontakte" },
    { path: "acquiary/datenbank", component: "AcquiaryDatenbank", title: "Datenbank" },
    { path: "acquiary/mandate", component: "AcquiaryMandates", title: "Mandate" },
    { path: "acquiary/needs-routing", component: "AcquiaryNeedsRouting", title: "Routing" },
    { path: "acquiary/monitor", component: "AcquiaryMonitor", title: "Monitor" },
    // Legacy Acquiary routes (kept for backward compatibility)
    { path: "acquiary/inbox", component: "AcquiaryInbox", title: "Inbox" },
    { path: "acquiary/assignments", component: "AcquiaryAssignments", title: "Zuweisungen" },
    { path: "acquiary/audit", component: "AcquiaryAudit", title: "Audit" },
    // Sales Desk (MOD-09 Vertriebsmanager) — 6-Tab Structure
    { path: "sales-desk", component: "SalesDeskDashboard", title: "Sales Desk" },
    { path: "sales-desk/kontakte", component: "SalesDeskKontakte", title: "Kontakte" },
    { path: "sales-desk/veroeffentlichungen", component: "SalesDeskPublishing", title: "Veröffentlichungen" },
    { path: "sales-desk/inbox", component: "SalesDeskInbox", title: "Inbox" },
    { path: "sales-desk/partner", component: "SalesDeskPartner", title: "Partner" },
    { path: "sales-desk/audit", component: "SalesDeskAudit", title: "Audit" },
    // Lead Desk (MOD-10 Leadmanager) — 3-Tab Structure (Website Leads + Kampagnen + Brand-Templates)
    { path: "lead-desk", component: "LeadDeskRouter", title: "Lead Desk" },
    { path: "lead-desk/kampagnen", component: "LeadKampagnenDesk", title: "Kampagnen" },
    { path: "lead-desk/templates", component: "LeadBrandTemplates", title: "Brand-Templates" },
    // Projekt Desk (MOD-13 Projektmanager) — 4-Tab Structure
    { path: "projekt-desk", component: "ProjektDeskDashboard", title: "Projekt Desk" },
    { path: "projekt-desk/projekte", component: "ProjektDeskProjekte", title: "Projekte" },
    { path: "projekt-desk/listings", component: "ProjektDeskListings", title: "Listings" },
    { path: "projekt-desk/landing-pages", component: "ProjektDeskLandingPages", title: "Landing Pages" },
    // Pet Desk (MOD-05 + MOD-22) — 6-Tab Structure
    { path: "pet-desk", component: "PetDeskRouter", title: "Pet Desk" },
    { path: "pet-desk/kontakte", component: "PetDeskKontakte", title: "Kontakte" },
    { path: "pet-desk/vorgaenge", component: "PetDeskVorgaenge", title: "Vorgänge" },
    { path: "pet-desk/kunden", component: "PetDeskKunden", title: "Kunden" },
    { path: "pet-desk/shop", component: "PetDeskShop", title: "Shop" },
    { path: "pet-desk/billing", component: "PetDeskBilling", title: "Abrechnung" },
    // Finance Desk (MOD-18) — 5-Tab Structure
    { path: "finance-desk", component: "FinanceDeskRouter", title: "Finance Desk" },
    { path: "finance-desk/kontakte", component: "FinanceDeskKontakte", title: "Kontakte" },
    { path: "finance-desk/inbox", component: "FinanceDeskInboxPage", title: "Inbox" },
    { path: "finance-desk/faelle", component: "FinanceDeskFaellePage", title: "Fälle" },
    { path: "finance-desk/monitor", component: "FinanceDeskMonitorPage", title: "Monitor" },
    // =========================================================================
    // ARMSTRONG CONSOLE — KI-Assistent Governance (Config only, no chat)
    // =========================================================================
    { path: "armstrong", component: "ArmstrongDashboard", title: "Armstrong Console" },
    { path: "armstrong/actions", component: "ArmstrongActions", title: "Actions-Katalog" },
    { path: "armstrong/logs", component: "ArmstrongLogs", title: "Action Logs" },
    { path: "armstrong/billing", component: "ArmstrongBilling", title: "Billing" },
    { path: "armstrong/knowledge", component: "ArmstrongKnowledge", title: "Knowledge Base" },
    { path: "armstrong/policies", component: "ArmstrongPolicies", title: "Policies" },
    { path: "armstrong/test", component: "ArmstrongTestHarness", title: "Test Harness" },
    { path: "armstrong/integrations", component: "ArmstrongIntegrations", title: "Widget-Integrationen" },
    { path: "armstrong/engines", component: "ArmstrongEngines", title: "Engine Registry" },
    { path: "armstrong/golden-paths", component: "ArmstrongGoldenPaths", title: "Golden Path Registry" },
    { path: "armstrong/costs", component: "PlatformCostMonitor", title: "Plattform-Kostenmonitor" },
    { path: "armstrong/health", component: "PlatformHealth", title: "Platform Health Monitor" },
    { path: "armstrong/review", component: "WeeklyReview", title: "Wöchentliches Review" },
    // Fortbildung Management
    { path: "fortbildung", component: "AdminFortbildung", title: "Fortbildung" },
    // Service Desk (MOD-16, MOD-15, MOD-17, MOD-19, MOD-05 Shop)
    { path: "service-desk", component: "ServiceDeskRouter", title: "Service Desk" },
    // Ncore Desk — Projekt- & Kooperationsanfragen
    { path: "ncore-desk", component: "NcoreDeskRouter", title: "Ncore Desk" },
    { path: "ncore-desk/kontakte", component: "NcoreDeskKontakte", title: "Kontakte" },
    { path: "ncore-desk/monitor", component: "NcoreDeskMonitor", title: "Monitor" },
    // Otto² Advisory Desk — Finanzierungs- & Beratungsanfragen
    { path: "otto-desk", component: "OttoDeskRouter", title: "Otto² Advisory Desk" },
    { path: "otto-desk/kontakte", component: "OttoDeskKontakte", title: "Kontakte" },
    { path: "otto-desk/inbox", component: "OttoDeskInbox", title: "Inbox" },
    { path: "otto-desk/monitor", component: "OttoDeskMonitor", title: "Monitor" },
    // CommPro Desk — Telefonassistenten für alle Marken (Premium/ElevenLabs)
    { path: "commpro-desk", component: "CommProDeskRouter", title: "CommPro Desk" },
    // Compliance Desk — Legal Engine SSOT (8 internal tabs)
    { path: "compliance", component: "ComplianceDeskRouter", title: "Compliance Desk" },
  ],
};

// =============================================================================
// ZONE 2: USER PORTAL — 22 MODULE ARCHITECTURE (MOD-00 to MOD-20 + MOD-22)
// =============================================================================
export const zone2Portal: ZoneDefinition = {
  base: "/portal",
  layout: "PortalLayout",
  dashboard: { path: "", component: "PortalDashboard", title: "Portal Home" },
  modules: {
    "MOD-00": {
      name: "Dashboard",
      base: "dashboard",
      icon: "LayoutDashboard",
      display_order: 0,
      visibility: { default: true, org_types: ["client", "partner", "subpartner"] },
      tiles: [],
    },
    "MOD-01": {
      name: "Stammdaten",
      base: "stammdaten",
      icon: "Users",
      display_order: 1,
      visibility: { default: true, org_types: ["client", "partner", "subpartner"] },
      tiles: [
        { path: "profil", component: "ProfilTab", title: "Profil" },
        { path: "vertraege", component: "VertraegeTab", title: "Verträge" },
        { path: "abrechnung", component: "AbrechnungTab", title: "Abrechnung" },
        { path: "sicherheit", component: "SicherheitTab", title: "Sicherheit" },
        { path: "rechtliches", component: "RechtlichesTab", title: "Rechtliches" },
      ],
    },
    "MOD-02": {
      name: "KI Office",
      base: "office",
      icon: "Sparkles",
      display_order: 2,
      visibility: { default: true, org_types: ["client", "partner"] },
      tiles: [
        { path: "email", component: "EmailTab", title: "E-Mail" },
        { path: "brief", component: "BriefTab", title: "Brief" },
        { path: "kontakte", component: "KontakteTab", title: "Kontakte" },
        { path: "kalender", component: "KalenderTab", title: "Kalender" },
        { path: "widgets", component: "WidgetsTab", title: "Widgets" },
        { path: "whatsapp", component: "WhatsAppTab", title: "WhatsApp" },
        { path: "videocalls", component: "VideocallsTab", title: "Videocalls" },
      ],
      dynamic_routes: [
        { path: "videocalls/:callId", component: "VideocallRoom", title: "Videocall", dynamic: true },
      ],
    },
    "MOD-03": {
      name: "DMS",
      base: "dms",
      icon: "FolderOpen",
      display_order: 3,
      visibility: { default: true, org_types: ["client", "partner"] },
      tiles: [
        { path: "intelligenz", component: "EinstellungenTab", title: "Intelligenz", default: true },
        { path: "storage", component: "StorageTab", title: "Dateien" },
        { path: "posteingang", component: "PosteingangTab", title: "Posteingang" },
        { path: "sortieren", component: "SortierenTab", title: "Sortieren" },
        { path: "intake", component: "IntakeTab", title: "Magic Intake" },
      ],
    },
    "MOD-04": {
      name: "Immobilien",
      base: "immobilien",
      icon: "Building2",
      display_order: 4,
      visibility: { default: true, org_types: ["client"] },
      tiles: [
        // ZUHAUSE: MOD-20 (Miety) inline gerendert innerhalb MOD-04
        { path: "zuhause", component: "MietyInline", title: "HOME", default: true },
        { path: "portfolio", component: "PortfolioTab", title: "Portfolio" },
        // Tax: Vermietung + Verwaltung — Anlage V Steuererklärung
        { path: "verwaltung", component: "VerwaltungTab", title: "Steuer" },
        { path: "sanierung", component: "SanierungTab", title: "Sanierung" },
        // Bewertung entfernt — jetzt als Tab in der Immobilienakte (PropertyDetailPage)
      ],
      dynamic_routes: [
        // Create flow: Modal in PortfolioTab, redirect to dossier after creation
        { path: "neu", component: "CreatePropertyRedirect", title: "Neue Immobilie", dynamic: false },
        // Canonical dossier route (SSOT)
        { path: ":id", component: "PropertyDetail", title: "Immobilienakte", dynamic: true, goldenPath: { moduleCode: 'MOD-04', entityIdParam: 'id' } },
        // Rental expose detail (moved from MOD-05)
        { path: "vermietung/:id", component: "RentalExposeDetail", title: "Miet-Exposé", dynamic: true },
      ],
    },
    "MOD-05": {
      name: "Pets",
      base: "pets",
      icon: "PawPrint",
      display_order: 5,
      visibility: { default: false, org_types: ["client"], requires_activation: true },
      tiles: [
        { path: "meine-tiere", component: "PetsMeineTiere", title: "Meine Tiere", default: true },
        { path: "caring", component: "PetsCaring", title: "Caring" },
        { path: "shop", component: "PetsShop", title: "Shop" },
        { path: "mein-bereich", component: "PetsMeinBereich", title: "Mein Bereich" },
      ],
      dynamic_routes: [
        { path: ":petId", component: "PetDetailPage", title: "Tierakte", dynamic: true },
      ],
    },
    "MOD-06": {
      name: "Verkauf",
      base: "verkauf",
      icon: "Tag",
      display_order: 6,
      visibility: { default: false, org_types: ["client"], requires_activation: true },
      tiles: [
        { path: "objekte", component: "ObjekteTab", title: "Objekte" },
        { path: "anfragen", component: "AnfragenTab", title: "Anfragen" },
        { path: "vorgaenge", component: "VorgaengeTab", title: "Vorgänge" },
        { path: "reporting", component: "ReportingTab", title: "Reporting" },
      ],
      dynamic_routes: [
        { path: "expose/:unitId", component: "ExposeDetail", title: "Verkaufs-Exposé", dynamic: true },
      ],
    },
    // =========================================================================
    // MOD-07: FINANZIERUNG — Customer Finance Preparation
    // SoT UNTIL Submit → then Zone 1 FutureRoom takes over
    // =========================================================================
    "MOD-07": {
      name: "Finanzierung",
      base: "finanzierung",
      icon: "Landmark",
      display_order: 7,
      visibility: { default: true, org_types: ["client"] },
      tiles: [
        { path: "selbstauskunft", component: "SelbstauskunftTab", title: "Selbstauskunft", default: true },
        { path: "dokumente", component: "DokumenteTab", title: "Dokumente" },
        { path: "anfrage", component: "AnfrageTab", title: "Anfrage" },
        { path: "status", component: "StatusTab", title: "Status" },
        { path: "privatkredit", component: "PrivatkreditTab", title: "Privatkredit" },
      ],
      dynamic_routes: [
        { path: "anfrage/:requestId", component: "AnfrageDetailPage", title: "Anfrage-Details", dynamic: true, goldenPath: { moduleCode: 'MOD-07', entityIdParam: 'requestId' } },
      ],
    },
    // =========================================================================
    // MOD-08: Investment-Suche
    // =========================================================================
    "MOD-08": {
      name: "Investment-Suche",
      base: "investments",
      icon: "Search",
      display_order: 8,
      visibility: { default: true, org_types: ["client"] },
      tiles: [
        { path: "suche", component: "SucheTab", title: "Suche" },
        { path: "favoriten", component: "FavoritenTab", title: "Favoriten" },
        { path: "mandat", component: "MandatTab", title: "Mandat" },
        { path: "simulation", component: "SimulationTab", title: "Simulation" },
      ],
      // NOTE: MOD-08 dynamic routes are handled internally by InvestmentsPage.tsx
      // (own <Routes> block), NOT via portalDynamicComponentMap. Listed here for manifest completeness.
      dynamic_routes: [
        { path: "mandat/neu", component: "MandatCreateWizard", title: "Neues Mandat" },
        { path: "mandat/:mandateId", component: "MandatDetail", title: "Mandat-Details", dynamic: true },
        { path: "objekt/:publicId", component: "InvestmentExposePage", title: "Investment-Exposé", dynamic: true },
      ],
    },
    "MOD-09": {
      name: "Immomanager",
      base: "vertriebspartner",
      icon: "Handshake",
      display_order: 9,
      visibility: { default: false, org_types: ["partner", "subpartner"], requires_activation: true },
      tiles: [
        { path: "katalog", component: "KatalogTab", title: "Katalog" },
        { path: "beratung", component: "BeratungTab", title: "Beratung" },
        { path: "kunden", component: "KundenTab", title: "Kunden" },
        { path: "network", component: "NetworkTab", title: "Netzwerk" },
        { path: "systemgebuehr", component: "ImmoSystemgebuehr", title: "Provisionen" },
      ],
      dynamic_routes: [
        { path: "katalog/:publicId", component: "KatalogDetailPage", title: "Katalog-Detail", dynamic: true },
        { path: "beratung/objekt/:publicId", component: "PartnerExposePage", title: "Partner-Exposé", dynamic: true },
      ],
    },
    "MOD-10": {
      name: "Lead Manager",
      base: "lead-manager",
      icon: "Megaphone",
      display_order: 10,
      visibility: { default: false, org_types: ["partner"], requires_activation: true },
      tiles: [
        { path: "kampagnen", component: "LeadManagerKampagnen", title: "Kampagnen", default: true },
        { path: "kaufy", component: "LeadManagerBrand", title: "Kaufy" },
        { path: "futureroom", component: "LeadManagerBrand", title: "FutureRoom" },
        { path: "acquiary", component: "LeadManagerBrand", title: "Acquiary" },
        { path: "projekte", component: "LeadManagerProjekte", title: "Projekte" },
      ],
      deprecated_routes: [
        { path: "inline", reason: "Replaced by 5-tile architecture", remove_in: "3.0.0" },
        { path: "uebersicht", reason: "Consolidated into kampagnen", remove_in: "3.0.0" },
        { path: "studio", reason: "Consolidated into brand tiles", remove_in: "3.0.0" },
        { path: "leads", reason: "Consolidated into kampagnen", remove_in: "3.0.0" },
      ],
    },
    // =========================================================================
    // MOD-11: FINANZIERUNGSMANAGER — Finance Manager Workbench
    // Operational SoT AFTER acceptance/assignment from Zone 1
    // Role-gated: requires finance_manager
    // =========================================================================
    "MOD-11": {
      name: "Finanzierungsmanager",
      base: "finanzierungsmanager",
      icon: "Landmark",
      display_order: 11,
      visibility: { default: false, org_types: ["partner"], requires_role: ["finance_manager"] },
      tiles: [
        { path: "dashboard", component: "FMDashboard", title: "Dashboard", default: true },
        { path: "finanzierungsakte", component: "FMFinanzierungsakte", title: "Finanzierungsakte" },
        { path: "einreichung", component: "FMEinreichung", title: "Einreichung" },
        { path: "provisionen", component: "FMProvisionen", title: "Provisionen" },
        { path: "archiv", component: "FMArchiv", title: "Archiv" },
      ],
      dynamic_routes: [
        { path: "einreichung/:requestId", component: "FMEinreichungDetail", title: "Einreichung Detail", dynamic: true },
        { path: "faelle/:requestId", component: "FMFallDetail", title: "Finanzierungsakte", dynamic: true },
        { path: "uebersicht", component: "FMUebersichtTab", title: "Übersicht" },
        { path: "investment", component: "FMInvestmentTab", title: "Investment" },
        { path: "sachversicherungen", component: "FMSachversicherungenTab", title: "Versicherungen" },
        { path: "vorsorge", component: "FMVorsorgeTab", title: "Vorsorge" },
        { path: "abonnements", component: "FMAbonnementsTab", title: "Abos" },
      ],
    },
    // =========================================================================
    // NEW MODULES (MOD-12 to MOD-20)
    // =========================================================================
    "MOD-12": {
      name: "Akquisemanager",
      base: "akquise-manager",
      icon: "Briefcase",
      display_order: 12,
      visibility: { default: false, org_types: ["partner"], requires_activation: true, requires_role: ["akquise_manager"] },
      tiles: [
        { path: "dashboard", component: "AkquiseDashboard", title: "Dashboard", default: true },
        { path: "mandate", component: "AkquiseMandate", title: "Mandate" },
        { path: "objekteingang", component: "AkquiseObjekteingang", title: "Objekteingang" },
        { path: "datenbank", component: "AkquiseDatenbank", title: "Datenbank" },
        { path: "tools", component: "AkquiseTools", title: "Tools" },
        { path: "systemgebuehr", component: "AkquiseSystemgebuehr", title: "Provisionen" },
      ],
      dynamic_routes: [
        { path: "mandate/neu", component: "MandatCreateWizardManager", title: "Neues Mandat" },
        { path: "mandate/:mandateId", component: "AkquiseMandateDetail", title: "Mandat-Workbench", dynamic: true, goldenPath: { moduleCode: 'MOD-12', entityIdParam: 'mandateId' } },
        { path: "objekteingang/:offerId", component: "ObjekteingangDetail", title: "Objekteingang Detail", dynamic: true, goldenPath: { moduleCode: 'MOD-12', entityIdParam: 'offerId' } },
      ],
    },
    "MOD-13": {
      name: "Projektmanager",
      base: "projekte",
      icon: "FolderKanban",
      display_order: 13,
      visibility: { default: false, org_types: ["partner"], requires_activation: true },
      tiles: [
        { path: "dashboard", component: "ProjekteDashboard", title: "Dashboard", default: true },
        { path: "projekte", component: "PortfolioTab", title: "Projekte" },
        { path: "invest-engine", component: "InvestEngineTab", title: "InvestEngine" },
        { path: "vertrieb", component: "VertriebTab", title: "Vertrieb" },
        { path: "landing-page", component: "LandingPageTab", title: "Landing Page" },
        { path: "lead-manager", component: "ProjekteLeadManager", title: "Lead Manager" },
      ],
      dynamic_routes: [
        { path: ":projectId", component: "ProjectDetailPage", title: "Projektakte", dynamic: true, goldenPath: { moduleCode: 'MOD-13', entityIdParam: 'projectId' } },
        { path: ":projectId/einheit/:unitId", component: "UnitDetailPage", title: "Einheitenakte", dynamic: true },
        { path: "invest-engine/:unitId", component: "InvestEngineExposePage", title: "Investment-Analyse", dynamic: true },
      ],
    },
    "MOD-14": {
      name: "Communication Pro",
      base: "communication-pro",
      icon: "Mail",
      display_order: 14,
      visibility: { default: false, org_types: ["partner"], requires_activation: true },
      tiles: [
        { path: "serien-emails", component: "CommProSerienEmails", title: "Serien-E-Mails" },
        { path: "recherche", component: "CommProRecherche", title: "Recherche" },
        { path: "social", component: "CommProSocial", title: "Social" },
        { path: "ki-telefon", component: "CommProKiTelefon", title: "KI-Telefonassistent" },
      ],
    },
    "MOD-15": {
      name: "Fortbildung",
      base: "fortbildung",
      icon: "GraduationCap",
      display_order: 15,
      visibility: { default: true, org_types: ["partner", "subpartner"] },
      tiles: [
        { path: "buecher", component: "FortbildungBuecher", title: "Bücher" },
        { path: "fortbildungen", component: "FortbildungFortbildungen", title: "Fortbildungen" },
        { path: "vortraege", component: "FortbildungVortraege", title: "Vorträge" },
        { path: "kurse", component: "FortbildungKurse", title: "Kurse" },
      ],
    },
    "MOD-16": {
      name: "Shop",
      base: "services",
      icon: "ShoppingCart",
      display_order: 16,
      visibility: { default: true, org_types: ["client", "partner"] },
      tiles: [
        { path: "amazon", component: "ShopsAmazon", title: "Amazon Business" },
        { path: "bueroshop24", component: "ShopsBueroshop24", title: "Büroshop24" },
        { path: "miete24", component: "ShopsMiete24", title: "Miete24" },
        { path: "smart-home", component: "ShopsSmartHome", title: "Smart Home" },
        { path: "bestellungen", component: "ShopsBestellungen", title: "Bestellungen" },
      ],
    },
    "MOD-17": {
      name: "Car-Management",
      base: "cars",
      icon: "Car",
      display_order: 17,
      visibility: { default: false, org_types: ["partner"], requires_activation: true },
      tiles: [
        { path: "fahrzeuge", component: "CarsFahrzeuge", title: "Fahrzeuge" },
        { path: "boote", component: "CarsBoote", title: "Boote" },
        { path: "privatjet", component: "CarsPrivatjet", title: "Privatjet" },
        { path: "angebote", component: "CarsAngebote", title: "Angebote" },
      ],
    },
    "MOD-18": {
      name: "Finanzen",
      base: "finanzanalyse",
      icon: "LineChart",
      display_order: 18,
      visibility: { default: true, org_types: ["client"] },
      tiles: [
        { path: "dashboard", component: "FinanzenUebersicht", title: "Übersicht", default: true },
        { path: "konten", component: "FinanzenKonten", title: "Konten" },
        { path: "investment", component: "FinanzenInvestment", title: "Investment" },
        { path: "kv", component: "FinanzenKrankenversicherung", title: "Krankenversicherung" },
        { path: "sachversicherungen", component: "FinanzenSachversicherungen", title: "Versicherungen" },
        { path: "vorsorge", component: "FinanzenVorsorge", title: "Vorsorge" },
        { path: "darlehen", component: "FinanzenDarlehen", title: "Darlehen" },
        { path: "abonnements", component: "FinanzenAbonnements", title: "Abonnements" },
        { path: "vorsorgedokumente", component: "FinanzenVorsorgedokumente", title: "Testament & Vollmacht" },
      ],
    },
    "MOD-19": {
      name: "Photovoltaik",
      base: "photovoltaik",
      icon: "Sun",
      display_order: 19,
      visibility: { default: true, org_types: ["client"] },
      tiles: [
        { path: "anlagen", component: "PVAnlagen", title: "Anlagen", default: true },
        { path: "enpal", component: "PVEnpal", title: "Enpal" },
        { path: "dokumente", component: "PVDokumente", title: "Dokumente" },
        { path: "einstellungen", component: "PVEinstellungen", title: "Einstellungen" },
      ],
      dynamic_routes: [
        { path: "neu", component: "PVCreateWizard", title: "Neue PV-Anlage" },
        { path: ":pvPlantId", component: "PVPlantDetail", title: "PV-Akte", dynamic: true, goldenPath: { moduleCode: 'MOD-19', entityIdParam: 'pvPlantId' } },
      ],
    },
    "MOD-20": {
      name: "Miety",
      base: "miety",
      icon: "Home",
      display_order: 20,
      visibility: { default: false, org_types: ["client"], requires_activation: true },
      tiles: [
        // 4 tiles (Versicherungen → MOD-18 Finanzen)
        { path: "uebersicht", component: "MietyUebersicht", title: "Übersicht" },
        { path: "versorgung", component: "MietyVersorgung", title: "Versorgung" },
        { path: "smarthome", component: "MietySmartHome", title: "Smart Home" },
        { path: "kommunikation", component: "MietyKommunikation", title: "Kommunikation" },
      ],
      dynamic_routes: [
        { path: "zuhause/:homeId", component: "MietyHomeDossier", title: "Home-Akte", dynamic: true },
      ],
    },
    // =========================================================================
    // MOD-21: KI-BROWSER — AI-powered web research (Superuser only)
    // Deactivated for regular users, available via tile activation
    // =========================================================================
    "MOD-21": {
      name: "KI-Browser",
      base: "ki-browser",
      icon: "Globe",
      display_order: 21,
      visibility: { default: false, org_types: ["partner"], requires_activation: true },
      tiles: [
        { path: "uebersicht", component: "KiBrowserUebersicht", title: "Übersicht", default: true },
        { path: "session", component: "KiBrowserSession", title: "Session" },
        { path: "quellen", component: "KiBrowserQuellen", title: "Quellen" },
        { path: "vorlagen", component: "KiBrowserVorlagen", title: "Vorlagen" },
        { path: "policies", component: "KiBrowserPolicies", title: "Policies" },
      ],
    },
    // =========================================================================
    // MOD-22: PET MANAGER — Franchise-Partner Portal
    // =========================================================================
    "MOD-22": {
      name: "Pet Manager",
      base: "petmanager",
      icon: "PawPrint",
      display_order: 22,
      visibility: { default: false, org_types: ["client"], requires_activation: true },
      tiles: [
        { path: "dashboard", component: "PMDashboard", title: "Dashboard", default: true },
        { path: "profil", component: "PMProfil", title: "Profil" },
        { path: "pension", component: "PMPension", title: "Pension" },
        { path: "services", component: "PMServices", title: "Services" },
        { path: "mitarbeiter", component: "PMPersonal", title: "Mitarbeiter" },
        { path: "kunden", component: "PMKunden", title: "Kunden" },
        { path: "finanzen", component: "PMFinanzen", title: "Finanzen" },
      ],
      dynamic_routes: [],
    },
  },
};

// =============================================================================
// ZONE 3: WEBSITES
// =============================================================================
export const zone3Websites: Record<string, WebsiteDefinition> = {
  kaufy: {
    base: "/website/kaufy",
    layout: "Kaufy2026Layout",
    routes: [
      { path: "", component: "Kaufy2026Home", title: "KAUFY Home" },
      { path: "vermieter", component: "Kaufy2026Vermieter", title: "Für Vermieter" },
      { path: "verkaeufer", component: "Kaufy2026Verkaeufer", title: "Für Verkäufer" },
      { path: "vertrieb", component: "Kaufy2026Vertrieb", title: "Für Partner" },
      { path: "immobilien/:publicId", component: "Kaufy2026Expose", title: "Exposé", dynamic: true },
      { path: "kontakt", component: "Kaufy2026Kontakt", title: "Kontakt" },
      { path: "faq", component: "Kaufy2026FAQ", title: "FAQ" },
      { path: "impressum", component: "Kaufy2026Impressum", title: "Impressum" },
      { path: "datenschutz", component: "Kaufy2026Datenschutz", title: "Datenschutz" },
      { path: "ratgeber", component: "KaufyRatgeber", title: "Ratgeber — KAUFY" },
      { path: "ratgeber/:slug", component: "KaufyRatgeberArticle", title: "Ratgeber Artikel", dynamic: true },
    ],
  },
  futureroom: {
    base: "/website/futureroom",
    layout: "FutureRoomLayout",
    routes: [
      { path: "", component: "FutureRoomHome", title: "Future Room" },
      { path: "bonitat", component: "FutureRoomBonitat", title: "Bonität" },
      { path: "karriere", component: "FutureRoomKarriere", title: "Karriere" },
      { path: "faq", component: "FutureRoomFAQ", title: "FAQ" },
      { path: "login", component: "FutureRoomLogin", title: "Login" },
      { path: "akte", component: "FutureRoomAkte", title: "Meine Akte" },
      { path: "kontakt", component: "FutureRoomKontakt", title: "Kontakt" },
      { path: "impressum", component: "FutureRoomImpressum", title: "Impressum" },
      { path: "datenschutz", component: "FutureRoomDatenschutz", title: "Datenschutz" },
      { path: "ratgeber", component: "FutureRoomRatgeber", title: "Ratgeber — Future Room" },
      { path: "ratgeber/:slug", component: "FutureRoomRatgeberArticle", title: "Ratgeber Artikel", dynamic: true },
    ],
  },
  sot: {
    base: "/website/sot",
    layout: "SotLayout",
    routes: [
      { path: "", component: "SotHome", title: "System of a Town — Struktur und KI für Ihren Haushalt" },
      { path: "plattform", component: "SotPlattform", title: "Plattform" },
      { path: "intelligenz", component: "SotIntelligenz", title: "Armstrong Intelligence" },
      { path: "module", component: "SotModule", title: "Module" },
      { path: "preise", component: "SotPreise", title: "Preise" },
      { path: "demo", component: "SotDemo", title: "Demo" },
      { path: "karriere", component: "SotKarriere", title: "Karriere" },
      { path: "faq", component: "SotFAQ", title: "FAQ" },
      { path: "impressum", component: "SotImpressum", title: "Impressum" },
      { path: "datenschutz", component: "SotDatenschutz", title: "Datenschutz" },
      // Solution Landing Pages (SEO Hub)
      { path: "loesungen/mietsonderverwaltung", component: "SotMietsonderverwaltung", title: "Digitale Mietsonderverwaltung" },
      { path: "loesungen/immobilienverwaltung", component: "SotImmobilienverwaltung", title: "Digitale Immobilienverwaltung" },
      { path: "loesungen/finanzdienstleistungen", component: "SotFinanzdienstleistungen", title: "Finanzdienstleistungen" },
      // Ratgeber (Supporting Content Cluster)
      { path: "ratgeber/mietsonderverwaltung-vs-weg", component: "RatgeberMsvVsWeg", title: "MSV vs. WEG-Verwaltung" },
      { path: "ratgeber/nebenkostenabrechnung-vermieter", component: "RatgeberNebenkostenabrechnung", title: "Nebenkostenabrechnung Ratgeber" },
      { path: "ratgeber/hausverwaltung-wechseln", component: "RatgeberImmobilienverwalterWechseln", title: "Hausverwaltung wechseln" },
      { path: "ratgeber/immobilien-portfolioanalyse", component: "RatgeberPortfolioAnalyse", title: "Portfolioanalyse Ratgeber" },
      { path: "ratgeber/immobilienfinanzierung-kapitalanleger", component: "RatgeberImmobilienfinanzierung", title: "Immobilienfinanzierung Ratgeber" },
      { path: "ratgeber/renditeberechnung-immobilien", component: "RatgeberRenditeberechnung", title: "Renditeberechnung Ratgeber" },
      // Legacy redirects handled via component redirects
      { path: "real-estate", component: "SotPlattform", title: "Plattform" },
      { path: "finance", component: "SotPlattform", title: "Plattform" },
      { path: "management", component: "SotPlattform", title: "Plattform" },
      { path: "energy", component: "SotPlattform", title: "Plattform" },
      { path: "armstrong", component: "SotIntelligenz", title: "Armstrong Intelligence" },
      { path: "capital", component: "SotPlattform", title: "Plattform" },
    ],
  },
  acquiary: {
    base: "/website/acquiary",
    layout: "AcquiaryLayout",
    routes: [
      { path: "", component: "AcquiaryHome", title: "ACQUIARY" },
      { path: "methodik", component: "AcquiaryMethodik", title: "Methodik" },
      { path: "netzwerk", component: "AcquiaryNetzwerk", title: "Netzwerk" },
      { path: "karriere", component: "AcquiaryKarriere", title: "Karriere" },
      { path: "objekt", component: "AcquiaryObjekt", title: "Objekt anbieten" },
      { path: "kontakt", component: "AcquiaryKontakt", title: "Kontakt" },
      { path: "faq", component: "AcquiaryFAQ", title: "FAQ" },
      { path: "impressum", component: "AcquiaryImpressum", title: "Impressum" },
      { path: "datenschutz", component: "AcquiaryDatenschutz", title: "Datenschutz" },
      { path: "ratgeber", component: "AcquiaryRatgeber", title: "Ratgeber — ACQUIARY" },
      { path: "ratgeber/:slug", component: "AcquiaryRatgeberArticle", title: "Ratgeber Artikel", dynamic: true },
    ],
  },
  lennox: {
    base: "/website/tierservice",
    layout: "LennoxLayout",
    routes: [
      { path: "", component: "LennoxStartseite", title: "Lennox & Friends — Dog Resorts" },
      { path: "partner/:slug", component: "LennoxPartnerProfil", title: "Partner-Profil", dynamic: true },
      { path: "shop", component: "LennoxShop", title: "Lennox Shop" },
      { path: "partner-werden", component: "LennoxPartnerWerden", title: "Partner werden" },
      { path: "login", component: "LennoxAuth", title: "Anmelden" },
      { path: "mein-bereich", component: "LennoxMeinBereich", title: "Mein Bereich" },
      { path: "kontakt", component: "LennoxKontakt", title: "Kontakt" },
      { path: "faq", component: "LennoxFAQ", title: "FAQ" },
      { path: "impressum", component: "LennoxImpressum", title: "Impressum" },
      { path: "datenschutz", component: "LennoxDatenschutz", title: "Datenschutz" },
      { path: "ratgeber", component: "LennoxRatgeber", title: "Ratgeber — Lennox & Friends" },
      { path: "ratgeber/:slug", component: "LennoxRatgeberArticle", title: "Ratgeber Artikel", dynamic: true },
    ],
  },
  // =========================================================================
  // PROJECT LANDING PAGES — Dynamic per-project websites
  // =========================================================================
  'project-landing': {
    base: "/website/projekt",
    layout: "ProjectLandingLayout",
    routes: [
      { path: ":slug", component: "ProjectLandingHome", title: "Projekt", dynamic: true },
      { path: ":slug/objekt", component: "ProjectLandingObjekt", title: "Objekt", dynamic: true },
      { path: ":slug/beratung", component: "ProjectLandingBeratung", title: "Beratung", dynamic: true },
      { path: ":slug/einheit/:unitId", component: "ProjectLandingExpose", title: "Exposé", dynamic: true },
      { path: ":slug/impressum", component: "ProjectLandingImpressum", title: "Impressum", dynamic: true },
      { path: ":slug/datenschutz", component: "ProjectLandingDatenschutz", title: "Datenschutz", dynamic: true },
    ],
  },
  // =========================================================================
  // NCORE BUSINESS CONSULTING — Beratung, Digitalisierung, Stiftungen
  // =========================================================================
  ncore: {
    base: "/website/ncore",
    layout: "NcoreLayout",
    routes: [
      { path: "", component: "NcoreHome", title: "Ncore Business Consulting — Connecting Dots. Connecting People." },
      { path: "digitalisierung", component: "NcoreDigitalisierung", title: "Digitalisierung & KI für KMU — Ncore Business Consulting" },
      { path: "stiftungen", component: "NcoreStiftungen", title: "Stiftungen & Vermögensschutz — Ncore Business Consulting" },
      { path: "geschaeftsmodelle", component: "NcoreGeschaeftsmodelle", title: "Geschäftsmodelle & Vertrieb — Ncore Business Consulting" },
      { path: "netzwerk", component: "NcoreNetzwerk", title: "Unser Netzwerk — Ncore Business Consulting" },
      { path: "gruender", component: "NcoreGruender", title: "Gründer — Ncore Business Consulting" },
      { path: "kontakt", component: "NcoreKontakt", title: "Kontakt — Ncore Business Consulting" },
      { path: "impressum", component: "NcoreImpressum", title: "Impressum — Ncore Business Consulting" },
      { path: "datenschutz", component: "NcoreDatenschutz", title: "Datenschutz — Ncore Business Consulting" },
      { path: "ratgeber", component: "NcoreRatgeber", title: "Ratgeber — Ncore Business Consulting" },
      { path: "ratgeber/:slug", component: "NcoreRatgeberArticle", title: "Ratgeber Artikel", dynamic: true },
    ],
  },
  // =========================================================================
  // OTTO² ADVISORY — Finanzberatung für Unternehmer & Privathaushalte
  // =========================================================================
  otto: {
    base: "/website/otto-advisory",
    layout: "OttoAdvisoryLayout",
    routes: [
      { path: "", component: "OttoHome", title: "Otto² Advisory — Ganzheitliche Finanzberatung" },
      { path: "unternehmer", component: "OttoUnternehmer", title: "Für Unternehmer — Otto² Advisory" },
      { path: "private-haushalte", component: "OttoPrivateHaushalte", title: "Für Privathaushalte — Otto² Advisory" },
      { path: "finanzierung", component: "OttoFinanzierung", title: "Finanzierung beantragen — Otto² Advisory" },
      { path: "kontakt", component: "OttoKontakt", title: "Kontakt — Otto² Advisory" },
      { path: "faq", component: "OttoFAQ", title: "FAQ — Otto² Advisory" },
      { path: "impressum", component: "OttoImpressum", title: "Impressum — Otto² Advisory" },
      { path: "datenschutz", component: "OttoDatenschutz", title: "Datenschutz — Otto² Advisory" },
      { path: "ratgeber", component: "OttoRatgeber", title: "Ratgeber — Otto² Advisory" },
      { path: "ratgeber/:slug", component: "OttoRatgeberArticle", title: "Ratgeber Artikel", dynamic: true },
    ],
  },
  // =========================================================================
  // ZL WOHNBAU — Wohnraum für Mitarbeiter
  // =========================================================================
  zlwohnbau: {
    base: "/website/zl-wohnbau",
    layout: "ZLWohnbauLayout",
    routes: [
      { path: "", component: "ZLWohnbauHome", title: "ZL Wohnbau — Wohnraum für Mitarbeiter" },
      { path: "leistungen", component: "ZLWohnbauLeistungen", title: "Leistungen — ZL Wohnbau" },
      { path: "portfolio", component: "ZLWohnbauPortfolio", title: "Portfolio — ZL Wohnbau" },
      { path: "kontakt", component: "ZLWohnbauKontakt", title: "Kontakt — ZL Wohnbau" },
      { path: "impressum", component: "ZLWohnbauImpressum", title: "Impressum — ZL Wohnbau" },
      { path: "datenschutz", component: "ZLWohnbauDatenschutz", title: "Datenschutz — ZL Wohnbau" },
    ],
  },
};
// =============================================================================
export const legacyRoutes: LegacyRoute[] = [
  // Legacy Portfolio Routes
  { path: "/portfolio", redirect_to: "/portal/immobilien/portfolio", reason: "Legacy route" },
  { path: "/portfolio/new", redirect_to: "/portal/immobilien/neu", reason: "Legacy route" },
  { path: "/portfolio/:id", redirect_to: "/portal/immobilien/:id", reason: "Legacy route" },
  // Legacy Finanzierung Routes (MOD-07 Restructure)
  { path: "/portal/finanzierung/vorgaenge", redirect_to: "/portal/finanzierung/anfrage", reason: "MOD-07 tile rename" },
  { path: "/portal/finanzierung/readiness", redirect_to: "/portal/finanzierung/selbstauskunft", reason: "MOD-07 tile rename" },
  { path: "/portal/finanzierung/export", redirect_to: "/portal/finanzierung/anfrage", reason: "MOD-07 tile rename" },
  { path: "/portal/finanzierung/partner", redirect_to: "/portal/finanzierung/status", reason: "MOD-07 tile rename" },
  // Legacy Finance Module Routes → NEW MOD-07
  { path: "/portal/finance", redirect_to: "/portal/finanzierung", reason: "Legacy english route" },
  { path: "/portal/finance/*", redirect_to: "/portal/finanzierung", reason: "Legacy english route" },
  { path: "/portal/financing", redirect_to: "/portal/finanzierung", reason: "Legacy english route" },
  { path: "/portal/financing/*", redirect_to: "/portal/finanzierung", reason: "Legacy english route" },
  // Finance Desk is now active again — no legacy redirect needed
  // Legacy MOD-11 Routes
  { path: "/portal/finanzierungsmanager/how-it-works", redirect_to: "/portal/finanzierungsmanager/dashboard", reason: "MOD-11 restructure" },
  { path: "/portal/finanzierungsmanager/selbstauskunft", redirect_to: "/portal/finanzierungsmanager/faelle", reason: "MOD-11 restructure" },
  { path: "/portal/finanzierungsmanager/selbstauskunft/:id", redirect_to: "/portal/finanzierungsmanager/faelle/:id", reason: "MOD-11 restructure" },
  { path: "/portal/finanzierungsmanager/einreichen", redirect_to: "/portal/finanzierungsmanager/faelle", reason: "MOD-11 restructure" },
  { path: "/portal/finanzierungsmanager/einreichen/:id", redirect_to: "/portal/finanzierungsmanager/faelle/:id", reason: "MOD-11 restructure" },
  // ==========================================================================
  // ZBC-R08: Legacy Z3 Root-Pfade → /website/** Migration
  // ==========================================================================
  { path: "/kaufy2026", redirect_to: "/website/kaufy", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/kaufy2026/*", redirect_to: "/website/kaufy", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/futureroom", redirect_to: "/website/futureroom", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/futureroom/*", redirect_to: "/website/futureroom", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/sot", redirect_to: "/website/sot", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/sot/*", redirect_to: "/website/sot", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/acquiary", redirect_to: "/website/acquiary", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/acquiary/*", redirect_to: "/website/acquiary", reason: "ZBC-R08 Z3 prefix migration" },
  // Lennox Website Redesign — Legacy routes
  { path: "/website/tierservice/ueber-uns", redirect_to: "/website/tierservice", reason: "Lennox redesign — page removed" },
  { path: "/website/tierservice/anbieter/:providerId", redirect_to: "/website/tierservice", reason: "Lennox redesign — replaced by /partner/:slug" },
  { path: "/website/tierservice/anbieter/:providerId/buchen", redirect_to: "/website/tierservice", reason: "Lennox redesign — booking inline" },
  { path: "/website/tierservice/profil", redirect_to: "/website/tierservice/mein-bereich", reason: "Lennox redesign — merged into mein-bereich" },
  { path: "/website/tierservice/profil/tiere", redirect_to: "/website/tierservice/mein-bereich", reason: "Lennox redesign — merged into mein-bereich" },
  // Legacy MOD-10 Routes (Provisionen → Lead Manager)
  { path: "/portal/provisionen", redirect_to: "/portal/lead-manager", reason: "MOD-10 rename to Lead Manager" },
  { path: "/portal/provisionen/*", redirect_to: "/portal/lead-manager", reason: "MOD-10 rename to Lead Manager" },
  { path: "/portal/leads", redirect_to: "/portal/lead-manager", reason: "MOD-10 legacy leads path" },
  { path: "/portal/leads/*", redirect_to: "/portal/lead-manager", reason: "MOD-10 legacy leads path" },
  // Legacy MOD-09 Selfie Ads → Lead Manager
  { path: "/portal/vertriebspartner/leads", redirect_to: "/portal/lead-manager/leads", reason: "MOD-09 leads moved to MOD-10" },
  { path: "/portal/vertriebspartner/selfie-ads", redirect_to: "/portal/lead-manager/studio", reason: "Selfie Ads moved to Lead Manager" },
  { path: "/portal/vertriebspartner/selfie-ads-planen", redirect_to: "/portal/lead-manager/studio/planen", reason: "Selfie Ads moved to Lead Manager" },
  { path: "/portal/vertriebspartner/selfie-ads-summary", redirect_to: "/portal/lead-manager/studio/summary", reason: "Selfie Ads moved to Lead Manager" },
  { path: "/portal/vertriebspartner/selfie-ads-kampagnen", redirect_to: "/portal/lead-manager/kampagnen", reason: "Selfie Ads moved to Lead Manager" },
  { path: "/portal/vertriebspartner/selfie-ads-performance", redirect_to: "/portal/lead-manager/kampagnen", reason: "Selfie Ads moved to Lead Manager" },
  { path: "/portal/vertriebspartner/selfie-ads-abrechnung", redirect_to: "/portal/lead-manager/kampagnen", reason: "Selfie Ads moved to Lead Manager" },
];

// =============================================================================
// SPECIAL ROUTES
// =============================================================================
export const specialRoutes: SpecialRoute[] = [
  { path: "/", redirect_to: "/portal" },
  { path: "/auth", component: "Auth", title: "Login / Registrierung", public: true },
  { path: "/auth/reset-password", component: "ResetPassword", title: "Passwort zurücksetzen", public: true },
  { path: "/presentation-sot-k7m3x9p2", component: "PresentationPage", title: "Presentation", hidden: true },
];

// =============================================================================
// HELPER: Get all module codes sorted by display_order
// =============================================================================
export function getModulesSorted(): Array<{ code: string; module: ModuleDefinition }> {
  return Object.entries(zone2Portal.modules || {})
    .map(([code, module]) => ({ code, module }))
    .sort((a, b) => a.module.display_order - b.module.display_order);
}

// =============================================================================
// HELPER: Get full route path for a module tile
// =============================================================================
export function getTileFullPath(moduleBase: string, tilePath: string): string {
  if (tilePath === "") return `/portal/${moduleBase}`;
  return `/portal/${moduleBase}/${tilePath}`;
}
