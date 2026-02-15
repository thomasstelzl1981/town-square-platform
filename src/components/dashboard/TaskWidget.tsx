/**
 * TaskWidget — Square widget card for Armstrong task actions
 * 
 * DESIGN SPEC:
 * - Displays task info in a compact square layout (aspect-square)
 * - Actions: Two round glass buttons at bottom center + delete top-right
 *   - Left: X (cancel/reject) - outline style, hover destructive
 *   - Right: ✓ (approve/confirm) - primary tint, glass effect
 *   - Top-right: Trash2 (delete) - small, with AlertDialog confirmation
 * - No text labels on buttons, only icons
 * - Glass morphism: backdrop-blur-sm, semi-transparent backgrounds
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Mail, 
  MailOpen,
  Bell,
  CheckSquare,
  Search,
  StickyNote,
  FolderKanban,
  Lightbulb,
  FileText,
  Send,
  Check, 
  X, 
  Loader2,
  Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Widget, TaskWidgetType } from '@/types/widget';
import { WIDGET_CONFIGS } from '@/types/widget';

// Icon mapping
const WIDGET_ICONS: Record<TaskWidgetType, typeof Mail> = {
  letter: Mail,
  email: MailOpen,
  reminder: Bell,
  task: CheckSquare,
  research: Search,
  note: StickyNote,
  project: FolderKanban,
  idea: Lightbulb,
  meeting_protocol: FileText,
};


interface TaskWidgetProps {
  widget: Widget;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete?: (id: string) => void;
  isExecuting?: boolean;
}

export function TaskWidget({ 
  widget, 
  onConfirm, 
  onCancel,
  onDelete,
  isExecuting = false 
}: TaskWidgetProps) {
  const config = WIDGET_CONFIGS[widget.type];
  const Icon = WIDGET_ICONS[widget.type as TaskWidgetType] || Send;

  return (
    <Card className="glass-card border-primary/20 aspect-square relative overflow-hidden">
      {/* Gradient Overlay */}
      <div 
        className={cn(
          "absolute inset-0 opacity-30 pointer-events-none bg-gradient-to-br",
          config.gradient
        )}
      />
      
      <CardContent className="p-4 h-full flex flex-col relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              {config.label_de}
            </span>
          </div>
          
          {/* Delete Button */}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Löschen"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Widget löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    „{widget.title}" wird unwiderruflich gelöscht.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(widget.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        
        {/* Title & Description */}
        <div className="flex-1 min-h-0">
          <h4 className="font-medium text-base text-foreground truncate">
            {widget.title}
          </h4>
          {widget.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {widget.description}
            </p>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-auto pt-2">
          
          {/* Action Buttons - Two round glass buttons */}
          <div className="flex items-center justify-center gap-4">
            {/* Cancel Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel(widget.id);
              }}
              disabled={isExecuting}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                "bg-background/60 backdrop-blur-sm border border-muted-foreground/20",
                "hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-label="Abbrechen"
            >
              <X className="h-5 w-5" />
            </button>
            
            {/* Confirm Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfirm(widget.id);
              }}
              disabled={isExecuting}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                "bg-primary/10 backdrop-blur-sm border border-primary/30",
                "hover:bg-primary/20 hover:border-primary/50 text-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-label="Freigeben"
            >
              {isExecuting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
