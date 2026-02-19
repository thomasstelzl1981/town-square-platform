/**
 * PostserviceCard — Nachsendeauftrag-Verwaltung
 * Extracted from EinstellungenTab for reuse in PosteingangTab
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function PostserviceCard() {
  const { user, activeTenantId } = useAuth();
  const queryClient = useQueryClient();

  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderAddress, setOrderAddress] = useState('');
  const [orderCity, setOrderCity] = useState('');
  const [orderPostalCode, setOrderPostalCode] = useState('');
  const [orderRecipientName, setOrderRecipientName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { data: mandates = [], isLoading: mandateLoading } = useQuery({
    queryKey: ['postservice-mandate', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('postservice_mandates')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .in('status', ['requested', 'setup_in_progress', 'active', 'paused'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const createMandate = useMutation({
    mutationFn: async () => {
      if (!activeTenantId || !user?.id) throw new Error('Nicht angemeldet');
      const { error } = await supabase.from('postservice_mandates').insert({
        tenant_id: activeTenantId,
        requested_by_user_id: user.id,
        type: 'postservice_forwarding',
        status: 'active',
        payload_json: { recipient_name: orderRecipientName, address: orderAddress, city: orderCity, postal_code: orderPostalCode },
        contract_terms: { duration_months: 12, monthly_credits: 30, billing_mode: 'annual_prepay', cost_per_letter: 3 },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postservice-mandate'] });
      queryClient.invalidateQueries({ queryKey: ['postservice-mandate-active'] });
      setShowOrderDialog(false);
      setOrderRecipientName('');
      setOrderAddress('');
      setOrderCity('');
      setOrderPostalCode('');
      setAcceptedTerms(false);
      toast.success('Postservice aktiviert – Ihre Inbound-E-Mail-Adresse wird generiert.');
    },
    onError: () => toast.error('Fehler beim Aktivieren'),
  });

  const cancelMandate = useMutation({
    mutationFn: async (mandateId: string) => {
      const { error } = await supabase
        .from('postservice_mandates')
        .update({ status: 'cancelled' })
        .eq('id', mandateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postservice-mandate'] });
      toast.success('Nachsendeauftrag widerrufen');
    },
  });

  const getMandateStatusBadge = (status: string) => {
    const map: Record<string, { icon: typeof Clock; label: string; cls: string }> = {
      requested: { icon: Clock, label: 'Eingereicht', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
      setup_in_progress: { icon: Loader2, label: 'In Bearbeitung', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      active: { icon: CheckCircle, label: 'Aktiv', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
      paused: { icon: AlertCircle, label: 'Pausiert', cls: 'border-border text-muted-foreground' },
      cancelled: { icon: AlertCircle, label: 'Widerrufen', cls: 'border-border text-muted-foreground' },
    };
    const cfg = map[status];
    if (!cfg) return null;
    const Icon = cfg.icon;
    return (
      <Badge variant="outline" className={cfg.cls}>
        <Icon className={`h-3 w-3 mr-1 ${status === 'setup_in_progress' ? 'animate-spin' : ''}`} />
        {cfg.label}
      </Badge>
    );
  };

  return (
    <>
      <Card className="glass-card flex flex-col overflow-hidden">
        <div className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Digitaler Postservice</h3>
              <p className="text-xs text-muted-foreground">Nachsendeauftrag für physische Post</p>
            </div>
          </div>
        </div>

        <CardContent className="flex-1 p-6 space-y-4">
          {mandateLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Laden...</span>
            </div>
          ) : (
            <>
              {mandates.map((m) => {
                const payload = m.payload_json as { recipient_name?: string; address?: string; postal_code?: string; city?: string } | null;
                return (
                  <div key={m.id} className="rounded-xl border border-border/50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {payload?.recipient_name || 'Unbekannter Empfänger'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[payload?.address, [payload?.postal_code, payload?.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      {getMandateStatusBadge(m.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Postfach: <span className="font-mono font-medium text-foreground">{activeTenantId?.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Kosten: 30 Credits/Monat · 3 Credits/Brief
                    </div>
                    {['requested', 'setup_in_progress', 'active'].includes(m.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelMandate.mutate(m.id)}
                        disabled={cancelMandate.isPending}
                        className="text-destructive hover:text-destructive w-full"
                      >
                        Widerrufen
                      </Button>
                    )}
                  </div>
                );
              })}

              <Button onClick={() => setShowOrderDialog(true)} variant={mandates.length > 0 ? 'outline' : 'default'} className="w-full">
                {mandates.length > 0 ? '+ Weiteren Postservice einrichten' : 'Postservice aktivieren'}
              </Button>

              <div className="p-3 rounded-xl bg-muted/50 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-medium text-foreground text-sm mb-1">Kostenmodell</p>
                <p>• 30 Credits / Monat (Grundgebühr)</p>
                <p>• 3 Credits pro zugestelltem Brief</p>
                <p>• Mindestlaufzeit: 12 Monate</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={(open) => { setShowOrderDialog(open); if (!open) setAcceptedTerms(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Postservice aktivieren</DialogTitle>
            <DialogDescription>
              Schließen Sie den Vertrag ab, um Ihre persönliche Inbound-E-Mail-Adresse zu erhalten.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Empfängername</Label>
              <Input value={orderRecipientName} onChange={(e) => setOrderRecipientName(e.target.value)} placeholder="Max Mustermann / Firma GmbH" />
            </div>
            <div className="space-y-2">
              <Label>Straße und Hausnummer</Label>
              <Input value={orderAddress} onChange={(e) => setOrderAddress(e.target.value)} placeholder="Musterstraße 1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>PLZ</Label>
                <Input value={orderPostalCode} onChange={(e) => setOrderPostalCode(e.target.value)} placeholder="10115" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Stadt</Label>
                <Input value={orderCity} onChange={(e) => setOrderCity(e.target.value)} placeholder="Berlin" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
              <p className="font-semibold text-sm">Vereinbarung über den digitalen Postservice</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• <strong>Leistung:</strong> Empfang und Verarbeitung digitaler Post über eine persönliche Inbound-E-Mail-Adresse</p>
                <p>• <strong>Grundgebühr:</strong> 30 Credits / Monat (360 Credits jährlich)</p>
                <p>• <strong>Verarbeitungskosten:</strong> 3 Credits pro zugestelltem Dokument</p>
                <p>• <strong>Mindestlaufzeit:</strong> 12 Monate</p>
                <p>• <strong>Kündigung:</strong> Zum Ende der Laufzeit mit 30 Tagen Vorlauf</p>
                <p>• <strong>Datenschutz:</strong> Eingehende Dokumente werden verschlüsselt verarbeitet und ausschließlich in Ihrem Tenant-DMS gespeichert</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/50 text-sm">
              <span className="text-muted-foreground">Postfach-Nummer: </span>
              <span className="font-mono font-medium">{activeTenantId?.slice(0, 8).toUpperCase()}</span>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-primary text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">
                Ich habe die Vertragsbedingungen gelesen und akzeptiere die Vereinbarung über den digitalen Postservice.
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowOrderDialog(false); setAcceptedTerms(false); }}>Abbrechen</Button>
            <Button
              onClick={() => createMandate.mutate()}
              disabled={createMandate.isPending || !orderRecipientName || !orderAddress || !orderCity || !acceptedTerms}
            >
              {createMandate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Vertrag abschließen & aktivieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
