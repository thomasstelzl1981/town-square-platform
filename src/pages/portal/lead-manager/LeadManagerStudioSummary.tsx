/**
 * Lead Manager — Kampagne Zusammenfassung (MOD-10)
 * Migrated from SelfieAdsSummary with brand_context
 */
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Image, CreditCard, ArrowLeft, CheckCircle2, MapPin, Calendar, Target, Users, Sparkles, User, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const TEMPLATE_NAMES: Record<string, string> = {
  T1: 'Rendite-Highlight', T2: 'Berater-Portrait', T3: 'Objekt-Showcase', T4: 'Testimonial', T5: 'Region-Focus',
};
const BRAND_LABELS: Record<string, string> = {
  futureroom: 'FutureRoom', kaufy: 'Kaufy', lennox_friends: 'Lennox & Friends', acquiary: 'Acquiary',
};

export default function LeadManagerStudioSummary() {
  const navigate = useNavigate();
  const { user, activeTenantId } = useAuth();

  const planData = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('leadManagerPlanData');
      if (raw) return JSON.parse(raw);
    } catch (err) { console.error('[LeadManagerStudioSummary] Failed to parse plan data:', err); }
    return {
      brandContext: 'kaufy', goal: 'Lead-Generierung', platform: 'Facebook + Instagram (Paid)',
      startDate: '2026-03-01', endDate: '2026-03-31', budget: 2500, regions: 'München',
      presets: ['Kapitalanlage'], selectedSlots: ['T1', 'T3'], personalization: { name: 'Max Berater', region: 'München', claim: '' },
      creatives: {
        T1: { slides: ['S1', 'S2', 'S3', 'S4'], caption: 'Sichere Rendite', cta: 'Jetzt starten' },
        T3: { slides: ['S1', 'S2', 'S3', 'S4'], caption: 'Exklusive Objekte', cta: 'Entdecken' },
      },
    };
  }, []);

  const formatBudget = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return dateStr; }
  };

  const handleBeauftragen = async () => {
    if (!activeTenantId || !user?.id) {
      toast.error('Bitte einloggen');
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('sot-social-mandate-submit', {
        body: {
          tenant_id: activeTenantId,
          brand_context: planData.brandContext,
          budget_total_cents: planData.budget * 100,
          start_date: planData.startDate,
          end_date: planData.endDate,
          regions: planData.regions?.split(',').map((r: string) => r.trim()) || [],
          audience_preset: { presets: planData.presets },
          template_slots: { selected: planData.selectedSlots },
          personalization: planData.personalization,
          creatives: planData.creatives,
        },
      });
      if (error) throw error;
      toast.success('Mandat erfolgreich eingereicht!');
      navigate('/portal/lead-manager/kampagnen');
    } catch (e: any) {
      toast.error(e.message || 'Fehler beim Einreichen');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/portal/lead-manager/studio/planen')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Zurück zur Planung
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Mandat Zusammenfassung</h1>
        <p className="text-muted-foreground mt-1">Lead Manager — Prüfen & Beauftragen</p>
      </div>

      {/* Mandate data */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><FileText className="h-4 w-4" /> Mandatsdaten</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2"><Sparkles className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /><div><span className="text-muted-foreground text-xs">Brand</span><p className="font-medium">{BRAND_LABELS[planData.brandContext] || planData.brandContext}</p></div></div>
            <div className="flex items-start gap-2"><Target className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /><div><span className="text-muted-foreground text-xs">Ziel</span><p className="font-medium">{planData.goal}</p></div></div>
            <div className="flex items-start gap-2"><CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /><div><span className="text-muted-foreground text-xs">Budget</span><p className="font-medium">{formatBudget(planData.budget)}</p></div></div>
            <div className="flex items-start gap-2"><Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /><div><span className="text-muted-foreground text-xs">Laufzeit</span><p className="font-medium">{formatDate(planData.startDate)} – {formatDate(planData.endDate)}</p></div></div>
            <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /><div><span className="text-muted-foreground text-xs">Regionen</span><p className="font-medium">{planData.regions || '—'}</p></div></div>
            <div className="flex items-start gap-2"><Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /><div><span className="text-muted-foreground text-xs">Zielgruppe</span><p className="font-medium">{planData.presets?.join(', ') || '—'}</p></div></div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><Image className="h-4 w-4" /> Template-Slots</h3>
          <div className="space-y-2">
            {planData.selectedSlots?.map((slotKey: string) => {
              const creative = planData.creatives?.[slotKey];
              return (
                <div key={slotKey} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-sm font-medium">{slotKey}: {TEMPLATE_NAMES[slotKey] || slotKey}</span>
                    <Badge variant="default" className="ml-auto text-xs">Generiert</Badge>
                  </div>
                  {creative && (
                    <div className="ml-7 space-y-1">
                      <p className="text-xs text-muted-foreground">Caption: {creative.caption}</p>
                      <p className="text-xs text-muted-foreground">CTA: {creative.cta}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Scope */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-medium flex items-center gap-2"><Shield className="h-4 w-4" /> Leistungsumfang</h3>
          <ul className="text-sm space-y-1.5 text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" /> {planData.selectedSlots?.length || 0} Slideshow-Anzeigen</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" /> Veröffentlichung über zentralen Meta-Account</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" /> Lead-Erfassung & automatische Zuordnung</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" /> Performance-Dashboard & Lead-Inbox</li>
          </ul>
        </CardContent>
      </Card>

      <Separator />

      <Button size="lg" className="w-full gap-2 text-base" onClick={handleBeauftragen}>
        <CreditCard className="h-5 w-5" /> Beauftragen — {formatBudget(planData.budget)}
      </Button>
      <p className="text-xs text-center text-muted-foreground pb-4">Prepayment. Nach Zahlung wird das Mandat übergeben.</p>
    </div>
  );
}
