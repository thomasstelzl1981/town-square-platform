/**
 * Projekte Dashboard - Magic Intake Entry Point
 * MOD-13 PROJEKTE — P0 Redesign
 * 
 * ALWAYS shows 5 widgets (W1–W5), even without data.
 */

import { useState, useCallback } from 'react';
import { DESIGN } from '@/config/designManifest';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, FileText, Table2, Sparkles, X, Loader2, ArrowRight,
  Building2, FolderKanban, TrendingUp, AlertCircle, CheckCircle2,
  Trash2, Search, Plus,
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
import { isDemoMode, DEMO_PROJECT, DEMO_CALC } from '@/components/projekte/demoProjectData';
import type { ProjectPortfolioRow } from '@/types/projekte';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

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
}

type IntakeStep = 'upload' | 'review' | 'creating';

export default function ProjekteDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;
  const { portfolioRows, isLoadingPortfolio, deleteProject } = useDevProjects();
  
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

  const handleDeleteClick = (project: ProjectPortfolioRow) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (projectId: string): Promise<DeletionProtocol> => {
    const result = await deleteProject.mutateAsync(projectId);
    return result;
  };

  // Expose dropzone
  const onDropExpose = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) { setExposeFile(acceptedFiles[0]); setError(null); }
  }, []);
  const { getRootProps: getExposeRootProps, getInputProps: getExposeInputProps, isDragActive: isExposeDragActive } = useDropzone({
    onDrop: onDropExpose, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1, multiple: false, disabled: !!uploadedExpose,
  });

  // Pricelist dropzone
  const onDropPricelist = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) { setPricelistFile(acceptedFiles[0]); setError(null); }
  }, []);
  const { getRootProps: getPricelistRootProps, getInputProps: getPricelistInputProps, isDragActive: isPricelistDragActive } = useDropzone({
    onDrop: onDropPricelist,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'], 'text/csv': ['.csv'] },
    maxFiles: 1, multiple: false, disabled: !!uploadedPricelist,
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
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sot-project-intake', { body: { storagePaths, mode: 'analyze' } });
      if (fnError) throw fnError; if (data?.error) throw new Error(data.error);
      if (data?.extractedData) { setExtractedData(data.extractedData); setStep('review'); toast.success('Analyse abgeschlossen'); }
    } catch (err) { const message = err instanceof Error ? err.message : 'Analyse fehlgeschlagen'; setError(message); toast.error('KI-Analyse fehlgeschlagen', { description: message }); } finally { setIsAnalyzing(false); }
  };

  const handleCreateProject = async () => {
    if (!extractedData) return;
    const storagePaths: { expose?: string; pricelist?: string } = {};
    if (uploadedExpose) storagePaths.expose = uploadedExpose.storagePath;
    if (uploadedPricelist) storagePaths.pricelist = uploadedPricelist.storagePath;
    setStep('creating'); setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sot-project-intake', { body: { storagePaths, mode: 'create', reviewedData: extractedData, autoCreateContext: true } });
      if (fnError) throw fnError; if (data?.error) throw new Error(data.error);
      if (data?.projectId) { toast.success('Projekt erstellt', { description: `Projektcode: ${data.projectCode}` }); resetForm(); navigate(`/portal/projekte/${data.projectId}`); }
    } catch (err) { const message = err instanceof Error ? err.message : 'Projekt konnte nicht erstellt werden'; setError(message); setStep('review'); toast.error('Fehler beim Erstellen', { description: message }); }
  };

  const resetForm = () => { setExposeFile(null); setPricelistFile(null); setUploadedExpose(null); setUploadedPricelist(null); setExtractedData(null); setStep('upload'); setError(null); };
  const hasUploadedFiles = !!uploadedExpose || !!uploadedPricelist;
  const hasSelectedFiles = !!exposeFile || !!pricelistFile;

  const isDemo = isDemoMode(portfolioRows);

  const stats = {
    totalProjects: portfolioRows.length + 1, // +1 for demo
    activeProjects: portfolioRows.filter(p => p.status === 'in_distribution' || p.status === 'active').length + 1,
    totalUnits: portfolioRows.reduce((sum, p) => sum + p.total_units_count, 0) + DEMO_PROJECT.total_units_count,
    soldUnits: portfolioRows.reduce((sum, p) => sum + p.units_sold, 0),
    totalRevenue: portfolioRows.reduce((sum, p) => sum + (p.sale_revenue_actual || 0), 0),
    reservedUnits: portfolioRows.reduce((sum, p) => sum + p.units_reserved, 0),
  };

  return (
    <PageShell>
      <ModulePageHeader title="PROJEKTE" description="Bauträger- und Aufteiler-Projekte verwalten" />

      {/* ═══ W1: So funktioniert's ═══ */}
      <Card className="glass-card shadow-card overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-4">
            {[
              { step: 1, icon: Upload, title: 'Hochladen', desc: 'Exposé + Preisliste' },
              { step: 2, icon: Sparkles, title: 'KI-Analyse', desc: 'Automatische Aufbereitung' },
              { step: 3, icon: CheckCircle2, title: 'Prüfen & Freigeben', desc: 'Provision bestätigen' },
              { step: 4, icon: TrendingUp, title: 'Vertrieb & Leads', desc: 'Kampagnen starten' },
            ].map(({ step, icon: Icon, title, desc }, idx) => (
              <div key={step} className={cn("relative flex flex-col items-center text-center p-5 transition-colors", idx < 3 && "border-r border-border/50")}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Schritt {step}</div>
                <div className="text-sm font-semibold text-foreground">{title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                {idx < 3 && <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 text-muted-foreground/50 z-10 hidden md:block" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══ W2: Projekt starten (Magic Intake) ═══ */}
      <Card className="border-primary/30 glass-card shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 shadow-glow"><Sparkles className="h-6 w-6 text-primary" /></div>
            <div className="flex-1">
              <CardTitle className="text-lg">Magic Intake</CardTitle>
              <CardDescription>Laden Sie Exposé und/oder Wohnungsliste hoch — die KI erstellt Ihr Projekt automatisch.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCreateProjectOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Manuell anlegen
            </Button>
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
                <p className="text-sm text-muted-foreground"><Sparkles className="inline h-3 w-3 mr-1" />{hasUploadedFiles ? 'Dateien hochgeladen — starten Sie die KI-Analyse' : 'KI extrahiert automatisch Projektdaten, Einheiten & Preise'}</p>
                <div className="flex gap-2">
                  {(hasSelectedFiles || hasUploadedFiles) && <Button variant="ghost" onClick={resetForm} disabled={isUploading || isAnalyzing}>Zurücksetzen</Button>}
                  {!hasUploadedFiles && <Button onClick={handleUploadFiles} disabled={isUploading || !hasSelectedFiles} className="gap-2" size="lg">{isUploading ? <><Loader2 className="h-4 w-4 animate-spin" />Wird hochgeladen…</> : <><Upload className="h-4 w-4" />Dateien hochladen</>}</Button>}
                  {hasUploadedFiles && <Button onClick={handleStartAnalysis} disabled={isAnalyzing} className="gap-2" size="lg">{isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" />KI analysiert…</> : <><Search className="h-4 w-4" />KI-Analyse starten</>}</Button>}
                </div>
              </div>
            </>
          )}

          {step === 'review' && extractedData && (
            <div className="space-y-4">
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
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={resetForm}>Abbrechen</Button>
                <Button onClick={handleCreateProject} className="gap-2" size="lg"><Sparkles className="h-4 w-4" />Projekt anlegen</Button>
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

      {/* ═══ W3: Stats Cards — ALWAYS visible ═══ */}
      <div className={cn(DESIGN.KPI_GRID.FULL, isDemo && "opacity-50")}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projekte</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">{stats.activeProjects} aktiv im Vertrieb {isDemo && '(Musterdaten)'}</p>
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

      {/* ═══ W3b: Meine Projekte — Square Cards ═══ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Meine Projekte</CardTitle>
            <CardDescription>{portfolioRows.length === 0 ? 'Noch keine Projekte vorhanden' : `${portfolioRows.length} Projekte im Portfolio`}</CardDescription>
          </div>
          {portfolioRows.length > 0 && (
            <Button variant="outline" onClick={() => navigate('/portal/projekte/projekte')}>
              Alle anzeigen <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingPortfolio ? (
            <LoadingState />
          ) : (
            <WidgetGrid>
              {/* Demo project is ALWAYS shown as first tile */}
              <WidgetCell>
                <ProjectCard project={DEMO_PROJECT} isDemo />
              </WidgetCell>
              {portfolioRows.map((project) => (
                <WidgetCell key={project.id}>
                  <ProjectCard project={project} />
                </WidgetCell>
              ))}
              <WidgetCell>
                <ProjectCardPlaceholder onClick={() => setCreateProjectOpen(true)} />
              </WidgetCell>
            </WidgetGrid>
          )}
        </CardContent>
      </Card>

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
