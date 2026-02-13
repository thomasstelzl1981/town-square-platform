/**
 * AkquiseMandate — Vollständiger Workflow nach FM-Vorbild (MOD-12)
 * 
 * Sektion A: Meine Mandate (WidgetGrid)
 * Sektion B: Neues Mandat — Durchlaufender Workflow
 *   Phase 1: KI-gestützte Freitext-Erfassung
 *   Phase 2: Ankaufsprofil aufbereiten & Mandat erstellen
 *   Phase 3-7: Operative Sektionen (Sourcing, Outreach, Inbound, Analysis, Delivery)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { MandateCaseCard, MandateCaseCardPlaceholder } from '@/components/akquise/MandateCaseCard';
import { AcqSectionHeader } from '@/components/akquise/AcqSectionHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, Send, Sparkles, Search, Mail, Inbox, Brain, Package } from 'lucide-react';
import { useAcqMandatesForManager, useCreateAcqMandate } from '@/hooks/useAcqMandate';
import { ASSET_FOCUS_OPTIONS, type CreateAcqMandateData } from '@/types/acquisition';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  SourcingTab, OutreachTab, InboundTab, AnalysisTab, DeliveryTab,
} from './components';

// ── Types ──
interface ExtractedProfile {
  client_name?: string;
  region?: string;
  asset_focus: string[];
  price_min?: number | null;
  price_max?: number | null;
  yield_target?: number | null;
  exclusions?: string;
  notes?: string;
  profile_text_long?: string;
}

type WorkflowPhase = 'capture' | 'profile' | 'active';

export default function AkquiseMandate() {
  const navigate = useNavigate();
  const { data: mandates, isLoading } = useAcqMandatesForManager();
  const createMandate = useCreateAcqMandate();

  // Workflow state
  const [phase, setPhase] = useState<WorkflowPhase>('capture');
  const [activeMandateId, setActiveMandateId] = useState<string | null>(null);
  const [activeMandateCode, setActiveMandateCode] = useState<string>('');

  // Phase 1: Free-text capture
  const [freeText, setFreeText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Phase 2: Editable profile (pre-filled from AI)
  const [clientName, setClientName] = useState('');
  const [region, setRegion] = useState('');
  const [assetFocus, setAssetFocus] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [yieldTarget, setYieldTarget] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [notes, setNotes] = useState('');
  const [profileTextLong, setProfileTextLong] = useState('');

  // ── Helpers ──
  const toggleAssetFocus = (value: string) => {
    setAssetFocus(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const applyProfile = (p: ExtractedProfile) => {
    if (p.client_name) setClientName(p.client_name);
    if (p.region) setRegion(p.region);
    if (p.asset_focus?.length) setAssetFocus(p.asset_focus);
    if (p.price_min) setPriceMin(String(p.price_min));
    if (p.price_max) setPriceMax(String(p.price_max));
    if (p.yield_target) setYieldTarget(String(p.yield_target));
    if (p.exclusions) setExclusions(p.exclusions);
    if (p.notes) setNotes(p.notes);
    if (p.profile_text_long) setProfileTextLong(p.profile_text_long);
  };

  // ── Phase 1: KI-Extraction ──
  const handleExtract = async () => {
    if (!freeText.trim()) return;
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-acq-profile-extract', {
        body: { freeText: freeText.trim() },
      });
      if (error) throw error;
      if (data?.profile) {
        applyProfile(data.profile);
        setPhase('profile');
        toast.success('Ankaufsprofil extrahiert');
      } else {
        throw new Error('Kein Profil extrahiert');
      }
    } catch (err) {
      console.error(err);
      toast.error('KI-Analyse fehlgeschlagen — bitte manuell ausfüllen');
      setPhase('profile');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSkipToManual = () => {
    setPhase('profile');
  };

  // ── Phase 2: Mandat erstellen ──
  const handleCreate = async () => {
    if (!clientName.trim()) return;

    const data: CreateAcqMandateData = {
      client_display_name: clientName.trim(),
      search_area: { free_text: region.trim() || undefined },
      asset_focus: assetFocus,
      price_min: priceMin ? Number(priceMin) : null,
      price_max: priceMax ? Number(priceMax) : null,
      yield_target: yieldTarget ? Number(yieldTarget) : null,
      exclusions: exclusions.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const result = await createMandate.mutateAsync(data);
    if (result?.id) {
      setActiveMandateId(result.id);
      setActiveMandateCode(result.code || '');
      setPhase('active');
    }
  };

  // ── Select existing mandate to view workflow ──
  const handleSelectMandate = (mandate: { id: string; code: string; client_display_name: string | null; search_area: Record<string, unknown>; asset_focus: string[]; }) => {
    setActiveMandateId(mandate.id);
    setActiveMandateCode(mandate.code);
    setPhase('active');
  };

  // ── Reset to new mandate ──
  const handleNewMandate = () => {
    setPhase('capture');
    setActiveMandateId(null);
    setActiveMandateCode('');
    setFreeText('');
    setClientName('');
    setRegion('');
    setAssetFocus([]);
    setPriceMin('');
    setPriceMax('');
    setYieldTarget('');
    setExclusions('');
    setNotes('');
    setProfileTextLong('');
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader
        title="MANDATE"
        description="Ihre Akquise-Mandate verwalten"
      />

      {/* ══════════════════════════════════════════════════════════════════
          SEKTION A: Meine Mandate
          ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Meine Mandate
        </h2>
        {mandates && mandates.length > 0 ? (
          <WidgetGrid>
            {mandates.map(mandate => (
              <WidgetCell key={mandate.id}>
                <MandateCaseCard
                  mandate={mandate}
                  onClick={() => handleSelectMandate(mandate)}
                />
              </WidgetCell>
            ))}
          </WidgetGrid>
        ) : (
          <WidgetGrid>
            <WidgetCell>
              <MandateCaseCardPlaceholder />
            </WidgetCell>
          </WidgetGrid>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SEKTION B: Neues Mandat — Workflow oder aktives Mandat
          ══════════════════════════════════════════════════════════════════ */}

      {/* ── Active mandate: show full operative workflow ── */}
      {phase === 'active' && activeMandateId && (
        <div className="space-y-6 mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Mandat {activeMandateCode} — Workflow
            </h2>
            <Button variant="outline" size="sm" onClick={handleNewMandate}>
              + Neues Mandat
            </Button>
          </div>

          <AcqSectionHeader number={1} title="Sourcing & Recherche" description="Immobilienportale durchsuchen und passende Objekte identifizieren" icon={<Search className="h-5 w-5" />} />
          <SourcingTab mandateId={activeMandateId} mandateCode={activeMandateCode} />

          <Separator />
          <AcqSectionHeader number={2} title="Outreach" description="Kontakte anschreiben und Angebote einholen" icon={<Mail className="h-5 w-5" />} />
          <OutreachTab mandateId={activeMandateId} mandateCode={activeMandateCode} />

          <Separator />
          <AcqSectionHeader number={3} title="Objekteingang & Analyse" description="Eingegangene Angebote bewerten und analysieren" icon={<Inbox className="h-5 w-5" />} />
          <InboundTab mandateId={activeMandateId} mandateCode={activeMandateCode} />

          <Separator />
          <AcqSectionHeader number={4} title="Analyse & Kalkulation" description="Bestand- und Aufteiler-Kalkulationen durchführen" icon={<Brain className="h-5 w-5" />} />
          <AnalysisTab mandateId={activeMandateId} mandateCode={activeMandateCode} />

          <Separator />
          <AcqSectionHeader number={5} title="Delivery & Präsentation" description="Objekte dem Mandanten präsentieren" icon={<Package className="h-5 w-5" />} />
          <DeliveryTab mandateId={activeMandateId} mandateCode={activeMandateCode} />
        </div>
      )}

      {/* ── Phase 1: KI-gestützte Erfassung ── */}
      {phase === 'capture' && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Neues Mandat — KI-gestützte Erfassung
            </CardTitle>
            <CardDescription>
              Beschreiben Sie in eigenen Worten, was Ihr Mandant sucht. Die KI analysiert den Text und erstellt ein strukturiertes Ankaufsprofil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="z.B. Family Office sucht Mehrfamilienhäuser in der Rhein-Main-Region, Investitionsvolumen 2 bis 5 Millionen Euro, mindestens 4% Rendite, kein Denkmalschutz, keine Erbbaurechte. Bevorzugt Bestandsimmobilien mit Wertsteigerungspotenzial."
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              rows={6}
              className="text-base"
            />
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={handleSkipToManual}>
                Manuell ausfüllen →
              </Button>
              <Button
                size="lg"
                onClick={handleExtract}
                disabled={!freeText.trim() || isExtracting}
              >
                {isExtracting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Ankaufsprofil generieren
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Phase 2: Ankaufsprofil aufbereiten ── */}
      {phase === 'profile' && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Ankaufsprofil aufbereiten</CardTitle>
            <CardDescription>
              Prüfen und ergänzen Sie die extrahierten Daten. Das Mandat wird erst beim Absenden angelegt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Generiertes Profil (wenn vorhanden) */}
            {profileTextLong && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <Label className="text-xs uppercase tracking-wider text-primary font-semibold">KI-generiertes Ankaufsprofil</Label>
                <Textarea
                  value={profileTextLong}
                  onChange={e => setProfileTextLong(e.target.value)}
                  rows={4}
                  className="bg-background"
                />
              </div>
            )}

            {/* Kontaktname */}
            <div className="space-y-2">
              <Label htmlFor="clientName">Kontaktname / Mandant *</Label>
              <Input
                id="clientName"
                placeholder="z.B. Müller Family Office"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
              />
            </div>

            {/* Suchgebiet */}
            <div className="space-y-2">
              <Label htmlFor="region">Suchgebiet / Region</Label>
              <Input
                id="region"
                placeholder="z.B. Rhein-Main, Berlin, NRW"
                value={region}
                onChange={e => setRegion(e.target.value)}
              />
            </div>

            {/* Asset-Fokus */}
            <div className="space-y-2">
              <Label>Asset-Fokus</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {ASSET_FOCUS_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-accent/50 cursor-pointer transition-colors text-sm"
                  >
                    <Checkbox
                      checked={assetFocus.includes(opt.value)}
                      onCheckedChange={() => toggleAssetFocus(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preisspanne + Rendite */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceMin">Preis ab (€)</Label>
                <Input
                  id="priceMin"
                  type="number"
                  placeholder="500.000"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceMax">Preis bis (€)</Label>
                <Input
                  id="priceMax"
                  type="number"
                  placeholder="5.000.000"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yieldTarget">Zielrendite (%)</Label>
                <Input
                  id="yieldTarget"
                  type="number"
                  step="0.1"
                  placeholder="5.0"
                  value={yieldTarget}
                  onChange={e => setYieldTarget(e.target.value)}
                />
              </div>
            </div>

            {/* Ausschlüsse */}
            <div className="space-y-2">
              <Label htmlFor="exclusions">Ausschlüsse</Label>
              <Textarea
                id="exclusions"
                placeholder="z.B. keine Erbbau-Grundstücke, kein Denkmalschutz"
                value={exclusions}
                onChange={e => setExclusions(e.target.value)}
                rows={2}
              />
            </div>

            {/* Notizen */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                placeholder="Weitere Hinweise zum Suchprofil"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="ghost" onClick={() => setPhase('capture')}>
                ← Zurück zur Freitext-Erfassung
              </Button>
              <Button
                size="lg"
                onClick={handleCreate}
                disabled={!clientName.trim() || createMandate.isPending}
              >
                {createMandate.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Mandat erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
