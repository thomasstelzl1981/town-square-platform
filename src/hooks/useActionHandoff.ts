/**
 * Camunda Action Handoff Hook
 * 
 * UI triggers that create standardized payloads for Camunda workflow integration.
 * These are "handoff" points - no local business logic, just event dispatch + UI feedback.
 */

import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export type ActionKey = 
  | 'FIN_SUBMIT'           // Finanzierung einreichen
  | 'MANDATE_DELEGATE'     // Mandat delegieren
  | 'SALE_START'           // Verkauf starten
  | 'RENTAL_START'         // Vermietung starten
  | 'SERVICE_REQUEST'      // Service anfragen
  | 'ACQ_MANDATE_CREATE'   // Suchmandat erstellen (MOD-08)
  | 'ACQ_MANDATE_ACCEPT'   // Mandat akzeptieren (MOD-12)
  | 'LEAD_ASSIGN'          // Lead zuweisen (Zone 1)
  | 'LISTING_PUBLISH'      // Listing veröffentlichen (MOD-06)
  | 'LISTING_WITHDRAW'     // Listing zurückziehen (MOD-06)
  | 'PV_COMMISSION'        // PV-Anlage in Betrieb nehmen (MOD-19)
  | 'PROJECT_PHASE_CHANGE'; // Projekt-Phasenwechsel (MOD-13)

export interface ActionPayload {
  actionKey: ActionKey;
  correlationKey: string; // Format: {entityType}_{entityId}_{timestamp}
  context: {
    userId?: string;
    tenantId?: string;
    module: string;
    entityIds?: {
      propertyId?: string;
      mandateId?: string;
      requestId?: string;
      serviceId?: string;
      caseId?: string;
      listingId?: string;
      leadId?: string;
      plantId?: string;
      projectId?: string;
    };
    timestamp: string;
  };
}

/**
 * Generate a Camunda-compatible correlation key
 */
export function generateCorrelationKey(entityType: string, entityId?: string): string {
  const id = entityId || 'new';
  const timestamp = Math.floor(Date.now() / 1000);
  return `${entityType}_${id}_${timestamp}`;
}

interface ActionConfig {
  toastMessage: string;
  toastDescription?: string;
  redirectTo: string;
}

const ACTION_CONFIGS: Record<ActionKey, ActionConfig> = {
  FIN_SUBMIT: {
    toastMessage: 'Finanzierungsanfrage eingereicht',
    toastDescription: 'Ihre Anfrage wird bearbeitet.',
    redirectTo: '/portal/finanzierung/status',
  },
  MANDATE_DELEGATE: {
    toastMessage: 'Mandat delegiert',
    toastDescription: 'Der Status wurde aktualisiert.',
    redirectTo: '/portal/akquise-manager/mandate',
  },
  SALE_START: {
    toastMessage: 'Verkaufsprozess gestartet',
    toastDescription: 'Das Objekt ist jetzt im Verkauf.',
    redirectTo: '/portal/verkauf/vorgaenge',
  },
  RENTAL_START: {
    toastMessage: 'Vermietungsprozess gestartet',
    toastDescription: 'Das Objekt ist jetzt in Vermietung.',
    redirectTo: '/portal/msv/vermietung',
  },
  SERVICE_REQUEST: {
    toastMessage: 'Service angefragt',
    toastDescription: 'Ihre Anfrage wurde erstellt.',
    redirectTo: '/portal/services/auftraege',
  },
  ACQ_MANDATE_CREATE: {
    toastMessage: 'Suchmandat erstellt',
    toastDescription: 'Ihr Suchmandat wurde an den Akquise-Service übergeben.',
    redirectTo: '/portal/investments/mandat',
  },
  ACQ_MANDATE_ACCEPT: {
    toastMessage: 'Mandat akzeptiert',
    toastDescription: 'Das Mandat ist jetzt aktiv.',
    redirectTo: '/portal/akquise-manager/mandate',
  },
  LEAD_ASSIGN: {
    toastMessage: 'Lead zugewiesen',
    toastDescription: 'Der Lead wurde dem Partner zugewiesen.',
    redirectTo: '/admin/lead-desk',
  },
  LISTING_PUBLISH: {
    toastMessage: 'Listing veröffentlicht',
    toastDescription: 'Das Objekt ist jetzt auf dem Marktplatz sichtbar.',
    redirectTo: '/portal/verkauf/objekte',
  },
  LISTING_WITHDRAW: {
    toastMessage: 'Listing zurückgezogen',
    toastDescription: 'Das Objekt wurde vom Marktplatz entfernt.',
    redirectTo: '/portal/verkauf/objekte',
  },
  PV_COMMISSION: {
    toastMessage: 'PV-Anlage in Betrieb genommen',
    toastDescription: 'Die Anlage ist jetzt aktiv.',
    redirectTo: '/portal/photovoltaik/anlagen',
  },
  PROJECT_PHASE_CHANGE: {
    toastMessage: 'Projektphase aktualisiert',
    toastDescription: 'Die neue Phase wurde gesetzt.',
    redirectTo: '/portal/projekte/uebersicht',
  },
};

