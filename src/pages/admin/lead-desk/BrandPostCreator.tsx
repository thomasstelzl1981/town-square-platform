/**
 * BrandPostCreator — Inline-Formular für neue Brand-Templates (Zone 1)
 * Immer sichtbar, kein Dialog.
 */
import { useState, useCallback } from 'react';
import { PLATFORM_TENANT_ID } from '@/config/platformConstants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import {
  Plus, Upload, X, Loader2, Image as ImageIcon, Save, Check,
} from 'lucide-react';

const BRANDS = [
  { key: 'kaufy', label: 'Kaufy' },
  { key: 'futureroom', label: 'FutureRoom' },
  { key: 'acquiary', label: 'Acquiary' },
];

const CTA_OPTIONS = [
  { value: 'LEARN_MORE', label: 'Mehr erfahren' },
  { value: 'SIGN_UP', label: 'Registrieren' },
  { value: 'GET_QUOTE', label: 'Angebot einholen' },
  { value: 'CONTACT_US', label: 'Kontaktieren' },
  { value: 'APPLY_NOW', label: 'Jetzt bewerben' },
  { value: 'BOOK_NOW', label: 'Jetzt buchen' },
  { value: 'SHOP_NOW', label: 'Jetzt kaufen' },
];

const REGION_OPTIONS = ['DACH', 'Deutschland', 'Österreich', 'Schweiz', 'Bayern', 'NRW', 'Hessen', 'Berlin', 'Hamburg'];

interface BrandPostCreatorProps {
  onCreated: () => void;
}

