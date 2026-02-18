import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { HardDrive, Mail, Cpu, CheckCircle, Clock, Loader2, AlertCircle, Check, Sparkles, Shield, Zap, FileSearch, Database, Brain, CloudCog, Plug, ArrowRight, Lock, ScanSearch, Play, XCircle, Bot, FileText, Receipt } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { DESIGN } from '@/config/designManifest';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataEngineInfoCard } from '@/components/dms/DataEngineInfoCard';
import { StorageExtractionCard } from '@/components/dms/StorageExtractionCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface StoragePlan {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  features: { storage_gb: number; credits_monthly: number };
  display_order: number;
}

const PLAN_ICONS: Record<string, typeof HardDrive> = {
  Free: HardDrive,
  Basic: Zap,
  Pro: Sparkles,
  Business: Shield,
};

export function EinstellungenTab() {
  const { user, activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  // OCR state from DB
  const { data: ocrEnabled = false } = useQuery({
    queryKey: ['ai-extraction-enabled', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return false;
      const { data, error } = await supabase
        .from('organizations')
        .select('ai_extraction_enabled')
        .eq('id', activeTenantId)
        .single();
      if (error) throw error;
      return data?.ai_extraction_enabled ?? false;
    },
    enabled: !!activeTenantId,
  });
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderAddress, setOrderAddress] = useState('');
  const [orderCity, setOrderCity] = useState('');
  const [orderPostalCode, setOrderPostalCode] = useState('');
  const [orderRecipientName, setOrderRecipientName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // ── Storage Plans ──
  const { data: storagePlans = [] } = useQuery({
    queryKey: ['storage-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []) as unknown as StoragePlan[];
    },
  });

  const { data: orgData } = useQuery({
    queryKey: ['org-storage', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('storage_plan_id, storage_quota_bytes')
        .eq('id', activeTenantId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeTenantId,
  });

  const currentPlanId = orgData?.storage_plan_id || '00000000-0000-0000-0000-000000000001';
  const currentQuota = orgData?.storage_quota_bytes || 5368709120;
  const usedBytes = 0; // STUB: Storage-API-Abfrage erfordert Edge Function (DATA-002)
  const usedPercent = Math.round((usedBytes / currentQuota) * 100);

  const changePlanMutation = useMutation({
    mutationFn: async (plan: StoragePlan) => {
      if (!activeTenantId) throw new Error('Kein Mandant');
      const quotaBytes = plan.features.storage_gb * 1024 * 1024 * 1024;
      const { error } = await supabase
        .from('organizations')
        .update({ storage_plan_id: plan.id, storage_quota_bytes: quotaBytes })
        .eq('id', activeTenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-storage'] });
      toast.success('Speicherplan aktualisiert');
    },
    onError: () => toast.error('Planwechsel fehlgeschlagen'),
  });

  // ── Postservice Mandates (multi) ──
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
      
      // Create mandate with status 'active' (contract accepted via TermsGate)
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

  const ocrToggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!activeTenantId) throw new Error('Kein Mandant');
      const { error } = await supabase
        .from('organizations')
        .update({ ai_extraction_enabled: enabled })
        .eq('id', activeTenantId);
      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['ai-extraction-enabled'] });
      toast.success(enabled ? 'Dokumenten-Auslesung aktiviert' : 'Dokumenten-Auslesung deaktiviert');
    },
    onError: () => toast.error('Fehler beim Umschalten'),
  });

  const handleOcrToggle = (enabled: boolean) => {
    ocrToggleMutation.mutate(enabled);
  };

  const formatGB = (bytes: number) => `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
  const formatCredits = (cents: number) => `${Math.round(cents / 25)} Credits`;

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

  const currentPlan = storagePlans.find(p => p.id === currentPlanId);

  return (
    <PageShell>
      <ModulePageHeader title="Einstellungen" description="Speicher, Postservice und Dokumenten-Auslesung konfigurieren" />

      {/* 3-Column Grid */}
      <div className={DESIGN.WIDGET_GRID.FULL}>

        {/* ═══ KACHEL A: SPEICHERPLATZ ═══ */}
        <Card className="glass-card flex flex-col overflow-hidden">
          <div className="p-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Speicherplatz</h3>
                <p className="text-xs text-muted-foreground">Aktueller Plan: {currentPlan?.name || 'Free'}</p>
              </div>
            </div>
          </div>

          <CardContent className="flex-1 p-6 space-y-5">
            {/* Usage Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Verwendet</span>
                <span className="font-medium text-foreground">{formatGB(usedBytes)} / {formatGB(currentQuota)}</span>
              </div>
              <Progress value={usedPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">{usedPercent}% belegt</p>
            </div>

            {/* Plan Selector */}
            <div className="space-y-2.5">
              {storagePlans.map((plan) => {
                const isActive = plan.id === currentPlanId;
                const PlanIcon = PLAN_ICONS[plan.name] || HardDrive;
                return (
                   <button
                    key={plan.id}
                    onClick={() => {
                      if (!isActive && plan.price_cents > 0) {
                        toast.info('Vertrag erforderlich – bitte kontaktieren Sie uns für ein Upgrade.');
                        return;
                      }
                      if (!isActive) changePlanMutation.mutate(plan);
                    }}
                    disabled={isActive || changePlanMutation.isPending}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                        : plan.price_cents > 0 ? 'border-border/50 opacity-60 cursor-not-allowed' : 'border-border/50 hover:border-primary/30 hover:bg-primary/5'
                    }`}
                  >
                    <PlanIcon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-foreground'}`}>
                          {plan.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {plan.features.storage_gb} GB
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {plan.price_cents === 0 ? 'Kostenlos' : `${formatCredits(plan.price_cents)}/Monat`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {plan.features.credits_monthly > 0 ? `${plan.features.credits_monthly} Credits` : ''}
                        </span>
                      </div>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">Abrechnung monatlich in Credits</p>
          </CardContent>
        </Card>

        {/* ═══ KACHEL B: DIGITALER POSTSERVICE ═══ */}
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
                {/* Existing Mandates */}
                {mandates.map((m) => {
                  const payload = m.payload_json as { recipient_name?: string; address?: string; postal_code?: string; city?: string } | null;
                  return (
                    <div key={m.id} className="rounded-xl border border-border/50 p-4 space-y-3">
                      {/* Recipient & Status */}
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

                      {/* Postfach */}
                      <div className="text-xs text-muted-foreground">
                        Postfach: <span className="font-mono font-medium text-foreground">{activeTenantId?.slice(0, 8).toUpperCase()}</span>
                      </div>

                      {/* Costs */}
                      <div className="text-xs text-muted-foreground">
                        Kosten: 30 Credits/Monat · 3 Credits/Brief
                      </div>

                      {/* Cancel */}
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

                {/* Add new mandate button */}
                <Button onClick={() => setShowOrderDialog(true)} variant={mandates.length > 0 ? 'outline' : 'default'} className="w-full">
                  {mandates.length > 0 ? '+ Weiteren Postservice einrichten' : 'Postservice aktivieren'}
                </Button>

                {/* Cost info */}
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

        {/* ═══ KACHEL C: POSTEINGANGS-AUSLESUNG ═══ */}
        <Card className="glass-card flex flex-col overflow-hidden">
          <div className="p-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Posteingangs-Auslesung</h3>
                <p className="text-xs text-muted-foreground">Automatische End-to-End-Verarbeitung</p>
              </div>
            </div>
          </div>

          <CardContent className="flex-1 p-6 space-y-5">
            {/* Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30">
              <div>
                <p className="text-sm font-medium text-foreground">Automatische Auslesung</p>
                <p className="text-xs text-muted-foreground">Neue Dokumente im Posteingang automatisch analysieren</p>
              </div>
              <Switch checked={ocrEnabled} onCheckedChange={handleOcrToggle} />
            </div>

            {/* Pipeline Steps */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Verarbeitungs-Pipeline</p>
              {[
                { icon: FileText, text: 'PDF empfangen & OCR-Texterkennung' },
                { icon: Sparkles, text: 'Dokumententyp erkennen (Rechnung, Vertrag, Bescheid…)' },
                { icon: Zap, text: 'Automatisch in passende Akte sortieren' },
                { icon: Database, text: 'Für Armstrong durchsuchbar machen' },
              ].map((step) => (
                <div key={step.text} className="flex items-center gap-2.5">
                  <step.icon className={`h-4 w-4 shrink-0 ${ocrEnabled ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <span className={`text-sm ${ocrEnabled ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                    {step.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Cost */}
            <div className="p-3 rounded-xl border border-primary/10 bg-primary/5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground font-medium">Kosten pro Dokument</span>
                <Badge variant="outline" className="font-mono">1 Credit</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Vollautomatisch: Upload → Extraktion → Sortierung → Index</p>
            </div>

            {/* Armstrong Examples */}
            <div className="p-3 rounded-xl bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Armstrong kann dann z.B.:</p>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• „Zeige mir alle Rechnungen vom letzten Monat"</p>
                <p>• „Fasse den Mietvertrag Musterstr. 5 zusammen"</p>
                <p>• „Welche offenen Fristen habe ich?"</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══ KACHEL D: DATENRAUM-EXTRAKTION ═══ */}
        <StorageExtractionCard tenantId={activeTenantId} />

        {/* ═══ KACHEL E: DOCUMENT INTELLIGENCE ENGINE ═══ */}
        <DataEngineInfoCard />
      </div>

      {/* ═══ ORDER DIALOG (TermsGate) ═══ */}
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

            {/* Contract Terms */}
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

            {/* Terms Acceptance Checkbox */}
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
    </PageShell>
  );
}
