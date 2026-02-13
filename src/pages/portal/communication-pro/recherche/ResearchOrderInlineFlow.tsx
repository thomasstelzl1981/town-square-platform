/**
 * ResearchOrderInlineFlow — 6-Section inline flow for active research order
 */
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Play, Loader2, Globe, Database, Search, Brain, ListChecks, FileText, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { type ResearchOrder, useUpdateResearchOrder, useStartResearchOrder } from '@/hooks/useResearchOrders';
import { useResearchAI } from '@/hooks/useResearchAI';
import { ResearchResultsTable } from './ResearchResultsTable';

interface Props {
  order: ResearchOrder;
}

export function ResearchOrderInlineFlow({ order }: Props) {
  const updateOrder = useUpdateResearchOrder();
  const startOrder = useStartResearchOrder();
  const { suggestFilters, optimizePlan, scoreResults, summarize } = useResearchAI();

  const isDraft = order.status === 'draft';
  const isRunning = order.status === 'running' || order.status === 'queued';
  const hasResults = order.status === 'done' || order.status === 'needs_review' || order.results_count > 0;

  // Local draft state
  const [title, setTitle] = useState(order.title || '');
  const [intentText, setIntentText] = useState(order.intent_text || '');
  const [icp, setIcp] = useState<any>(order.icp_json || {});
  const [maxResults, setMaxResults] = useState(String(order.max_results || 25));
  const [costCap, setCostCap] = useState(String(order.cost_cap || 5));
  const [consent, setConsent] = useState(order.consent_confirmed);
  const [providerPlan, setProviderPlan] = useState<any>(order.provider_plan_json || { firecrawl: true });

  const saveDraft = async () => {
    await updateOrder.mutateAsync({
      id: order.id,
      title,
      intent_text: intentText,
      icp_json: icp,
      max_results: parseInt(maxResults) || 25,
      cost_cap: parseFloat(costCap) || 5,
      consent_confirmed: consent,
      provider_plan_json: providerPlan,
    } as any);
    toast.success('Entwurf gespeichert');
  };

  const handleStart = async () => {
    if (!consent) return toast.error('Bitte bestätige den geschäftlichen Zweck');
    if (!intentText.trim()) return toast.error('Bitte Suchintent eingeben');

    await saveDraft();
    try {
      await startOrder.mutateAsync(order.id);
      toast.success('Rechercheauftrag gestartet');
    } catch (e: any) {
      toast.error(`Start fehlgeschlagen: ${e.message}`);
    }
  };

  const handleAISuggestFilters = async () => {
    if (!intentText.trim()) return toast.error('Bitte zuerst einen Suchintent eingeben');
    try {
      const result = await suggestFilters.mutateAsync(intentText);
      if (result?.icp_json && !result.icp_json.error) {
        setIcp(result.icp_json);
        toast.success('KI-Filter übernommen');
      } else {
        toast.info('KI konnte keine Filter ableiten');
      }
    } catch {
      toast.error('KI-Filtervorschlag fehlgeschlagen');
    }
  };

  const handleAIOptimizePlan = async () => {
    try {
      const result = await optimizePlan.mutateAsync({ intentText, icpJson: icp });
      if (result?.provider_plan) {
        setProviderPlan(result.provider_plan);
        toast.success('Provider-Plan optimiert');
      }
    } catch {
      toast.error('KI-Planoptimierung fehlgeschlagen');
    }
  };

  return (
    <div className="space-y-4">
      {/* Section 1 — Auftrag definieren */}
      <Card className="glass-card p-4 md:p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Search className="h-4 w-4" />
          1. Auftrag definieren
        </h3>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Auftragstitel</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="z.B. Hausverwaltungen NRW"
              disabled={!isDraft}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Suchintent (Was suchst du?)</Label>
            <textarea
              value={intentText}
              onChange={e => setIntentText(e.target.value)}
              placeholder="z.B. Geschäftsführer von Hausverwaltungen in Nordrhein-Westfalen mit mehr als 500 Einheiten"
              disabled={!isDraft}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Branche</Label>
              <Input value={icp.branche || ''} onChange={e => setIcp({ ...icp, branche: e.target.value })} disabled={!isDraft} className="mt-1" placeholder="z.B. Immobilien" />
            </div>
            <div>
              <Label className="text-xs">Region</Label>
              <Input value={icp.region || ''} onChange={e => setIcp({ ...icp, region: e.target.value })} disabled={!isDraft} className="mt-1" placeholder="z.B. NRW, Deutschland" />
            </div>
            <div>
              <Label className="text-xs">Rolle / Position</Label>
              <Input value={icp.role || ''} onChange={e => setIcp({ ...icp, role: e.target.value })} disabled={!isDraft} className="mt-1" placeholder="z.B. Geschäftsführer" />
            </div>
            <div>
              <Label className="text-xs">Firma / Domain (optional)</Label>
              <Input value={icp.domain || ''} onChange={e => setIcp({ ...icp, domain: e.target.value })} disabled={!isDraft} className="mt-1" placeholder="z.B. example.de" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Keywords (kommagetrennt)</Label>
            <Input
              value={(icp.keywords || []).join(', ')}
              onChange={e => setIcp({ ...icp, keywords: e.target.value.split(',').map((k: string) => k.trim()).filter(Boolean) })}
              disabled={!isDraft}
              className="mt-1"
              placeholder="z.B. WEG, Mietverwaltung, Facility"
            />
          </div>
        </div>
      </Card>

      {/* Section 2 — Trefferlimit & Kosten */}
      <Card className="glass-card p-4 md:p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          2. Trefferlimit & Kosten
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Maximale Treffer</Label>
            <Select value={maxResults} onValueChange={setMaxResults} disabled={!isDraft}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 Treffer</SelectItem>
                <SelectItem value="25">25 Treffer</SelectItem>
                <SelectItem value="50">50 Treffer</SelectItem>
                <SelectItem value="100">100 Treffer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Kosten-Obergrenze (€)</Label>
            <Input
              type="number"
              value={costCap}
              onChange={e => setCostCap(e.target.value)}
              disabled={!isDraft}
              className="mt-1"
              min={1}
              step={1}
            />
          </div>
        </div>
        {!isDraft && (
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span>Treffer: {order.results_count} / {order.max_results}</span>
            <span>Kosten: €{Number(order.cost_spent).toFixed(2)} / €{Number(order.cost_cap).toFixed(2)}</span>
          </div>
        )}
      </Card>

      {/* Section 3 — Provider & Quellen */}
      <Card className="glass-card p-4 md:p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4" />
          3. Provider & Quellen
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ProviderToggle
            icon={<Globe className="h-5 w-5" />}
            label="Firecrawl"
            description="Web Crawl & Extraction"
            enabled={providerPlan.firecrawl !== false}
            onChange={v => setProviderPlan({ ...providerPlan, firecrawl: v })}
            disabled={!isDraft}
          />
          <ProviderToggle
            icon={<Database className="h-5 w-5" />}
            label="Epify"
            description="Enrichment & Lookup"
            enabled={providerPlan.epify === true}
            onChange={v => setProviderPlan({ ...providerPlan, epify: v })}
            disabled={!isDraft}
            locked
            lockedHint="API-Key noch nicht hinterlegt"
          />
          <ProviderToggle
            icon={<Search className="h-5 w-5" />}
            label="Apollo"
            description="People Search"
            enabled={providerPlan.apollo === true}
            onChange={v => setProviderPlan({ ...providerPlan, apollo: v })}
            disabled={!isDraft}
            locked
            lockedHint="API-Key noch nicht hinterlegt"
          />
        </div>
      </Card>

      {/* Section 4 — KI-Assistent */}
      <Card className="glass-card p-4 md:p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Brain className="h-4 w-4" />
          4. KI-Assistent
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAISuggestFilters}
            disabled={suggestFilters.isPending || !isDraft}
          >
            {suggestFilters.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
            KI schlägt Filter vor
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAIOptimizePlan}
            disabled={optimizePlan.isPending || !isDraft}
          >
            {optimizePlan.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
            KI optimiert Provider-Plan
          </Button>
          {hasResults && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => scoreResults.mutateAsync(order.id).then(() => toast.success('Scoring abgeschlossen'))}
                disabled={scoreResults.isPending}
              >
                {scoreResults.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                KI bewertet Treffer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => summarize.mutateAsync(order.id).then(() => toast.success('Zusammenfassung erstellt'))}
                disabled={summarize.isPending}
              >
                {summarize.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileText className="h-3 w-3 mr-1" />}
                KI Zusammenfassung
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Section 5 — Consent & Start */}
      {isDraft && (
        <Card className="glass-card p-4 md:p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Play className="h-4 w-4" />
            5. Consent & Start
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={v => setConsent(!!v)}
              />
              <label htmlFor="consent" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                Ich bestätige, dass diese Recherche einem geschäftlichen Zweck dient und im Einklang mit den geltenden Datenschutzbestimmungen (DSGVO) erfolgt.
              </label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={saveDraft} disabled={updateOrder.isPending}>
                Entwurf speichern
              </Button>
              <Button
                size="sm"
                onClick={handleStart}
                disabled={!consent || !intentText.trim() || startOrder.isPending}
              >
                {startOrder.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-1" />
                )}
                Recherche kostenpflichtig starten
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Running Status */}
      {isRunning && (
        <Card className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Recherche läuft…</p>
              <p className="text-xs text-muted-foreground">
                {order.results_count} Treffer gefunden • €{Number(order.cost_spent).toFixed(2)} verbraucht
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Section 6 — Ergebnisse */}
      {hasResults && (
        <Card className="glass-card p-4 md:p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            6. Ergebnisse ({order.results_count} Treffer)
          </h3>

          {/* AI Summary */}
          {order.ai_summary_md && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg text-xs whitespace-pre-wrap">
              {order.ai_summary_md}
            </div>
          )}

          {/* GP Validator: Prompt to import if done but no imports */}
          {order.status === 'done' && order.results_count > 0 && (
            <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary shrink-0" />
              <span>
                <strong>Kontakte übernehmen:</strong> Wähle Treffer aus und klicke "Ins Kontaktbuch", um sie als Kontakte zu speichern.
              </span>
            </div>
          )}

          <ResearchResultsTable orderId={order.id} />
        </Card>
      )}
    </div>
  );
}

function ProviderToggle({
  icon,
  label,
  description,
  enabled,
  onChange,
  disabled,
  locked,
  lockedHint,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
  locked?: boolean;
  lockedHint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => !locked && !disabled && onChange(!enabled)}
      className={`relative p-3 rounded-lg border text-left transition-all ${
        locked ? 'opacity-50 cursor-not-allowed' : disabled ? 'opacity-70' : 'cursor-pointer hover:bg-muted/50'
      } ${enabled && !locked ? 'border-primary bg-primary/5' : 'border-border'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm font-medium">{label}</span>
        {enabled && !locked && <Badge variant="default" className="text-[10px] ml-auto">Aktiv</Badge>}
      </div>
      <p className="text-xs text-muted-foreground">{locked ? lockedHint : description}</p>
    </button>
  );
}

