/**
 * OPERATIVE DESK DESIGN MANIFEST V1.0
 * 
 * Standardisiert den Aufbau aller Zone-1 Operative Desks.
 * Jedes Desk folgt derselben visuellen und strukturellen Architektur.
 * 
 * ┌─────────────────────────────────────────────────┐
 * │  DESIGN.HEADER                                  │
 * │  ─ Title (text-2xl font-bold uppercase)         │
 * │  ─ Subtitle (text-muted-foreground text-sm)     │
 * │  ─ MOD-Badge (Badge variant="outline")          │
 * ├─────────────────────────────────────────────────┤
 * │  DESIGN.KPI_GRID                                │
 * │  ─ grid-cols-2 md:grid-cols-4 gap-4             │
 * │  ─ Max 4 KPIs with icon + value + subtitle      │
 * ├─────────────────────────────────────────────────┤
 * │  DESIGN.TABS (optional)                         │
 * │  ─ Router-linked TabsList                       │
 * │  ─ Sub-pages lazy-loaded via React Router       │
 * ├─────────────────────────────────────────────────┤
 * │  DESIGN.CONTENT                                 │
 * │  ─ Card-based sections                          │
 * │  ─ Table components for data grids              │
 * │  ─ EmptyState for zero-data scenarios           │
 * └─────────────────────────────────────────────────┘
 * 
 * ZONE-FLOW RULES:
 * ─────────────────
 * Z3 (Website/Surface) ←→ Z1 (Governance/Backbone) ←→ Z2 (Manager/Client)
 * 
 * NEVER: Z2 → Z3 direct.  ALWAYS: Z2 → Z1 → Z3
 * 
 * DESK REGISTRY:
 * ──────────────
 * | Desk             | Module | Status      | Arch Pattern        |
 * |------------------|--------|-------------|---------------------|
 * | FutureRoom       | MOD-11 | Functional  | Lazy-Tab-Router     |
 * | Acquiary         | MOD-12 | Functional  | Lazy-Tab-Router     |
 * | Sales Desk       | MOD-09 | Functional  | Monolithic (legacy) |
 * | Lead Desk        | MOD-10 | Functional  | Monolithic (legacy) |
 * | Projekt Desk     | MOD-13 | In Progress | Shell + Tabs        |
 * | Website Hosting  | —      | Functional  | Standalone          |
 * | Petmanager       | MOD-05 | Placeholder | Shell               |
 */

export const DESK_DESIGN_TOKENS = {
  /** Header typography */
  HEADER: {
    title: 'text-2xl font-bold uppercase',
    subtitle: 'text-muted-foreground text-sm',
    badge: 'text-xs',
  },
  /** KPI grid layout */
  KPI_GRID: {
    container: 'grid grid-cols-2 md:grid-cols-4 gap-4',
    label: 'text-sm font-medium text-muted-foreground',
    value: 'text-2xl font-bold',
    icon: 'h-4 w-4',
  },
  /** Tab navigation */
  TABS: {
    list: 'w-full',
  },
  /** Content section spacing */
  CONTENT: {
    root: 'space-y-6',
    section: 'space-y-4',
  },
} as const;

/** Zone-Flow Registry — Documents the governance flows per desk */
export const ZONE_FLOW_REGISTRY = [
  {
    flow: 'FLOW-LEAD',
    z3Surface: 'Kaufy / SoT Website',
    z1Desk: 'Lead Desk',
    z2Manager: 'MOD-10 (Leadmanager)',
    z2Client: 'MOD-09 (Vertriebspartner)',
    description: 'Leads von Z3 → Z1 Lead Pool → Zuweisung an Z2 Partner',
  },
  {
    flow: 'FLOW-LISTING',
    z3Surface: 'Kaufy Marketplace',
    z1Desk: 'Sales Desk',
    z2Manager: 'MOD-09 (Vertriebsmanager)',
    z2Client: 'MOD-04/06 (Eigentümer)',
    description: 'Listing-Aktivierung Z2 → Z1 Governance → Z3 Distribution',
  },
  {
    flow: 'FLOW-PROJEKT',
    z3Surface: 'Projekt Landing Pages',
    z1Desk: 'Projekt Desk',
    z2Manager: 'MOD-13 (Projektmanager)',
    z2Client: 'MOD-04 (Eigentümer)',
    description: 'Projekt-Intake Z2 → Z1 Freigabe → Z3 Landing Page + Marketplace',
  },
  {
    flow: 'FLOW-FINANCE',
    z3Surface: 'FutureRoom Website',
    z1Desk: 'FutureRoom',
    z2Manager: 'MOD-11 (Finanzierungsmanager)',
    z2Client: 'Antragsteller',
    description: 'Finanzierungsantrag Z3 → Z1 Inbox → Z2 Berater-Zuweisung',
  },
  {
    flow: 'FLOW-AKQUISE',
    z3Surface: 'Acquiary Website',
    z1Desk: 'Acquiary',
    z2Manager: 'MOD-12 (Akquisemanager)',
    z2Client: 'Mandant',
    description: 'Objekt-Inbound Z3 → Z1 Routing → Z2 Mandat-Bearbeitung',
  },
  {
    flow: 'FLOW-WEBSITE',
    z3Surface: 'Tenant Websites',
    z1Desk: 'Website Hosting',
    z2Manager: '—',
    z2Client: 'Tenant (Website-Owner)',
    description: 'Website-Erstellung Z2 → Z1 Hosting-Governance → Z3 Live',
  },
] as const;
