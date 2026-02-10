import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Cpu, Mail, HardDrive, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function EinstellungenTab() {
  const { user, activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [ocrEnabled, setOcrEnabled] = useState(true);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderAddress, setOrderAddress] = useState('');
  const [orderCity, setOrderCity] = useState('');
  const [orderPostalCode, setOrderPostalCode] = useState('');

  // Fetch existing mandate for this tenant
  const { data: mandate, isLoading: mandateLoading } = useQuery({
    queryKey: ['postservice-mandate', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data, error } = await supabase
        .from('postservice_mandates')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!activeTenantId,
  });

  // Create mandate mutation
  const createMandate = useMutation({
    mutationFn: async () => {
      if (!activeTenantId || !user?.id) throw new Error('Nicht angemeldet');
      const { error } = await supabase.from('postservice_mandates').insert({
        tenant_id: activeTenantId,
        requested_by_user_id: user.id,
        type: 'postservice_forwarding',
        status: 'requested',
        payload_json: {
          address: orderAddress,
          city: orderCity,
          postal_code: orderPostalCode,
        },
        contract_terms: {
          duration_months: 12,
          monthly_credits: 30,
          billing_mode: 'annual_prepay',
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postservice-mandate'] });
      setShowOrderDialog(false);
      toast.success('Nachsendeauftrag eingereicht');
    },
    onError: () => {
      toast.error('Fehler beim Einreichen');
    },
  });

  // Cancel mandate mutation
  const cancelMandate = useMutation({
    mutationFn: async () => {
      if (!mandate) return;
      const { error } = await supabase
        .from('postservice_mandates')
        .update({ status: 'cancelled' })
        .eq('id', mandate.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postservice-mandate'] });
      toast.success('Nachsendeauftrag widerrufen');
    },
  });

  const getMandateStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Eingereicht
          </Badge>
        );
      case 'setup_in_progress':
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            In Bearbeitung
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aktiv
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pausiert
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Widerrufen
          </Badge>
        );
      default:
        return null;
    }
  };

  const activeMandateExists = mandate && !['cancelled'].includes(mandate.status);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Kachel A: Speicherplatz */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Speicherplatz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Verwendet</span>
              <span className="font-medium">0 MB von 5 GB</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '0%' }} />
            </div>
            <div className="text-xs text-muted-foreground">
              Upgrade auf einen höheren Plan für mehr Speicherplatz
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kachel B: Digitaler Postservice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Digitaler Postservice
          </CardTitle>
          <CardDescription>
            Nachsendeauftrag für Ihre physische Post — digital zugestellt in Ihren DMS-Posteingang
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mandateLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Laden...
            </div>
          ) : activeMandateExists ? (
            // Show mandate status
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Nachsendeauftrag</div>
                  <div className="text-sm text-muted-foreground">
                    Postfach-Nr.: {activeTenantId?.slice(0, 8).toUpperCase()}
                  </div>
                </div>
                {getMandateStatusBadge(mandate!.status)}
              </div>

              {mandate!.status === 'requested' && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <div className="font-medium mb-1">Auftrag eingereicht</div>
                  <div className="text-muted-foreground">
                    Einrichtung erfolgt durch den Administrator. Sie werden benachrichtigt, sobald der Service aktiv ist.
                  </div>
                </div>
              )}

              {mandate!.status === 'setup_in_progress' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm">
                  <div className="font-medium mb-1">Einrichtung läuft</div>
                  <div className="text-muted-foreground">
                    Ihr Postservice wird gerade eingerichtet. Bitte haben Sie etwas Geduld.
                  </div>
                </div>
              )}

              {mandate!.status === 'active' && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-sm">
                  <div className="font-medium mb-1 text-green-700 dark:text-green-400">Post wird weitergeleitet</div>
                  <div className="text-muted-foreground">
                    Eingehende Post wird automatisch in Ihren DMS-Posteingang zugestellt.
                  </div>
                </div>
              )}

              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="font-medium mb-1">Kostenmodell</div>
                <div className="text-muted-foreground space-y-1">
                  <div>• 30 Credits / Monat (Grundgebühr)</div>
                  <div>• 3 Credits pro zugestelltem Brief</div>
                  <div>• Mindestlaufzeit: 12 Monate</div>
                </div>
              </div>

              {['requested', 'setup_in_progress', 'active'].includes(mandate!.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancelMandate.mutate()}
                  disabled={cancelMandate.isPending}
                  className="text-destructive"
                >
                  Nachsendeauftrag widerrufen
                </Button>
              )}
            </div>
          ) : (
            // Show order form CTA
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="font-medium mb-1">So funktioniert's:</div>
                <div className="text-muted-foreground space-y-1">
                  <div>1. Nachsendeauftrag einreichen</div>
                  <div>2. Administrator richtet Ihren digitalen Postkasten ein</div>
                  <div>3. Eingehende Post wird automatisch in Ihren DMS-Posteingang zugestellt</div>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="font-medium mb-1">Kosten</div>
                <div className="text-muted-foreground space-y-1">
                  <div>• 30 Credits / Monat (Mindestlaufzeit 12 Monate)</div>
                  <div>• 3 Credits pro zugestelltem Brief</div>
                  <div>• Jährliche Vorauszahlung: 360 Credits</div>
                </div>
              </div>

              <Button onClick={() => setShowOrderDialog(true)}>
                Nachsendeauftrag einrichten
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kachel C: Dokumenten-Auslesung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Dokumenten-Auslesung (OCR / KI)
          </CardTitle>
          <CardDescription>
            KI-gestützte Texterkennung und Datenextraktion aus Dokumenten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Dokumenten-Auslesung aktivieren</div>
              <div className="text-sm text-muted-foreground">
                Ermöglicht automatische Texterkennung und Vorsortierung
              </div>
            </div>
            <Switch
              checked={ocrEnabled}
              onCheckedChange={setOcrEnabled}
            />
          </div>

          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="font-medium mb-1">Kosten</div>
            <div className="text-muted-foreground">
              1 Credit pro Dokument-Auslesung
            </div>
          </div>

          {ocrEnabled && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="font-medium mb-1">Unterstützte Formate:</div>
              <div className="text-muted-foreground">
                PDF, Word (DOC/DOCX), Excel (XLS/XLSX), Bilder (JPG/PNG), E-Mails (EML)
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nachsendeauftrag einrichten</DialogTitle>
            <DialogDescription>
              Geben Sie die Adresse an, von der die Post umgeleitet werden soll.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Straße und Hausnummer</Label>
              <Input
                value={orderAddress}
                onChange={(e) => setOrderAddress(e.target.value)}
                placeholder="Musterstraße 1"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>PLZ</Label>
                <Input
                  value={orderPostalCode}
                  onChange={(e) => setOrderPostalCode(e.target.value)}
                  placeholder="10115"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Stadt</Label>
                <Input
                  value={orderCity}
                  onChange={(e) => setOrderCity(e.target.value)}
                  placeholder="Berlin"
                />
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <div className="font-medium">Vertragsbedingungen:</div>
              <div className="text-muted-foreground">• Laufzeit: 12 Monate</div>
              <div className="text-muted-foreground">• 30 Credits / Monat (360 Credits jährlich im Voraus)</div>
              <div className="text-muted-foreground">• 3 Credits pro zugestelltem Brief</div>
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="text-muted-foreground">
                Postfach-Nummer: <span className="font-mono font-medium">{activeTenantId?.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => createMandate.mutate()}
              disabled={createMandate.isPending || !orderAddress || !orderCity}
            >
              {createMandate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Auftrag einreichen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
