/**
 * WhatsApp Armstrong Card — Owner-Control & Auto-Reply Settings
 * Extracted from AbrechnungTab for reuse in ArmstrongInfoPage
 */
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FormSection, FormInput } from '@/components/shared';
import { MessageSquare, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function WhatsAppArmstrongCard() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const { data: waSettings } = useQuery({
    queryKey: ['whatsapp-user-settings', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.from('whatsapp_user_settings').select('*').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: waAccount } = useQuery({
    queryKey: ['whatsapp-account'],
    queryFn: async () => {
      const { data, error } = await supabase.from('whatsapp_accounts').select('system_phone_e164, status').maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const [ownerControlE164, setOwnerControlE164] = React.useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = React.useState(false);
  const [autoReplyText, setAutoReplyText] = React.useState('Vielen Dank für Ihre Nachricht. Wir melden uns in Kürze.');

  React.useEffect(() => {
    if (waSettings) {
      setOwnerControlE164(waSettings.owner_control_e164 || '');
      setAutoReplyEnabled(waSettings.auto_reply_enabled || false);
      setAutoReplyText(waSettings.auto_reply_text || 'Vielen Dank für Ihre Nachricht. Wir melden uns in Kürze.');
    }
  }, [waSettings]);

  const saveWaSettings = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      const { data: tenantId } = await supabase.rpc('get_user_tenant_id');
      if (!tenantId) throw new Error('No organization found');
      const { error } = await supabase.from('whatsapp_user_settings').upsert({
        tenant_id: tenantId, user_id: userId,
        owner_control_e164: ownerControlE164 || null,
        auto_reply_enabled: autoReplyEnabled, auto_reply_text: autoReplyText,
      }, { onConflict: 'tenant_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['whatsapp-user-settings'] }); toast.success('WhatsApp gespeichert'); },
    onError: (error) => { toast.error('Fehler: ' + (error as Error).message); },
  });

  const statusColor = waAccount?.status === 'connected' ? 'text-green-600' :
    waAccount?.status === 'error' ? 'text-destructive' : 'text-yellow-600';
  const statusLabel = waAccount?.status === 'connected' ? 'Verbunden' :
    waAccount?.status === 'error' ? 'Fehler' : 'Ausstehend';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          WhatsApp Business
        </CardTitle>
        <CardDescription>Verbindung und Armstrong-Steuerung</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {waAccount ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusColor}>● {statusLabel}</Badge>
                </div>
                <FormSection>
                  <FormInput label="Systemnummer" name="system_phone" value={waAccount.system_phone_e164} disabled
                    hint="WhatsApp Business Nummer" />
                </FormSection>
              </>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Noch nicht konfiguriert</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <FormSection>
              <FormInput label="Owner-Control Nummer" name="owner_control_e164" type="tel"
                value={ownerControlE164} onChange={e => setOwnerControlE164(e.target.value)}
                placeholder="+49 170 1234567" hint="Für Armstrong-Befehle via WhatsApp" />
            </FormSection>
            <div className="flex items-center gap-2">
              <Switch id="auto-reply" checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
              <Label htmlFor="auto-reply" className="text-sm">Auto-Reply für Kundennachrichten</Label>
            </div>
            {autoReplyEnabled && (
              <Textarea value={autoReplyText} onChange={e => setAutoReplyText(e.target.value)}
                placeholder="Automatische Antwort…" rows={3} className="text-sm" />
            )}
            <Button size="sm" variant="outline" className="gap-1" onClick={() => saveWaSettings.mutate()} disabled={saveWaSettings.isPending}>
              {saveWaSettings.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Speichern
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