export default function BrandPostCreator({ onCreated }: BrandPostCreatorProps) {
  const { user } = useAuth();
  const [brand, setBrand] = useState('kaufy');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [caption, setCaption] = useState('');
  const [cta, setCta] = useState('LEARN_MORE');
  const [description, setDescription] = useState('');

  // Targeting
  const [ageMin, setAgeMin] = useState(25);
  const [ageMax, setAgeMax] = useState(55);
  const [gender, setGender] = useState(0);
  const [regions, setRegions] = useState<string[]>(['DACH']);
  const [interests, setInterests] = useState('');

  // Campaign defaults
  const [minBudget, setMinBudget] = useState(500);
  const [suggestedBudget, setSuggestedBudget] = useState(2500);
  const [durationDays, setDurationDays] = useState(14);
  const [creditCost, setCreditCost] = useState(10);

  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const remaining = 4 - imageFiles.length;
    const toAdd = accepted.slice(0, remaining);
    setImageFiles(prev => [...prev, ...toAdd]);
    toAdd.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setImagePreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  }, [imageFiles.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 4 - imageFiles.length,
    maxSize: 5 * 1024 * 1024,
    disabled: imageFiles.length >= 4,
  });

  const removeImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleRegion = (r: string) => {
    setRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const handleSave = async (approve: boolean) => {
    if (!code.trim() || !name.trim()) {
      toast.error('Code und Name sind Pflichtfelder');
      return;
    }
    if (imageFiles.length === 0) {
      toast.error('Mindestens 1 Bild erforderlich');
      return;
    }

    setSaving(true);
    try {
      // 1. Create template record first to get ID
      const templateId = crypto.randomUUID();
      const imageUrls: string[] = [];

      // 2. Upload images to storage
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `platform/brand-templates/${brand}/${templateId}/${i + 1}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('tenant-documents')
          .upload(path, file, { contentType: file.type, upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('tenant-documents').getPublicUrl(path);
        imageUrls.push(urlData.publicUrl);
      }

      // 3. Insert template
      const { error } = await supabase
        .from('social_templates')
        .insert({
          id: templateId,
          code: code.toUpperCase(),
          name,
          brand_context: brand,
          format_type: imageUrls.length > 1 ? 'carousel' : 'image',
          image_url: imageUrls[0],
          image_urls: imageUrls,
          description,
          editable_fields_schema: { caption: { default: caption }, cta: { default: cta } },
          target_audience: {
            age_min: ageMin,
            age_max: ageMax,
            genders: gender,
            geo_regions: regions,
            interests: interests.split(',').map(s => s.trim()).filter(Boolean),
          },
          campaign_defaults: {
            min_budget_cents: minBudget * 100,
            suggested_budget_cents: suggestedBudget * 100,
            suggested_duration_days: durationDays,
            credit_cost: creditCost,
          },
          active: true,
          approved: approve,
          approved_at: approve ? new Date().toISOString() : null,
          approved_by: approve ? user?.id : null,
          // Platform-level template: no tenant_id needed for Zone 1 master
          tenant_id: PLATFORM_TENANT_ID,
        } as any);
      if (error) throw error;

      toast.success(approve ? 'Post erstellt und freigegeben!' : 'Post als Entwurf gespeichert');
      // Reset
      setCode(''); setName(''); setCaption(''); setDescription('');
      setImageFiles([]); setImagePreviews([]);
      onCreated();
    } catch (e: any) {
      console.error('BrandPostCreator save:', e);
      toast.error(e.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-primary/30">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Neuen Post erstellen</h2>
        </div>

        {/* ── Row 1: Brand, Code, Name ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Marke</Label>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BRANDS.map(b => <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Code</Label>
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="z.B. KAU-RENDITE" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Post-Titel" />
          </div>
        </div>

        {/* ── Images (1-4) ── */}
        <div className="space-y-2">
          <Label className="text-xs">Bilder (1–4) · 4:5 Format · 1080×1350px · JPG/PNG/WebP</Label>
          <div className="flex flex-wrap gap-3">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative w-[108px] h-[135px] rounded-lg overflow-hidden border border-border group">
                <img src={src} alt={`Bild ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <span className="absolute bottom-1 left-1 text-[10px] font-mono bg-background/70 px-1 rounded">{i + 1}</span>
              </div>
            ))}
            {imageFiles.length < 4 && (
              <div
                {...getRootProps()}
                className={`w-[108px] h-[135px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              >
                <input {...getInputProps()} />
                <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground">Hochladen</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Text fields ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Anzeigentext (Caption)</Label>
            <Textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3} placeholder="Primärtext des Posts..." />
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Call-to-Action</Label>
              <Select value={cta} onValueChange={setCta}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CTA_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Beschreibung</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Kurzbeschreibung..." />
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Targeting ── */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Zielgruppe (Voreinstellung für Partner)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Alter von</Label>
              <Input type="number" min={18} max={65} value={ageMin} onChange={e => setAgeMin(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Alter bis</Label>
              <Input type="number" min={18} max={65} value={ageMax} onChange={e => setAgeMax(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Geschlecht</Label>
              <Select value={String(gender)} onValueChange={v => setGender(+v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Alle</SelectItem>
                  <SelectItem value="1">Männer</SelectItem>
                  <SelectItem value="2">Frauen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Interessen</Label>
              <Input value={interests} onChange={e => setInterests(e.target.value)} placeholder="Immobilien, Kapital..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Regionen</Label>
            <div className="flex flex-wrap gap-1.5">
              {REGION_OPTIONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRegion(r)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors
                    ${regions.includes(r) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-border hover:border-primary/50'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Campaign Defaults ── */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Kampagnen-Defaults</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Min-Budget (EUR)</Label>
              <Input type="number" min={0} value={minBudget} onChange={e => setMinBudget(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Empfohlen (EUR)</Label>
              <Input type="number" min={0} value={suggestedBudget} onChange={e => setSuggestedBudget(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Laufzeit (Tage)</Label>
              <Input type="number" min={1} value={durationDays} onChange={e => setDurationDays(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Credits</Label>
              <Input type="number" min={0} value={creditCost} onChange={e => setCreditCost(+e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={() => handleSave(false)} disabled={saving} variant="outline" className="text-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Als Entwurf speichern
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving} className="text-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
            Speichern & Freigeben
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
