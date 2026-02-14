/**
 * ROUTES MANIFEST — SINGLE SOURCE OF TRUTH
 * 
 * This TypeScript version is generated from manifests/routes_manifest.yaml
 * ALL routes must be declared here. App.tsx delegates to ManifestRouter.
 * 
 * RULES:
 * 1. No route exists unless declared here
 * 2. 4-Tile-Pattern is mandatory for all modules (except MOD-04: 4 tiles, MOD-05: Website Builder (0 tiles, dynamic routes), MOD-20 Miety: 6 tiles)
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
    { path: "organizations", component: "Organizations", title: "Organisationen" },
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
    // KI Office — Konsolidiert: 3 Menüpunkte
    { path: "ki-office/recherche", component: "AdminRecherche", title: "Recherche" },
    { path: "ki-office/kontakte", component: "AdminKontaktbuch", title: "Kontaktbuch" },
    { path: "ki-office/email", component: "AdminEmailAgent", title: "E-Mail Agent" },
    { path: "tiles", component: "TileCatalog", title: "Tile-Katalog" },
    { path: "integrations", component: "Integrations", title: "Integrationen" },
    { path: "oversight", component: "Oversight", title: "Oversight" },
    { path: "audit", component: "AuditHub", title: "Audit Hub" },
    
    { path: "agreements", component: "Agreements", title: "Vereinbarungen" },
    { path: "inbox", component: "Inbox", title: "Posteingang" },
    { path: "leadpool", component: "LeadPool", title: "Lead Pool" },
    { path: "partner-verification", component: "PartnerVerification", title: "Partner-Verifizierung" },
    { path: "roles", component: "RolesManagement", title: "Rollen & Berechtigungen" },
    { path: "commissions", component: "CommissionApproval", title: "Provisionen" },
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
    // Social Media — ENTFERNT (war 100% Demo-Daten, keine DB-Anbindung)
    // Agents
    { path: "agents", component: "AgentsDashboard", title: "Agents" },
    { path: "agents/catalog", component: "AgentsCatalog", title: "Agenten-Katalog" },
    { path: "agents/instances", component: "AgentsInstances", title: "Agenten-Instanzen" },
    { path: "agents/runs", component: "AgentsRuns", title: "Agent Runs" },
    { path: "agents/policies", component: "AgentsPolicies", title: "Policies" },
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
    // Sales Desk
    { path: "sales-desk", component: "SalesDeskDashboard", title: "Sales Desk" },
    { path: "sales-desk/veroeffentlichungen", component: "SalesDeskPublishing", title: "Veröffentlichungen" },
    { path: "sales-desk/inbox", component: "SalesDeskInbox", title: "Inbox" },
    { path: "sales-desk/partner", component: "SalesDeskPartner", title: "Partner" },
    { path: "sales-desk/audit", component: "SalesDeskAudit", title: "Audit" },
    // Finance Desk removed — legacy route handled via redirects in legacyRedirects[]
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
    // Landing Pages
    { path: "landing-pages", component: "AdminLandingPages", title: "Landing Pages" },
    // Fortbildung Management
    { path: "fortbildung", component: "AdminFortbildung", title: "Fortbildung" },
    // Website Hosting (MOD-05 Zone 1) — konsolidiert auf 1 Route
    { path: "website-hosting", component: "WebHostingDashboard", title: "Website Hosting" },
  ],
};

// =============================================================================
// ZONE 2: USER PORTAL — 21 MODULE ARCHITECTURE (MOD-00 to MOD-20)
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
        { path: "demo-daten", component: "DemoDatenTab", title: "Demo-Daten" },
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
        { path: "storage", component: "StorageTab", title: "Storage" },
        { path: "posteingang", component: "PosteingangTab", title: "Posteingang" },
        { path: "sortieren", component: "SortierenTab", title: "Sortieren" },
        { path: "einstellungen", component: "EinstellungenTab", title: "Einstellungen" },
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
        { path: "zuhause", component: "MietyInline", title: "ZUHAUSE", default: true },
        { path: "portfolio", component: "PortfolioTab", title: "Portfolio" },
        // VERWALTUNG: Konsolidierte Mietverwaltung (ehemals MOD-05 MSV)
        { path: "verwaltung", component: "VerwaltungTab", title: "Verwaltung" },
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
      name: "Website Builder",
      base: "website-builder",
      icon: "Globe",
      display_order: 5,
      visibility: { default: true, org_types: ["client", "partner"] },
      tiles: [],
      dynamic_routes: [
        { path: ":websiteId/editor", component: "WBEditor", title: "Editor", dynamic: true },
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
      name: "Vertriebspartner",
      base: "vertriebspartner",
      icon: "Handshake",
      display_order: 9,
      visibility: { default: false, org_types: ["partner", "subpartner"], requires_activation: true },
      tiles: [
        { path: "katalog", component: "KatalogTab", title: "Katalog" },
        { path: "beratung", component: "BeratungTab", title: "Beratung" },
        { path: "kunden", component: "KundenTab", title: "Kunden" },
        { path: "network", component: "NetworkTab", title: "Netzwerk" },
        { path: "leads", component: "LeadsTab", title: "Leadeingang" },
      ],
      dynamic_routes: [
        { path: "katalog/:publicId", component: "KatalogDetailPage", title: "Katalog-Detail", dynamic: true },
        { path: "beratung/objekt/:publicId", component: "PartnerExposePage", title: "Partner-Exposé", dynamic: true },
        { path: "selfie-ads", component: "SelfieAdsStudio", title: "Selfie Ads Studio" },
        { path: "selfie-ads-planen", component: "SelfieAdsPlanen", title: "Kampagne planen" },
        { path: "selfie-ads-summary", component: "SelfieAdsSummary", title: "Kampagne Zusammenfassung" },
        { path: "selfie-ads-kampagnen", component: "SelfieAdsKampagnen", title: "Kampagnen" },
        { path: "selfie-ads-performance", component: "SelfieAdsPerformance", title: "Performance" },
        { path: "selfie-ads-abrechnung", component: "SelfieAdsAbrechnung", title: "Abrechnung" },
      ],
    },
    "MOD-10": {
      name: "Abrechnung",
      base: "leads",
      icon: "CreditCard",
      display_order: 10,
      visibility: { default: false, org_types: ["partner"], requires_activation: true },
      tiles: [
        { path: "uebersicht", component: "ProvisionenUebersicht", title: "Übersicht" },
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
        { path: "faelle/:requestId", component: "FMFallDetail", title: "Finanzierungsakte", dynamic: true },
        { path: "einreichung/:requestId", component: "FMEinreichungDetail", title: "Einreichung Detail", dynamic: true },
      ],
    },
    // =========================================================================
    // NEW MODULES (MOD-12 to MOD-20)
    // =========================================================================
    "MOD-12": {
      name: "Akquise-Manager",
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
      ],
      dynamic_routes: [
        { path: "mandate/neu", component: "MandatCreateWizardManager", title: "Neues Mandat" },
        { path: "mandate/:mandateId", component: "AkquiseMandateDetail", title: "Mandat-Workbench", dynamic: true, goldenPath: { moduleCode: 'MOD-12', entityIdParam: 'mandateId' } },
        { path: "objekteingang/:offerId", component: "ObjekteingangDetail", title: "Objekteingang Detail", dynamic: true, goldenPath: { moduleCode: 'MOD-12', entityIdParam: 'offerId' } },
      ],
    },
    "MOD-13": {
      name: "Projekte",
      base: "projekte",
      icon: "FolderKanban",
      display_order: 13,
      visibility: { default: true, org_types: ["client", "partner"] },
      tiles: [
        { path: "dashboard", component: "ProjekteDashboard", title: "Dashboard", default: true },
        { path: "projekte", component: "PortfolioTab", title: "Projekte" },
        { path: "vertrieb", component: "VertriebTab", title: "Vertrieb" },
        { path: "landing-page", component: "LandingPageTab", title: "Landing Page" },
      ],
      dynamic_routes: [
        { path: ":projectId", component: "ProjectDetailPage", title: "Projektakte", dynamic: true, goldenPath: { moduleCode: 'MOD-13', entityIdParam: 'projectId' } },
        { path: ":projectId/einheit/:unitId", component: "UnitDetailPage", title: "Einheitenakte", dynamic: true },
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
      name: "Shops",
      base: "services",
      icon: "ShoppingCart",
      display_order: 16,
      visibility: { default: true, org_types: ["client", "partner"] },
      tiles: [
        { path: "amazon", component: "ShopsAmazon", title: "Amazon Business" },
        { path: "otto-office", component: "ShopsOttoOffice", title: "OTTO Office" },
        { path: "miete24", component: "ShopsMiete24", title: "Miete24" },
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
      name: "Finanzanalyse",
      base: "finanzanalyse",
      icon: "LineChart",
      display_order: 18,
      visibility: { default: true, org_types: ["client"] },
      tiles: [
        { path: "dashboard", component: "FinanzanalyseDashboard", title: "Übersicht" },
        { path: "reports", component: "FinanzanalyseReports", title: "Cashflow & Budget" },
        { path: "szenarien", component: "FinanzanalyseSzenarien", title: "Verträge & Fixkosten" },
        { path: "settings", component: "FinanzanalyseSettings", title: "Risiko & Absicherung" },
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
        // 5 tiles (Einstellungen entfernt — APIs in Zone 1 Integration Registry)
        { path: "uebersicht", component: "MietyUebersicht", title: "Übersicht" },
        { path: "versorgung", component: "MietyVersorgung", title: "Versorgung" },
        { path: "versicherungen", component: "MietyVersicherungen", title: "Versicherungen" },
        { path: "smarthome", component: "MietySmartHome", title: "Smart Home" },
        { path: "kommunikation", component: "MietyKommunikation", title: "Kommunikation" },
      ],
      dynamic_routes: [
        { path: "zuhause/:homeId", component: "MietyHomeDossier", title: "Zuhause-Akte", dynamic: true },
      ],
    },
    // MOD-21 entfernt — Website Builder ist jetzt MOD-05
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
    ],
  },
  miety: {
    base: "/website/miety",
    layout: "MietyLayout",
    routes: [
      { path: "", component: "MietyHome", title: "Miety Home" },
      { path: "leistungen", component: "MietyLeistungen", title: "Leistungen" },
      { path: "vermieter", component: "MietyVermieter", title: "Für Vermieter" },
      { path: "app", component: "MietyApp", title: "Mieter-App" },
      { path: "preise", component: "MietyPreise", title: "Preise" },
      { path: "so-funktioniert", component: "MietySoFunktioniert", title: "So funktioniert's" },
      { path: "kontakt", component: "MietyKontakt", title: "Kontakt" },
      { path: "registrieren", component: "MietyRegistrieren", title: "Registrieren" },
      { path: "invite", component: "MietyInvite", title: "Einladung" },
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
    ],
  },
  sot: {
    base: "/website/sot",
    layout: "SotLayout",
    routes: [
      { path: "", component: "SotHome", title: "System of a Town — Marketplace" },
      { path: "real-estate", component: "SotRealEstate", title: "Real Estate" },
      { path: "capital", component: "SotCapital", title: "Capital" },
      { path: "projects", component: "SotProjects", title: "Projects" },
      { path: "management", component: "SotManagement", title: "Management" },
      { path: "energy", component: "SotEnergy", title: "Energy" },
      { path: "karriere", component: "SotKarriere", title: "Karriere" },
      // Legacy routes kept for backward compatibility
      { path: "produkt", component: "SotProdukt", title: "Produkt" },
      { path: "module", component: "SotModule", title: "Module" },
      { path: "module/:moduleId", component: "SotModuleDetail", title: "Modul-Details", dynamic: true },
      { path: "preise", component: "SotPreise", title: "Preise" },
      { path: "demo", component: "SotDemo", title: "Demo" },
      { path: "faq", component: "SotFAQ", title: "FAQ" },
      { path: "use-cases", component: "SotUseCases", title: "Use Cases" },
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
    ],
  },
  projekt: {
    base: "/website/projekt",
    layout: "ProjektLandingLayout",
    routes: [
      { path: ":slug", component: "ProjektLandingPage", title: "Projekt-Website", dynamic: true },
    ],
  },
  sites: {
    base: "/website/sites",
    layout: "TenantSiteLayout",
    routes: [
      { path: ":slug", component: "TenantSiteRenderer", title: "Website", dynamic: true },
    ],
  },
};

// =============================================================================
// LEGACY ROUTES (DEPRECATED)
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
  // Legacy Admin Finance Desk → FutureRoom
  { path: "/admin/finance-desk", redirect_to: "/admin/futureroom", reason: "Consolidated into FutureRoom" },
  { path: "/admin/finance-desk/*", redirect_to: "/admin/futureroom", reason: "Consolidated into FutureRoom" },
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
  { path: "/miety", redirect_to: "/website/miety", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/miety/*", redirect_to: "/website/miety", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/futureroom", redirect_to: "/website/futureroom", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/futureroom/*", redirect_to: "/website/futureroom", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/sot", redirect_to: "/website/sot", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/sot/*", redirect_to: "/website/sot", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/acquiary", redirect_to: "/website/acquiary", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/acquiary/*", redirect_to: "/website/acquiary", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/projekt", redirect_to: "/website/projekt", reason: "ZBC-R08 Z3 prefix migration" },
  { path: "/projekt/*", redirect_to: "/website/projekt", reason: "ZBC-R08 Z3 prefix migration" },
];

// =============================================================================
// SPECIAL ROUTES
// =============================================================================
export const specialRoutes: SpecialRoute[] = [
  { path: "/", redirect_to: "/portal" },
  { path: "/auth", component: "Auth", title: "Login / Registrierung", public: true },
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
