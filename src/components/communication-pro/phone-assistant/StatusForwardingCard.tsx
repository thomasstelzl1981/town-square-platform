import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Info, Phone, Search, ShoppingCart, Trash2, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { PhoneAssistantConfig } from '@/hooks/usePhoneAssistant';

interface Props {
  config: PhoneAssistantConfig;
  onUpdate: (u: Partial<PhoneAssistantConfig>) => void;
  onRefresh?: () => void;
  brandKey?: string;
}

interface AvailableNumber {
  phone_number: string;
  friendly_name: string;
  locality: string;
  type: string;
  capabilities: Record<string, boolean>;
}

const GSM_CODES = [
  { provider: 'Allgemein (GSM)', immediate: '**21*{nr}#', delayed: '**61*{nr}*11*30#', cancel: '##21#' },
  { provider: 'Telekom / Vodafone / O2', immediate: '**21*{nr}#', delayed: '**61*{nr}**30#', cancel: '##002#' },
];

export function StatusForwardingCard({ config, onUpdate, onRefresh, brandKey }: Props) {
  const [purchasing, setPurchasing] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

  const hasNumber = !!config.twilio_phone_number_e164;

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    pending: { label: 'Ausstehend', variant: 'secondary' },
    active: { label: 'Aktiv', variant: 'default' },
    error: { label: 'Fehler', variant: 'destructive' },
  };
  const s = statusMap[config.binding_status] ?? statusMap.pending;

  const handleSearchNumbers = async () => {
    setSearching(true);
    setAvailableNumbers([]);
    setSelectedNumber(null);
    setDialogOpen(true);
    try {
      const body: Record<string, string> = { action: 'search', country_code: 'DE' };
      if (brandKey) body.brand_key = brandKey;
      const { data, error } = await supabase.functions.invoke('sot-phone-provision', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAvailableNumbers(data.numbers ?? []);
      if (!data.numbers?.length) {
        toast({ title: 'Keine Nummern verfügbar', description: 'Bitte versuchen Sie es später erneut.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Fehler bei der Nummernsuche', description: err.message, variant: 'destructive' });
      setDialogOpen(false);
    } finally {
      setSearching(false);
    }
  };

  const handlePurchaseSelected = async () => {
    if (!selectedNumber) return;
    setPurchasing(true);
    try {
      const body: Record<string, string> = { action: 'purchase', country_code: 'DE', phone_number: selectedNumber };
      if (brandKey) body.brand_key = brandKey;
      const { data, error } = await supabase.functions.invoke('sot-phone-provision', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Nummer gekauft', description: data.phone_number });
      setDialogOpen(false);
      onRefresh?.();
    } catch (err: any) {
      toast({ title: 'Fehler beim Nummernkauf', description: err.message, variant: 'destructive' });
    } finally {
      setPurchasing(false);
    }
  };

  const handleRelease = async () => {
    setReleasing(true);
    try {
      const body: Record<string, string> = { action: 'release' };
      if (brandKey) body.brand_key = brandKey;
      const { data, error } = await supabase.functions.invoke('sot-phone-provision', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Nummer freigegeben' });
      onRefresh?.();
    } catch (err: any) {
      toast({ title: 'Fehler beim Freigeben', description: err.message, variant: 'destructive' });
    } finally {
      setReleasing(false);
    }
  };

  const copyNumber = () => {
    if (config.twilio_phone_number_e164) {
      navigator.clipboard.writeText(config.twilio_phone_number_e164);
      toast({ title: 'Nummer kopiert' });
    }
  };

  const formatPhone = (e164: string) => {
    if (e164.startsWith('+49')) {
      const rest = e164.slice(3);
      return `+49 ${rest.slice(0, rest.length > 7 ? rest.length - 7 : 0)} ${rest.slice(-7, -4)} ${rest.slice(-4)}`.replace(/\s+/g, ' ');
    }
    return e164;
  };

  return (
    <>
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-primary" />
            Status &amp; Rufweiterleitung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Assistent aktiv</span>
            <Switch checked={config.is_enabled} onCheckedChange={v => onUpdate({ is_enabled: v })} />
          </div>

          {/* Number management */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Weiterleitungs-Nummer</label>
            {hasNumber ? (
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={config.twilio_phone_number_e164 ?? ''}
                  className="flex-1 bg-muted/20 font-mono"
                />
                <Button variant="outline" size="icon" onClick={copyNumber} title="Nummer kopieren">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRelease}
                  disabled={releasing}
                  title="Nummer freigeben"
                  className="text-destructive hover:text-destructive"
                >
                  {releasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleSearchNumbers}
                disabled={searching}
                className="w-full"
                variant="default"
              >
                {searching ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Nummern werden gesucht…</>
                ) : (
                  <><Search className="h-4 w-4 mr-2" /> Deutsche Nummern suchen</>
                )}
              </Button>
            )}
            <Badge variant={s.variant} className="mt-1">{s.label}</Badge>
          </div>

          {/* Tier indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Tier:</span>
            <Badge variant={config.tier === 'premium' ? 'default' : 'secondary'} className="text-xs">
              {config.tier === 'premium' ? '⚡ Premium (ElevenLabs)' : '📞 Standard (Twilio)'}
            </Badge>
          </div>

          {/* GSM forwarding codes */}
          {hasNumber && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2">
              <div className="flex gap-2 text-xs font-medium text-foreground">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>GSM-Rufweiterleitung einrichten</span>
              </div>
              <div className="space-y-1.5 pl-6">
                {GSM_CODES.map((g) => (
                  <div key={g.provider} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{g.provider}:</span>
                    <div className="mt-0.5 space-y-0.5">
                      <div>
                        <span className="text-muted-foreground">Nach 30s: </span>
                        <code className="bg-muted px-1 rounded text-[11px]">
                          {g.delayed.replace('{nr}', config.twilio_phone_number_e164 || '')}
                        </code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sofort: </span>
                        <code className="bg-muted px-1 rounded text-[11px]">
                          {g.immediate.replace('{nr}', config.twilio_phone_number_e164 || '')}
                        </code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Deaktivieren: </span>
                        <code className="bg-muted px-1 rounded text-[11px]">{g.cancel}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info box when no number */}
          {!hasNumber && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 flex gap-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                Suchen Sie eine eigene Telefonnummer aus, um den KI-Assistenten zu aktivieren.
                Danach richten Sie bei Ihrem Mobilfunkanbieter eine Rufumleitung ein.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Number selection dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Deutsche Nummer auswählen
            </DialogTitle>
            <DialogDescription>
              Wählen Sie eine verfügbare Telefonnummer für Ihren KI-Assistenten.
            </DialogDescription>
          </DialogHeader>

          {searching ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Verfügbare Nummern werden geladen…
            </div>
          ) : availableNumbers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Keine Nummern gefunden. Bitte versuchen Sie es später erneut.
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-[360px] pr-2">
                <div className="space-y-2">
                  {availableNumbers.map((n) => {
                    const isSelected = selectedNumber === n.phone_number;
                    return (
                      <button
                        key={n.phone_number}
                        onClick={() => setSelectedNumber(n.phone_number)}
                        className={`w-full text-left rounded-lg border p-3 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                            : 'border-border hover:border-primary/40 hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-medium">
                            {formatPhone(n.phone_number)}
                          </span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {n.locality && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {n.locality}
                            </span>
                          )}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {n.type === 'Local' ? 'Festnetz' : n.type === 'Mobile' ? 'Mobil' : 'Gebührenfrei'}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button
                  onClick={handlePurchaseSelected}
                  disabled={!selectedNumber || purchasing}
                >
                  {purchasing ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Wird gekauft…</>
                  ) : (
                    <><ShoppingCart className="h-4 w-4 mr-2" /> Nummer kaufen</>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
