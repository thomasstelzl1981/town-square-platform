import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { HardDrive, Mail, Cpu, CheckCircle, Clock, Loader2, AlertCircle, Check, Sparkles, Shield, Zap, FileSearch } from 'lucide-react';
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
  const [ocrEnabled, setOcrEnabled] = useState(() => {
    const stored = localStorage.getItem('dms_ocr_enabled');
    return stored !== 'false';
  });
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderAddress, setOrderAddress] = useState('');
  const [orderCity, setOrderCity] = useState('');
  const [orderPostalCode, setOrderPostalCode] = useState('');
  const [orderRecipientName, setOrderRecipientName] = useState('');

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
  const usedBytes = 0; // TODO: calculate from actual storage usage
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

  // ── Postservice Mandate ──
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

  const createMandate = useMutation({
    mutationFn: async () => {
      if (!activeTenantId || !user?.id) throw new Error('Nicht angemeldet');
      const { error } = await supabase.from('postservice_mandates').insert({
        tenant_id: activeTenantId,
        requested_by_user_id: user.id,
        type: 'postservice_forwarding',
        status: 'requested',
        payload_json: { recipient_name: orderRecipientName, address: orderAddress, city: orderCity, postal_code: orderPostalCode },
        contract_terms: { duration_months: 12, monthly_credits: 30, billing_mode: 'annual_prepay' },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postservice-mandate'] });
      setShowOrderDialog(false);
      toast.success('Nachsendeauftrag eingereicht');
    },
    onError: () => toast.error('Fehler beim Einreichen'),
  });

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

  const activeMandateExists = mandate && !['cancelled'].includes(mandate.status);

  const handleOcrToggle = (enabled: boolean) => {
    setOcrEnabled(enabled);
    localStorage.setItem('dms_ocr_enabled', String(enabled));
    toast.success(enabled ? 'Dokumenten-Auslesung aktiviert' : 'Dokumenten-Auslesung deaktiviert');
  };

  const formatGB = (bytes: number) => `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
  const formatCredits = (cents: number) => `${(cents / 100).toFixed(2).replace('.', ',')} €`;

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
    <div className="container max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-h2 text-foreground">Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-1">Speicher, Postservice und Dokumenten-Auslesung verwalten</p>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

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
                    onClick={() => !isActive && changePlanMutation.mutate(plan)}
                    disabled={isActive || changePlanMutation.isPending}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border/50 hover:border-primary/30 hover:bg-primary/5'
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

            <p className="text-[11px] text-muted-foreground">4 Credits = 1 € · Abrechnung monatlich</p>
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
            ) : activeMandateExists ? (
              <>
                {/* Status Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Nachsendeauftrag</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Postfach {activeTenantId?.slice(0, 8).toUpperCase()}
                    </div>
                  </div>
                  {getMandateStatusBadge(mandate!.status)}
                </div>

                {/* Status Message */}
                {mandate!.status === 'requested' && (
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-sm">
                    <p className="font-medium text-amber-700 dark:text-amber-400 mb-0.5">Auftrag eingereicht</p>
                    <p className="text-xs text-muted-foreground">Einrichtung erfolgt durch den Administrator.</p>
                  </div>
                )}
                {mandate!.status === 'setup_in_progress' && (
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-sm">
                    <p className="font-medium text-blue-700 dark:text-blue-400 mb-0.5">Einrichtung läuft</p>
                    <p className="text-xs text-muted-foreground">Bitte haben Sie etwas Geduld.</p>
                  </div>
                )}
                {mandate!.status === 'active' && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-sm">
                    <p className="font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">Post wird weitergeleitet</p>
                    <p className="text-xs text-muted-foreground">Eingehende Post wird automatisch in Ihren DMS-Posteingang zugestellt.</p>
                  </div>
                )}

                {/* Costs */}
                <div className="p-3 rounded-xl bg-muted/50 space-y-1.5 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground text-sm mb-1">Kostenmodell</p>
                  <p>• 30 Credits / Monat (Grundgebühr)</p>
                  <p>• 3 Credits pro zugestelltem Brief</p>
                  <p>• Mindestlaufzeit: 12 Monate</p>
                </div>

                {['requested', 'setup_in_progress', 'active'].includes(mandate!.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cancelMandate.mutate()}
                    disabled={cancelMandate.isPending}
                    className="text-destructive hover:text-destructive w-full"
                  >
                    Nachsendeauftrag widerrufen
                  </Button>
                )}
              </>
            ) : (
              <>
                {/* How it works */}
                <div className="space-y-3">
                  {[
                    { step: '1', text: 'Nachsendeauftrag einreichen' },
                    { step: '2', text: 'Admin richtet digitalen Postkasten ein' },
                    { step: '3', text: 'Post wird automatisch zugestellt' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {item.step}
                      </div>
                      <p className="text-sm text-muted-foreground pt-0.5">{item.text}</p>
                    </div>
                  ))}
                </div>

                {/* Costs */}
                <div className="p-3 rounded-xl bg-muted/50 space-y-1.5 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground text-sm mb-1">Kosten</p>
                  <p>• 30 Credits / Monat (360 Credits jährlich)</p>
                  <p>• 3 Credits pro zugestelltem Brief</p>
                </div>

                <Button onClick={() => setShowOrderDialog(true)} className="w-full">
                  Nachsendeauftrag einrichten
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* ═══ KACHEL C: DOKUMENTEN-AUSLESUNG ═══ */}
        <Card className="glass-card flex flex-col overflow-hidden">
          <div className="p-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Dokumenten-Auslesung</h3>
                <p className="text-xs text-muted-foreground">OCR & KI-Extraktion</p>
              </div>
            </div>
          </div>

          <CardContent className="flex-1 p-6 space-y-5">
            {/* Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30">
              <div>
                <p className="text-sm font-medium text-foreground">Auslesung aktivieren</p>
                <p className="text-xs text-muted-foreground">Automatische Texterkennung</p>
              </div>
              <Switch checked={ocrEnabled} onCheckedChange={handleOcrToggle} />
            </div>

            {/* Features */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Funktionen</p>
              {[
                { icon: FileSearch, text: 'Texterkennung (OCR) aus Scans' },
                { icon: Sparkles, text: 'KI-gestützte Datenextraktion' },
                { icon: Zap, text: 'Automatische Vorsortierung' },
              ].map((feat) => (
                <div key={feat.text} className="flex items-center gap-2.5">
                  <feat.icon className={`h-4 w-4 shrink-0 ${ocrEnabled ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <span className={`text-sm ${ocrEnabled ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                    {feat.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Supported formats */}
            <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground text-sm mb-1">Unterstützte Formate</p>
              <p>PDF, Word, Excel, Bilder (JPG/PNG), E-Mails</p>
            </div>

            {/* Cost */}
            <div className="p-3 rounded-xl border border-primary/10 bg-primary/5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground font-medium">Kosten pro Dokument</span>
                <Badge variant="outline" className="font-mono">1 Credit</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">≈ 0,25 € pro Auslesung</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ ORDER DIALOG ═══ */}
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
            <div className="p-3 rounded-xl bg-muted/50 text-sm space-y-1">
              <p className="font-medium">Vertragsbedingungen:</p>
              <p className="text-xs text-muted-foreground">• Laufzeit: 12 Monate</p>
              <p className="text-xs text-muted-foreground">• 30 Credits / Monat (360 Credits jährlich)</p>
              <p className="text-xs text-muted-foreground">• 3 Credits pro zugestelltem Brief</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 text-sm">
              <span className="text-muted-foreground">Postfach-Nummer: </span>
              <span className="font-mono font-medium">{activeTenantId?.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>Abbrechen</Button>
            <Button
              onClick={() => createMandate.mutate()}
              disabled={createMandate.isPending || !orderRecipientName || !orderAddress || !orderCity}
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
