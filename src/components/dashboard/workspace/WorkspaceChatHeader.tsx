/**
 * WorkspaceChatHeader — Top bar of the Armstrong chat column
 * Extracted from ArmstrongWorkspace R-28
 */
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArmstrongOrb, type OrbState } from '@/components/chat/ArmstrongOrb';
import { Button } from '@/components/ui/button';
import { PanelLeftOpen, PanelRightOpen, VolumeX, Trash2 } from 'lucide-react';
import type { ArmstrongProject } from '@/hooks/useArmstrongProjects';

interface Props {
  activeProject: ArmstrongProject | null;
  orbState: OrbState;
  hasMessages: boolean;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  isSpeaking: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onStopSpeaking: () => void;
  onClear: () => void;
}

export function WorkspaceChatHeader({
  activeProject, orbState, hasMessages, showLeftPanel, showRightPanel,
  isSpeaking, onToggleLeft, onToggleRight, onStopSpeaking, onClear,
}: Props) {
  const isMobile = useIsMobile();

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', !isMobile && showLeftPanel && 'text-primary')}
          onClick={onToggleLeft}
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
        <ArmstrongOrb state={orbState} size={24} />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-wide truncate">
            {activeProject ? activeProject.title : 'Armstrong'}
          </h3>
          {activeProject?.goal && (
            <p className="text-[10px] text-muted-foreground truncate">{activeProject.goal}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {isSpeaking && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary" onClick={onStopSpeaking}>
            <VolumeX className="h-4 w-4" />
          </Button>
        )}
        {hasMessages && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClear} title="Gespräch löschen">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', !isMobile && showRightPanel && 'text-primary')}
          onClick={onToggleRight}
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
