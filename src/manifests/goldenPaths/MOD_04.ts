import type { GoldenPathDefinition } from './types';

/**
 * Golden Path MOD-04: Immobilie — Von Anlage bis Vertrieb
 * 
 * SSOT-Definition des idealen Nutzerflusses fuer das Immobilien-Modul.
 * 11 Phasen vom Objektanlegen bis zur Deaktivierung.
 * 
 * Referenziert ausschliesslich existierende DB-Tabellen und Spalten:
 * - properties, units, storage_nodes
 * - property_features (verkaufsauftrag, kaufy_sichtbarkeit)
 * - listings (status, sales_mandate_consent_id)
 * - listing_publications (channel, status)
 * - user_consents
 */
export const MOD_04_GOLDEN_PATH: GoldenPathDefinition = {
  moduleCode: 'MOD-04',
  version: '2.0.0',
  label: 'Immobilie — Von Anlage bis Vertrieb',
  description:
    'Vollstaendiger Lebenszyklus einer Immobilie: Anlage, Dossier-Pflege, Vermarktung, Sichtbarkeit in Downstream-Modulen, optionale Kaufy-Aktivierung und Deaktivierung.',

  steps: [
    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: OBJEKT ANLEGEN
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'create_property',
      phase: 1,
      label: 'Immobilie anlegen',
      type: 'action',
      routePattern: '/portal/immobilien/portfolio',
      preconditions: [
        {
          key: 'user_authenticated',
          source: 'auth',
          description: 'User muss eingeloggt sein',
        },
        {
          key: 'tenant_exists',
          source: 'organizations',
          description: 'Tenant/Organisation muss vorhanden sein',
        },
      ],
      completion: [
        {
          key: 'property_exists',
          source: 'properties',
          check: 'exists',
          description: 'Property-Row wurde erstellt',
        },
        {
          key: 'main_unit_exists',
          source: 'units',
          check: 'exists',
          description: 'MAIN-Unit wurde durch DB-Trigger erstellt',
        },
        {
          key: 'folder_structure_exists',
          source: 'storage_nodes',
          check: 'exists',
          description: 'Ordnerstruktur (PROPERTY_DOSSIER_V1) wurde durch DB-Trigger erstellt',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: IMMOBILIENAKTE BEARBEITEN
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'edit_dossier',
      phase: 2,
      label: 'Immobilienakte bearbeiten',
      type: 'route',
      routeId: 'MOD-04::dynamic::/:id',
      routePattern: '/portal/immobilien/:propertyId',
      preconditions: [
        {
          key: 'property_exists',
          source: 'properties',
          description: 'Property muss existieren',
        },
      ],
      // Kein Completion-Check — manueller Datenpflege-Schritt
    },

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: SICHTBARKEIT IN MOD-05 (MIETVERWALTUNG)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'mod05_visibility',
      phase: 3,
      label: 'Sichtbarkeit in Mietverwaltung (MOD-05)',
      type: 'system',
      downstreamModules: ['MOD-05'],
      preconditions: [
        {
          key: 'property_exists',
          source: 'properties',
          description: 'Property muss existieren',
        },
        {
          key: 'main_unit_exists',
          source: 'units',
          description: 'MAIN-Unit muss existieren',
        },
      ],
      completion: [
        {
          key: 'unit_visible_in_mod05',
          source: 'units',
          check: 'exists',
          description: 'Einheit erscheint automatisch in MOD-05 ObjekteTab (kein Filter)',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // PHASE 4: VERKAUFSAUFTRAG AKTIVIEREN
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'activate_sales_mandate',
      phase: 4,
      label: 'Verkaufsauftrag aktivieren',
      type: 'action',
      routeId: 'MOD-04::dynamic::/:id',
      routePattern: '/portal/immobilien/:id',
      queryParams: { tab: 'verkaufsauftrag' },
      preconditions: [
        {
          key: 'property_exists',
          source: 'properties',
          description: 'Property muss existieren',
        },
      ],
      completion: [
        {
          key: 'verkaufsauftrag_active',
          source: 'property_features',
          check: 'equals',
          value: 'active',
          description: 'property_features.verkaufsauftrag = active',
        },
        {
          key: 'listing_active',
          source: 'listings',
          check: 'equals',
          value: 'active',
          description: 'listings.status = active',
        },
        {
          key: 'partner_network_active',
          source: 'listing_publications',
          check: 'equals',
          value: 'active',
          description: 'listing_publications (channel=partner_network) status = active',
        },
        {
          key: 'sales_mandate_consent_linked',
          source: 'listings',
          check: 'not_null',
          description: 'listings.sales_mandate_consent_id IS NOT NULL',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // PHASE 5: VERTRAG IN STAMMDATEN
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'stammdaten_contract',
      phase: 5,
      label: 'Vertrag in Stammdaten sichtbar',
      type: 'system',
      routePattern: '/portal/stammdaten/vertraege',
      preconditions: [
        {
          key: 'sales_mandate_consent_linked',
          source: 'listings',
          description: 'listings.sales_mandate_consent_id IS NOT NULL',
        },
      ],
      completion: [
        {
          key: 'contract_visible',
          source: 'listings',
          check: 'not_null',
          description: 'Verkaufsmandat erscheint in VertraegeTab',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // PHASE 6: SALES DESK SICHTBARKEIT
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'sales_desk_visibility',
      phase: 6,
      label: 'Vertriebsauftrag im Sales Desk sichtbar',
      type: 'system',
      routePattern: '/admin/sales-desk',
      preconditions: [
        {
          key: 'sales_mandate_consent_linked',
          source: 'listings',
          description: 'listings.sales_mandate_consent_id IS NOT NULL',
        },
        {
          key: 'listing_active',
          source: 'listings',
          description: 'listings.status = active',
        },
      ],
      completion: [
        {
          key: 'sales_desk_entry_visible',
          source: 'listings',
          check: 'exists',
          description: 'Eintrag in ImmobilienVertriebsauftraegeCard sichtbar',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // PHASE 7: MOD-09 KATALOG
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'mod09_katalog',
      phase: 7,
      label: 'Sichtbarkeit im Partner-Katalog (MOD-09)',
      type: 'system',
      downstreamModules: ['MOD-09'],
      preconditions: [
        {
          key: 'partner_network_active',
          source: 'listing_publications',
          description: 'listing_publications (channel=partner_network) status = active',
        },
      ],
      completion: [
        {
          key: 'katalog_visible',
          source: 'listing_publications',
          check: 'exists',
          description: 'Objekt erscheint im KatalogTab',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // PHASE 8: MOD-08 INVESTMENT-SUCHE
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'mod08_suche',
      phase: 8,
      label: 'Sichtbarkeit in Investment-Suche (MOD-08)',
      type: 'system',
      downstreamModules: ['MOD-08'],
      preconditions: [
        {
          key: 'listing_active',
          source: 'listings',
          description: 'listings.status = active',
        },
      ],
      completion: [
        {
          key: 'suche_visible',
          source: 'listings',
          check: 'exists',
          description: 'Objekt erscheint in SucheTab',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // PHASE 9: KAUFY-SICHTBARKEIT AKTIVIEREN (OPTIONAL)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'activate_kaufy',
      phase: 9,
      label: 'Kaufy-Marktplatz aktivieren',
      type: 'action',
      routeId: 'MOD-04::dynamic::/:id',
      routePattern: '/portal/immobilien/:id',
      queryParams: { tab: 'verkaufsauftrag' },
      preconditions: [
        {
          key: 'verkaufsauftrag_active',
          source: 'property_features',
          description: 'Verkaufsauftrag muss aktiv sein (dependsOn)',
        },
      ],
      completion: [
        {
          key: 'kaufy_sichtbarkeit_active',
          source: 'property_features',
          check: 'equals',
          value: 'active',
          description: 'property_features.kaufy_sichtbarkeit = active',
        },
        {
          key: 'kaufy_publication_active',
          source: 'listing_publications',
          check: 'equals',
          value: 'active',
          description: 'listing_publications (channel=kaufy) status = active',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // PHASE 10: KAUFY-WEBSITE (ZONE 3)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'kaufy_website',
      phase: 10,
      label: 'Sichtbarkeit auf Kaufy-Website (Zone 3)',
      type: 'system',
      downstreamModules: ['ZONE-3'],
      preconditions: [
        {
          key: 'kaufy_publication_active',
          source: 'listing_publications',
          description: 'listing_publications (channel=kaufy) status = active',
        },
      ],
      completion: [
        {
          key: 'kaufy_website_visible',
          source: 'listing_publications',
          check: 'exists',
          description: 'Objekt erscheint auf oeffentlicher Kaufy-Website',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // PHASE 11: DEAKTIVIERUNG (WIDERRUF)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'deactivate_mandate',
      phase: 11,
      label: 'Verkaufsauftrag deaktivieren (Widerruf)',
      type: 'action',
      routeId: 'MOD-04::dynamic::/:id',
      routePattern: '/portal/immobilien/:id',
      queryParams: { tab: 'verkaufsauftrag' },
      preconditions: [
        {
          key: 'verkaufsauftrag_active',
          source: 'property_features',
          description: 'Verkaufsauftrag muss aktuell aktiv sein',
        },
      ],
      completion: [
        {
          key: 'listing_withdrawn',
          source: 'listings',
          check: 'equals',
          value: 'withdrawn',
          description: 'listings.status = withdrawn',
        },
        {
          key: 'publications_paused',
          source: 'listing_publications',
          check: 'equals',
          value: 'paused',
          description: 'Alle listing_publications status = paused',
        },
        {
          key: 'features_inactive',
          source: 'property_features',
          check: 'equals',
          value: 'inactive',
          description: 'Alle property_features (verkaufsauftrag, kaufy_sichtbarkeit) = inactive',
        },
      ],
    },
  ],
};
