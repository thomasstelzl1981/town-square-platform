/**
 * ACQUISITION TYPES — MOD-12 AkquiseManager + Zone-1 Acquiary
 * 
 * Type definitions for the Akquise-Service Golden Path
 */

// ============================================================================
// ENUMS (matching DB enums)
// ============================================================================

export type AcqMandateStatus = 
  | 'draft'
  | 'submitted_to_zone1'
  | 'assigned'
  | 'active'
  | 'paused'
  | 'closed';

export type AcqMandateEventType =
  | 'created'
  | 'submitted'
  | 'assigned'
  | 'split_confirmed'
  | 'activated'
  | 'paused'
  | 'resumed'
  | 'closed'
  | 'profile_generated'
  | 'contact_added'
  | 'email_sent'
  | 'email_replied'
  | 'offer_created'
  | 'offer_analyzed'
  | 'delivery_sent';

// ============================================================================
// INTERFACES
// ============================================================================

export interface AcqMandate {
  id: string;
  code: string;
  tenant_id: string;
  created_by_user_id: string;
  
  // Client info (only visible after gate)
  client_display_name: string | null;
  
  // Search criteria
  search_area: Record<string, unknown>;
  asset_focus: string[];
  price_min: number | null;
  price_max: number | null;
  yield_target: number | null;
  exclusions: string | null;
  notes: string | null;
  
  // Workflow status
  status: AcqMandateStatus;
  
  // Assignment
  assigned_manager_user_id: string | null;
  assigned_at: string | null;
  
  // Gate (Split confirmation)
  split_terms_confirmed_at: string | null;
  split_terms_confirmed_by: string | null;
  
  // AI-generated profile
  profile_text_email: string | null;
  profile_text_long: string | null;
  profile_keywords: string[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface AcqMandateEvent {
  id: string;
  mandate_id: string;
  event_type: AcqMandateEventType;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface CreateAcqMandateData {
  client_display_name: string;
  search_area: {
    regions?: string[];
    cities?: string[];
    postal_codes?: string[];
    free_text?: string;
  };
  asset_focus: string[];
  price_min?: number | null;
  price_max?: number | null;
  yield_target?: number | null;
  exclusions?: string;
  notes?: string;
}

export interface AssignAcqManagerData {
  mandate_id: string;
  manager_user_id: string;
}

export interface ConfirmSplitTermsData {
  mandate_id: string;
  confirmed: boolean;
}

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

export const MANDATE_STATUS_CONFIG: Record<AcqMandateStatus, {
  label: string;
  labelShort: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  description: string;
}> = {
  draft: {
    label: 'Entwurf',
    labelShort: 'Entwurf',
    variant: 'outline',
    description: 'Mandat wird vorbereitet',
  },
  submitted_to_zone1: {
    label: 'Eingereicht',
    labelShort: 'Neu',
    variant: 'destructive',
    description: 'Warte auf Zuweisung durch Zone 1',
  },
  assigned: {
    label: 'Zugewiesen',
    labelShort: 'Zugewiesen',
    variant: 'secondary',
    description: 'Manager zugewiesen, warte auf Annahme',
  },
  active: {
    label: 'Aktiv',
    labelShort: 'Aktiv',
    variant: 'default',
    description: 'Mandat wird aktiv bearbeitet',
  },
  paused: {
    label: 'Pausiert',
    labelShort: 'Pause',
    variant: 'outline',
    description: 'Bearbeitung vorübergehend eingestellt',
  },
  closed: {
    label: 'Abgeschlossen',
    labelShort: 'Fertig',
    variant: 'outline',
    description: 'Mandat wurde abgeschlossen',
  },
};

// ============================================================================
// ASSET FOCUS OPTIONS
// ============================================================================

export const ASSET_FOCUS_OPTIONS = [
  { value: 'MFH', label: 'Mehrfamilienhaus (MFH)' },
  { value: 'ETW', label: 'Eigentumswohnung (ETW)' },
  { value: 'EFH', label: 'Einfamilienhaus (EFH)' },
  { value: 'ZFH', label: 'Zweifamilienhaus (ZFH)' },
  { value: 'WGH', label: 'Wohn- und Geschäftshaus' },
  { value: 'GEW', label: 'Gewerbeimmobilie' },
  { value: 'BUERO', label: 'Bürogebäude' },
  { value: 'HANDEL', label: 'Handelsfläche' },
  { value: 'LAGER', label: 'Lager/Logistik' },
  { value: 'HOTEL', label: 'Hotel/Gastgewerbe' },
  { value: 'GRUNDSTUECK', label: 'Grundstück' },
  { value: 'PORTFOLIO', label: 'Portfolio' },
] as const;

// ============================================================================
// EXTENDED TYPES WITH RELATIONS
// ============================================================================

export interface AcqMandateWithEvents extends AcqMandate {
  events?: AcqMandateEvent[];
}

export interface AcqMandateWithCreator extends AcqMandate {
  creator?: {
    id: string;
    display_name: string | null;
    email: string | null;
  };
}

export interface AcqMandateWithManager extends AcqMandate {
  manager?: {
    id: string;
    display_name: string | null;
    email: string | null;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function canViewClientInfo(mandate: AcqMandate): boolean {
  return mandate.split_terms_confirmed_at !== null;
}

export function formatMandateCode(mandate: AcqMandate): string {
  return mandate.code || `ACQ-${mandate.id.slice(0, 8).toUpperCase()}`;
}

export function getMandateStatusBadgeVariant(status: AcqMandateStatus) {
  return MANDATE_STATUS_CONFIG[status]?.variant || 'outline';
}
