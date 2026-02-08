/**
 * useWidgetPreferences — Hook for managing system widget preferences
 * 
 * Handles:
 * - Loading preferences from DB (authenticated) or localStorage (guest)
 * - Toggle widget enabled/disabled
 * - Update sort order
 * - Optimistic updates with React Query
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SYSTEM_WIDGETS, getDefaultEnabledWidgets } from '@/config/systemWidgets';
import { toast } from 'sonner';

export interface WidgetPreference {
  id?: string;
  widget_code: string;
  enabled: boolean;
  sort_order: number;
  config_json?: Record<string, unknown>;
}

const STORAGE_KEY = 'widget_preferences_v1';

// Get default preferences
function getDefaultPreferences(): WidgetPreference[] {
  return SYSTEM_WIDGETS.map((widget, index) => ({
    widget_code: widget.code,
    enabled: widget.default_enabled,
    sort_order: index,
    config_json: {},
  }));
}

// localStorage helpers
function loadFromStorage(): WidgetPreference[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load widget preferences from storage:', e);
  }
  return null;
}

function saveToStorage(prefs: WidgetPreference[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save widget preferences to storage:', e);
  }
}

export function useWidgetPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localPreferences, setLocalPreferences] = useState<WidgetPreference[]>(() => {
    return loadFromStorage() || getDefaultPreferences();
  });

  // Fetch from DB if authenticated
  const { data: dbPreferences, isLoading } = useQuery({
    queryKey: ['widget-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('widget_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order');
      
      if (error) throw error;
      return data as WidgetPreference[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize DB preferences if empty
  useEffect(() => {
    if (user && dbPreferences && dbPreferences.length === 0) {
      // First time user - insert default preferences
      const defaults = getDefaultPreferences();
      const insertDefaults = async () => {
        for (const pref of defaults) {
          await supabase.from('widget_preferences').insert({
            user_id: user.id,
            widget_code: pref.widget_code,
            enabled: pref.enabled,
            sort_order: pref.sort_order,
            config_json: pref.config_json || {},
          } as any);
        }
        queryClient.invalidateQueries({ queryKey: ['widget-preferences', user.id] });
      };
      insertDefaults();
    }
  }, [user, dbPreferences, queryClient]);

  // Merge DB and local preferences
  const preferences = useMemo(() => {
    if (user && dbPreferences && dbPreferences.length > 0) {
      // Use DB preferences, but ensure all widgets are present
      const existingCodes = new Set(dbPreferences.map(p => p.widget_code));
      const merged = [...dbPreferences];
      
      // Add any missing widgets (new widgets added to registry)
      SYSTEM_WIDGETS.forEach((widget, index) => {
        if (!existingCodes.has(widget.code)) {
          merged.push({
            widget_code: widget.code,
            enabled: widget.default_enabled,
            sort_order: merged.length + index,
            config_json: {},
          });
        }
      });
      
      return merged.sort((a, b) => a.sort_order - b.sort_order);
    }
    return localPreferences;
  }, [user, dbPreferences, localPreferences]);

  // Get only enabled widget codes in order
  const enabledWidgets = useMemo(() => {
    return preferences
      .filter(p => p.enabled)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(p => p.widget_code);
  }, [preferences]);

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ code, enabled }: { code: string; enabled: boolean }) => {
      if (user) {
        const { error } = await supabase
          .from('widget_preferences')
          .upsert({
            user_id: user.id,
            widget_code: code,
            enabled,
            sort_order: preferences.find(p => p.widget_code === code)?.sort_order ?? 0,
            config_json: {},
          }, {
            onConflict: 'user_id,widget_code',
          });
        
        if (error) throw error;
      }
      return { code, enabled };
    },
    onMutate: async ({ code, enabled }) => {
      // Optimistic update
      if (user) {
        await queryClient.cancelQueries({ queryKey: ['widget-preferences', user.id] });
      }
      
      const newPrefs = preferences.map(p =>
        p.widget_code === code ? { ...p, enabled } : p
      );
      
      if (!user) {
        setLocalPreferences(newPrefs);
        saveToStorage(newPrefs);
      }
      
      return { previousPrefs: preferences };
    },
    onError: (err, variables, context) => {
      // Rollback
      if (!user && context?.previousPrefs) {
        setLocalPreferences(context.previousPrefs);
        saveToStorage(context.previousPrefs);
      }
      toast.error('Einstellung konnte nicht gespeichert werden');
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['widget-preferences', user.id] });
      }
    },
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (newOrder: string[]) => {
      if (user) {
        // Update all sort_orders
        const updates = newOrder.map((code, index) => ({
          user_id: user.id,
          widget_code: code,
          sort_order: index,
          enabled: preferences.find(p => p.widget_code === code)?.enabled ?? false,
          config_json: {},
        }));
        
        for (const update of updates) {
          const { error } = await supabase
            .from('widget_preferences')
            .upsert(update, { onConflict: 'user_id,widget_code' });
          
          if (error) throw error;
        }
      }
      return newOrder;
    },
    onMutate: async (newOrder) => {
      if (user) {
        await queryClient.cancelQueries({ queryKey: ['widget-preferences', user.id] });
      }
      
      const newPrefs = newOrder.map((code, index) => ({
        ...preferences.find(p => p.widget_code === code)!,
        sort_order: index,
      }));
      
      if (!user) {
        setLocalPreferences(newPrefs);
        saveToStorage(newPrefs);
      }
      
      return { previousPrefs: preferences };
    },
    onError: (err, variables, context) => {
      if (!user && context?.previousPrefs) {
        setLocalPreferences(context.previousPrefs);
        saveToStorage(context.previousPrefs);
      }
      toast.error('Reihenfolge konnte nicht gespeichert werden');
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['widget-preferences', user.id] });
      }
    },
  });

  // Public API
  const toggleWidget = useCallback((code: string, enabled: boolean) => {
    toggleMutation.mutate({ code, enabled });
  }, [toggleMutation]);

  const updateOrder = useCallback((newOrder: string[]) => {
    updateOrderMutation.mutate(newOrder);
  }, [updateOrderMutation]);

  const resetToDefaults = useCallback(async () => {
    const defaults = getDefaultPreferences();
    
    if (user) {
      // Delete all and re-insert
      await supabase
        .from('widget_preferences')
        .delete()
        .eq('user_id', user.id);
      
      for (const pref of defaults) {
        await supabase.from('widget_preferences').insert({
          user_id: user.id,
          widget_code: pref.widget_code,
          enabled: pref.enabled,
          sort_order: pref.sort_order,
          config_json: pref.config_json || {},
        } as any);
      }
      
      queryClient.invalidateQueries({ queryKey: ['widget-preferences', user.id] });
    } else {
      setLocalPreferences(defaults);
      saveToStorage(defaults);
    }
    
    toast.success('Einstellungen zurückgesetzt');
  }, [user, queryClient]);

  return {
    preferences,
    enabledWidgets,
    isLoading: user ? isLoading : false,
    toggleWidget,
    updateOrder,
    resetToDefaults,
    isUpdating: toggleMutation.isPending || updateOrderMutation.isPending,
  };
}
