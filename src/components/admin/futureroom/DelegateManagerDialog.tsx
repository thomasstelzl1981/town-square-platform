/**
 * Zone-1 FutureRoom - Delegate Manager Dialog
 * 
 * Dialog to select a finance_manager and delegate a mandate.
 * Creates audit event on delegation.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCheck, Users, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDelegateMandate } from '@/hooks/useFinanceMandate';
import { useAuth } from '@/contexts/AuthContext';

interface DelegateManagerDialogProps {
  mandateId: string;
  onDelegated?: () => void;
}

export function DelegateManagerDialog({ mandateId, onDelegated }: DelegateManagerDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedManagerId, setSelectedManagerId] = React.useState<string | null>(null);
  const delegateMandate = useDelegateMandate();
  const { user } = useAuth();

  // Fetch users with finance_manager role
  // In a real implementation, this would query user_roles or a similar table
  const { data: managers, isLoading: loadingManagers } = useQuery({
    queryKey: ['finance-managers'],
    queryFn: async () => {
      // For now, fetch from profiles and simulate role filtering
      // TODO: Replace with actual role-based query when user_roles table is available
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .limit(10);

      if (error) throw error;
      
      // Simulate adding role info
      return (data || []).map(p => ({
        ...p,
        role: 'finance_manager',
      }));
    },
    enabled: open,
  });

  const handleDelegate = async () => {
    if (!selectedManagerId) return;

    try {
      await delegateMandate.mutateAsync({
        mandateId,
        managerId: selectedManagerId,
      });

      // Create audit event
      if (user?.id) {
        await supabase.from('audit_events').insert({
          actor_user_id: user.id,
          event_type: 'mandate_delegated',
          payload: {
            mandate_id: mandateId,
            assigned_manager_id: selectedManagerId,
          },
        });
      }

      setOpen(false);
      setSelectedManagerId(null);
      onDelegated?.();
    } catch (error) {
      console.error('Delegation failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          Zuweisen
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manager zuweisen
          </DialogTitle>
          <DialogDescription>
            Wählen Sie einen Finanzierungsmanager, der das Mandat bearbeiten soll.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loadingManagers ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !managers || managers.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              Keine Finanzierungsmanager verfügbar
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {managers.map((manager) => (
                <div
                  key={manager.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedManagerId === manager.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedManagerId(manager.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {manager.avatar_url ? (
                          <img 
                            src={manager.avatar_url} 
                            alt="" 
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <UserCheck className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {manager.display_name || `Manager ${manager.id.slice(0, 8)}`}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Finanzierungsmanager
                        </Badge>
                      </div>
                    </div>
                    {selectedManagerId === manager.id && (
                      <UserCheck className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleDelegate}
            disabled={!selectedManagerId || delegateMandate.isPending}
          >
            {delegateMandate.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="mr-2 h-4 w-4" />
            )}
            Zuweisen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
