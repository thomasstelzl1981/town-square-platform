/**
 * Selfie Ads Planen — Kampagne planen (Zone 2)
 * Seitenbasiert mit 5 Abschnitten: Parameter, Templates (5 Slots), Personalisierung, Generieren, Zusammenfassung
 */
import { useState, useCallback } from 'react';
import { DESIGN } from '@/config/designManifest';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Megaphone, Image, Sparkles, User, FileText, ArrowRight, Check, Upload, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TEMPLATE_DEFS = [
  { key: 'T1', name: 'Rendite-Highlight', format: 'Slideshow (4 Slides)', description: 'Renditezahlen & Fakten im Fokus' },
  { key: 'T2', name: 'Berater-Portrait', format: 'Slideshow (4 Slides)', description: 'Persönliche Vorstellung des Beraters' },
  { key: 'T3', name: 'Objekt-Showcase', format: 'Slideshow (4 Slides)', description: 'Beispielobjekte & Standortvorteile' },
  { key: 'T4', name: 'Testimonial', format: 'Slideshow (4 Slides)', description: 'Kundenstimmen & Erfolgsgeschichten' },
  { key: 'T5', name: 'Region-Focus', format: 'Slideshow (4 Slides)', description: 'Regionale Marktdaten & Chancen' },
];

const PRESETS = ['Kapitalanlage', 'Immobilien', 'Vermietung', 'Finanzierung'];

type SlotCreative = {
  slides: string[];
  caption: string;
  cta: string;
};

type PlanFormData = {
  goal: string;
  platform: string;
  startDate: string;
  endDate: string;
  budget: number;
  regions: string;
  presets: string[];
  selectedSlots: string[];
  personalization: {
    name: string;
    region: string;
    claim: string;
    phone: string;
    email: string;
  };
  creatives: Record<string, SlotCreative>;
};

const DEFAULT_CAPTIONS: Record<string, string> = {
  T1: 'Sichere Rendite mit Kaufy — Bis zu 6% p.a. mit Kapitalanlage-Immobilien',
  T2: 'Ihr Berater vor Ort — Persönliche Beratung für Ihre Kapitalanlage',
  T3: 'Exklusive Anlageobjekte — Handverlesene Immobilien in Top-Lagen',
  T4: '„Beste Entscheidung meines Lebens" — Was unsere Kunden sagen',
  T5: 'Ihr Standortvorteil — Marktdaten & Chancen in Ihrer Region',
};

const DEFAULT_CTAS: Record<string, string> = {
  T1: 'Jetzt Rendite-Check starten',
  T2: 'Kostenlos beraten lassen',
  T3: 'Objekte entdecken',
  T4: 'Erfolgsgeschichte lesen',
  T5: 'Marktanalyse anfordern',
};

const SLIDE_LABELS: Record<string, string[]> = {
  T1: ['Headline + Kennzahl', 'Rendite-Beispiel', 'Vergleich Tagesgeld', 'CTA + Berater'],
  T2: ['Berater-Portrait', 'Expertise & Erfahrung', 'Leistungsversprechen', 'Kontakt + CTA'],
  T3: ['Objekt-Außenansicht', 'Lage & Infrastruktur', 'Kennzahlen & Rendite', 'CTA + Kontakt'],
  T4: ['Kundenzitat', 'Vorher/Nachher', 'Ergebnis-Kennzahl', 'CTA + Vertrauen'],
  T5: ['Region-Karte', 'Marktdaten', 'Preisentwicklung', 'CTA + Berater'],
};

