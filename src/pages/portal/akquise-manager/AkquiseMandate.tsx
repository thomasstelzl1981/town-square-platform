/**
 * AkquiseMandate — Vollständiger Workflow nach FM-Vorbild (MOD-12)
 * 
 * ALLE 7 Sektionen sind IMMER sichtbar (durchlaufende Seite).
 * Sektionen 3-7 werden ausgegraut wenn kein Mandat erstellt wurde.
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

export default function AkquiseMandate() {
  const navigate = useNavigate();
  const { data: mandates, isLoading } = useAcqMandatesForManager();
  const createMandate = useCreateAcqMandate();

  // Active mandate (null = neues Mandat wird erstellt)
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
        toast.success('Ankaufsprofil extrahiert');
      } else {
        throw new Error('Kein Profil extrahiert');
      }
    } catch (err) {
      console.error(err);
      toast.error('KI-Analyse fehlgeschlagen — bitte manuell ausfüllen');
    } finally {
      setIsExtracting(false);
    }
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
      toast.success('Mandat erstellt');
    }
  };

  // ── Select existing mandate ──
  const handleSelectMandate = (mandate: { id: string; code: string }) => {
    setActiveMandateId(mandate.id);
    setActiveMandateCode(mandate.code);
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

      <Separator />

      {/* ══════════════════════════════════════════════════════════════════
          SEKTION 1: KI-gestützte Erfassung (IMMER SICHTBAR)
          ══════════════════════════════════════════════════════════════════ */}
      <AcqSectionHeader
        number={1}
        title="KI-gestützte Erfassung"
        description="Beschreiben Sie in eigenen Worten, was Ihr Mandant sucht. Die KI erstellt ein strukturiertes Ankaufsprofil."
        icon={<Sparkles className="h-5 w-5" />}
      />
      <div className="space-y-4">
        <Textarea
          placeholder="z.B. Family Office sucht Mehrfamilienhäuser in der Rhein-Main-Region, Investitionsvolumen 2 bis 5 Millionen Euro, mindestens 4% Rendite, kein Denkmalschutz, keine Erbbaurechte."
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          rows={5}
          className="text-base"
        />
        <div className="flex justify-end">
          <Button
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
      </div>

      <Separator />

      {/* ══════════════════════════════════════════════════════════════════
          SEKTION 2: Ankaufsprofil aufbereiten (IMMER SICHTBAR)
          ══════════════════════════════════════════════════════════════════ */}
      <AcqSectionHeader
        number={2}
        title="Ankaufsprofil aufbereiten"
        description="Prüfen und ergänzen Sie die Daten. Wird durch KI vorausgefüllt oder manuell befüllt."
      />
      <div className="space-y-6">
        {/* KI-generiertes Profil */}
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
            <Input id="priceMin" type="number" placeholder="500.000" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priceMax">Preis bis (€)</Label>
            <Input id="priceMax" type="number" placeholder="5.000.000" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yieldTarget">Zielrendite (%)</Label>
            <Input id="yieldTarget" type="number" step="0.1" placeholder="5.0" value={yieldTarget} onChange={e => setYieldTarget(e.target.value)} />
          </div>
        </div>

        {/* Ausschlüsse */}
        <div className="space-y-2">
          <Label htmlFor="exclusions">Ausschlüsse</Label>
          <Textarea id="exclusions" placeholder="z.B. keine Erbbau-Grundstücke, kein Denkmalschutz" value={exclusions} onChange={e => setExclusions(e.target.value)} rows={2} />
        </div>

        {/* Notizen */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notizen</Label>
          <Textarea id="notes" placeholder="Weitere Hinweise zum Suchprofil" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
        </div>

        {/* Mandat erstellen Button */}
        <div className="flex justify-end pt-4 border-t border-border">
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
      </div>

      <Separator />

      {/* ══════════════════════════════════════════════════════════════════
          SEKTIONEN 3-7: Operative Workflow-Sektionen (IMMER SICHTBAR)
          Ausgegraut wenn kein activeMandateId vorhanden
          ══════════════════════════════════════════════════════════════════ */}

      {/* ── 3. Kontaktrecherche ── */}
      <AcqSectionHeader
        number={3}
        title="Kontaktrecherche"
        description="Immobilienportale durchsuchen und passende Kontakte identifizieren"
        icon={<Search className="h-5 w-5" />}
      />
      <div className={!activeMandateId ? 'opacity-40 pointer-events-none' : ''}>
        <SourcingTab mandateId={activeMandateId!} mandateCode={activeMandateCode} />
      </div>
      {!activeMandateId && (
        <p className="text-sm text-muted-foreground italic">
          Erstellen Sie zuerst ein Mandat (Schritt 2), um diesen Bereich zu nutzen.
        </p>
      )}

      <Separator />

      {/* ── 4. E-Mail-Versand ── */}
      <AcqSectionHeader
        number={4}
        title="E-Mail-Versand"
        description="Kontakte anschreiben und Angebote einholen"
        icon={<Mail className="h-5 w-5" />}
      />
      <div className={!activeMandateId ? 'opacity-40 pointer-events-none' : ''}>
        <OutreachTab mandateId={activeMandateId!} mandateCode={activeMandateCode} />
      </div>
      {!activeMandateId && (
        <p className="text-sm text-muted-foreground italic">
          Erstellen Sie zuerst ein Mandat (Schritt 2), um diesen Bereich zu nutzen.
        </p>
      )}

      <Separator />

      {/* ── 5. Objekteingang ── */}
      <AcqSectionHeader
        number={5}
        title="Objekteingang"
        description="Eingegangene Angebote bewerten und zuordnen"
        icon={<Inbox className="h-5 w-5" />}
      />
      <div className={!activeMandateId ? 'opacity-40 pointer-events-none' : ''}>
        <InboundTab mandateId={activeMandateId!} mandateCode={activeMandateCode} />
      </div>
      {!activeMandateId && (
        <p className="text-sm text-muted-foreground italic">
          Erstellen Sie zuerst ein Mandat (Schritt 2), um diesen Bereich zu nutzen.
        </p>
      )}

      <Separator />

      {/* ── 6. Analyse & Kalkulation ── */}
      <AcqSectionHeader
        number={6}
        title="Analyse & Kalkulation"
        description="Bestand- und Aufteiler-Kalkulationen durchführen"
        icon={<Brain className="h-5 w-5" />}
      />
      <div className={!activeMandateId ? 'opacity-40 pointer-events-none' : ''}>
        <AnalysisTab mandateId={activeMandateId!} mandateCode={activeMandateCode} />
      </div>
      {!activeMandateId && (
        <p className="text-sm text-muted-foreground italic">
          Erstellen Sie zuerst ein Mandat (Schritt 2), um diesen Bereich zu nutzen.
        </p>
      )}

      <Separator />

      {/* ── 7. Delivery ── */}
      <AcqSectionHeader
        number={7}
        title="Delivery & Präsentation"
        description="Objekte dem Mandanten präsentieren"
        icon={<Package className="h-5 w-5" />}
      />
      <div className={!activeMandateId ? 'opacity-40 pointer-events-none' : ''}>
        <DeliveryTab mandateId={activeMandateId!} mandateCode={activeMandateCode} />
      </div>
      {!activeMandateId && (
        <p className="text-sm text-muted-foreground italic">
          Erstellen Sie zuerst ein Mandat (Schritt 2), um diesen Bereich zu nutzen.
        </p>
      )}
    </PageShell>
  );
}
