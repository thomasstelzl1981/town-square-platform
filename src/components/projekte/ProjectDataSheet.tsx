/**
 * ProjectDataSheet — Vollständig editierbares Projekt-Datenblatt
 * Ersetzt ProjectOverviewCard. Alle Felder editierbar, ein Speichern-Button.
 * KI-Beschreibungs-Button für automatische Exposé-Analyse.
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin, Home, Ruler, Calendar, Flame, Zap, Car, Building2, Layers,
  CheckCircle2, Scale, Users, Briefcase, Receipt, Percent, BookOpen,
  Save, Loader2, Sparkles, Upload, ImageOff, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { ProjectPortfolioRow } from '@/types/projekte';
import { DEMO_PROJECT_DESCRIPTION, DEMO_PROJECT_IMAGES } from './demoProjectData';
import { sanitizeFileName } from '@/config/storageManifest';

import demoExterior from '@/assets/demo-project-exterior.jpg';
import demoLivingroom from '@/assets/demo-project-livingroom.jpg';
import demoKitchen from '@/assets/demo-project-kitchen.jpg';
import demoBathroom from '@/assets/demo-project-bathroom.jpg';

const IMAGE_MAP: Record<string, string> = {
  exterior: demoExterior,
  livingroom: demoLivingroom,
  kitchen: demoKitchen,
  bathroom: demoBathroom,
};

// ── GrESt by Bundesland ──
const BUNDESLAND_GREST: Record<string, { label: string; rate: number }> = {
  BW: { label: 'Baden-Württemberg', rate: 5.0 },
  BY: { label: 'Bayern', rate: 3.5 },
  BE: { label: 'Berlin', rate: 6.0 },
  BB: { label: 'Brandenburg', rate: 6.5 },
  HB: { label: 'Bremen', rate: 5.0 },
  HH: { label: 'Hamburg', rate: 5.5 },
  HE: { label: 'Hessen', rate: 6.0 },
  MV: { label: 'Mecklenburg-Vorpommern', rate: 6.0 },
  NI: { label: 'Niedersachsen', rate: 5.0 },
  NW: { label: 'Nordrhein-Westfalen', rate: 6.5 },
  RP: { label: 'Rheinland-Pfalz', rate: 5.0 },
  SL: { label: 'Saarland', rate: 6.5 },
  SN: { label: 'Sachsen', rate: 5.5 },
  ST: { label: 'Sachsen-Anhalt', rate: 5.0 },
  SH: { label: 'Schleswig-Holstein', rate: 6.5 },
  TH: { label: 'Thüringen', rate: 5.0 },
};

const AFA_MODELS = [
  { value: 'linear', label: 'Linear (§7 Abs. 4)' },
  { value: '7i', label: '§7i Denkmal' },
  { value: '7h', label: '§7h Sanierung' },
  { value: '7b', label: '§7b Neubau' },
];

const IMAGE_SLOTS = [
  { key: 'hero', label: 'Hero-Bild', desc: 'Hauptbild für Exposé & Landingpage' },
  { key: 'exterior', label: 'Außen', desc: 'Außenansicht des Gebäudes' },
  { key: 'interior', label: 'Innen', desc: 'Innenansicht / Musterwohnung' },
  { key: 'surroundings', label: 'Umgebung', desc: 'Lage & Infrastruktur' },
] as const;

type ImageSlotKey = typeof IMAGE_SLOTS[number]['key'];

interface ProjectDataSheetProps {
  isDemo?: boolean;
  selectedProject?: ProjectPortfolioRow;
  unitCount?: number;
  fullProject?: Record<string, any> | null;
}

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export function ProjectDataSheet({ isDemo, selectedProject, unitCount, fullProject }: ProjectDataSheetProps) {
  const queryClient = useQueryClient();
  const projectId = selectedProject?.id;

  // ── Form state ──
  const intake = (fullProject?.intake_data as Record<string, any>) ?? {};
  const reviewed = intake?.reviewed_data as Record<string, any> | null;

  const initVal = useCallback((dbField: string, intakeField?: string, fallback?: any) => {
    if (fullProject?.[dbField] != null) return fullProject[dbField];
    if (intakeField && intake?.[intakeField] != null) return intake[intakeField];
    return fallback ?? '';
  }, [fullProject, intake]);

  // Object data
  const [totalUnits, setTotalUnits] = useState(unitCount ?? selectedProject?.total_units_count ?? 0);
  const [totalArea, setTotalArea] = useState<number>(
    typeof intake?.total_area_sqm === 'number' ? intake.total_area_sqm
      : typeof reviewed?.totalArea === 'number' ? reviewed.totalArea : 0
  );
  const [constructionYear, setConstructionYear] = useState(intake?.construction_year ?? 0);
  const [conditionText, setConditionText] = useState(initVal('condition_text', 'modernization_status', ''));
  const [floorsCount, setFloorsCount] = useState(initVal('floors_count', undefined, 0));
  const [heatingType, setHeatingType] = useState(initVal('heating_type', 'heating_type', ''));
  const [energySource, setEnergySource] = useState(initVal('energy_source', undefined, ''));
  const [energyClass, setEnergyClass] = useState(initVal('energy_class', 'energy_class', ''));
  const [parkingType, setParkingType] = useState(initVal('parking_type', undefined, ''));
  const [sellerName, setSellerName] = useState(initVal('seller_name', 'developer', ''));
  const [investmentType, setInvestmentType] = useState(initVal('investment_type', undefined, ''));
  const [managementCompany, setManagementCompany] = useState(initVal('management_company', undefined, ''));
  const [managementCost, setManagementCost] = useState(initVal('management_cost_per_unit', undefined, 0));
  const [incomeType, setIncomeType] = useState(initVal('income_type', undefined, ''));
  const [featuresText, setFeaturesText] = useState(
    Array.isArray(fullProject?.features) ? (fullProject.features as string[]).join(', ') : ''
  );

  // Federal state + GrESt
  const [federalState, setFederalState] = useState(initVal('federal_state', undefined, ''));
  const [grestRate, setGrestRate] = useState(Number(initVal('grest_rate_percent', undefined, 6.5)));
  const notaryRate = 2.0; // fixed

  // AfA
  const [afaRate, setAfaRate] = useState(Number(fullProject?.afa_rate_percent ?? 2.0));
  const [afaModel, setAfaModel] = useState(fullProject?.afa_model ?? 'linear');
  const [landShare, setLandShare] = useState(Number(fullProject?.land_share_percent ?? 20.0));

  // Descriptions
  const [description, setDescription] = useState(fullProject?.full_description ?? '');
  const [locationDesc, setLocationDesc] = useState(fullProject?.location_description ?? '');

  // Image uploads
  const [projectImages, setProjectImages] = useState<Record<string, string>>(
    (fullProject?.project_images as Record<string, string>) ?? {}
  );
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // UI state
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  // Auto-update GrESt when Bundesland changes
  useEffect(() => {
    if (federalState && BUNDESLAND_GREST[federalState]) {
      setGrestRate(BUNDESLAND_GREST[federalState].rate);
      setDirty(true);
    }
  }, [federalState]);

  // Load signed URLs for project images
  useEffect(() => {
    const loadUrls = async () => {
      const urls: Record<string, string> = {};
      for (const [key, path] of Object.entries(projectImages)) {
        if (path) {
          const { data } = await supabase.storage.from('tenant-documents').createSignedUrl(path, 3600);
          if (data?.signedUrl) urls[key] = data.signedUrl;
        }
      }
      setImageUrls(urls);
    };
    if (Object.keys(projectImages).some(k => projectImages[k])) loadUrls();
  }, [projectImages]);

  const markDirty = () => setDirty(true);

  // ── Image Upload ──
  const handleImageUpload = async (slotKey: string, file: File) => {
    if (isDemo || !projectId || !fullProject?.tenant_id) return;
    setUploadingSlot(slotKey);
    try {
      const safeName = sanitizeFileName(file.name);
      const storagePath = `${fullProject.tenant_id}/MOD_13/${projectId}/images/${slotKey}_${safeName}`;
      const { error: uploadErr } = await supabase.storage
        .from('tenant-documents')
        .upload(storagePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      setProjectImages(prev => ({ ...prev, [slotKey]: storagePath }));
      const { data: urlData } = await supabase.storage
        .from('tenant-documents')
        .createSignedUrl(storagePath, 3600);
      if (urlData?.signedUrl) {
        setImageUrls(prev => ({ ...prev, [slotKey]: urlData.signedUrl }));
      }
      setDirty(true);
      toast.success(`${IMAGE_SLOTS.find(s => s.key === slotKey)?.label} hochgeladen`);
    } catch (err: any) {
      toast.error('Upload fehlgeschlagen', { description: err.message });
    } finally {
      setUploadingSlot(null);
    }
  };

  // ── KI-Beschreibung ──
  const generateAiDescription = async () => {
    if (isDemo || !projectId) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-project-description', {
        body: { projectId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.description) {
        setDescription(data.description);
        setDirty(true);
      }
      if (data?.location_description) {
        setLocationDesc(data.location_description);
        setDirty(true);
      }
      toast.success('KI-Beschreibung generiert', { description: 'Bitte prüfen und ggf. anpassen.' });
    } catch (err: any) {
      const msg = err?.message || 'Unbekannter Fehler';
      if (msg.includes('Rate-Limit') || msg.includes('429')) {
        toast.error('Rate-Limit erreicht', { description: 'Bitte in einer Minute erneut versuchen.' });
      } else if (msg.includes('Credits') || msg.includes('402')) {
        toast.error('KI-Credits aufgebraucht');
      } else {
        toast.error('KI-Beschreibung fehlgeschlagen', { description: msg });
      }
    } finally {
      setAiLoading(false);
    }
  };

  // ── Save all ──
  const handleSave = async () => {
    if (isDemo || !projectId) return;
    setSaving(true);
    try {
      const featuresArr = featuresText
        .split(',')
        .map(f => f.trim())
        .filter(Boolean);

      const updatePayload: Record<string, any> = {
        full_description: description || null,
        location_description: locationDesc || null,
        features: featuresArr.length > 0 ? featuresArr : null,
        heating_type: heatingType || null,
        energy_source: energySource || null,
        energy_class: energyClass || null,
        parking_type: parkingType || null,
        federal_state: federalState || null,
        grest_rate_percent: grestRate,
        notary_rate_percent: notaryRate,
        seller_name: sellerName || null,
        management_company: managementCompany || null,
        management_cost_per_unit: managementCost || null,
        investment_type: investmentType || null,
        income_type: incomeType || null,
        condition_text: conditionText || null,
        floors_count: floorsCount || null,
        project_images: projectImages,
        afa_rate_percent: afaRate,
        afa_model: afaModel,
        land_share_percent: landShare,
      };

      const { error } = await supabase
        .from('dev_projects')
        .update(updatePayload as any)
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Projekt-Datenblatt gespeichert');
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['dev-projects'] });
    } catch (err: any) {
      toast.error('Fehler beim Speichern', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Demo mode ──
  const demoData = isDemo ? DEMO_PROJECT_DESCRIPTION : null;
  const demoImages = isDemo ? DEMO_PROJECT_IMAGES : [];
  const headline = selectedProject?.name || demoData?.headline || '—';
  const address = selectedProject
    ? [fullProject?.address, `${selectedProject.postal_code || ''} ${selectedProject.city || ''}`].filter(Boolean).join(', ').trim()
    : demoData ? `${demoData.address}, ${demoData.postal_code} ${demoData.city}` : '—';
  const totalSalePrice = selectedProject?.total_sale_target ?? selectedProject?.purchase_price ?? demoData?.total_sale_price ?? 0;

  return (
    <Card className={cn('overflow-hidden', isDemo && 'opacity-60 select-none')}>
      <CardContent className="p-6 space-y-5">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight">{headline}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{address || '—'}</span>
            </div>
          </div>
          <div className="text-right shrink-0 flex items-center gap-3">
            {totalSalePrice > 0 && (
              <div>
                <p className="text-lg font-bold text-primary">{eur(totalSalePrice)}</p>
                <p className="text-[11px] text-muted-foreground">Gesamtverkaufspreis</p>
              </div>
            )}
            {dirty && !isDemo && (
              <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Speichern
              </Button>
            )}
          </div>
        </div>

        {isDemo && (
          <Badge variant="outline" className="text-[10px] italic text-muted-foreground">Musterdaten</Badge>
        )}

        {/* ── 4 Image Slots ── */}
        <div className="border-t pt-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Projektbilder</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {IMAGE_SLOTS.map((slot) => {
              const storagePath = projectImages[slot.key];
              const signedUrl = imageUrls[slot.key];
              // Demo images
              const demoImg = isDemo && demoImages.length > 0
                ? IMAGE_MAP[demoImages.find(d => d.importKey === slot.key)?.importKey || '']
                : null;
              const displayUrl = signedUrl || demoImg;
              const isUploading = uploadingSlot === slot.key;

              return (
                <div key={slot.key} className="relative group">
                  <label
                    className={cn(
                      'block rounded-lg overflow-hidden border-2 border-dashed cursor-pointer transition-colors h-[140px]',
                      displayUrl ? 'border-transparent' : 'border-muted-foreground/20 hover:border-primary/40',
                      isUploading && 'opacity-50 pointer-events-none'
                    )}
                  >
                    {displayUrl ? (
                      <img src={displayUrl} alt={slot.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-1 text-muted-foreground/50">
                        {isUploading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Upload className="h-6 w-6" />
                        )}
                        <span className="text-[10px]">{slot.label}</span>
                      </div>
                    )}
                    {!isDemo && (
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageUpload(slot.key, f);
                        }}
                      />
                    )}
                  </label>
                  <span className="absolute top-1 left-1 bg-background/80 backdrop-blur-sm text-[9px] font-medium px-1.5 py-0.5 rounded">
                    {slot.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Objektdaten — full-width grid ── */}
        <div className="space-y-4 pt-2 border-t">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Objektdaten</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <FormField label="Wohneinheiten" icon={Home}>
              <Input type="number" value={totalUnits} onChange={e => { setTotalUnits(+e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm" />
            </FormField>
            <FormField label="Wohnfläche (m²)" icon={Ruler}>
              <Input type="number" value={totalArea} onChange={e => { setTotalArea(+e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm" />
            </FormField>
            <FormField label="Baujahr" icon={Calendar}>
              <Input type="number" value={constructionYear} onChange={e => { setConstructionYear(+e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm" />
            </FormField>
            <FormField label="Stockwerke" icon={Layers}>
              <Input type="number" value={floorsCount} onChange={e => { setFloorsCount(+e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm" />
            </FormField>
            <FormField label="Zustand" icon={CheckCircle2}>
              <Input value={conditionText} onChange={e => { setConditionText(e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm" />
            </FormField>
            <FormField label="Heizung" icon={Flame}>
              <Input value={heatingType} onChange={e => { setHeatingType(e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm" />
            </FormField>
            <FormField label="Energieträger" icon={Zap}>
              <Input value={energySource} onChange={e => { setEnergySource(e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm" />
            </FormField>
            <FormField label="Energieklasse" icon={Zap}>
              <Input value={energyClass} onChange={e => { setEnergyClass(e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm" />
            </FormField>
            <FormField label="Stellplätze" icon={Car}>
              <Input value={parkingType} onChange={e => { setParkingType(e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm" />
            </FormField>
            <FormField label="Verkäufer" icon={Users}>
              <Input value={sellerName} onChange={e => { setSellerName(e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm" />
            </FormField>
            <FormField label="Anlagetyp" icon={Briefcase}>
              <Input value={investmentType} onChange={e => { setInvestmentType(e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm" placeholder="z.B. Kapitalanlage" />
            </FormField>
            <FormField label="Ausstattung" icon={CheckCircle2}>
              <Input value={featuresText} onChange={e => { setFeaturesText(e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm" placeholder="Balkon, FBH, …" />
            </FormField>
          </div>
        </div>

        {/* ── Objektbeschreibung — full width ── */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Objektbeschreibung</p>
            {!isDemo && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={generateAiDescription}
                disabled={aiLoading}
              >
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {aiLoading ? 'Exposé wird analysiert…' : 'KI-Beschreibung generieren'}
              </Button>
            )}
          </div>
          <Textarea
            value={description}
            onChange={e => { setDescription(e.target.value); markDirty(); }}
            disabled={isDemo}
            placeholder="Professionelle Objektbeschreibung (150-250 Wörter)…"
            className="text-sm leading-relaxed resize-none overflow-hidden"
            style={{ fieldSizing: 'content', minHeight: '80px' } as React.CSSProperties}
          />
          {description && (
            <p className="text-[10px] text-muted-foreground text-right">
              {description.split(/\s+/).filter(Boolean).length} Wörter
            </p>
          )}
        </div>

        {/* ── Lagebeschreibung — full width ── */}
        <div className="space-y-2 pt-2 border-t">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Lagebeschreibung</p>
          <Textarea
            value={locationDesc}
            onChange={e => { setLocationDesc(e.target.value); markDirty(); }}
            disabled={isDemo}
            placeholder="Lage, Infrastruktur, Anbindung (100-150 Wörter)…"
            className="text-sm leading-relaxed resize-none overflow-hidden"
            style={{ fieldSizing: 'content', minHeight: '80px' } as React.CSSProperties}
          />
          {locationDesc && (
            <p className="text-[10px] text-muted-foreground text-right">
              {locationDesc.split(/\s+/).filter(Boolean).length} Wörter
            </p>
          )}
        </div>

        {/* ── Erwerbsnebenkosten — full width ── */}
        <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5" /> Erwerbsnebenkosten
          </p>

          <FormField label="Bundesland" icon={MapPin}>
            <Select value={federalState} onValueChange={v => { setFederalState(v); markDirty(); }} disabled={isDemo}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Bundesland wählen" /></SelectTrigger>
              <SelectContent>
                {Object.entries(BUNDESLAND_GREST).map(([code, { label }]) => (
                  <SelectItem key={code} value={code}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <Label className="text-[10px] text-muted-foreground">Grunderwerbsteuer</Label>
              <div className="flex items-center gap-1">
                <Input type="number" step="0.5" value={grestRate} onChange={e => { setGrestRate(+e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm w-20" />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              {federalState && (
                <span className="text-[9px] text-muted-foreground">({BUNDESLAND_GREST[federalState]?.label})</span>
              )}
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Notar/Gericht</Label>
              <div className="flex items-center gap-1">
                <Input type="number" value={notaryRate} disabled className="h-8 text-sm w-20 bg-muted/60" />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <span className="text-[9px] text-muted-foreground">(pauschal)</span>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Gesamt</Label>
              <p className="text-sm font-semibold h-8 flex items-center">{(grestRate + notaryRate).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* ── Steuerliche Parameter — full width ── */}
        <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Steuerliche Parameter
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">AfA-Satz (%)</Label>
              <Input type="number" step="0.5" min="0" max="20" value={afaRate}
                onChange={e => { setAfaRate(+e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">AfA-Modell</Label>
              <Select value={afaModel} onValueChange={v => { setAfaModel(v); markDirty(); }} disabled={isDemo}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AFA_MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Grundanteil (%)</Label>
              <Input type="number" step="1" min="0" max="100" value={landShare}
                onChange={e => { setLandShare(+e.target.value); markDirty(); }} disabled={isDemo} className="h-8 text-sm" />
            </div>
          </div>

          <FormField label="WEG-Verwaltung" icon={Scale}>
            <div className="flex gap-2">
              <Input value={managementCompany} onChange={e => { setManagementCompany(e.target.value); markDirty(); }}
                disabled={isDemo} className="h-8 text-sm flex-1" placeholder="Firma" />
              <div className="flex items-center gap-1">
                <Input type="number" value={managementCost} onChange={e => { setManagementCost(+e.target.value); markDirty(); }}
                  disabled={isDemo} className="h-8 text-sm w-20" />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">EUR/WE</span>
              </div>
            </div>
          </FormField>

          <FormField label="Einkunftsart" icon={BookOpen}>
            <Input value={incomeType} onChange={e => { setIncomeType(e.target.value); markDirty(); }}
              disabled={isDemo} className="h-8 text-sm" placeholder="z.B. §21 EStG V+V" />
          </FormField>
        </div>

        {/* ── Save button — full width ── */}
        {!isDemo && (
          <Button onClick={handleSave} disabled={saving || !dirty} className="w-full gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Projekt-Datenblatt speichern
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Helper: Form field with icon + label ──
function FormField({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </Label>
      {children}
    </div>
  );
}
