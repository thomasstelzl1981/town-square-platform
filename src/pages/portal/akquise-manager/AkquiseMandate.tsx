/**
 * AkquiseMandate — Mandate-Übersicht + Inline-Erstellung (MOD-12)
 * Sektion A: Meine Mandate (WidgetGrid)
 * Sektion B: Neues Mandat erstellen (Inline-Workflow)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { MandateCaseCard, MandateCaseCardPlaceholder } from '@/components/akquise/MandateCaseCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Send } from 'lucide-react';
import { useAcqMandatesForManager, useCreateAcqMandate } from '@/hooks/useAcqMandate';
import { ASSET_FOCUS_OPTIONS, type CreateAcqMandateData } from '@/types/acquisition';

export default function AkquiseMandate() {
  const navigate = useNavigate();
  const { data: mandates, isLoading } = useAcqMandatesForManager();
  const createMandate = useCreateAcqMandate();

  // Form state
  const [clientName, setClientName] = useState('');
  const [region, setRegion] = useState('');
  const [assetFocus, setAssetFocus] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [yieldTarget, setYieldTarget] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [notes, setNotes] = useState('');

  const toggleAssetFocus = (value: string) => {
    setAssetFocus(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

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
      navigate(`/portal/akquise-manager/mandate/${result.id}`);
    }
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

      {/* ── Sektion A: Meine Mandate ── */}
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
                  onClick={() => navigate(`/portal/akquise-manager/mandate/${mandate.id}`)}
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

      {/* ── Sektion B: Neues Mandat erstellen ── */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Neues Mandat erstellen</CardTitle>
          <CardDescription>
            Kontakt-First: Erfassen Sie die Eckdaten des Suchprofils. Das Mandat wird erst beim Absenden angelegt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {/* Submit */}
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
        </CardContent>
      </Card>
    </PageShell>
  );
}