export default function SelfieAdsPlanen() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const [form, setForm] = useState<PlanFormData>({
    goal: 'Kapitalanleger-Leads',
    platform: 'Facebook + Instagram (Paid)',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    budget: 2500,
    regions: 'München',
    presets: ['Kapitalanlage'],
    selectedSlots: [],
    personalization: { name: '', region: '', claim: '', phone: '', email: '' },
    creatives: {},
  });

  const hasCreatives = Object.keys(form.creatives).length > 0;

  const toggleSlot = (key: string) => {
    setForm(prev => ({
      ...prev,
      selectedSlots: prev.selectedSlots.includes(key)
        ? prev.selectedSlots.filter(s => s !== key)
        : [...prev.selectedSlots, key],
    }));
  };

  const togglePreset = (p: string) => {
    setForm(prev => ({
      ...prev,
      presets: prev.presets.includes(p) ? prev.presets.filter(x => x !== p) : [...prev.presets, p],
    }));
  };

  const updatePersonalization = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      personalization: { ...prev.personalization, [field]: value },
    }));
  };

  const updateCreative = (slotKey: string, field: 'caption' | 'cta', value: string) => {
    setForm(prev => ({
      ...prev,
      creatives: {
        ...prev.creatives,
        [slotKey]: { ...prev.creatives[slotKey], [field]: value },
      },
    }));
  };

  const handleGenerate = useCallback(async () => {
    if (form.selectedSlots.length === 0) {
      toast.error('Bitte mindestens einen Template-Slot auswählen');
      return;
    }
    setIsGenerating(true);
    // Simulate generation delay
    await new Promise(r => setTimeout(r, 1500));

    const newCreatives: Record<string, SlotCreative> = {};
    for (const slotKey of form.selectedSlots) {
      newCreatives[slotKey] = {
        slides: SLIDE_LABELS[slotKey] || ['Slide 1', 'Slide 2', 'Slide 3', 'Slide 4'],
        caption: DEFAULT_CAPTIONS[slotKey] || 'Ihre Chance auf sichere Rendite',
        cta: DEFAULT_CTAS[slotKey] || 'Jetzt kostenlos beraten lassen',
      };
    }
    setForm(prev => ({ ...prev, creatives: newCreatives }));
    setIsGenerating(false);
    toast.success(`${form.selectedSlots.length} Creatives generiert`);
  }, [form.selectedSlots]);

  const handleNavigateToSummary = () => {
    // Store form data for summary page
    sessionStorage.setItem('selfieAdsPlanData', JSON.stringify(form));
    navigate('/portal/vertriebspartner/selfie-ads-summary');
  };

  const formatBudget = (cents: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Kampagne planen</h1>
        <p className="text-muted-foreground mt-1">Kaufy Selfie Ads — Social-Media-Mandat konfigurieren</p>
      </div>

      {/* ABSCHNITT A — Parameter */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="font-medium">A) Kampagnen-Parameter</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ziel</Label>
              <Input value={form.goal} disabled className="bg-muted/30" />
              <p className="text-xs text-muted-foreground">Fix im MVP</p>
            </div>
            <div className="space-y-2">
              <Label>Plattform</Label>
              <Input value={form.platform} disabled className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label>Laufzeit von</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Laufzeit bis</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Gesamtbudget (EUR)</Label>
              <Input
                type="number"
                value={form.budget}
                onChange={e => setForm(prev => ({ ...prev, budget: Number(e.target.value) }))}
                min={500}
                step={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Regionen (max. 3)</Label>
              <Input
                placeholder="z.B. München, Berlin, Hamburg"
                value={form.regions}
                onChange={e => setForm(prev => ({ ...prev, regions: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Zielgruppe Presets</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Badge
                  key={p}
                  variant={form.presets.includes(p) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => togglePreset(p)}
                >
                  {form.presets.includes(p) && <Check className="h-3 w-3 mr-1" />}
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ABSCHNITT B — 5 Template-Slots */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Image className="h-4 w-4 text-primary" />
            <h2 className="font-medium">B) Template-Slots (5 Kaufy CI Templates)</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Wählen Sie die Templates aus, die für Ihre Kampagne generiert werden sollen</p>
          <div className={DESIGN.WIDGET_GRID.FULL}>
            {TEMPLATE_DEFS.map((t) => {
              const isSelected = form.selectedSlots.includes(t.key);
              const isGenerated = !!form.creatives[t.key];
              return (
                <div
                  key={t.key}
                  onClick={() => toggleSlot(t.key)}
                  className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-dashed border-border bg-muted/20 hover:border-primary/40'
                  }`}
                >
                  <Badge
                    variant={isGenerated ? 'default' : isSelected ? 'secondary' : 'outline'}
                    className="absolute top-2 right-2 text-xs"
                  >
                    {isGenerated ? '✓ Generiert' : isSelected ? 'Gewählt' : 'Leer'}
                  </Badge>
                  <div className="h-16 w-full rounded-lg bg-muted/50 flex items-center justify-center mb-3">
                    {isGenerated ? (
                      <Sparkles className="h-6 w-6 text-primary/60" />
                    ) : (
                      <Image className="h-6 w-6 text-muted-foreground/50" />
                    )}
                  </div>
                  <p className="text-xs font-medium">{t.key}: {t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.format}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{t.description}</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {form.selectedSlots.length}/5 Slots gewählt
          </p>
        </CardContent>
      </Card>

      {/* ABSCHNITT C — Personalisierung */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-primary" />
            <h2 className="font-medium">C) Personalisierung (Kaufy CI)</h2>
          </div>
          <p className="text-xs text-muted-foreground">Wird über Kaufy Social-Media-Accounts veröffentlicht</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Beraterportrait</Label>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center shrink-0">
                  <Upload className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <Button variant="outline" size="sm">Foto hochladen</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Ihr Name"
                value={form.personalization.name}
                onChange={e => updatePersonalization('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Input
                placeholder="z.B. München & Umgebung"
                value={form.personalization.region}
                onChange={e => updatePersonalization('region', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Claim (max. 80 Zeichen)</Label>
              <Input
                placeholder="Ihr persönlicher Claim"
                maxLength={80}
                value={form.personalization.claim}
                onChange={e => updatePersonalization('claim', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{form.personalization.claim.length}/80 Zeichen</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ABSCHNITT D — Generieren */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-medium">D) Creatives generieren</h2>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={form.selectedSlots.length === 0 || isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGenerating ? 'Generiere...' : `Generieren (${form.selectedSlots.length} Slots)`}
            </Button>
          </div>

          {form.selectedSlots.length === 0 && !hasCreatives && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Wählen Sie oben mindestens einen Template-Slot aus, um Creatives zu generieren
            </p>
          )}

          {hasCreatives && (
            <div className="space-y-4 mt-4">
              {form.selectedSlots.map((slotKey) => {
                const tmpl = TEMPLATE_DEFS.find(t => t.key === slotKey)!;
                const creative = form.creatives[slotKey];
                if (!creative) return null;
                return (
                  <div key={slotKey} className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{slotKey}: {tmpl.name}</p>
                      <Badge variant="default" className="text-xs">✓ Generiert</Badge>
                    </div>
                    {/* 4-Slide Thumbnails */}
                    <div className="flex gap-2">
                      {creative.slides.map((slideLabel, idx) => (
                        <div key={idx} className="h-20 flex-1 rounded-md bg-gradient-to-br from-muted/80 to-muted/40 border border-border/50 flex flex-col items-center justify-center p-1">
                          <span className="text-xs text-muted-foreground font-medium">Slide {idx + 1}</span>
                          <span className="text-xs text-muted-foreground/70 text-center mt-0.5 leading-tight">{slideLabel}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Caption / Hook</Label>
                        <Input
                          value={creative.caption}
                          onChange={e => updateCreative(slotKey, 'caption', e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">CTA</Label>
                        <Input
                          value={creative.cta}
                          onChange={e => updateCreative(slotKey, 'cta', e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ABSCHNITT E — Zusammenfassung */}
      {hasCreatives && form.selectedSlots.length > 0 && (
        <Card className="glass-card border-primary/30">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="font-medium">E) Mandat-Zusammenfassung</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Budget</span>
                <p className="font-medium">{formatBudget(form.budget)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Laufzeit</span>
                <p className="font-medium">
                  {new Date(form.startDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} – {new Date(form.endDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Regionen</span>
                <p className="font-medium">{form.regions || '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Templates</span>
                <p className="font-medium">{form.selectedSlots.length} Slots ({form.selectedSlots.join(', ')})</p>
              </div>
            </div>
            {form.personalization.name && (
              <div className="text-sm">
                <span className="text-muted-foreground text-xs">Berater</span>
                <p className="font-medium">{form.personalization.name} {form.personalization.region ? `· ${form.personalization.region}` : ''}</p>
              </div>
            )}
            <Separator />
            <Button onClick={handleNavigateToSummary} className="w-full gap-2">
              Zur Mandatszusammenfassung <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