export function useActionHandoff() {
  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Trigger an action handoff
   * Shows toast feedback, creates payload, and redirects
   */
  const triggerAction = async (
    actionKey: ActionKey,
    module: string,
    entityIds?: ActionPayload['context']['entityIds'],
    entityType?: string
  ) => {
    const config = ACTION_CONFIGS[actionKey];
    
    // Determine entity ID for correlation key
    const primaryEntityId = entityIds?.requestId || entityIds?.mandateId || 
                            entityIds?.propertyId || entityIds?.serviceId || 
                            entityIds?.caseId || entityIds?.listingId ||
                            entityIds?.leadId || entityIds?.plantId ||
                            entityIds?.projectId;
    
    // Generate correlation key for Camunda
    const correlationKey = generateCorrelationKey(
      entityType || module.toLowerCase().replace('mod-', ''),
      primaryEntityId
    );
    
    // Build standardized payload
    const payload: ActionPayload = {
      actionKey,
      correlationKey,
      context: {
        userId: user?.id,
        module,
        entityIds,
        timestamp: new Date().toISOString(),
      },
    };

    // Log payload (future: send to Camunda via edge function)
    if (import.meta.env.DEV) {
      console.log('[ActionHandoff]', payload);
    }

    // Show immediate feedback
    toast.success(config.toastMessage, {
      description: config.toastDescription,
    });

    // Redirect after brief delay for toast visibility
    setTimeout(() => {
      navigate(config.redirectTo);
    }, 500);

    return payload;
  };

  // Convenience methods for each action
  const submitFinancing = (requestId?: string) => 
    triggerAction('FIN_SUBMIT', 'MOD-07', { requestId });

  const delegateMandate = (mandateId?: string) => 
    triggerAction('MANDATE_DELEGATE', 'MOD-11', { mandateId });

  const startSale = (propertyId?: string) => 
    triggerAction('SALE_START', 'MOD-06', { propertyId });

  const startRental = (propertyId?: string) => 
    triggerAction('RENTAL_START', 'MOD-05', { propertyId });

  const requestService = (serviceId?: string) => 
    triggerAction('SERVICE_REQUEST', 'MOD-16', { serviceId });

  const createAcqMandate = (mandateId?: string) =>
    triggerAction('ACQ_MANDATE_CREATE', 'MOD-08', { mandateId });

  const acceptAcqMandate = (mandateId?: string) =>
    triggerAction('ACQ_MANDATE_ACCEPT', 'MOD-12', { mandateId });

  const assignLead = (leadId?: string) =>
    triggerAction('LEAD_ASSIGN', 'ZONE-1', { leadId });

  const publishListing = (listingId?: string) =>
    triggerAction('LISTING_PUBLISH', 'MOD-06', { listingId });

  const withdrawListing = (listingId?: string) =>
    triggerAction('LISTING_WITHDRAW', 'MOD-06', { listingId });

  const commissionPV = (plantId?: string) =>
    triggerAction('PV_COMMISSION', 'MOD-19', { plantId });

  const changeProjectPhase = (projectId?: string) =>
    triggerAction('PROJECT_PHASE_CHANGE', 'MOD-13', { projectId });

  return {
    triggerAction,
    submitFinancing,
    delegateMandate,
    startSale,
    startRental,
    requestService,
    createAcqMandate,
    acceptAcqMandate,
    assignLead,
    publishListing,
    withdrawListing,
    commissionPV,
    changeProjectPhase,
  };
}
