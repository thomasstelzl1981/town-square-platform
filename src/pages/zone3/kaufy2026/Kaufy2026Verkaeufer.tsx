/**
 * Kaufy2026Verkaeufer — Combined Seller Landing + Public Magic Intake
 * 
 * Flow:
 * 1. Hero + Value Props (Landing)
 * 2. Demo-Projekt (interaktive Vorschau)
 * 3. Magic Intake Wizard (6 Steps: Upload → Analyse → Review → Kontakt → Vertrag → Submit)
 */
import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Target, Shield, Zap, Users, CheckCircle2, ArrowRight, ArrowLeft,
  Upload, FileText, Table2, Sparkles, X, Loader2, Building2,
  Image as ImageIcon, Phone, Mail, Briefcase, ScrollText, Search,
} from 'lucide-react';

// ── Demo Project Data ───────────────────────────────────────────────────────
const DEMO_PROJECT = {
  name: 'Residenz am Stadtpark',
  city: 'München',
  postalCode: '80339',
  address: 'Parkstraße 12',
  units: 24,
  area: '1.850 m²',
  priceRange: '289.000 – 695.000 €',
  type: 'Neubau',
  description: 'Exklusives Neubauprojekt mit 24 Eigentumswohnungen in bester Innenstadtlage. Moderne Architektur, hochwertige Ausstattung, Tiefgarage.',
  sampleUnits: [
    { nr: 'WE-001', type: 'Wohnung', area: 52, rooms: 2, floor: 'EG', price: 289000 },
    { nr: 'WE-002', type: 'Wohnung', area: 78, rooms: 3, floor: '1.OG', price: 425000 },
    { nr: 'WE-003', type: 'Penthouse', area: 120, rooms: 4, floor: 'DG', price: 695000 },
  ],
};

const features = [
  { icon: Target, title: 'Qualifizierte Käufer', description: 'Tausende vorab geprüfte Investoren mit konkretem Kaufinteresse.' },
  { icon: Shield, title: 'KI-gestützte Aufbereitung', description: 'Magic Intake extrahiert automatisch Projektdaten aus Ihrem Exposé.' },
  { icon: Zap, title: 'Sofort online', description: 'Projekt innerhalb von Minuten auf dem Kaufy-Marktplatz veröffentlicht.' },
  { icon: Users, title: 'Vertriebsunterstützung', description: 'Unser Partner-Netzwerk vermarktet Ihr Projekt aktiv.' },
];

const howItWorks = [
  { step: 1, icon: Upload, title: 'Exposé hochladen', desc: 'PDF + Bilder' },
  { step: 2, icon: Sparkles, title: 'KI-Analyse', desc: 'Automatische Aufbereitung' },
  { step: 3, icon: CheckCircle2, title: 'Prüfen & Freigeben', desc: 'Daten bestätigen' },
  { step: 4, icon: Building2, title: 'Vermarktung starten', desc: 'Sofort auf Kaufy live' },
];

// ── Types ────────────────────────────────────────────────────────────────────
interface ExtractedUnit {
  unitNumber: string;
  type: string;
  area: number;
  rooms: number;
  floor: string;
  price: number;
}

interface ExtractedData {
  projectName: string;
  address: string;
  city: string;
  postalCode: string;
  unitsCount: number;
  totalArea: number;
  priceRange: string;
  description?: string;
  projectType?: string;
  extractedUnits?: ExtractedUnit[];
}

type WizardStep = 'upload' | 'analyzing' | 'review' | 'contact' | 'agreement' | 'submitted';

