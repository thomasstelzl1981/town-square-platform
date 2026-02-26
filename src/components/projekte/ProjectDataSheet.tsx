/**
 * ProjectDataSheet — Vollständig editierbares Projekt-Datenblatt
 * Ersetzt ProjectOverviewCard. Alle Felder editierbar, ein Speichern-Button.
 * KI-Beschreibungs-Button für automatische Exposé-Analyse.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  MapPin, Home, Ruler, Calendar, Flame, Zap, Car, Building2, Layers,
  CheckCircle2, Scale, Users, Briefcase, Receipt, Percent, BookOpen,
  Save, Loader2, Sparkles, ChevronDown, Landmark, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { ProjectPortfolioRow } from '@/types/projekte';
import { DEMO_PROJECT_DESCRIPTION, DEMO_PROJECT_IMAGES } from './demoProjectData';
import { useImageSlotUpload } from '@/hooks/useImageSlotUpload';
import { ImageSlotGrid, type ImageSlot } from '@/components/shared/ImageSlotGrid';

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

const IMAGE_SLOTS: ImageSlot[] = [
  { key: 'hero', label: 'Hero-Bild', desc: 'Hauptbild für Exposé & Landingpage' },
  { key: 'exterior', label: 'Außen', desc: 'Außenansicht des Gebäudes' },
  { key: 'interior', label: 'Innen', desc: 'Innenansicht / Musterwohnung' },
  { key: 'surroundings', label: 'Umgebung', desc: 'Lage & Infrastruktur' },
];

interface ProjectDataSheetProps {
  isDemo?: boolean;
  selectedProject?: ProjectPortfolioRow;
  unitCount?: number;
  fullProject?: Record<string, any> | null;
}

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function truncateLines(text: string, maxLines: number): string {
  const lines = text.split('\n').slice(0, maxLines);
  return lines.join('\n');
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
  const [totalUnits, setTotalUnits] = useState(unitCount || selectedProject?.total_units_count || 0);
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
  const [slotDocIds, setSlotDocIds] = useState<Record<string, string>>({});

  // Shared image upload hook
  const imageUpload = useImageSlotUpload({
    moduleCode: 'MOD-13',
    entityId: projectId || '',
    tenantId: fullProject?.tenant_id || '',
    entityType: 'projekt',
  });
  const { uploadToSlot, getSignedUrl, uploadingSlot } = imageUpload;

  // UI state
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  // ── Developer Context (Anbieter/Impressum) – editable state ──
  const [devCtxId, setDevCtxId] = useState<string | null>(null);
  const [devName, setDevName] = useState('');
  const [devLegalForm, setDevLegalForm] = useState('');
  const [devManagingDirector, setDevManagingDirector] = useState('');
  const [devStreet, setDevStreet] = useState('');
  const [devHouseNumber, setDevHouseNumber] = useState('');
  const [devPostalCode, setDevPostalCode] = useState('');
  const [devCity, setDevCity] = useState('');
  const [devHrb, setDevHrb] = useState('');
  const [devUstId, setDevUstId] = useState('');

  useEffect(() => {
    if (!fullProject?.developer_context_id || isDemo) return;
    const loadContext = async () => {
      const { data } = await supabase
        .from('developer_contexts')
        .select('id, name, legal_form, managing_director, street, house_number, postal_code, city, hrb_number, ust_id')
        .eq('id', fullProject.developer_context_id)
        .maybeSingle();
      if (data) {
        setDevCtxId(data.id);
        setDevName(data.name || '');
        setDevLegalForm(data.legal_form || '');
        setDevManagingDirector(data.managing_director || '');
        setDevStreet(data.street || '');
        setDevHouseNumber(data.house_number || '');
        setDevPostalCode(data.postal_code || '');
        setDevCity(data.city || '');
        setDevHrb(data.hrb_number || '');
        setDevUstId(data.ust_id || '');
      }
    };
    loadContext();
  }, [fullProject?.developer_context_id, isDemo]);

  // ══════════════════════════════════════════════════════════════
  // ── CRITICAL: Sync form states when fullProject data arrives ──
  // useState only uses initialValue on FIRST render. When data
  // loads async, we must push it into state via useEffect.
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!fullProject) return;
    const intake = (fullProject.intake_data as Record<string, any>) ?? {};
    const reviewed = intake?.reviewed_data as Record<string, any> | null;

    setTotalUnits(unitCount || fullProject.total_units_count || selectedProject?.total_units_count || 0);
    setTotalArea(
      typeof intake?.total_area_sqm === 'number' ? intake.total_area_sqm
        : typeof reviewed?.totalArea === 'number' ? reviewed.totalArea : 0
    );
    setConstructionYear(fullProject.construction_year ?? intake?.construction_year ?? 0);
    setTotalArea(fullProject.total_area_sqm ?? (typeof intake?.total_area_sqm === 'number' ? intake.total_area_sqm : (typeof (intake?.reviewed_data as any)?.totalArea === 'number' ? (intake.reviewed_data as any).totalArea : 0)));
    setConditionText(fullProject.condition_text ?? intake?.modernization_status ?? '');
    setFloorsCount(fullProject.floors_count ?? 0);
    setHeatingType(fullProject.heating_type ?? intake?.heating_type ?? '');
    setEnergySource(fullProject.energy_source ?? '');
    setEnergyClass(fullProject.energy_class ?? intake?.energy_class ?? '');
    setParkingType(fullProject.parking_type ?? '');
    setSellerName(fullProject.seller_name ?? intake?.developer ?? '');
    setInvestmentType(fullProject.investment_type ?? '');
    setManagementCompany(fullProject.management_company ?? '');
    setManagementCost(fullProject.management_cost_per_unit ?? 0);
    setIncomeType(fullProject.income_type ?? '');
    setFeaturesText(
      Array.isArray(fullProject.features) ? (fullProject.features as string[]).join(', ') : ''
    );
    setFederalState(fullProject.federal_state ?? '');
    setGrestRate(Number(fullProject.grest_rate_percent ?? 6.5));
    setAfaRate(Number(fullProject.afa_rate_percent ?? 2.0));
    setAfaModel(fullProject.afa_model ?? 'linear');
    setLandShare(Number(fullProject.land_share_percent ?? 20.0));
    setDescription(fullProject.full_description ?? '');
    setLocationDesc(fullProject.location_description ?? '');
    setProjectImages((fullProject.project_images as Record<string, string>) ?? {});
    setDirty(false);

    // Auto-open descriptions if they have content
    setDescOpen(!!(fullProject.full_description));
    setLocationOpen(!!(fullProject.location_description));
  }, [fullProject?.id, unitCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-update GrESt when Bundesland changes
  useEffect(() => {
    if (federalState && BUNDESLAND_GREST[federalState]) {
      setGrestRate(BUNDESLAND_GREST[federalState].rate);
      setDirty(true);
    }
  }, [federalState]);

  // ── PRIMARY: Load images from document_links (DB-based) ──
  useEffect(() => {
    if (!projectId || !fullProject?.tenant_id || isDemo) return;
    const loadFromDb = async () => {
      const imageMap = await imageUpload.loadSlotImages(projectId, 'projekt');
      const urls: Record<string, string> = {};
      const docIds: Record<string, string> = {};
      for (const [key, val] of Object.entries(imageMap)) {
        urls[key] = val.url;
        docIds[key] = val.documentId;
      }
      // FALLBACK: merge legacy JSONB paths for slots not found in DB
      for (const [key, path] of Object.entries(projectImages)) {
        if (!urls[key] && path) {
          const url = await getSignedUrl(path);
          if (url) urls[key] = url;
        }
      }
      setImageUrls(urls);
      setSlotDocIds(docIds);
    };
    loadFromDb();
  }, [projectId, fullProject?.tenant_id, isDemo]);

  // Fallback: resolve JSONB paths for demo or when DB load hasn't run
  useEffect(() => {
    if (isDemo) return;
    // Only resolve JSONB paths that aren't already resolved
    const loadLegacyUrls = async () => {
      const urls: Record<string, string> = {};
      for (const [key, path] of Object.entries(projectImages)) {
        if (!imageUrls[key] && path) {
          const url = await getSignedUrl(path);
          if (url) urls[key] = url;
        }
      }
      if (Object.keys(urls).length > 0) {
        setImageUrls(prev => ({ ...prev, ...urls }));
      }
    };
    if (Object.keys(projectImages).some(k => projectImages[k])) loadLegacyUrls();
  }, [projectImages, getSignedUrl]);

  const markDirty = () => setDirty(true);

  // ── Image Upload (via shared hook) ──
  const handleImageUpload = async (slotKey: string, file: File) => {
    if (isDemo) return;
    const storagePath = await uploadToSlot(slotKey, file);
    if (storagePath) {
      setProjectImages(prev => ({ ...prev, [slotKey]: storagePath }));
      const url = await getSignedUrl(storagePath);
      if (url) setImageUrls(prev => ({ ...prev, [slotKey]: url }));
      setDirty(true);
      // Reload doc IDs for delete support
      const imageMap = await imageUpload.loadSlotImages(projectId!, 'projekt');
      if (imageMap[slotKey]) {
        setSlotDocIds(prev => ({ ...prev, [slotKey]: imageMap[slotKey].documentId }));
      }
    }
  };

  const handleImageDelete = async (slotKey: string) => {
    const docId = slotDocIds[slotKey];
    if (!docId) return;
    const deleted = await imageUpload.deleteSlotImage(docId);
    if (!deleted) return;
    setImageUrls(prev => { const n = { ...prev }; delete n[slotKey]; return n; });
    setProjectImages(prev => { const n = { ...prev }; delete n[slotKey]; return n; });
    setSlotDocIds(prev => { const n = { ...prev }; delete n[slotKey]; return n; });
    setDirty(true);
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
        setDescOpen(true);
        setDirty(true);
      }
      if (data?.location_description) {
        setLocationDesc(data.location_description);
        setLocationOpen(true);
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
        construction_year: constructionYear || null,
        total_area_sqm: totalArea || null,
        total_units_count: totalUnits || null,
      };

      const { error } = await supabase
        .from('dev_projects')
        .update(updatePayload)
        .eq('id', projectId);

      if (error) throw error;

      // ── Save Developer Context (Anbieter) ──
      if (devCtxId) {
        const { error: ctxErr } = await supabase
          .from('developer_contexts')
          .update({
            name: devName || null,
            legal_form: devLegalForm || null,
            managing_director: devManagingDirector || null,
            street: devStreet || null,
            house_number: devHouseNumber || null,
            postal_code: devPostalCode || null,
            city: devCity || null,
            hrb_number: devHrb || null,
            ust_id: devUstId || null,
          })
          .eq('id', devCtxId);
        if (ctxErr) console.error('Developer context save error:', ctxErr);
      }

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

        {/* ── 4 Image Slots (Drag & Drop) ── */}
        <ImageSlotGrid
          slots={IMAGE_SLOTS}
          images={(() => {
            const merged: Record<string, string | null> = {};
            IMAGE_SLOTS.forEach((slot) => {
              const signedUrl = imageUrls[slot.key];
              const demoImg = isDemo && demoImages.length > 0
                ? IMAGE_MAP[demoImages.find(d => d.importKey === slot.key)?.importKey || '']
                : null;
              merged[slot.key] = signedUrl || demoImg || null;
            });
            return merged;
          })()}
          onUpload={handleImageUpload}
          onDelete={handleImageDelete}
          uploadingSlot={uploadingSlot}
          disabled={isDemo}
          title="Projektbilder"
        />

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

        {/* ── Objektbeschreibung — Collapsible ── */}
        <Collapsible open={descOpen} onOpenChange={setDescOpen}>
          <div className="border-t pt-3">
            <CollapsibleTrigger className="flex items-center justify-between w-full group cursor-pointer">
              <div className="flex items-center gap-2">
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', descOpen && 'rotate-180')} />
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Objektbeschreibung</p>
              </div>
              {description && (
                <span className="text-[10px] text-muted-foreground">{wordCount(description)} Wörter</span>
              )}
            </CollapsibleTrigger>

            {/* Preview when collapsed */}
            {!descOpen && description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 pl-6">{description}</p>
            )}

            <CollapsibleContent>
              <div className="mt-2">
                <Textarea
                  value={description}
                  onChange={e => { setDescription(e.target.value); markDirty(); }}
                  disabled={isDemo}
                  placeholder="Professionelle Objektbeschreibung (150-250 Wörter)…"
                  className="text-sm leading-relaxed resize-none overflow-hidden"
                  style={{ fieldSizing: 'content', minHeight: '120px' } as React.CSSProperties}
                />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* ── Lagebeschreibung — Collapsible ── */}
        <Collapsible open={locationOpen} onOpenChange={setLocationOpen}>
          <div className="border-t pt-3">
            <CollapsibleTrigger className="flex items-center justify-between w-full group cursor-pointer">
              <div className="flex items-center gap-2">
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', locationOpen && 'rotate-180')} />
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Lagebeschreibung</p>
              </div>
              {locationDesc && (
                <span className="text-[10px] text-muted-foreground">{wordCount(locationDesc)} Wörter</span>
              )}
            </CollapsibleTrigger>

            {/* Preview when collapsed */}
            {!locationOpen && locationDesc && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 pl-6">{locationDesc}</p>
            )}

            <CollapsibleContent>
              <div className="mt-2">
                <Textarea
                  value={locationDesc}
                  onChange={e => { setLocationDesc(e.target.value); markDirty(); }}
                  disabled={isDemo}
                  placeholder="Lage, Infrastruktur, Anbindung (100-150 Wörter)…"
                  className="text-sm leading-relaxed resize-none overflow-hidden"
                  style={{ fieldSizing: 'content', minHeight: '120px' } as React.CSSProperties}
                />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

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

        {/* ── Projektgesellschaft / Anbieter (editierbar) ── */}
        {(devCtxId || !isDemo) && (
          <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5" /> Projektgesellschaft / Anbieter
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Firma" icon={Building2}>
                <Input value={devName} onChange={e => { setDevName(e.target.value); markDirty(); }}
                  disabled={isDemo} className="h-8 text-sm" placeholder="Gesellschaftsname" />
              </FormField>
              <FormField label="Rechtsform" icon={Scale}>
                <Input value={devLegalForm} onChange={e => { setDevLegalForm(e.target.value); markDirty(); }}
                  disabled={isDemo} className="h-8 text-sm" placeholder="GmbH, UG, AG…" />
              </FormField>
            </div>
            <FormField label="Geschäftsführer" icon={Users}>
              <Input value={devManagingDirector} onChange={e => { setDevManagingDirector(e.target.value); markDirty(); }}
                disabled={isDemo} className="h-8 text-sm" placeholder="Vor- und Nachname" />
            </FormField>
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <FormField label="Straße" icon={MapPin}>
                  <Input value={devStreet} onChange={e => { setDevStreet(e.target.value); markDirty(); }}
                    disabled={isDemo} className="h-8 text-sm" placeholder="Straßenname" />
                </FormField>
              </div>
              <FormField label="Nr." icon={Home}>
                <Input value={devHouseNumber} onChange={e => { setDevHouseNumber(e.target.value); markDirty(); }}
                  disabled={isDemo} className="h-8 text-sm" placeholder="42" />
              </FormField>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="PLZ" icon={MapPin}>
                <Input value={devPostalCode} onChange={e => { setDevPostalCode(e.target.value); markDirty(); }}
                  disabled={isDemo} className="h-8 text-sm" placeholder="80802" />
              </FormField>
              <div className="col-span-2">
                <FormField label="Stadt" icon={Building2}>
                  <Input value={devCity} onChange={e => { setDevCity(e.target.value); markDirty(); }}
                    disabled={isDemo} className="h-8 text-sm" placeholder="München" />
                </FormField>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="HRB-Nummer" icon={Briefcase}>
                <Input value={devHrb} onChange={e => { setDevHrb(e.target.value); markDirty(); }}
                  disabled={isDemo} className="h-8 text-sm" placeholder="HRB 287451 · AG München" />
              </FormField>
              <FormField label="USt-ID" icon={Receipt}>
                <Input value={devUstId} onChange={e => { setDevUstId(e.target.value); markDirty(); }}
                  disabled={isDemo} className="h-8 text-sm" placeholder="DE318294756" />
              </FormField>
            </div>
          </div>
        )}

        {/* ── Footer: KI-Button + Save ── */}
        {!isDemo && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
            <Button
              variant="outline"
              onClick={generateAiDescription}
              disabled={aiLoading}
              className="gap-1.5 flex-1"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ? 'Exposé wird analysiert…' : 'KI-Beschreibung generieren'}
            </Button>
            <Button onClick={handleSave} disabled={saving || !dirty} className="gap-1.5 flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Projekt-Datenblatt speichern
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Helper: Form field with icon + label ──
const FormField = React.forwardRef<HTMLDivElement, { label: string; icon: React.ElementType; children: React.ReactNode }>(
  ({ label, icon: Icon, children }, ref) => (
    <div ref={ref} className="space-y-1">
      <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </Label>
      {children}
    </div>
  )
);
FormField.displayName = 'FormField';
