/**
 * useArmstrongAdvisor — Zone 2 Chat API Integration
 * 
 * Connects ChatPanel to sot-armstrong-advisor Edge Function.
 * Handles message sending, action confirmation, and state management.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useArmstrongContext, Zone2Context } from './useArmstrongContext';
import { toast } from '@/hooks/use-toast';
import { useIntakeListener, type IntakeState } from './useIntakeContext';

// =============================================================================
// TYPES
// =============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  responseType?: AdvisorResponseType;
  suggestedActions?: SuggestedAction[];
  draft?: DraftContent;
  pendingAction?: PendingAction;
  result?: ActionResult;
  blocked?: BlockedInfo;
}

export type AdvisorResponseType = 
  | 'EXPLAIN' 
  | 'DRAFT' 
  | 'SUGGEST_ACTIONS' 
  | 'CONFIRM_REQUIRED' 
  | 'RESULT' 
  | 'BLOCKED';

export interface SuggestedAction {
  action_code: string;
  title_de: string;
  execution_mode: string;
  risk_level: 'low' | 'medium' | 'high';
  cost_model: 'free' | 'metered' | 'premium';
  credits_estimate?: number;
  cost_hint_cents?: number;
  side_effects?: string[];
  why?: string;
}

export interface DraftContent {
  title: string;
  content: string;
  format: 'markdown' | 'text' | 'json';
}

export interface PendingAction {
  action_code: string;
  title_de: string;
  summary: string;
  execution_mode: string;
  risk_level: 'low' | 'medium' | 'high';
  cost_model: 'free' | 'metered' | 'premium';
  credits_estimate?: number;
  cost_hint_cents?: number;
  side_effects?: string[];
  preconditions?: string[];
  params?: Record<string, unknown>;
}

export interface ActionResult {
  action_run_id: string;
  status: 'completed' | 'failed' | 'cancelled';
  message: string;
  output?: Record<string, unknown>;
}

export interface BlockedInfo {
  reason_code: string;
  message: string;
}

interface AdvisorRequest {
  zone: string;
  module: string;
  route: string;
  entity: { type: string | null; id: string | null };
  message: string;
  conversation: { last_messages: Array<{ role: string; content: string }> };
  action_request?: {
    action_code: string;
    confirmed: boolean;
    params?: Record<string, unknown>;
  } | null;
  flow?: {
    flow_type: string;
    flow_state?: Record<string, unknown>;
  } | null;
  document_context?: {
    extracted_text: string;
    filename: string;
    content_type: string;
    confidence: number;
  } | null;
}

interface AdvisorResponse {
  type: AdvisorResponseType;
  message?: string;
  draft?: DraftContent;
  suggested_actions?: SuggestedAction[];
  action?: PendingAction;
  action_run_id?: string;
  status?: string;
  output?: Record<string, unknown>;
  reason_code?: string;
  next_steps?: string[];
  flow_state?: {
    step: number;
    total_steps: number;
    status: 'active' | 'completed';
    result?: Record<string, unknown>;
  };
}

// =============================================================================
// MVP MODULE LIST & GLOBAL ASSIST
// =============================================================================

const MVP_MODULES = ['MOD-00', 'MOD-04', 'MOD-07', 'MOD-08', 'MOD-09', 'MOD-13'];

// Global Assist: Armstrong helps everywhere, but module-specific actions
// are only available in MVP modules

// =============================================================================
// HOOK
// =============================================================================

export interface FlowState {
  flow_type: string;
  step: number;
  total_steps: number;
  status: 'active' | 'completed' | 'cancelled';
  result?: Record<string, unknown>;
}

// =============================================================================
// CONTEXT-SENSITIVE WELCOME MESSAGE
// =============================================================================

interface WelcomeChip {
  label: string;
  action_code: string;
}

const MODULE_WELCOME_CONFIG: Record<string, { greeting: string; chips: WelcomeChip[] }> = {
  'MOD-04': {
    greeting: 'Willkommen in deinem Immobilien-Portfolio. Ich kann dir sofort helfen:',
    chips: [
      { label: '📄 Immobilie aus Dokument', action_code: 'ARM.MOD04.MAGIC_INTAKE_PROPERTY' },
      { label: '📊 KPIs berechnen', action_code: 'ARM.MOD04.CALCULATE_KPI' },
      { label: '✅ Datenqualität prüfen', action_code: 'ARM.MOD04.DATA_QUALITY_CHECK' },
    ],
  },
  'MOD-07': {
    greeting: 'Ich bin bereit für deine Finanzierung. Was soll ich tun?',
    chips: [
      { label: '📋 Selbstauskunft erklären', action_code: 'ARM.MOD07.EXPLAIN_SELBSTAUSKUNFT' },
      { label: '📑 Dokument-Checkliste', action_code: 'ARM.MOD07.DOC_CHECKLIST' },
      { label: '🔍 Bereitschaft prüfen', action_code: 'ARM.MOD07.VALIDATE_READINESS' },
    ],
  },
  'MOD-08': {
    greeting: 'Investment-Bereich. Ich unterstütze dich bei der Analyse:',
    chips: [
      { label: '📈 Simulation starten', action_code: 'ARM.MOD08.RUN_SIMULATION' },
      { label: '📄 Suchmandat aus Dokument', action_code: 'ARM.MOD08.MAGIC_INTAKE_MANDATE' },
      { label: '⭐ Favorit analysieren', action_code: 'ARM.MOD08.ANALYZE_FAVORITE' },
    ],
  },
  'MOD-11': {
    greeting: 'Finanzierungsmanager. Wie kann ich helfen?',
    chips: [
      { label: '📄 Fall aus Dokument anlegen', action_code: 'ARM.MOD11.MAGIC_INTAKE_CASE' },
    ],
  },
  'MOD-12': {
    greeting: 'Akquise-Manager. Was soll ich tun?',
    chips: [
      { label: '📄 Mandat aus Dokument', action_code: 'ARM.MOD12.MAGIC_INTAKE_MANDATE' },
    ],
  },
  'MOD-13': {
    greeting: 'Projekte-Bereich. Ich helfe dir beim Bauträgerprojekt:',
    chips: [
      { label: '🏗️ Projekt aus Dokument', action_code: 'ARM.MOD13.CREATE_DEV_PROJECT' },
      { label: '❓ Modul erklären', action_code: 'ARM.MOD13.EXPLAIN_MODULE' },
    ],
  },
  'MOD-18': {
    greeting: 'Finanzanalyse. Ich kann Dokumente direkt auswerten:',
    chips: [
      { label: '📄 Finanzdaten aus Dokument', action_code: 'ARM.MOD18.MAGIC_INTAKE_FINANCE' },
    ],
  },
};

function getWelcomeMessage(moduleCode: string): ChatMessage {
  const config = MODULE_WELCOME_CONFIG[moduleCode];

  if (config) {
    const chipLabels = config.chips.map(c => `- ${c.label}`).join('\n');
    return {
      id: 'welcome',
      role: 'assistant',
      content: `${config.greeting}\n\n${chipLabels}\n\nOder frag mich einfach — ich helfe bei allem rund um dein System.`,
      timestamp: new Date(),
    };
  }

  return {
    id: 'welcome',
    role: 'assistant',
    content: `Hallo! Ich bin Armstrong, dein persönlicher Assistent. Ich kann dir bei vielen Aufgaben helfen:

- **Fragen stellen** — Ich erkläre dir alles rund um dein System
- **Dokumente analysieren** — Hänge ein Dokument an und ich lese es für dich
- **Daten zuordnen** — Gib mir Informationen und ich helfe dir, sie richtig einzuordnen
- **Texte erstellen** — Briefe, E-Mails oder Zusammenfassungen

Frag mich einfach, was du wissen möchtest!`,
    timestamp: new Date(),
  };
}

export function useArmstrongAdvisor() {
  const context = useArmstrongContext();
  const intakeState = useIntakeListener();
  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage('MOD-00')]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeFlow, setActiveFlow] = useState<FlowState | null>(null);
  const conversationRef = useRef<Array<{ role: string; content: string }>>([]);
  const lastModuleRef = useRef<string>('MOD-00');
  const lastIntakeStepRef = useRef<IntakeState['step']>(null);

  // Update welcome message when module changes
  useEffect(() => {
    const mod = context.zone === 'Z2' ? (context as Zone2Context).current_module || 'MOD-00' : 'MOD-00';
    if (mod !== lastModuleRef.current && messages.length <= 1) {
      lastModuleRef.current = mod;
      setMessages([getWelcomeMessage(mod)]);
      conversationRef.current = [];
    }
  }, [context]);

  // ── Proactive intake messages ──────────────────────────────────────────────
  useEffect(() => {
    const prevStep = lastIntakeStepRef.current;
    const newStep = intakeState.step;
    lastIntakeStepRef.current = newStep;

    // Only react to step transitions
    if (prevStep === newStep) return;

    let proactiveContent: string | null = null;

    if (newStep === 'analyzing' && prevStep !== 'analyzing') {
      proactiveContent = '🔍 **KI-Analyse gestartet.** Ich analysiere das Exposé und die Preisliste — das dauert ca. 15–30 Sekunden. Ich melde mich, wenn ich fertig bin.';
    }

    if (newStep === 'review' && prevStep === 'analyzing') {
      const parts: string[] = ['✅ **Analyse abgeschlossen!**'];
      if (intakeState.unitsCount > 0) {
        parts.push(`Ich habe **${intakeState.unitsCount} Einheiten** erkannt.`);
      }
      if (intakeState.wegCount && intakeState.wegCount > 1) {
        parts.push(`Das Projekt hat **${intakeState.wegCount} WEGs**.`);
      }
      if (intakeState.avgPricePerSqm) {
        parts.push(`Ø-Preis: **${intakeState.avgPricePerSqm.toLocaleString('de-DE')} €/m²**.`);
      }
      if (intakeState.projectType === 'aufteilung') {
        parts.push('Projekttyp: **Aufteilungsobjekt**.');
      }
      // Warnings
      const warnCount = intakeState.warnings.filter(w => w.type === 'warning').length;
      const errCount = intakeState.warnings.filter(w => w.type === 'error').length;
      if (errCount > 0) {
        parts.push(`\n⛔ **${errCount} Fehler** müssen vor dem Erstellen behoben werden.`);
      }
      if (warnCount > 0) {
        parts.push(`\n⚠️ **${warnCount} Hinweis(e)** — bitte die markierten Zellen prüfen.`);
      }
      parts.push('\nKlicken Sie auf einzelne Zellen in der Tabelle, um Werte zu korrigieren.');
      proactiveContent = parts.join(' ');
    }

    if (newStep === 'created') {
      proactiveContent = `🎉 **Projekt „${intakeState.projectName || 'Neues Projekt'}" wurde erfolgreich angelegt** mit ${intakeState.unitsCount} Einheiten.\n\nNächste Schritte:\n- **Immobilienakten erstellen** — Jede Einheit wird zur eigenen Immobilie im Portfolio\n- **Vertrieb starten** — Landing Page und Lead-Formulare aktivieren`;
    }

    if (proactiveContent) {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: proactiveContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, msg]);
      conversationRef.current.push({ role: 'assistant', content: proactiveContent });
    }
  }, [intakeState.step]);

  /**
   * Check if current module is in MVP scope
   */
  const isInMvpScope = useCallback(() => {
    if (context.zone !== 'Z2') return false;
    const z2ctx = context as Zone2Context;
    return z2ctx.current_module ? MVP_MODULES.includes(z2ctx.current_module) : false;
  }, [context]);

  /**
   * Get current module code from context
   */
  const getCurrentModule = useCallback(() => {
    if (context.zone !== 'Z2') return 'MOD-00';
    const z2ctx = context as Zone2Context;
    return z2ctx.current_module || 'MOD-00';
  }, [context]);

  /**
   * Build request payload
   */
  const buildRequest = useCallback((
    message: string,
    actionRequest?: AdvisorRequest['action_request'],
    flow?: AdvisorRequest['flow'],
    documentContext?: AdvisorRequest['document_context']
  ): AdvisorRequest => {
    const z2ctx = context as Zone2Context;
    
    return {
      zone: 'Z2',
      module: getCurrentModule(),
      route: z2ctx.current_path || '/portal',
      entity: {
        type: z2ctx.entity_type || null,
        id: z2ctx.entity_id || null,
      },
      message,
      conversation: {
        last_messages: conversationRef.current.slice(-10),
      },
      action_request: actionRequest || null,
      flow: flow || (activeFlow ? { flow_type: activeFlow.flow_type, flow_state: { step: activeFlow.step } } : null),
      document_context: documentContext || null,
    };
  }, [context, getCurrentModule, activeFlow]);

  /**
   * Add message to state
   */
  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
    conversationRef.current.push({ role: msg.role, content: msg.content });
  }, []);

  /**
   * Process advisor response
   */
  const processResponse = useCallback((response: AdvisorResponse): ChatMessage => {
    // Update flow state if present in response
    if (response.flow_state) {
      setActiveFlow({
        flow_type: activeFlow?.flow_type || 'unknown',
        step: response.flow_state.step,
        total_steps: response.flow_state.total_steps,
        status: response.flow_state.status,
        result: response.flow_state.result,
      });
      // If flow completed, clear active flow after a moment
      if (response.flow_state.status === 'completed') {
        setTimeout(() => setActiveFlow(null), 500);
      }
    }

    const baseMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response.message || '',
      timestamp: new Date(),
      responseType: response.type,
    };

    switch (response.type) {
      case 'EXPLAIN':
        return {
          ...baseMessage,
          suggestedActions: response.suggested_actions,
        };

      case 'DRAFT':
        return {
          ...baseMessage,
          draft: response.draft,
          suggestedActions: response.suggested_actions,
        };

      case 'SUGGEST_ACTIONS':
        return {
          ...baseMessage,
          suggestedActions: response.suggested_actions,
        };

      case 'CONFIRM_REQUIRED':
        if (response.action) {
          setPendingAction(response.action);
        }
        return {
          ...baseMessage,
          pendingAction: response.action,
        };

      case 'RESULT':
        return {
          ...baseMessage,
          result: {
            action_run_id: response.action_run_id || '',
            status: (response.status as ActionResult['status']) || 'completed',
            message: response.message || '',
            output: response.output,
          },
        };

      case 'BLOCKED':
        return {
          ...baseMessage,
          blocked: {
            reason_code: response.reason_code || 'UNKNOWN',
            message: response.message || 'Diese Aktion ist nicht verfügbar.',
          },
        };

      default:
        return baseMessage;
    }
  }, [activeFlow]);

  /**
   * Send a message to the advisor
   */
  const sendMessage = useCallback(async (text: string, documentContext?: AdvisorRequest['document_context']) => {
    if (!text.trim()) return;

    // Clear any pending action when new message is sent
    setPendingAction(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: documentContext ? `📄 ${documentContext.filename}\n\n${text}` : text,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    
    setIsLoading(true);

    try {
      const request = buildRequest(text, undefined, undefined, documentContext);
      
      const { data, error } = await supabase.functions.invoke('sot-armstrong-advisor', {
        body: request,
      });

      if (error) throw error;

      const assistantMessage = processResponse(data);
      addMessage(assistantMessage);

      // Show toast for results
      if (data.type === 'RESULT') {
        toast({
          title: data.status === 'completed' ? 'Aktion abgeschlossen' : 'Aktion fehlgeschlagen',
          description: data.message,
          variant: data.status === 'completed' ? 'default' : 'destructive',
        });
      }

    } catch (err) {
      console.error('Armstrong advisor error:', err);
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
        timestamp: new Date(),
        responseType: 'BLOCKED',
        blocked: {
          reason_code: 'ERROR',
          message: err instanceof Error ? err.message : 'Unbekannter Fehler',
        },
      };
      addMessage(errorMessage);

      toast({
        title: 'Fehler',
        description: 'Armstrong konnte die Anfrage nicht verarbeiten.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, buildRequest, processResponse]);

  /**
   * Confirm and execute a pending action
   */
  const confirmAction = useCallback(async (actionCode: string, params?: Record<string, unknown>) => {
    if (!pendingAction) return;

    setIsExecuting(true);

    try {
      const request = buildRequest('', {
        action_code: actionCode,
        confirmed: true,
        params: params || pendingAction.params,
      });

      const { data, error } = await supabase.functions.invoke('sot-armstrong-advisor', {
        body: request,
      });

      if (error) throw error;

      const resultMessage = processResponse(data);
      addMessage(resultMessage);

      // Clear pending action after execution
      setPendingAction(null);

      toast({
        title: data.status === 'completed' ? 'Erfolgreich ausgeführt' : 'Ausführung fehlgeschlagen',
        description: data.message,
        variant: data.status === 'completed' ? 'default' : 'destructive',
      });

    } catch (err) {
      console.error('Action execution error:', err);
      
      toast({
        title: 'Ausführung fehlgeschlagen',
        description: err instanceof Error ? err.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  }, [pendingAction, addMessage, buildRequest, processResponse]);

  /**
   * Cancel a pending action
   */
  const cancelAction = useCallback(() => {
    setPendingAction(null);
    
    const cancelMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Aktion abgebrochen. Wie kann ich Ihnen sonst helfen?',
      timestamp: new Date(),
    };
    addMessage(cancelMessage);
  }, [addMessage]);

  /**
   * Handle clicking a suggested action
   */
  const selectAction = useCallback(async (action: SuggestedAction) => {
    // Add user selection as message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `Führe aus: ${action.title_de}`,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    setIsLoading(true);

    try {
      // If action requires confirmation, request it
      if (action.execution_mode === 'execute_with_confirmation') {
        const request = buildRequest('', {
          action_code: action.action_code,
          confirmed: false,
        });

        const { data, error } = await supabase.functions.invoke('sot-armstrong-advisor', {
          body: request,
        });

        if (error) throw error;

        const assistantMessage = processResponse(data);
        addMessage(assistantMessage);
      } else {
        // For readonly or draft_only, execute directly
        const request = buildRequest('', {
          action_code: action.action_code,
          confirmed: true,
        });

        const { data, error } = await supabase.functions.invoke('sot-armstrong-advisor', {
          body: request,
        });

        if (error) throw error;

        const assistantMessage = processResponse(data);
        addMessage(assistantMessage);

        if (data.type === 'RESULT') {
          toast({
            title: data.status === 'completed' ? 'Aktion abgeschlossen' : 'Aktion fehlgeschlagen',
            description: data.message,
            variant: data.status === 'completed' ? 'default' : 'destructive',
          });
        }
      }
    } catch (err) {
      console.error('Action selection error:', err);
      
      toast({
        title: 'Fehler',
        description: 'Die Aktion konnte nicht gestartet werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, buildRequest, processResponse]);

  /**
   * Clear conversation
   */
  const clearConversation = useCallback(() => {
    setMessages([getWelcomeMessage(getCurrentModule())]);
    conversationRef.current = [];
    setPendingAction(null);
    setActiveFlow(null);
  }, []);

  /**
   * Start a guided flow (e.g., Social Audit)
   * Opens Armstrong with a special context that triggers the flow handler
   */
  const startFlow = useCallback(async (flowType: string, flowConfig?: Record<string, unknown>) => {
    // Set flow state
    setActiveFlow({
      flow_type: flowType,
      step: 0,
      total_steps: flowType === 'social_audit' ? 15 : 0,
      status: 'active',
    });

    // Clear conversation for fresh flow
    setMessages([getWelcomeMessage(getCurrentModule())]);
    conversationRef.current = [];
    setPendingAction(null);
    setIsLoading(true);

    try {
      const request = buildRequest(
        '__flow_start__',
        null,
        { flow_type: flowType, flow_state: { step: 0, ...flowConfig } }
      );

      const { data, error } = await supabase.functions.invoke('sot-armstrong-advisor', {
        body: request,
      });

      if (error) throw error;

      const assistantMessage = processResponse(data);
      addMessage(assistantMessage);
    } catch (err) {
      console.error('Armstrong flow start error:', err);
      setActiveFlow(null);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Das Audit konnte nicht gestartet werden. Bitte versuchen Sie es erneut.',
        timestamp: new Date(),
        responseType: 'BLOCKED',
        blocked: { reason_code: 'ERROR', message: err instanceof Error ? err.message : 'Unbekannter Fehler' },
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [buildRequest, processResponse, addMessage]);

  /**
   * Cancel active flow
   */
  const cancelFlow = useCallback(() => {
    setActiveFlow(null);
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Audit abgebrochen. Du kannst es jederzeit neu starten.',
      timestamp: new Date(),
    };
    addMessage(msg);
  }, [addMessage]);

  return {
    // State
    messages,
    isLoading,
    pendingAction,
    isExecuting,
    isInMvpScope: isInMvpScope(),
    currentModule: getCurrentModule(),
    activeFlow,
    
    // Actions
    sendMessage,
    confirmAction,
    cancelAction,
    selectAction,
    clearConversation,
    startFlow,
    cancelFlow,
  };
}
