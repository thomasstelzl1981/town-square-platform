/**
 * WidgetsTab — KI-Office Widgets Management
 * 
 * Two tabs:
 * 1. Systemwidgets - Configure dashboard system widgets
 * 2. Aufgabenwidgets - Archive of completed Armstrong widgets
 * 
 * NOTE: Recherche wurde nach MOD-14 Communication Pro verschoben
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Mail, 
  MailOpen,
  Bell,
  CheckSquare,
  Search,
  StickyNote,
  FolderKanban,
  Lightbulb,
  Layers,
  RefreshCw,
  CheckCircle,
  XCircle,
  Inbox,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Widget, TaskWidgetType, WidgetStatus } from '@/types/widget';
import { WIDGET_CONFIGS } from '@/types/widget';
import { useIsMobile } from '@/hooks/use-mobile';
import { SystemWidgetsTab } from './SystemWidgetsTab';

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
};

// Demo data - will be replaced with React Query hook
const DEMO_COMPLETED_WIDGETS: Widget[] = [
  {
    id: 'completed-1',
    type: 'letter',
    title: 'Brief an Max Müller',
    description: 'Mieterhöhung zum 01.04.2026',
    status: 'completed',
    risk_level: 'medium',
    cost_model: 'free',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'completed-2',
    type: 'reminder',
    title: 'Vertrag prüfen',
    description: 'Mietvertrag Hauptstr. 5',
    status: 'completed',
    risk_level: 'low',
    cost_model: 'free',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cancelled-1',
    type: 'idea',
    title: 'Balkonsanierung',
    description: 'Konzept erstellen',
    status: 'cancelled',
    risk_level: 'low',
    cost_model: 'free',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function TaskWidgetsContent() {
  const isMobile = useIsMobile();
  const [widgets] = useState<Widget[]>(DEMO_COMPLETED_WIDGETS);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredWidgets = widgets.filter((widget) => {
    if (typeFilter !== 'all' && widget.type !== typeFilter) return false;
    if (statusFilter !== 'all' && widget.status !== statusFilter) return false;
    return true;
  });

  const handleRepeat = (widgetId: string) => {
    console.log('Repeat widget:', widgetId);
  };

  return (
    <div className={isMobile ? "p-4" : "p-4 md:p-6 lg:p-8"}>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className={isMobile ? "text-lg font-semibold" : "text-h2"}>Erledigte Widgets</h2>
        </div>
        
        <div className={cn(
          "flex gap-2",
          isMobile ? "flex-col" : "flex-row items-center"
        )}>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className={cn(
              "h-9 text-xs",
              isMobile ? "w-full" : "w-[140px]"
            )}>
              <SelectValue placeholder="Typ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              <SelectItem value="letter">Brief</SelectItem>
              <SelectItem value="email">E-Mail</SelectItem>
              <SelectItem value="reminder">Erinnerung</SelectItem>
              <SelectItem value="task">Aufgabe</SelectItem>
              <SelectItem value="research">Recherche</SelectItem>
              <SelectItem value="note">Notiz</SelectItem>
              <SelectItem value="project">Projekt</SelectItem>
              <SelectItem value="idea">Idee</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn(
              "h-9 text-xs",
              isMobile ? "w-full" : "w-[130px]"
            )}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="completed">Erledigt</SelectItem>
              <SelectItem value="cancelled">Abgebrochen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Widget List */}
      {filteredWidgets.length === 0 ? (
        <Card className="glass-card border-dashed border-muted-foreground/20">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Keine erledigten Widgets
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Widgets von Armstrong erscheinen hier nach Erledigung
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredWidgets.map((widget) => {
            const config = WIDGET_CONFIGS[widget.type];
            const Icon = WIDGET_ICONS[widget.type as TaskWidgetType] || Layers;
            const isCompleted = widget.status === 'completed';
            
            return (
              <Card 
                key={widget.id} 
                className="glass-card border-muted-foreground/10 hover:border-primary/20 transition-colors"
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    "bg-gradient-to-br",
                    config.gradient
                  )}>
                    <Icon className="h-4 w-4 text-foreground/70" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {widget.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {config.label_de}
                      </span>
                    </div>
                    {widget.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {widget.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                      {widget.completed_at 
                        ? format(new Date(widget.completed_at), 'dd.MM.yyyy HH:mm', { locale: de })
                        : format(new Date(widget.created_at), 'dd.MM.yyyy HH:mm', { locale: de })
                      }
                    </span>
                    
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[9px] h-5",
                        isCompleted 
                          ? "bg-status-success/10 text-status-success border-status-success/20"
                          : "bg-status-error/10 text-status-error border-status-error/20"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {isCompleted ? 'Erledigt' : 'Abgebr.'}
                    </Badge>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRepeat(widget.id)}
                      className="h-7 w-7 p-0"
                      title="Wiederholen"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function WidgetsTab() {
  const isMobile = useIsMobile();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Widgets</h1>
        <p className="text-muted-foreground mt-1">System- und Aufgabenwidgets verwalten</p>
      </div>
    <Card className="glass-card overflow-hidden">
    <Tabs defaultValue="system" className="w-full">
      <div className="border-b px-4 pt-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="system" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Systemwidgets
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <Layers className="h-4 w-4" />
            Aufgaben
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="system" className="mt-0">
        <SystemWidgetsTab />
      </TabsContent>

      <TabsContent value="tasks" className="mt-0">
        <TaskWidgetsContent />
      </TabsContent>
    </Tabs>
    </Card>
    </div>
  );
}
