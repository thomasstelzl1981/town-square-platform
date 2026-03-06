/**
 * SendToObjekteingangButton — Forward email to Objekteingang (acq_offers)
 * Only rendered when MOD-12 is active for the user's tenant.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, Loader2, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsModuleActive } from '@/hooks/useIsModuleActive';
import { toast } from 'sonner';

interface Props {
  email: {
    id: string;
    subject?: string;
    from_name?: string;
    from_address?: string;
    body_text?: string;
    snippet?: string;
    received_at?: string;
    attachments?: any;
  };
  variant?: 'icon' | 'full';
}

export function SendToObjekteingangButton({ email, variant = 'icon' }: Props) {
  const { data: isAcqActive } = useIsModuleActive('MOD-12');
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId) throw new Error('Kein Mandant aktiv');

      const title = email.subject || 'Objekt aus E-Mail';
      const providerName = email.from_name || email.from_address || 'Unbekannt';
      const notes = `Weitergeleitet aus E-Mail: "${email.subject || '(Kein Betreff)'}"\nVon: ${email.from_name || ''} <${email.from_address || ''}>\nDatum: ${email.received_at ? new Date(email.received_at).toLocaleString('de-DE') : 'Unbekannt'}`;

      const { error } = await supabase.from('acq_offers').insert({
        tenant_id: activeTenantId,
        title,
        provider_name: providerName,
        provider_contact: email.from_address || null,
        source_type: 'inbound_email' as const,
        notes,
        status: 'new' as const,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setSent(true);
      toast.success('An Objekteingang gesendet');
      queryClient.invalidateQueries({ queryKey: ['acq-offers'] });
    },
    onError: (err: any) => {
      toast.error('Fehler: ' + (err.message || 'Unbekannt'));
    },
  });

  if (!isAcqActive) return null;

  if (variant === 'full') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1.5"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || sent}
      >
        {mutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : sent ? (
          <Check className="h-3 w-3 text-primary" />
        ) : (
          <Building2 className="h-3 w-3" />
        )}
        {sent ? 'Gesendet' : 'An Objekteingang'}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      title="An Objekteingang senden"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending || sent}
    >
      {mutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : sent ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Building2 className="h-4 w-4" />
      )}
    </Button>
  );
}
