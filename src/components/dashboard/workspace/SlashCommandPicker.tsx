/**
 * SlashCommandPicker — Popup for "/" tool picker in Armstrong Workspace
 * Filters actions from armstrongManifest by context and search query
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  getActionsForZone, 
  getActionsForModule,
  isTop30MvpAction,
  type ArmstrongActionV2 
} from '@/manifests/armstrongManifest';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Zap,
  FileText,
  Eye,
  Shield,
  Sparkles,
} from 'lucide-react';

interface SlashCommandPickerProps {
  query: string;
  currentModule: string | null;
  onSelect: (action: ArmstrongActionV2) => void;
  onClose: () => void;
}

const RISK_ICONS: Record<string, React.ReactNode> = {
  low: <Zap className="h-3 w-3 text-emerald-500" />,
  medium: <Eye className="h-3 w-3 text-amber-500" />,
  high: <Shield className="h-3 w-3 text-destructive" />,
};

const MODE_LABELS: Record<string, string> = {
  readonly: 'Lesen',
  execute: 'Direkt',
  execute_with_confirmation: 'Bestätigung',
  draft_only: 'Entwurf',
};

export function SlashCommandPicker({ query, currentModule, onSelect, onClose }: SlashCommandPickerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const allActions = useMemo(() => {
    const z2Actions = getActionsForZone('Z2');
    return z2Actions;
  }, []);

  const filteredActions = useMemo(() => {
    const search = query.toLowerCase().trim();
    
    let actions = allActions;

    // If there's a module context, prioritize module-specific actions
    if (currentModule && !search) {
      const moduleActions = getActionsForModule(currentModule);
      const globalActions = allActions.filter(a => !a.module);
      // Module actions first, then globals
      actions = [...moduleActions, ...globalActions.filter(g => !moduleActions.some(m => m.action_code === g.action_code))];
    }

    if (search) {
      actions = actions.filter(a =>
        a.title_de.toLowerCase().includes(search) ||
        a.description_de.toLowerCase().includes(search) ||
        a.action_code.toLowerCase().includes(search)
      );
    }

    // Sort: Top30 MVP first, then by title
    return actions.sort((a, b) => {
      const aTop = isTop30MvpAction(a.action_code) ? 0 : 1;
      const bTop = isTop30MvpAction(b.action_code) ? 0 : 1;
      if (aTop !== bTop) return aTop - bTop;
      return a.title_de.localeCompare(b.title_de, 'de');
    }).slice(0, 20); // Cap at 20 results
  }, [allActions, query, currentModule]);

  // Reset selection on filter change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredActions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filteredActions[selectedIndex]) {
        e.preventDefault();
        onSelect(filteredActions[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredActions, selectedIndex, onSelect, onClose]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (filteredActions.length === 0) {
    return (
      <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border rounded-xl shadow-lg p-3 z-50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Search className="h-3.5 w-3.5" />
          <span>Keine Aktionen gefunden für „{query}"</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">Aktionen</span>
        {currentModule && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">
            {currentModule}
          </Badge>
        )}
      </div>

      {/* Action list */}
      <ScrollArea className="max-h-[280px]">
        <div ref={listRef} className="p-1">
          {filteredActions.map((action, idx) => (
            <button
              key={action.action_code}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-start gap-2.5',
                idx === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'
              )}
              onClick={() => onSelect(action)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div className="mt-0.5 shrink-0">
                {RISK_ICONS[action.risk_level] || <FileText className="h-3 w-3" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium truncate">{action.title_de}</span>
                  {isTop30MvpAction(action.action_code) && (
                    <Sparkles className="h-2.5 w-2.5 text-primary shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {action.description_de}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-0.5 mt-0.5">
                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                  {MODE_LABELS[action.execution_mode] || action.execution_mode}
                </Badge>
                {action.cost_model !== 'free' && (
                  <span className="text-[9px] text-muted-foreground">
                    {action.cost_hint_cents ? `${(action.cost_hint_cents / 100).toFixed(2)}€` : 'Credits'}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-border/30 text-[10px] text-muted-foreground flex gap-3">
        <span>↑↓ Navigation</span>
        <span>↵ Auswählen</span>
        <span>Esc Schließen</span>
      </div>
    </div>
  );
}
