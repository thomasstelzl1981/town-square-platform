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
  | 'FIN_SUBMIT'        // Finanzierung einreichen
  | 'MANDATE_DELEGATE'  // Mandat delegieren
  | 'SALE_START'        // Verkauf starten
  | 'RENTAL_START'      // Vermietung starten
  | 'SERVICE_REQUEST';  // Service anfragen

export interface ActionPayload {
  actionKey: ActionKey;
  context: {
    userId?: string;
    module: string;
    entityIds?: {
      propertyId?: string;
      mandateId?: string;
      requestId?: string;
      serviceId?: string;
    };
    timestamp: string;
  };
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
    entityIds?: ActionPayload['context']['entityIds']
  ) => {
    const config = ACTION_CONFIGS[actionKey];
    
    // Build standardized payload
    const payload: ActionPayload = {
      actionKey,
      context: {
        userId: user?.id,
        module,
        entityIds,
        timestamp: new Date().toISOString(),
      },
    };

    // Log payload (future: send to Camunda via edge function)
    console.log('[ActionHandoff]', payload);

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

  return {
    triggerAction,
    submitFinancing,
    delegateMandate,
    startSale,
    startRental,
    requestService,
  };
}
