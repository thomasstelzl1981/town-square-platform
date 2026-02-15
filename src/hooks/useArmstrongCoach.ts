/**
 * useArmstrongCoach — Coach Event Listener & Auto-Start Logic
 * 
 * Listens for Investment Engine & Slideshow events, manages dismiss state,
 * and triggers Armstrong coach messages via the advisor hook.
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { 
  SLIDE_COACH_MESSAGES, 
  COACH_MESSAGES,
  COACH_QUICK_ACTIONS,
  getSlideActionCode,
  type PresentationCoachKey,
} from '@/constants/armstrongCoachMessages';

// =============================================================================
// TYPES
// =============================================================================

export interface CoachState {
  isActive: boolean;
  currentPresentation: string | null;
  currentSlide: number;
  isDismissed: boolean;
}

export interface CoachQuickAction {
  label: string;
  action: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DISMISS_KEY = 'arm_coach_dismissed_until';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// =============================================================================
// CUSTOM EVENT TYPES
// =============================================================================

export interface PresentationOpenedEvent extends CustomEvent {
  detail: { presentationKey: string };
}

export interface PresentationSlideChangedEvent extends CustomEvent {
  detail: { presentationKey: string; slideIndex: number };
}

export interface PresentationClosedEvent extends CustomEvent {
  detail: { presentationKey: string };
}

// =============================================================================
// HOOK
// =============================================================================

export function useArmstrongCoach(sendMessage?: (text: string) => void) {
  const [coachState, setCoachState] = useState<CoachState>({
    isActive: false,
    currentPresentation: null,
    currentSlide: 0,
    isDismissed: false,
  });
  
  const [quickActions, setQuickActions] = useState<CoachQuickAction[]>([]);
  const lastSlideMessageRef = useRef<string>('');

  // =========================================================================
  // DISMISS LOGIC
  // =========================================================================
  
  const isDismissed = useCallback((): boolean => {
    const until = localStorage.getItem(DISMISS_KEY);
    if (!until) return false;
    return new Date(until).getTime() > Date.now();
  }, []);

  const dismissCoach = useCallback(() => {
    const until = new Date(Date.now() + DISMISS_DURATION_MS).toISOString();
    localStorage.setItem(DISMISS_KEY, until);
    setCoachState(prev => ({ ...prev, isDismissed: true, isActive: false }));
    setQuickActions([]);
  }, []);

  const resumeCoach = useCallback(() => {
    localStorage.removeItem(DISMISS_KEY);
    setCoachState(prev => ({ ...prev, isDismissed: false, isActive: true }));
  }, []);

  // =========================================================================
  // GET COACHING MESSAGE FOR SLIDE
  // =========================================================================

  const getSlideMessage = useCallback((presentationKey: string, slideIndex: number): string | null => {
    const key = presentationKey as PresentationCoachKey;
    const messages = SLIDE_COACH_MESSAGES[key];
    if (!messages || slideIndex >= messages.length) return null;
    
    const message = messages[slideIndex];
    
    // Avoid repeating the same message
    if (message === lastSlideMessageRef.current) {
      return `Kurz-Reminder: ${message.substring(0, 80)}…`;
    }
    
    lastSlideMessageRef.current = message;
    return message;
  }, []);

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  const handlePresentationOpened = useCallback((e: Event) => {
    const detail = (e as PresentationOpenedEvent).detail;
    if (isDismissed()) return;
    
    setCoachState({
      isActive: true,
      currentPresentation: detail.presentationKey,
      currentSlide: 0,
      isDismissed: false,
    });
    setQuickActions(COACH_QUICK_ACTIONS.SLIDESHOW as unknown as CoachQuickAction[]);
    
    // Send auto-start message
    if (sendMessage) {
      sendMessage(COACH_MESSAGES.AUTO_START);
    }
  }, [isDismissed, sendMessage]);

  const handleSlideChanged = useCallback((e: Event) => {
    const detail = (e as PresentationSlideChangedEvent).detail;
    if (!coachState.isActive || isDismissed()) return;
    
    setCoachState(prev => ({
      ...prev,
      currentSlide: detail.slideIndex,
    }));
    
    const message = getSlideMessage(detail.presentationKey, detail.slideIndex);
    if (message && sendMessage) {
      // Delay slightly to feel natural
      setTimeout(() => sendMessage(message), 800);
    }
  }, [coachState.isActive, isDismissed, getSlideMessage, sendMessage]);

  const handlePresentationClosed = useCallback((_e: Event) => {
    setCoachState(prev => ({
      ...prev,
      isActive: false,
      currentPresentation: null,
    }));
    setQuickActions([]);
    lastSlideMessageRef.current = '';
  }, []);

  const handleInvestmentEngineVisible = useCallback((_e: Event) => {
    if (isDismissed() || coachState.currentPresentation) return;
    
    setCoachState(prev => ({
      ...prev,
      isActive: true,
    }));
    setQuickActions(COACH_QUICK_ACTIONS.ENGINE as unknown as CoachQuickAction[]);
  }, [isDismissed, coachState.currentPresentation]);

  // =========================================================================
  // QUICK ACTION HANDLER
  // =========================================================================

  const handleQuickAction = useCallback((actionCode: string) => {
    if (!sendMessage) return;
    
    switch (actionCode) {
      case 'ARM.INV.COACH.DISMISS':
        dismissCoach();
        sendMessage(COACH_MESSAGES.DISMISS);
        break;
      case 'ARM.INV.COACH.AUTO_START':
        sendMessage(COACH_MESSAGES.AUTO_START);
        break;
      case 'ARM.INV.COACH.TO_SIMULATION':
      case 'ARM.INV.COACH.ENGINE.TO_SIMULATION':
        sendMessage(COACH_MESSAGES.TO_SIMULATION);
        break;
      case 'ARM.INV.COACH.ENGINE.FRAME_START':
        sendMessage(COACH_MESSAGES.ENGINE_FRAME_START);
        break;
      case 'ARM.INV.COACH.ENGINE.PATH_CHOICE':
        sendMessage(COACH_MESSAGES.ENGINE_PATH_CHOICE);
        break;
      case 'ARM.INV.COACH.ENGINE.MSV_EXPLAIN':
        sendMessage(COACH_MESSAGES.ENGINE_MSV_EXPLAIN);
        break;
      default:
        break;
    }
  }, [sendMessage, dismissCoach]);

  // =========================================================================
  // EVENT LISTENERS
  // =========================================================================

  useEffect(() => {
    window.addEventListener('armstrong:presentation_opened', handlePresentationOpened);
    window.addEventListener('armstrong:presentation_slide_changed', handleSlideChanged);
    window.addEventListener('armstrong:presentation_closed', handlePresentationClosed);
    window.addEventListener('armstrong:investment_engine_visible', handleInvestmentEngineVisible);

    return () => {
      window.removeEventListener('armstrong:presentation_opened', handlePresentationOpened);
      window.removeEventListener('armstrong:presentation_slide_changed', handleSlideChanged);
      window.removeEventListener('armstrong:presentation_closed', handlePresentationClosed);
      window.removeEventListener('armstrong:investment_engine_visible', handleInvestmentEngineVisible);
    };
  }, [handlePresentationOpened, handleSlideChanged, handlePresentationClosed, handleInvestmentEngineVisible]);

  // =========================================================================
  // CHECK DISMISS ON MOUNT
  // =========================================================================

  useEffect(() => {
    if (isDismissed()) {
      setCoachState(prev => ({ ...prev, isDismissed: true }));
    }
  }, [isDismissed]);

  return {
    coachState,
    quickActions,
    dismissCoach,
    resumeCoach,
    handleQuickAction,
    getSlideActionCode,
  };
}
