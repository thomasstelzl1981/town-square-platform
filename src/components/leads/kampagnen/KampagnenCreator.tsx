/**
 * KampagnenCreator — 5-step campaign creation wizard
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, ShoppingBag, Landmark, Search, Check, Loader2 } from 'lucide-react';
import { TemplateCard } from '@/pages/portal/lead-manager/TemplateCard';
import { DESIGN } from '@/config/designManifest';
import { toast } from 'sonner';

const BRAND_CARDS = [
  { key: 'kaufy', name: 'KAUFY', tagline: 'Marktplatz & Investment', gradient: 'from-[hsl(220,85%,55%)] to-[hsl(245,75%,60%)]', icon: ShoppingBag },
  { key: 'futureroom', name: 'FutureRoom', tagline: 'Finanzierung', gradient: 'from-[hsl(165,70%,36%)] to-[hsl(158,64%,52%)]', icon: Landmark },
  { key: 'acquiary', name: 'ACQUIARY', tagline: 'Sourcing & Akquisition', gradient: 'from-[hsl(210,80%,50%)] to-[hsl(200,70%,40%)]', icon: Search },
] as const;

const BRAND_GRADIENTS: Record<string, string> = {
  kaufy: 'from-[hsl(220,85%,55%)] to-[hsl(245,75%,60%)]',
  futureroom: 'from-[hsl(165,70%,36%)] to-[hsl(158,64%,52%)]',
  acquiary: 'from-[hsl(210,80%,50%)] to-[hsl(200,70%,40%)]',
  project: 'from-[hsl(270,60%,50%)] to-[hsl(280,50%,60%)]',
};

export function KampagnenCreator() {
  const { user, activeTenantId } = useAuth();
  const queryClient = useQueryClient();

  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [planBudget, setPlanBudget] = useState(2500);
  const [planStartDate, setPlanStartDate] = useState('');
  const [planEndDate, setPlanEndDate] = useState('');
  const [planRegions, setPlanRegions] = useState('');
  const [personalization, setPersonalization] = useState({ name: '', region: '', claim: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: availableTemplates } = useQuery({
    queryKey: ['social-templates-for-campaign', activeTenantId, selectedContext],
    queryFn: async () => {
      if (!activeTenantId || !selectedContext) return [];
      const { data } = await supabase.from('social_templates').select('*').eq('brand_context', selectedContext).eq('active', true).eq('approved', true).order('code');
      return data || [];
    },
    enabled: !!activeTenantId && !!selectedContext,
  });

  const handleSelectContext = (key: string) => { setSelectedContext(key); setSelectedTemplates([]); };
  const toggleTemplate = (id: string) => setSelectedTemplates(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  const extractFields = (schema: any) => ({ caption: schema?.caption?.default || '', cta: schema?.cta?.default || '', description: schema?.description || '' });

  const handleSubmit = async () => {
    if (!activeTenantId || !user?.id) return;
    if (!selectedContext) { toast.error('Bitte Marke wählen'); return; }
    if (!campaignName.trim()) { toast.error('Bitte Kampagnenname eingeben'); return; }
    if (selectedTemplates.length === 0) { toast.error('Bitte mindestens eine Vorlage auswählen'); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('sot-social-mandate-submit', {
        body: { tenant_id: activeTenantId, brand_context: selectedContext, campaign_name: campaignName, budget_total_cents: planBudget * 100, start_date: planStartDate || null, end_date: planEndDate || null, regions: planRegions.split(',').map(r => r.trim()).filter(Boolean), template_ids: selectedTemplates, personalization },
      });
      if (error) throw error;
      toast.success('Kampagne erfolgreich eingereicht!');
      setSelectedContext(null); setSelectedTemplates([]); setCampaignName('');
      queryClient.invalidateQueries({ queryKey: ['lead-manager-campaigns'] });
    } catch (e: any) {
      toast.error(e.message || 'Fehler beim Einreichen');
    } finally { setIsSubmitting(false); }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-6">
        <div className="flex items-center gap-2"><Plus className="h-4 w-4 text-muted-foreground" /><h2 className="text-sm font-medium">Neue Kampagne erstellen</h2></div>

        {/* Step 1: Brand */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Schritt 1: Für welche Marke möchten Sie werben?</h3>
          <p className="text-xs text-muted-foreground">Wählen Sie eine Marke. Die zugehörigen Vorlagen werden automatisch geladen.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BRAND_CARDS.map(b => (
              <div key={b.key} className={`rounded-xl overflow-hidden cursor-pointer transition-all ${selectedContext === b.key ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'}`} onClick={() => handleSelectContext(b.key)}>
                <div className={`h-[120px] bg-gradient-to-br ${b.gradient} flex items-center justify-center`}><b.icon className="h-10 w-10 text-white/70" /></div>
                <div className="p-3 border border-t-0 rounded-b-xl"><p className="font-semibold text-sm">{b.name}</p><p className="text-xs text-muted-foreground">{b.tagline}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Templates */}
        {selectedContext && (
          <div className="space-y-3">
            <Separator />
            <h3 className="text-sm font-medium">Schritt 2: Vorlagen auswählen</h3>
            <p className="text-xs text-muted-foreground">Wählen Sie die Vorlagen, die Sie in dieser Kampagne verwenden möchten.</p>
            {availableTemplates && availableTemplates.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableTemplates.map(t => (
                  <TemplateCard key={t.id} id={t.id} name={t.name} code={t.code} brandGradient={BRAND_GRADIENTS[selectedContext] || BRAND_GRADIENTS.kaufy} fields={extractFields(t.editable_fields_schema)} active={t.active} imageUrls={(t.image_urls as string[]) || []} selectable selected={selectedTemplates.includes(t.id)} onSelect={toggleTemplate} onSave={() => {}} onToggleActive={() => {}} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Keine aktiven Vorlagen vorhanden. Bitte erstellen Sie zuerst Vorlagen im Tab „{BRAND_CARDS.find(b => b.key === selectedContext)?.name}".</div>
            )}
          </div>
        )}

        {/* Step 3: Details */}
        {selectedContext && selectedTemplates.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h3 className="text-sm font-medium">Schritt 3: Kampagnen-Details</h3>
            <div className={DESIGN.FORM_GRID.FULL}>
              <div><Label className="text-xs">Kampagnenname *</Label><Input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="z.B. Frühjahrs-Kampagne 2026" className="mt-1" /></div>
              <div><Label className="text-xs">Budget (EUR)</Label><Input type="number" value={planBudget} onChange={e => setPlanBudget(Number(e.target.value))} className="mt-1" /></div>
              <div><Label className="text-xs">Startdatum</Label><Input type="date" value={planStartDate} onChange={e => setPlanStartDate(e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Enddatum</Label><Input type="date" value={planEndDate} onChange={e => setPlanEndDate(e.target.value)} className="mt-1" /></div>
              <div className="md:col-span-2"><Label className="text-xs">Regionen (kommagetrennt)</Label><Input value={planRegions} onChange={e => setPlanRegions(e.target.value)} placeholder="z.B. München, Berlin" className="mt-1" /></div>
            </div>
          </div>
        )}

        {/* Step 4: Personalization */}
        {selectedContext && selectedTemplates.length > 0 && campaignName.trim() && (
          <div className="space-y-3">
            <Separator />
            <h3 className="text-sm font-medium">Schritt 4: Personalisierung</h3>
            <p className="text-xs text-muted-foreground">Ihre Angaben erscheinen auf den Anzeigen.</p>
            <div className={DESIGN.FORM_GRID.FULL}>
              <div><Label className="text-xs">Ihr Name</Label><Input value={personalization.name} onChange={e => setPersonalization(p => ({ ...p, name: e.target.value }))} placeholder="Max Mustermann" className="mt-1" /></div>
              <div><Label className="text-xs">Region</Label><Input value={personalization.region} onChange={e => setPersonalization(p => ({ ...p, region: e.target.value }))} placeholder="München" className="mt-1" /></div>
              <div className="md:col-span-2"><Label className="text-xs">Claim / Slogan</Label><Input value={personalization.claim} onChange={e => setPersonalization(p => ({ ...p, claim: e.target.value }))} placeholder="Ihr Immobilienexperte in München" className="mt-1" /></div>
            </div>
          </div>
        )}

        {/* Step 5: Submit */}
        {selectedContext && selectedTemplates.length > 0 && campaignName.trim() && (
          <div className="space-y-3">
            <Separator />
            <h3 className="text-sm font-medium">Schritt 5: Zusammenfassung & Beauftragen</h3>
            <div className="rounded-xl bg-muted/30 border p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Marke</span><span className="font-medium">{BRAND_CARDS.find(b => b.key === selectedContext)?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Kampagnenname</span><span className="font-medium">{campaignName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vorlagen</span><span className="font-medium">{selectedTemplates.length} ausgewählt</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span className="font-medium">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(planBudget)}</span></div>
              {planStartDate && <div className="flex justify-between"><span className="text-muted-foreground">Zeitraum</span><span className="font-medium">{planStartDate} – {planEndDate || '—'}</span></div>}
              {planRegions && <div className="flex justify-between"><span className="text-muted-foreground">Regionen</span><span className="font-medium">{planRegions}</span></div>}
            </div>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full gap-2" size="lg">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Kampagne beauftragen — {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(planBudget)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
