/**
 * PendingActionsWidget — Dashboard widget showing pending Armstrong actions
 * Displays actions awaiting user confirmation (approve/cancel)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PendingActionCard } from './PendingActionCard';

// Demo data - will be replaced with React Query hook later
interface PendingAction {
  id: string;
  action_code: string;
  title: string;
  description?: string;
  parameters?: Record<string, unknown>;
  risk_level: 'low' | 'medium' | 'high';
  cost_model: 'free' | 'metered' | 'premium';
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
}

const initialDemoActions: PendingAction[] = [
  {
    id: 'demo-1',
    action_code: 'ARM.MOD02.SEND_LETTER',
    title: 'Brief an Max Müller',
    description: 'Mieterhöhung zum 01.04.2026',
    parameters: {
      recipient: 'Max Müller',
      subject: 'Mieterhöhung',
      channel: 'email',
    },
    risk_level: 'medium',
    cost_model: 'free',
    status: 'pending',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
  },
];

interface PendingActionsWidgetProps {
  className?: string;
}

export function PendingActionsWidget({ className }: PendingActionsWidgetProps) {
  const [actions, setActions] = useState<PendingAction[]>(initialDemoActions);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const pendingActions = actions.filter(a => a.status === 'pending');

  const handleConfirm = async (actionId: string) => {
    setExecutingId(actionId);
    
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update action status
    setActions(prev => 
      prev.map(a => 
        a.id === actionId 
          ? { ...a, status: 'completed' as const } 
          : a
      )
    );
    
    setExecutingId(null);
    toast.success('Aktion erfolgreich ausgeführt', {
      description: 'Der Brief wurde zur Sendung freigegeben.',
    });
  };

  const handleCancel = (actionId: string) => {
    setActions(prev => 
      prev.map(a => 
        a.id === actionId 
          ? { ...a, status: 'cancelled' as const } 
          : a
      )
    );
    
    toast.info('Aktion abgebrochen', {
      description: 'Die Aktion wurde nicht ausgeführt.',
    });
  };

  // Don't render if no pending actions
  if (pendingActions.length === 0) {
    return null;
  }

  return (
    <Card className={cn("glass-card border-primary/20 relative overflow-hidden", className)}>
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, transparent 50%, hsl(var(--accent) / 0.05) 100%)'
        }}
      />
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">
              Ausstehende Aktionen
            </CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px] h-5 px-2">
            {pendingActions.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 relative z-10 space-y-3">
        {pendingActions.map((action) => (
          <PendingActionCard
            key={action.id}
            id={action.id}
            action_code={action.action_code}
            title={action.title}
            description={action.description}
            parameters={action.parameters}
            risk_level={action.risk_level}
            cost_model={action.cost_model}
            created_at={action.created_at}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            isExecuting={executingId === action.id}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// Empty state component for when there are no pending actions
export function PendingActionsEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn("glass-card border-dashed border-muted-foreground/20", className)}>
      <CardContent className="py-6 flex flex-col items-center justify-center text-center">
        <Inbox className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          Keine ausstehenden Aktionen
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Armstrong wird hier Aktionen zur Freigabe anzeigen
        </p>
      </CardContent>
    </Card>
  );
}
