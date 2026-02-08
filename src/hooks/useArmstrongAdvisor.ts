/**
 * useArmstrongAdvisor — Zone 2 Chat API Integration
 * 
 * Connects ChatPanel to sot-armstrong-advisor Edge Function.
 * Handles message sending, action confirmation, and state management.
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useArmstrongContext, Zone2Context } from './useArmstrongContext';
import { toast } from '@/hooks/use-toast';

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
}

// =============================================================================
// MVP MODULE LIST
// =============================================================================

const MVP_MODULES = ['MOD-00', 'MOD-04', 'MOD-07', 'MOD-08'];

// =============================================================================
// HOOK
// =============================================================================

export function useArmstrongAdvisor() {
  const context = useArmstrongContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const conversationRef = useRef<Array<{ role: string; content: string }>>([]);

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
    actionRequest?: AdvisorRequest['action_request']
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
        last_messages: conversationRef.current.slice(-10), // Keep last 10 messages
      },
      action_request: actionRequest || null,
    };
  }, [context, getCurrentModule]);

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
  }, []);

  /**
   * Send a message to the advisor
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Clear any pending action when new message is sent
    setPendingAction(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    
    setIsLoading(true);

    try {
      const request = buildRequest(text);
      
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
    setMessages([]);
    conversationRef.current = [];
    setPendingAction(null);
  }, []);

  return {
    // State
    messages,
    isLoading,
    pendingAction,
    isExecuting,
    isInMvpScope: isInMvpScope(),
    currentModule: getCurrentModule(),
    
    // Actions
    sendMessage,
    confirmAction,
    cancelAction,
    selectAction,
    clearConversation,
  };
}