export default function Kaufy2026Verkaeufer() {
  const intakeRef = useRef<HTMLDivElement>(null);
  
  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>('upload');
  const [exposeFile, setExposeFile] = useState<File | null>(null);
  const [pricelistFile, setPricelistFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [storagePaths, setStoragePaths] = useState<{ expose?: string; pricelist?: string }>({});
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  
  // Contact form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollToIntake = () => {
    intakeRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Dropzones ──────────────────────────────────────────────────────────────
  const onDropExpose = useCallback((files: File[]) => {
    if (files.length > 0) setExposeFile(files[0]);
  }, []);

  const onDropPricelist = useCallback((files: File[]) => {
    if (files.length > 0) setPricelistFile(files[0]);
  }, []);

  const onDropImages = useCallback((files: File[]) => {
    setImageFiles(prev => [...prev, ...files].slice(0, 10));
  }, []);

  const { getRootProps: getExposeProps, getInputProps: getExposeInput, isDragActive: isExposeDrag } = useDropzone({
    onDrop: onDropExpose, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1, multiple: false,
  });

  const { getRootProps: getPricelistProps, getInputProps: getPricelistInput, isDragActive: isPricelistDrag } = useDropzone({
    onDrop: onDropPricelist,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] },
    maxFiles: 1, multiple: false,
  });

  const { getRootProps: getImageProps, getInputProps: getImageInput, isDragActive: isImageDrag } = useDropzone({
    onDrop: onDropImages, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }, maxFiles: 10, multiple: true,
  });

  // ── Upload + Analyze ───────────────────────────────────────────────────────
  const handleUploadAndAnalyze = async () => {
    if (!exposeFile) { toast.error('Bitte laden Sie mindestens ein Exposé hoch.'); return; }
    setIsUploading(true);
    setWizardStep('analyzing');

    try {
      const sessionId = crypto.randomUUID();
      const paths: { expose?: string; pricelist?: string } = {};
      const imgPaths: string[] = [];

      // Upload expose
      const exposePath = `${sessionId}/expose_${exposeFile.name}`;
      const { error: expErr } = await supabase.storage.from('public-intake').upload(exposePath, exposeFile);
      if (expErr) throw new Error('Exposé-Upload fehlgeschlagen: ' + expErr.message);
      paths.expose = exposePath;

      // Upload pricelist
      if (pricelistFile) {
        const plPath = `${sessionId}/pricelist_${pricelistFile.name}`;
        const { error: plErr } = await supabase.storage.from('public-intake').upload(plPath, pricelistFile);
        if (plErr) console.error('Pricelist upload error:', plErr);
        else paths.pricelist = plPath;
      }

      // Upload images
      for (const img of imageFiles) {
        const imgPath = `${sessionId}/images/${img.name}`;
        const { error: imgErr } = await supabase.storage.from('public-intake').upload(imgPath, img);
        if (!imgErr) imgPaths.push(imgPath);
      }

      setStoragePaths(paths);
      setImagePaths(imgPaths);

      // Call AI analysis
      const { data, error: fnError } = await supabase.functions.invoke('sot-public-project-intake', {
        body: { mode: 'analyze', storagePaths: paths },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      if (data?.extractedData) {
        setExtractedData(data.extractedData);
        setWizardStep('review');
        toast.success('KI-Analyse abgeschlossen');
      }
    } catch (err) {
      console.error('Upload/Analysis error:', err);
      toast.error(err instanceof Error ? err.message : 'Analyse fehlgeschlagen');
      setWizardStep('upload');
    } finally {
      setIsUploading(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!contactName || !contactEmail) { toast.error('Bitte füllen Sie Name und E-Mail aus.'); return; }
    if (!agreementAccepted) { toast.error('Bitte akzeptieren Sie den Vertriebsvertrag.'); return; }

    setIsSubmitting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sot-public-project-intake', {
        body: {
          mode: 'submit',
          contactName,
          contactEmail,
          contactPhone,
          companyName,
          extractedData,
          storagePaths,
          imagePaths,
          agreementVersion: '1.0',
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setWizardStep('submitted');
      toast.success('Projekt erfolgreich eingereicht!');
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err instanceof Error ? err.message : 'Einreichung fehlgeschlagen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setWizardStep('upload');
    setExposeFile(null);
    setPricelistFile(null);
    setImageFiles([]);
    setExtractedData(null);
    setStoragePaths({});
    setImagePaths([]);
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setCompanyName('');
    setAgreementAccepted(false);
  };

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="py-16 px-6 lg:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <Badge className="mb-4 bg-[hsl(210,80%,55%,0.1)] text-[hsl(210,80%,40%)] border-0">
            Für Bauträger & Eigentümer
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-bold text-[hsl(220,20%,10%)] mb-4">
            Vermarkten Sie Ihr Projekt über KAUFY.
          </h1>
          <p className="text-lg text-[hsl(215,16%,47%)] mb-8">
            Laden Sie einfach Ihr Exposé hoch — unsere KI erstellt automatisch ein professionelles 
            Inserat. Kein Account nötig, in 5 Minuten online.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="rounded-full" onClick={scrollToIntake}>
              <Sparkles className="w-4 h-4 mr-2" />
              Magic Intake starten
            </Button>
            <Link to="/auth">
              <Button variant="outline" size="lg" className="rounded-full">
                Zum Portal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-12 px-6 lg:px-10 bg-[hsl(210,30%,97%)] mx-6 lg:mx-10 rounded-2xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[hsl(220,20%,10%)] mb-10">
          Warum über KAUFY vermarkten?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="border-0 bg-white">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[hsl(210,80%,55%,0.1)] flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-[hsl(210,80%,55%)]" />
                </div>
                <h3 className="font-semibold text-[hsl(220,20%,10%)] mb-2">{f.title}</h3>
                <p className="text-sm text-[hsl(215,16%,47%)]">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-12 px-6 lg:px-10">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[hsl(220,20%,10%)] mb-10">
          So funktioniert's
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {howItWorks.map(({ step, icon: Icon, title, desc }, idx) => (
            <div key={step} className="relative text-center">
              <div className="w-12 h-12 rounded-full bg-[hsl(220,20%,10%)] text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
                {step}
              </div>
              <h3 className="font-semibold text-sm text-[hsl(220,20%,10%)] mb-1">{title}</h3>
              <p className="text-xs text-[hsl(215,16%,47%)]">{desc}</p>
              {idx < howItWorks.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-0.5 bg-[hsl(210,30%,90%)]" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ DEMO PROJECT ═══ */}
      <section className="py-12 px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[hsl(220,20%,10%)] mb-2 text-center">
            Beispiel: So sieht Ihr Projekt auf KAUFY aus
          </h2>
          <p className="text-center text-[hsl(215,16%,47%)] mb-8">
            Basierend auf einem hochgeladenen Exposé erstellt die KI automatisch diese Projektansicht.
          </p>

          <Card className="border-2 border-[hsl(210,30%,88%)] overflow-hidden">
            <div className="bg-gradient-to-r from-[hsl(220,20%,10%)] to-[hsl(220,20%,20%)] text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="mb-2 bg-white/20 text-white border-0">{DEMO_PROJECT.type}</Badge>
                  <h3 className="text-xl font-bold">{DEMO_PROJECT.name}</h3>
                  <p className="text-white/70 text-sm mt-1">
                    {DEMO_PROJECT.postalCode} {DEMO_PROJECT.city} · {DEMO_PROJECT.address}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/60">Ab</div>
                  <div className="text-xl font-bold">{DEMO_PROJECT.priceRange.split('–')[0].trim()}</div>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <p className="text-sm text-[hsl(215,16%,47%)] mb-4">{DEMO_PROJECT.description}</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-[hsl(210,30%,97%)] rounded-lg">
                  <div className="text-lg font-bold text-[hsl(220,20%,10%)]">{DEMO_PROJECT.units}</div>
                  <div className="text-xs text-[hsl(215,16%,47%)]">Einheiten</div>
                </div>
                <div className="text-center p-3 bg-[hsl(210,30%,97%)] rounded-lg">
                  <div className="text-lg font-bold text-[hsl(220,20%,10%)]">{DEMO_PROJECT.area}</div>
                  <div className="text-xs text-[hsl(215,16%,47%)]">Gesamtfläche</div>
                </div>
                <div className="text-center p-3 bg-[hsl(210,30%,97%)] rounded-lg">
                  <div className="text-lg font-bold text-[hsl(220,20%,10%)]">{DEMO_PROJECT.priceRange}</div>
                  <div className="text-xs text-[hsl(215,16%,47%)]">Preisspanne</div>
                </div>
              </div>

              {/* Sample unit table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-6 gap-2 px-3 py-2 bg-[hsl(210,30%,97%)] text-xs font-medium text-[hsl(215,16%,47%)]">
                  <span>Nr.</span><span>Typ</span><span>Fläche</span><span>Zimmer</span><span>Etage</span><span className="text-right">Preis</span>
                </div>
                {DEMO_PROJECT.sampleUnits.map((u) => (
                  <div key={u.nr} className="grid grid-cols-6 gap-2 px-3 py-2 border-t text-sm">
                    <span className="font-mono text-xs">{u.nr}</span>
                    <span>{u.type}</span>
                    <span>{u.area} m²</span>
                    <span>{u.rooms}</span>
                    <span>{u.floor}</span>
                    <span className="text-right font-medium">{u.price.toLocaleString('de-DE')} €</span>
                  </div>
                ))}
                <div className="px-3 py-2 border-t text-xs text-[hsl(215,16%,47%)] text-center">
                  … und {DEMO_PROJECT.units - 3} weitere Einheiten
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══ MAGIC INTAKE WIZARD ═══ */}
      <section ref={intakeRef} className="py-16 px-6 lg:px-10 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[hsl(220,20%,10%)] mb-2">
            <Sparkles className="inline h-6 w-6 mr-2 text-[hsl(210,80%,55%)]" />
            Magic Intake
          </h2>
          <p className="text-center text-[hsl(215,16%,47%)] mb-8">
            Laden Sie Ihr Exposé hoch — wir erledigen den Rest. Kein Account nötig.
          </p>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {(['upload', 'analyzing', 'review', 'contact', 'agreement'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                  wizardStep === s ? 'bg-[hsl(210,80%,55%)] text-white' :
                  (['upload', 'analyzing', 'review', 'contact', 'agreement'].indexOf(wizardStep) > i)
                    ? 'bg-green-500 text-white' : 'bg-[hsl(210,30%,90%)] text-[hsl(215,16%,55%)]'
                )}>
                  {(['upload', 'analyzing', 'review', 'contact', 'agreement'].indexOf(wizardStep) > i) ? '✓' : i + 1}
                </div>
                {i < 4 && <div className="w-8 h-0.5 bg-[hsl(210,30%,90%)]" />}
              </div>
            ))}
          </div>

          <Card className="border-2 border-[hsl(210,30%,88%)]">
            <CardContent className="p-6 md:p-8">

              {/* ── Step 1: Upload ── */}
              {wizardStep === 'upload' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-1">Dateien hochladen</h3>
                    <p className="text-sm text-[hsl(215,16%,47%)]">Laden Sie Ihr Projekt-Exposé und optional die Preisliste hoch.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Expose dropzone */}
                    <div {...getExposeProps()} className={cn(
                      "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                      isExposeDrag ? "border-[hsl(210,80%,55%)] bg-[hsl(210,80%,55%,0.05)]" : "border-[hsl(210,30%,88%)] hover:border-[hsl(210,80%,55%,0.5)]",
                      exposeFile && "border-green-500 bg-green-50"
                    )}>
                      <input {...getExposeInput()} />
                      {exposeFile ? (
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{exposeFile.name}</p>
                            <p className="text-xs text-[hsl(215,16%,47%)]">{Math.round(exposeFile.size / 1024)} KB</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => { e.stopPropagation(); setExposeFile(null); }}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-[hsl(215,16%,55%)]" />
                          <div>
                            <p className="font-medium text-sm text-[hsl(220,20%,10%)]">Exposé *</p>
                            <p className="text-xs text-[hsl(215,16%,47%)]">PDF (max. 10 MB)</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pricelist dropzone */}
                    <div {...getPricelistProps()} className={cn(
                      "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                      isPricelistDrag ? "border-[hsl(210,80%,55%)] bg-[hsl(210,80%,55%,0.05)]" : "border-[hsl(210,30%,88%)] hover:border-[hsl(210,80%,55%,0.5)]",
                      pricelistFile && "border-green-500 bg-green-50"
                    )}>
                      <input {...getPricelistInput()} />
                      {pricelistFile ? (
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{pricelistFile.name}</p>
                            <p className="text-xs text-[hsl(215,16%,47%)]">{Math.round(pricelistFile.size / 1024)} KB</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => { e.stopPropagation(); setPricelistFile(null); }}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Table2 className="h-8 w-8 text-[hsl(215,16%,55%)]" />
                          <div>
                            <p className="font-medium text-sm text-[hsl(220,20%,10%)]">Preisliste</p>
                            <p className="text-xs text-[hsl(215,16%,47%)]">XLSX, CSV oder PDF</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image upload */}
                  <div {...getImageProps()} className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                    isImageDrag ? "border-[hsl(210,80%,55%)] bg-[hsl(210,80%,55%,0.05)]" : "border-[hsl(210,30%,88%)] hover:border-[hsl(210,80%,55%,0.5)]",
                    imageFiles.length >= 4 && "border-green-500 bg-green-50"
                  )}>
                    <input {...getImageInput()} />
                    {imageFiles.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <ImageIcon className="h-5 w-5 text-green-500" />
                          <span className="font-medium text-sm">{imageFiles.length} Bild{imageFiles.length !== 1 ? 'er' : ''} ausgewählt</span>
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={(e) => { e.stopPropagation(); setImageFiles([]); }}>
                            Zurücksetzen
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {imageFiles.map((f, i) => (
                            <span key={i} className="text-xs bg-[hsl(210,30%,95%)] px-2 py-0.5 rounded">{f.name}</span>
                          ))}
                        </div>
                        {imageFiles.length < 4 && (
                          <p className="text-xs text-amber-600">Mindestens 4 Bilder empfohlen ({4 - imageFiles.length} fehlen noch)</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="h-8 w-8 text-[hsl(215,16%,55%)]" />
                        <div>
                          <p className="font-medium text-sm text-[hsl(220,20%,10%)]">Projektbilder (min. 4)</p>
                          <p className="text-xs text-[hsl(215,16%,47%)]">JPG, PNG oder WebP — bis zu 10 Bilder</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      size="lg" 
                      className="rounded-full gap-2"
                      disabled={!exposeFile || imageFiles.length < 4}
                      onClick={handleUploadAndAnalyze}
                    >
                      <Upload className="h-4 w-4" />
                      Hochladen & KI-Analyse starten
                    </Button>
                  </div>
                  {(!exposeFile || imageFiles.length < 4) && (
                    <p className="text-xs text-[hsl(215,16%,47%)] text-right">
                      * Exposé und mindestens 4 Bilder sind erforderlich
                    </p>
                  )}
                </div>
              )}

              {/* ── Step 2: Analyzing ── */}
              {wizardStep === 'analyzing' && (
                <div className="flex flex-col items-center gap-4 py-12">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-[hsl(210,80%,55%,0.1)] flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-[hsl(210,80%,55%)] animate-pulse" />
                    </div>
                    <Loader2 className="absolute inset-0 w-16 h-16 animate-spin text-[hsl(210,80%,55%,0.3)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[hsl(220,20%,10%)]">KI analysiert Ihre Dokumente…</h3>
                  <p className="text-sm text-[hsl(215,16%,47%)]">Projektdaten, Einheiten und Preise werden automatisch extrahiert.</p>
                </div>
              )}

              {/* ── Step 3: Review ── */}
              {wizardStep === 'review' && extractedData && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-1">Extrahierte Daten prüfen</h3>
                    <p className="text-sm text-[hsl(215,16%,47%)]">Bitte überprüfen und korrigieren Sie die KI-Ergebnisse.</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Projektname</Label>
                      <Input value={extractedData.projectName} onChange={(e) => setExtractedData({ ...extractedData, projectName: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Projekttyp</Label>
                      <Input value={extractedData.projectType || 'neubau'} onChange={(e) => setExtractedData({ ...extractedData, projectType: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Stadt</Label>
                      <Input value={extractedData.city} onChange={(e) => setExtractedData({ ...extractedData, city: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">PLZ</Label>
                      <Input value={extractedData.postalCode} onChange={(e) => setExtractedData({ ...extractedData, postalCode: e.target.value })} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Adresse</Label>
                      <Input value={extractedData.address} onChange={(e) => setExtractedData({ ...extractedData, address: e.target.value })} />
                    </div>
                  </div>

                  {extractedData.extractedUnits && extractedData.extractedUnits.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="px-3 py-2 bg-[hsl(210,30%,97%)] text-xs font-medium text-[hsl(215,16%,47%)]">
                        {extractedData.extractedUnits.length} Einheiten extrahiert
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {extractedData.extractedUnits.slice(0, 10).map((u, i) => (
                          <div key={i} className="grid grid-cols-6 gap-2 px-3 py-1.5 border-t text-xs">
                            <span className="font-mono">{u.unitNumber}</span>
                            <span>{u.type}</span>
                            <span>{u.area} m²</span>
                            <span>{u.rooms} Zi.</span>
                            <span>{u.floor}</span>
                            <span className="text-right font-medium">{u.price?.toLocaleString('de-DE')} €</span>
                          </div>
                        ))}
                        {extractedData.extractedUnits.length > 10 && (
                          <div className="px-3 py-1.5 border-t text-xs text-center text-[hsl(215,16%,47%)]">
                            … und {extractedData.extractedUnits.length - 10} weitere
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setWizardStep('upload')} className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Zurück
                    </Button>
                    <Button size="lg" className="rounded-full gap-2" onClick={() => setWizardStep('contact')}>
                      Weiter zu Kontaktdaten
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 4: Contact ── */}
              {wizardStep === 'contact' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-1">Ihre Kontaktdaten</h3>
                    <p className="text-sm text-[hsl(215,16%,47%)]">Wie können wir Sie bezüglich Ihres Projekts erreichen?</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Name *</Label>
                      <Input placeholder="Max Mustermann" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> E-Mail *</Label>
                      <Input type="email" placeholder="max@beispiel.de" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Telefon</Label>
                      <Input placeholder="+49 123 456789" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1"><Briefcase className="h-3 w-3" /> Firma</Label>
                      <Input placeholder="Mustermann Bau GmbH" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setWizardStep('review')} className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Zurück
                    </Button>
                    <Button 
                      size="lg" 
                      className="rounded-full gap-2"
                      disabled={!contactName || !contactEmail}
                      onClick={() => setWizardStep('agreement')}
                    >
                      Weiter zum Vertriebsvertrag
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 5: Agreement ── */}
              {wizardStep === 'agreement' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-1 flex items-center gap-2">
                      <ScrollText className="h-5 w-5" /> Vertriebsvertrag
                    </h3>
                    <p className="text-sm text-[hsl(215,16%,47%)]">Bitte lesen und akzeptieren Sie die Vertriebsvereinbarung.</p>
                  </div>

                  <Card className="bg-[hsl(210,30%,97%)] border-[hsl(210,30%,88%)]">
                    <CardContent className="p-4 max-h-64 overflow-y-auto text-sm text-[hsl(215,16%,47%)] space-y-3">
                      <p className="font-semibold text-[hsl(220,20%,10%)]">Vertriebsvereinbarung (Version 1.0)</p>
                      <p>Zwischen dem Anbieter (nachfolgend „Auftraggeber") und der KAUFY GmbH (nachfolgend „KAUFY") wird folgende Vereinbarung geschlossen:</p>
                      <p><strong>§1 Gegenstand:</strong> KAUFY übernimmt die digitale Vermarktung des eingereichten Immobilienprojekts auf der Plattform kaufy.app sowie über das angeschlossene Partnernetzwerk.</p>
                      <p><strong>§2 Leistungen:</strong> Erstellung eines professionellen Inserats, Verbreitung an qualifizierte Investoren, Lead-Management und -Qualifizierung, Reporting über Vertriebsfortschritt.</p>
                      <p><strong>§3 Vergütung:</strong> Bei erfolgreicher Vermittlung erhält KAUFY eine Vertriebsprovision in Höhe von 3% des Netto-Kaufpreises, zahlbar nach notarieller Beurkundung.</p>
                      <p><strong>§4 Laufzeit:</strong> Der Vertrag gilt für die Dauer der Vermarktung, mindestens jedoch 6 Monate. Eine Kündigung ist mit einer Frist von 4 Wochen zum Monatsende möglich.</p>
                      <p><strong>§5 Datenschutz:</strong> Die übermittelten Daten werden gemäß DSGVO verarbeitet und ausschließlich zum Zweck der Vermarktung verwendet.</p>
                    </CardContent>
                  </Card>

                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="agreement" 
                      checked={agreementAccepted} 
                      onCheckedChange={(checked) => setAgreementAccepted(checked === true)} 
                    />
                    <label htmlFor="agreement" className="text-sm text-[hsl(220,20%,10%)] cursor-pointer leading-tight">
                      Ich akzeptiere die Vertriebsvereinbarung (Version 1.0) und erkläre mich mit den 
                      Bedingungen einverstanden. Mir ist bekannt, dass bei erfolgreicher Vermittlung eine 
                      Provision von 3% anfällt.
                    </label>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setWizardStep('contact')} className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Zurück
                    </Button>
                    <Button 
                      size="lg" 
                      className="rounded-full gap-2"
                      disabled={!agreementAccepted || isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Wird eingereicht…</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4" /> Projekt einreichen</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 6: Submitted ── */}
              {wizardStep === 'submitted' && (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-[hsl(220,20%,10%)]">Erfolgreich eingereicht!</h3>
                  <p className="text-[hsl(215,16%,47%)] max-w-md mx-auto">
                    Ihr Projekt wurde erfolgreich übermittelt. Unser Team prüft Ihre Unterlagen und 
                    meldet sich innerhalb von 48 Stunden bei Ihnen unter <strong>{contactEmail}</strong>.
                  </p>
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <Button variant="outline" className="rounded-full" onClick={resetWizard}>
                      Weiteres Projekt einreichen
                    </Button>
                    <Link to="/auth">
                      <Button className="rounded-full gap-2">
                        Account erstellen
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-16" />
    </div>
  );
}
