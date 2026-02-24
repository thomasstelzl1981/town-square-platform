/**
 * Projekte Dashboard - Magic Intake Entry Point
 * MOD-13 PROJEKTE — P0 Redesign
 * 
 * ALWAYS shows 5 widgets (W1–W5), even without data.
 * 
 * v2: Inline-Editing, Validierung, erweiterte Felder (WEG, Hausgeld, Rendite)
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { DESIGN, getActiveWidgetGlow } from '@/config/designManifest';
import { useIntakeEmitter, type IntakeState } from '@/hooks/useIntakeContext';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useIsMobile } from '@/hooks/use-mobile';
import { TrendingUp as TrendingUpIcon, Globe } from 'lucide-react';
import { ManagerVisitenkarte } from '@/components/shared/ManagerVisitenkarte';
import { MarketReportWidget } from '@/components/shared/MarketReportWidget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, FileText, Table2, Sparkles, X, Loader2, ArrowRight,
  Building2, FolderKanban, TrendingUp, AlertCircle, CheckCircle2,
  Trash2, Search, Plus, AlertTriangle, Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUniversalUpload, type UploadedFileInfo } from '@/hooks/useUniversalUpload';
import { UploadResultCard } from '@/components/shared/UploadResultCard';
import { useDevProjects } from '@/hooks/useDevProjects';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/shared/LoadingState';
import { formatCurrency } from '@/lib/formatters';
import { ProjectDeleteDialog, type DeletionProtocol } from '@/components/projekte/ProjectDeleteDialog';
import { ProjectCard, ProjectCardPlaceholder } from '@/components/projekte/ProjectCard';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { CreateProjectDialog } from '@/components/projekte/CreateProjectDialog';
import type { ProjectPortfolioRow } from '@/types/projekte';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { DesktopOnly } from '@/components/shared/DesktopOnly';

interface ExtractedUnit {
  unitNumber: string;
  type: string;
  area: number;
  rooms?: number;
  floor?: string;
  price: number;
  currentRent?: number;
  hausgeld?: number;
  instandhaltung?: number;
  nettoRendite?: number;
  weg?: string;
  mietfaktor?: number;
}

interface ColumnMapping {
  original_column: string;
  mapped_to: string;
}

interface ExtractedProjectData {
  projectName: string;
  address: string;
  city: string;
  postalCode: string;
  unitsCount: number;
  totalArea: number;
  priceRange: string;
  description?: string;
  projectType?: 'neubau' | 'aufteilung';
  constructionYear?: number;
  modernizationStatus?: string;
  wegCount?: number;
  wegDetails?: { name: string; unitsCount: number; addressRange: string }[];
  developer?: string;
  extractedUnits?: ExtractedUnit[];
  columnMapping?: ColumnMapping[];
}

interface ValidationWarning {
  type: 'error' | 'warning';
  message: string;
}

const MAPPED_TO_LABELS: Record<string, string> = {
  unitNumber: 'Einheit-Nr.',
  type: 'Typ',
  area: 'Fläche (m²)',
  rooms: 'Zimmer',
  floor: 'Etage',
  price: 'Kaufpreis (EUR)',
  currentRent: 'Akt. Miete',
  hausgeld: 'Hausgeld',
  instandhaltung: 'Instandhaltung',
  nettoRendite: 'Netto-Rendite',
  weg: 'WEG',
  mietfaktor: 'Mietfaktor',
};

type IntakeStep = 'upload' | 'review' | 'creating';

// ── Inline editable cell ──────────────────────────────────────────────────────
function EditableCell({ value, onChange, type = 'text', className }: {
  value: string | number;
  onChange: (val: string) => void;
  type?: 'text' | 'number';
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(String(value));

  if (editing) {
    return (
      <Input
        autoFocus
        type={type}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={() => { setEditing(false); onChange(localVal); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { setEditing(false); onChange(localVal); } if (e.key === 'Escape') setEditing(false); }}
        className={cn("h-6 px-1 py-0 text-xs w-full min-w-[50px]", className)}
      />
    );
  }

  return (
    <span
      onClick={() => { setLocalVal(String(value)); setEditing(true); }}
      className="cursor-pointer hover:bg-primary/5 rounded px-0.5 transition-colors"
      title="Klicken zum Bearbeiten"
    >
      {value || '—'}
    </span>
  );
}

// ── Validation logic ──────────────────────────────────────────────────────────
function validateUnits(data: ExtractedProjectData): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const units = data.extractedUnits || [];

  if (!data.projectName?.trim()) {
    warnings.push({ type: 'error', message: 'Projektname ist leer' });
  }

  // Duplicate unit numbers
  const nums = units.map(u => u.unitNumber).filter(Boolean);
  const dupes = nums.filter((n, i) => nums.indexOf(n) !== i);
  if (dupes.length > 0) {
    warnings.push({ type: 'warning', message: `Doppelte Einheitennummern: ${[...new Set(dupes)].join(', ')}` });
  }

  // Units without price
  const noPriceCount = units.filter(u => !u.price || u.price <= 0).length;
  if (noPriceCount > 0) {
    warnings.push({ type: 'warning', message: `${noPriceCount} Einheit(en) ohne Kaufpreis` });
  }

  // Implausible price per sqm
  const validUnits = units.filter(u => u.area > 0 && u.price > 0);
  if (validUnits.length > 2) {
    const avgPricePerSqm = validUnits.reduce((s, u) => s + u.price / u.area, 0) / validUnits.length;
    const outliers = validUnits.filter(u => {
      const ppm = u.price / u.area;
      return Math.abs(ppm - avgPricePerSqm) / avgPricePerSqm > 0.5;
    });
    if (outliers.length > 0) {
      warnings.push({ type: 'warning', message: `${outliers.length} Einheit(en) mit auffälligem €/m²-Preis (>50% Abweichung vom Ø)` });
    }
  }

  return warnings;
}

export default function ProjekteDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-PROJEKT');
  const tenantId = profile?.active_tenant_id;
  const { portfolioRows, isLoadingPortfolio, deleteProject } = useDevProjects();
  const { showArmstrong } = usePortalLayout();
  const intakeEmitter = useIntakeEmitter();
  
  const [exposeFile, setExposeFile] = useState<File | null>(null);
  const [pricelistFile, setPricelistFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<IntakeStep>('upload');
  const [uploadedExpose, setUploadedExpose] = useState<UploadedFileInfo | null>(null);
  const [uploadedPricelist, setUploadedPricelist] = useState<UploadedFileInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedProjectData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectPortfolioRow | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const { upload: universalUpload } = useUniversalUpload();

  // Validation warnings (memoized)
  const validationWarnings = useMemo(() => {
    if (!extractedData) return [];
    return validateUnits(extractedData);
  }, [extractedData]);

  const hasBlockingErrors = validationWarnings.some(w => w.type === 'error');

  // ── Broadcast intake state to Armstrong ────────────────────────────────────
  useEffect(() => {
    const units = extractedData?.extractedUnits || [];
    const validUnits = units.filter(u => u.area > 0 && u.price > 0);
    const avgPps = validUnits.length > 0
      ? validUnits.reduce((s, u) => s + u.price / u.area, 0) / validUnits.length
      : undefined;

    const intakeStep = isAnalyzing ? 'analyzing' as const : step === 'upload' && !uploadedExpose && !uploadedPricelist ? null : step;

    intakeEmitter.emit({
      step: intakeStep,
      unitsCount: units.length,
      projectName: extractedData?.projectName || '',
      warnings: validationWarnings,
      avgPricePerSqm: avgPps ? Math.round(avgPps) : undefined,
      totalArea: units.reduce((s, u) => s + (u.area || 0), 0) || undefined,
      totalPrice: units.reduce((s, u) => s + (u.price || 0), 0) || undefined,
      wegCount: extractedData?.wegCount,
      projectType: extractedData?.projectType,
    });
  }, [step, isAnalyzing, extractedData, validationWarnings, uploadedExpose, uploadedPricelist]);

  const handleDeleteClick = (project: ProjectPortfolioRow) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (projectId: string): Promise<DeletionProtocol> => {
    const result = await deleteProject.mutateAsync(projectId);
    return result;
  };

  // ── Unit editing helpers ──────────────────────────────────────────────────
  const updateUnit = (idx: number, field: keyof ExtractedUnit, value: string) => {
    if (!extractedData?.extractedUnits) return;
    const newUnits = [...extractedData.extractedUnits];
    const numFields = ['area', 'rooms', 'price', 'currentRent', 'hausgeld', 'instandhaltung', 'nettoRendite', 'mietfaktor'];
    (newUnits[idx] as any)[field] = numFields.includes(field) ? (parseFloat(value) || 0) : value;
    setExtractedData({ ...extractedData, extractedUnits: newUnits });
  };

  const addUnit = () => {
    if (!extractedData) return;
    const units = extractedData.extractedUnits || [];
    const newUnit: ExtractedUnit = {
      unitNumber: `WE-${String(units.length + 1).padStart(3, '0')}`,
      type: 'Wohnung',
      area: 0,
      price: 0,
    };
    setExtractedData({ ...extractedData, extractedUnits: [...units, newUnit], unitsCount: units.length + 1 });
  };

  const removeUnit = (idx: number) => {
    if (!extractedData?.extractedUnits) return;
    const newUnits = [...extractedData.extractedUnits];
    newUnits.splice(idx, 1);
    setExtractedData({ ...extractedData, extractedUnits: newUnits, unitsCount: newUnits.length });
  };

  // ── Auto-upload helper — triggers upload immediately after drop ─────────
  const autoUploadFile = useCallback(async (file: File, docType: 'expose' | 'pricelist') => {
    setIsUploading(true);
    setError(null);
    try {
      const setter = docType === 'expose' ? setUploadedExpose : setUploadedPricelist;
      const result = await universalUpload(file, {
        moduleCode: 'MOD_13',
        docTypeHint: docType,
        source: 'project_intake',
        onFileUploaded: (info) => setter(info),
      });
      if (result.error) throw new Error(result.error);
      // Fallback if callback didn't fire
      if (result.documentId) {
        setter(prev => prev || {
          documentId: result.documentId!,
          storagePath: result.storagePath || '',
          storageNodeId: result.storageNodeId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          previewUrl: result.previewUrl || null,
        });
      }
      toast.success(`${docType === 'expose' ? 'Exposé' : 'Preisliste'} hochgeladen`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
      setError(message);
      toast.error('Upload fehlgeschlagen', { description: message });
      // Reset the file so user can retry
      if (docType === 'expose') setExposeFile(null); else setPricelistFile(null);
    } finally {
      setIsUploading(false);
    }
  }, [universalUpload]);

  // Expose dropzone — auto-upload on drop
  const onDropExpose = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setExposeFile(acceptedFiles[0]);
      setError(null);
      autoUploadFile(acceptedFiles[0], 'expose');
    }
  }, [autoUploadFile]);
  const { getRootProps: getExposeRootProps, getInputProps: getExposeInputProps, isDragActive: isExposeDragActive } = useDropzone({
    onDrop: onDropExpose, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1, multiple: false, disabled: !!uploadedExpose, noDrag: isMobile,
  });

  // Pricelist dropzone — auto-upload on drop
  const onDropPricelist = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setPricelistFile(acceptedFiles[0]);
      setError(null);
      autoUploadFile(acceptedFiles[0], 'pricelist');
    }
  }, [autoUploadFile]);
  const { getRootProps: getPricelistRootProps, getInputProps: getPricelistInputProps, isDragActive: isPricelistDragActive } = useDropzone({
    onDrop: onDropPricelist,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'], 'text/csv': ['.csv'] },
    maxFiles: 1, multiple: false, disabled: !!uploadedPricelist, noDrag: isMobile,
  });

  const handleUploadFiles = async () => {
    if (!exposeFile && !pricelistFile) { setError('Bitte laden Sie mindestens eine Datei hoch.'); return; }
    setIsUploading(true); setError(null);
    try {
      if (exposeFile) {
        const result = await universalUpload(exposeFile, { moduleCode: 'MOD_13', docTypeHint: 'expose', source: 'project_intake', onFileUploaded: (info) => setUploadedExpose(info) });
        if (result.error) throw new Error(result.error);
        if (!uploadedExpose && result.documentId) setUploadedExpose({ documentId: result.documentId, storagePath: result.storagePath || '', storageNodeId: result.storageNodeId, fileName: exposeFile.name, fileSize: exposeFile.size, mimeType: exposeFile.type, previewUrl: result.previewUrl || null });
      }
      if (pricelistFile) {
        const result = await universalUpload(pricelistFile, { moduleCode: 'MOD_13', docTypeHint: 'pricelist', source: 'project_intake', onFileUploaded: (info) => setUploadedPricelist(info) });
        if (result.error) throw new Error(result.error);
        if (!uploadedPricelist && result.documentId) setUploadedPricelist({ documentId: result.documentId, storagePath: result.storagePath || '', storageNodeId: result.storageNodeId, fileName: pricelistFile.name, fileSize: pricelistFile.size, mimeType: pricelistFile.type, previewUrl: result.previewUrl || null });
      }
      toast.success('Dateien erfolgreich hochgeladen');
    } catch (err) { const message = err instanceof Error ? err.message : 'Upload fehlgeschlagen'; setError(message); toast.error('Upload fehlgeschlagen', { description: message }); } finally { setIsUploading(false); }
  };

  const handleStartAnalysis = async () => {
    const storagePaths: { expose?: string; pricelist?: string } = {};
    if (uploadedExpose) storagePaths.expose = uploadedExpose.storagePath;
    if (uploadedPricelist) storagePaths.pricelist = uploadedPricelist.storagePath;
    setIsAnalyzing(true); setError(null);
    // Auto-open Armstrong when analysis starts
    showArmstrong({ expanded: true });
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sot-project-intake', { body: { storagePaths, mode: 'analyze' } });
      if (fnError) throw fnError; if (data?.error) throw new Error(data.error);
      if (data?.extractedData) { setExtractedData(data.extractedData); setStep('review'); toast.success('Analyse abgeschlossen'); }
    } catch (err) { const message = err instanceof Error ? err.message : 'Analyse fehlgeschlagen'; setError(message); toast.error('KI-Analyse fehlgeschlagen', { description: message }); } finally { setIsAnalyzing(false); }
  };

  const handleCreateProject = async () => {
    if (!extractedData) return;
    if (hasBlockingErrors) {
      toast.error('Bitte beheben Sie zuerst die Fehler (rot markiert).');
      return;
    }
    const storagePaths: { expose?: string; pricelist?: string } = {};
    if (uploadedExpose) storagePaths.expose = uploadedExpose.storagePath;
    if (uploadedPricelist) storagePaths.pricelist = uploadedPricelist.storagePath;
    setStep('creating'); setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sot-project-intake', { body: { storagePaths, mode: 'create', reviewedData: extractedData, autoCreateContext: true } });
      if (fnError) throw fnError; if (data?.error) throw new Error(data.error);
      if (data?.projectId) {
        // Emit 'created' state so Armstrong shows proactive message
        intakeEmitter.emit({
          step: 'created',
          unitsCount: extractedData.extractedUnits?.length || 0,
          projectName: extractedData.projectName || data.projectCode || '',
          warnings: [],
        });
        toast.success('Projekt erstellt', { description: `Projektcode: ${data.projectCode}` });
        // Small delay so Armstrong message renders before navigation
        setTimeout(() => { resetForm(); navigate(`/portal/projekte/${data.projectId}`); }, 1500);
      }
    } catch (err) { const message = err instanceof Error ? err.message : 'Projekt konnte nicht erstellt werden'; setError(message); setStep('review'); toast.error('Fehler beim Erstellen', { description: message }); }
  };

  const resetForm = () => { setExposeFile(null); setPricelistFile(null); setUploadedExpose(null); setUploadedPricelist(null); setExtractedData(null); setStep('upload'); setError(null); };
  const hasUploadedFiles = !!uploadedExpose || !!uploadedPricelist;
  const hasSelectedFiles = !!exposeFile || !!pricelistFile;

  const stats = {
    totalProjects: portfolioRows.length,
    activeProjects: portfolioRows.filter(p => p.status === 'in_distribution' || p.status === 'active').length,
    totalUnits: portfolioRows.reduce((sum, p) => sum + p.total_units_count, 0),
    soldUnits: portfolioRows.reduce((sum, p) => sum + p.units_sold, 0),
    totalRevenue: portfolioRows.reduce((sum, p) => sum + (p.sale_revenue_actual || 0), 0),
    reservedUnits: portfolioRows.reduce((sum, p) => sum + p.units_reserved, 0),
  };

  // ── Summen for review table ───────────────────────────────────────────────
  const unitSums = useMemo(() => {
    const units = extractedData?.extractedUnits || [];
    return {
      totalArea: units.reduce((s, u) => s + (u.area || 0), 0),
      totalPrice: units.reduce((s, u) => s + (u.price || 0), 0),
      totalRent: units.reduce((s, u) => s + (u.currentRent || 0), 0),
      totalHausgeld: units.reduce((s, u) => s + (u.hausgeld || 0), 0),
      avgRendite: (() => {
        const withRendite = units.filter(u => u.nettoRendite && u.nettoRendite > 0);
        return withRendite.length > 0 ? withRendite.reduce((s, u) => s + (u.nettoRendite || 0), 0) / withRendite.length : 0;
      })(),
    };
  }, [extractedData?.extractedUnits]);

  // Check if any unit has extended fields
  const hasExtendedFields = useMemo(() => {
    const units = extractedData?.extractedUnits || [];
    return units.some(u => u.hausgeld || u.weg || u.nettoRendite || u.mietfaktor);
  }, [extractedData?.extractedUnits]);

  return (
    <PageShell>
      <ModulePageHeader title="PROJEKTMANAGER" />

      {/* ═══ DASHBOARD_HEADER: Visitenkarte + KI-Marktanalyse ═══ */}
      <div className={DESIGN.DASHBOARD_HEADER.GRID}>
        <ManagerVisitenkarte
          role="Projektmanager"
          gradientFrom="hsl(25,85%,50%)"
          gradientTo="hsl(15,80%,45%)"
          badgeText={`${stats.activeProjects} ${stats.activeProjects === 1 ? 'aktives Projekt' : 'aktive Projekte'}`}
        />
        <MarketReportWidget
          icon={TrendingUpIcon}
          title="Marktanalyse"
          subtitle="KI-gestützter Wettbewerbsbericht"
          buttonLabel="Analyse starten"
          gradientFrom="hsl(25,85%,50%)"
          gradientTo="hsl(15,80%,45%)"
          sheetTitle="KI-Marktanalyse"
          sheetDescription="Strukturierter Wettbewerbsbericht zu Ihren Projekten"
          functionName="sot-project-market-report"
        />
      </div>

      {/* ═══ Meine Projekte — Widget-Grid direkt nach KPIs ═══ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Meine Projekte</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              onClick={() => {
                const intakeEl = document.getElementById('magic-intake-section');
                if (intakeEl) {
                  intakeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Pulse the card briefly to draw attention
                  intakeEl.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                  setTimeout(() => intakeEl.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 2000);
                }
              }}
            >
              <Sparkles className="h-4 w-4" />
              Projekt aus Dokument
            </Button>
            {portfolioRows.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => navigate('/portal/projekte/projekte')}>
                Alle anzeigen <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {isLoadingPortfolio ? (
          <LoadingState />
        ) : (
          <WidgetGrid>
            {portfolioRows.map((project) => (
              <WidgetCell key={project.id}>
                <ProjectCard project={project} />
              </WidgetCell>
            ))}
            <DesktopOnly>
              <WidgetCell>
                <ProjectCardPlaceholder onClick={() => setCreateProjectOpen(true)} />
              </WidgetCell>
            </DesktopOnly>
          </WidgetGrid>
        )}
      </div>

      {/* ═══ So funktioniert's ═══ */}
      <Card className="glass-card shadow-card overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-4">
            {[
              { step: 1, icon: Upload, title: 'Hochladen' },
              { step: 2, icon: Sparkles, title: 'KI-Analyse' },
              { step: 3, icon: CheckCircle2, title: 'Prüfen & Freigeben' },
              { step: 4, icon: TrendingUp, title: 'Vertrieb & Leads' },
            ].map(({ step, icon: Icon, title }, idx) => (
              <div key={step} className={cn("relative flex flex-col items-center text-center p-5 transition-colors", idx < 3 && "border-r border-border/50")}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-base font-semibold text-foreground">{title}</div>
                {idx < 3 && <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 text-muted-foreground/50 z-10 hidden md:block" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══ Magic Intake ═══ */}
      <Card id="magic-intake-section" className="border-primary/30 glass-card shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 shadow-glow"><Sparkles className="h-6 w-6 text-primary" /></div>
            <div className="flex-1">
              <CardTitle className="text-lg">Magic Intake</CardTitle>
              <CardDescription>Laden Sie Exposé und/oder Wohnungsliste hoch — die KI erstellt Ihr Projekt automatisch.</CardDescription>
            </div>
            <DesktopOnly>
              <Button variant="outline" size="sm" onClick={() => setCreateProjectOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Manuell anlegen
              </Button>
            </DesktopOnly>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {step !== 'upload' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Badge variant="outline" className={step === 'review' ? 'bg-primary/10 text-primary' : 'bg-muted'}>
                Schritt {step === 'review' ? '3: Review' : '4: Erstellen'}
              </Badge>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={resetForm}>Zurücksetzen</Button>
            </div>
          )}

          {step === 'upload' && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {uploadedExpose ? (
                  <UploadResultCard file={uploadedExpose} status={isAnalyzing ? 'analyzing' : 'uploaded'} />
                ) : (
                  <div {...getExposeRootProps()} className={cn("relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all group", isExposeDragActive ? "border-primary bg-primary/5 scale-[1.02] shadow-glow" : "border-border hover:border-primary/50 hover:bg-primary/5", exposeFile && "border-primary bg-primary/5")}>
                    <input {...getExposeInputProps()} />
                    {exposeFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10"><CheckCircle2 className="h-5 w-5 text-primary" /></div>
                          <div className="text-left"><p className="font-medium text-sm">{exposeFile.name}</p><p className="text-xs text-muted-foreground">{Math.round(exposeFile.size / 1024)} KB</p></div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setExposeFile(null); }}><X className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-2xl bg-muted/50 group-hover:bg-primary/10 transition-colors"><FileText className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" /></div>
                        <div><p className="font-semibold text-foreground">Projekt-Exposé</p><p className="text-sm text-muted-foreground">PDF hier ablegen oder klicken</p></div>
                      </div>
                    )}
                  </div>
                )}
                {uploadedPricelist ? (
                  <UploadResultCard file={uploadedPricelist} status={isAnalyzing ? 'analyzing' : 'uploaded'} />
                ) : (
                  <div {...getPricelistRootProps()} className={cn("relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all group", isPricelistDragActive ? "border-primary bg-primary/5 scale-[1.02] shadow-glow" : "border-border hover:border-primary/50 hover:bg-primary/5", pricelistFile && "border-primary bg-primary/5")}>
                    <input {...getPricelistInputProps()} />
                    {pricelistFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10"><CheckCircle2 className="h-5 w-5 text-primary" /></div>
                          <div className="text-left"><p className="font-medium text-sm">{pricelistFile.name}</p><p className="text-xs text-muted-foreground">{Math.round(pricelistFile.size / 1024)} KB</p></div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setPricelistFile(null); }}><X className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-2xl bg-muted/50 group-hover:bg-primary/10 transition-colors"><Table2 className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" /></div>
                        <div><p className="font-semibold text-foreground">Wohnungsliste / Preisliste</p><p className="text-sm text-muted-foreground">XLSX, CSV oder PDF</p></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  <Sparkles className="inline h-3 w-3 mr-1" />
                  {isUploading ? 'Dateien werden hochgeladen…' : hasUploadedFiles ? 'Dateien hochgeladen — starten Sie die KI-Analyse' : 'Dateien ablegen oder klicken — Upload startet automatisch'}
                </p>
                <div className="flex gap-2">
                  {(hasSelectedFiles || hasUploadedFiles) && <Button variant="ghost" onClick={resetForm} disabled={isUploading || isAnalyzing}>Zurücksetzen</Button>}
                  {isUploading && (
                    <Button disabled className="gap-2" size="lg">
                      <Loader2 className="h-4 w-4 animate-spin" />Wird hochgeladen…
                    </Button>
                  )}
                  {hasUploadedFiles && <Button onClick={handleStartAnalysis} disabled={isAnalyzing} className="gap-2" size="lg">{isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" />KI analysiert…</> : <><Search className="h-4 w-4" />KI-Analyse starten</>}</Button>}
                </div>
              </div>
            </>
          )}

          {step === 'review' && extractedData && (
            <div className="space-y-4">
              {/* Project metadata fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="projectName">Projektname</Label><Input id="projectName" value={extractedData.projectName} onChange={(e) => setExtractedData({ ...extractedData, projectName: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="projectType">Projekttyp</Label><Input id="projectType" value={extractedData.projectType || 'neubau'} onChange={(e) => setExtractedData({ ...extractedData, projectType: e.target.value as any })} /></div>
                <div className="space-y-2"><Label htmlFor="city">Stadt</Label><Input id="city" value={extractedData.city} onChange={(e) => setExtractedData({ ...extractedData, city: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="postalCode">PLZ</Label><Input id="postalCode" value={extractedData.postalCode} onChange={(e) => setExtractedData({ ...extractedData, postalCode: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="address">Adresse</Label><Input id="address" value={extractedData.address} onChange={(e) => setExtractedData({ ...extractedData, address: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="unitsCount">Einheiten</Label><Input id="unitsCount" type="number" value={extractedData.unitsCount} onChange={(e) => setExtractedData({ ...extractedData, unitsCount: parseInt(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label htmlFor="totalArea">Gesamtfläche (m²)</Label><Input id="totalArea" type="number" value={extractedData.totalArea} onChange={(e) => setExtractedData({ ...extractedData, totalArea: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label htmlFor="priceRange">Preisspanne</Label><Input id="priceRange" value={extractedData.priceRange} onChange={(e) => setExtractedData({ ...extractedData, priceRange: e.target.value })} /></div>
              </div>

              {/* Extra Expose fields for Aufteilungsobjekte */}
              {(extractedData.constructionYear || extractedData.developer || (extractedData.wegCount && extractedData.wegCount > 0)) && (
                <div className="grid gap-4 md:grid-cols-3">
                  {extractedData.constructionYear ? (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Baujahr</Label>
                      <p className="text-sm font-medium">{extractedData.constructionYear}</p>
                    </div>
                  ) : null}
                  {extractedData.developer ? (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Bauträger/Verkäufer</Label>
                      <p className="text-sm font-medium">{extractedData.developer}</p>
                    </div>
                  ) : null}
                  {extractedData.wegCount && extractedData.wegCount > 0 ? (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">WEGs</Label>
                      <div className="flex flex-wrap gap-1">
                        {extractedData.wegDetails?.map((weg, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{weg.name} ({weg.unitsCount} WE)</Badge>
                        )) || <p className="text-sm font-medium">{extractedData.wegCount} WEG(s)</p>}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Column Mapping Display */}
              {extractedData.columnMapping && extractedData.columnMapping.length > 0 && (
                <div>
                  <Label className="mb-2 block text-muted-foreground">KI-Spalten-Zuordnung</Label>
                  <div className="flex flex-wrap gap-2">
                    {extractedData.columnMapping.map((m, i) => (
                      <Badge key={i} variant="outline" className="gap-1 text-xs font-normal">
                        <span className="font-mono">"{m.original_column}"</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{MAPPED_TO_LABELS[m.mapped_to] || m.mapped_to}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Warnings */}
              {validationWarnings.length > 0 && (
                <div className="space-y-2">
                  {validationWarnings.map((w, i) => (
                    <div key={i} className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-sm",
                      w.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-accent/50 text-accent-foreground'
                    )}>
                      {w.type === 'error' ? <AlertCircle className="h-4 w-4 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
                      {w.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Extracted Units Table — INLINE EDITABLE */}
              {extractedData.extractedUnits && extractedData.extractedUnits.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center gap-2">
                      <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                      Erkannte Einheiten: {extractedData.extractedUnits.length}
                      <span className="text-xs text-muted-foreground font-normal">(Klicken zum Bearbeiten)</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{unitSums.totalArea.toFixed(0)} m² gesamt</Badge>
                      <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={addUnit}>
                        <Plus className="h-3 w-3" /> Einheit
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0 z-10">
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium">Nr.</th>
                          <th className="text-left py-2 px-3 font-medium">Typ</th>
                          {hasExtendedFields && <th className="text-left py-2 px-3 font-medium">WEG</th>}
                          <th className="text-right py-2 px-3 font-medium">Fläche</th>
                          <th className="text-right py-2 px-3 font-medium">Zimmer</th>
                          <th className="text-left py-2 px-3 font-medium">Etage</th>
                          <th className="text-right py-2 px-3 font-medium">Kaufpreis</th>
                          <th className="text-right py-2 px-3 font-medium">Miete</th>
                          {hasExtendedFields && <th className="text-right py-2 px-3 font-medium">Hausgeld</th>}
                          {hasExtendedFields && <th className="text-right py-2 px-3 font-medium">Rendite</th>}
                          <th className="text-right py-2 px-3 font-medium">€/m²</th>
                          <th className="py-2 px-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedData.extractedUnits.map((unit, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-1.5 px-3 font-mono text-xs">
                              <EditableCell value={unit.unitNumber} onChange={(v) => updateUnit(idx, 'unitNumber', v)} />
                            </td>
                            <td className="py-1.5 px-3">
                              <EditableCell value={unit.type} onChange={(v) => updateUnit(idx, 'type', v)} />
                            </td>
                            {hasExtendedFields && (
                              <td className="py-1.5 px-3 text-xs">
                                <EditableCell value={unit.weg || ''} onChange={(v) => updateUnit(idx, 'weg', v)} />
                              </td>
                            )}
                            <td className="py-1.5 px-3 text-right">
                              <EditableCell value={unit.area?.toFixed(1)} onChange={(v) => updateUnit(idx, 'area', v)} type="number" />
                              <span className="text-muted-foreground ml-0.5">m²</span>
                            </td>
                            <td className="py-1.5 px-3 text-right">
                              <EditableCell value={unit.rooms || 0} onChange={(v) => updateUnit(idx, 'rooms', v)} type="number" />
                            </td>
                            <td className="py-1.5 px-3">
                              <EditableCell value={unit.floor || ''} onChange={(v) => updateUnit(idx, 'floor', v)} />
                            </td>
                            <td className="py-1.5 px-3 text-right font-medium">
                              <EditableCell value={unit.price} onChange={(v) => updateUnit(idx, 'price', v)} type="number" />
                              <span className="text-muted-foreground ml-0.5">€</span>
                            </td>
                            <td className="py-1.5 px-3 text-right">
                              <EditableCell value={unit.currentRent || 0} onChange={(v) => updateUnit(idx, 'currentRent', v)} type="number" />
                              <span className="text-muted-foreground ml-0.5">€</span>
                            </td>
                            {hasExtendedFields && (
                              <td className="py-1.5 px-3 text-right">
                                <EditableCell value={unit.hausgeld || 0} onChange={(v) => updateUnit(idx, 'hausgeld', v)} type="number" />
                                <span className="text-muted-foreground ml-0.5">€</span>
                              </td>
                            )}
                            {hasExtendedFields && (
                              <td className="py-1.5 px-3 text-right text-primary font-medium">
                                {unit.nettoRendite ? `${unit.nettoRendite.toFixed(1)}%` : unit.currentRent && unit.price ? `${((unit.currentRent * 12 / unit.price) * 100).toFixed(1)}%` : '—'}
                              </td>
                            )}
                            <td className="py-1.5 px-3 text-right text-muted-foreground">
                              {unit.area > 0 ? Math.round(unit.price / unit.area).toLocaleString('de-DE') : '—'}
                            </td>
                            <td className="py-1.5 px-2">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeUnit(idx)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Sum row */}
                      <tfoot>
                        <tr className="bg-muted/30 font-medium border-t-2">
                          <td className="py-2 px-3 text-xs">SUMME</td>
                          <td className="py-2 px-3">{extractedData.extractedUnits.length} Einh.</td>
                          {hasExtendedFields && <td className="py-2 px-3"></td>}
                          <td className="py-2 px-3 text-right">{unitSums.totalArea.toFixed(0)} m²</td>
                          <td className="py-2 px-3"></td>
                          <td className="py-2 px-3"></td>
                          <td className="py-2 px-3 text-right">{unitSums.totalPrice.toLocaleString('de-DE')} €</td>
                          <td className="py-2 px-3 text-right">{unitSums.totalRent.toLocaleString('de-DE')} €</td>
                          {hasExtendedFields && <td className="py-2 px-3 text-right">{unitSums.totalHausgeld.toLocaleString('de-DE')} €</td>}
                          {hasExtendedFields && <td className="py-2 px-3 text-right text-primary">{unitSums.avgRendite > 0 ? `Ø ${unitSums.avgRendite.toFixed(1)}%` : '—'}</td>}
                          <td className="py-2 px-3 text-right text-muted-foreground">
                            {unitSums.totalArea > 0 ? `Ø ${Math.round(unitSums.totalPrice / unitSums.totalArea).toLocaleString('de-DE')}` : '—'}
                          </td>
                          <td className="py-2 px-2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={resetForm}>Abbrechen</Button>
                <Button 
                  onClick={handleCreateProject} 
                  className="gap-2" 
                  size="lg"
                  disabled={hasBlockingErrors}
                >
                  <Sparkles className="h-4 w-4" />Projekt anlegen
                </Button>
              </div>
            </div>
          )}

          {step === 'creating' && (
            <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Projekt wird erstellt…</div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"><AlertCircle className="h-4 w-4 flex-shrink-0" />{error}</div>
          )}
        </CardContent>
      </Card>

      {/* ═══ KPI-Kacheln — ganz unten ═══ */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projekte</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">{stats.activeProjects} aktiv im Vertrieb</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Einheiten</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnits}</div>
            <p className="text-xs text-muted-foreground">{stats.soldUnits} verkauft</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abverkaufsquote</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnits > 0 ? Math.round((stats.soldUnits / stats.totalUnits) * 100) : 0}%</div>
            <p className="text-xs text-muted-foreground">Gesamt-Portfolio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Umsatz IST</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Aus Verkäufen</p>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onSuccess={(projectId) => navigate(`/portal/projekte/${projectId}`)}
      />
      <ProjectDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        project={projectToDelete}
        tenantId={tenantId}
        onConfirmDelete={handleConfirmDelete}
      />
    </PageShell>
  );
}
