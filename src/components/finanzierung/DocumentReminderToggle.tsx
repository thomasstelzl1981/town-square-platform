/**
 * MOD-07: Document Reminder Toggle
 * Allows users to enable/disable weekly document reminders
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DocumentReminderToggleProps {
  requestId?: string | null;
}

export function DocumentReminderToggle({ requestId }: DocumentReminderToggleProps) {
  const { activeTenantId, user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch current reminder setting
  const { data: reminder, isLoading } = useQuery({
    queryKey: ['document-reminder', activeTenantId, user?.id, requestId],
    queryFn: async () => {
      if (!activeTenantId || !user?.id) return null;

      let query = supabase
        .from('document_reminders')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('user_id', user.id);
      
      if (requestId) {
        query = query.eq('finance_request_id', requestId);
      } else {
        query = query.is('finance_request_id', null);
      }
      
      const { data } = await query.maybeSingle();

      return data;
    },
    enabled: !!activeTenantId && !!user?.id,
  });

  // Toggle reminder mutation
  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!activeTenantId || !user?.id) throw new Error('Not authenticated');

      if (enabled) {
        // Enable reminder
        const nextReminder = new Date();
        nextReminder.setDate(nextReminder.getDate() + 7); // 1 week from now

        const { error } = await supabase
          .from('document_reminders')
          .upsert({
            tenant_id: activeTenantId,
            user_id: user.id,
            finance_request_id: requestId || null,
            reminder_type: 'weekly',
            next_reminder_at: nextReminder.toISOString(),
          }, {
            onConflict: 'tenant_id,user_id,finance_request_id',
          });

        if (error) throw error;
      } else {
        // Disable reminder
        if (reminder?.id) {
          const { error } = await supabase
            .from('document_reminders')
            .update({ reminder_type: 'disabled' })
            .eq('id', reminder.id);

          if (error) throw error;
        }
      }
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['document-reminder'] });
      toast.success(enabled 
        ? 'Wöchentliche Erinnerung aktiviert' 
        : 'Erinnerung deaktiviert'
      );
      setOpen(false);
    },
    onError: (error) => {
      console.error('Toggle reminder error:', error);
      toast.error('Fehler beim Ändern der Einstellung');
    },
  });

  const isEnabled = reminder?.reminder_type === 'weekly';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={`gap-2 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`}
        >
          {isEnabled ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Erinnerung</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Dokumenten-Erinnerung</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Erhalten Sie wöchentlich eine E-Mail, wenn noch Pflichtdokumente fehlen.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="reminder-toggle" className="text-sm">
              Wöchentliche Erinnerung
            </Label>
            {isLoading || toggleMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Switch
                id="reminder-toggle"
                checked={isEnabled}
                onCheckedChange={(checked) => toggleMutation.mutate(checked)}
              />
            )}
          </div>

          {isEnabled && reminder?.next_reminder_at && (
            <p className="text-xs text-muted-foreground">
              Nächste Erinnerung: {new Date(reminder.next_reminder_at).toLocaleDateString('de-DE')}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DocumentReminderToggle;
