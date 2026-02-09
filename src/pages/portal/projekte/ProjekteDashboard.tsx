/**
 * Projekte Dashboard - Magic Intake Entry Point
 * MOD-13 PROJEKTE
 * 
 * Primary landing page with:
 * - Magic Intake: Upload Exposé + Wohnungsliste → Auto-create project
 * - Recent projects list with delete functionality
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Table2, 
  Sparkles, 
  X, 
  Loader2, 
  ArrowRight,
  Building2,
  FolderKanban,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';
import { useDevProjects } from '@/hooks/useDevProjects';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/shared/LoadingState';
import { formatCurrency } from '@/lib/formatters';
import { ProjectDeleteDialog, type DeletionProtocol } from '@/components/projekte/ProjectDeleteDialog';
import type { ProjectPortfolioRow } from '@/types/projekte';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProjekteDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;
  const { portfolioRows, isLoadingPortfolio, deleteProject } = useDevProjects();
  
  const [exposeFile, setExposeFile] = useState<File | null>(null);
  const [pricelistFile, setPricelistFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectPortfolioRow | null>(null);

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
    if (acceptedFiles.length > 0) {
      setExposeFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps: getExposeRootProps, getInputProps: getExposeInputProps, isDragActive: isExposeDragActive } = useDropzone({
    onDrop: onDropExpose,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    multiple: false,
  });

  // Pricelist dropzone
  const onDropPricelist = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setPricelistFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps: getPricelistRootProps, getInputProps: getPricelistInputProps, isDragActive: isPricelistDragActive } = useDropzone({
    onDrop: onDropPricelist,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    multiple: false,
  });

  // Universal upload hook for stable direct-to-storage uploads
  const { upload: universalUpload } = useUniversalUpload();

  const handleMagicIntake = async () => {
    if (!exposeFile && !pricelistFile) {
      setError('Bitte laden Sie mindestens eine Datei hoch.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Upload files directly to storage (no FormData to Edge Function)
      const storagePaths: { expose?: string; pricelist?: string } = {};

      if (exposeFile) {
        const result = await universalUpload(exposeFile, {
          moduleCode: 'MOD_13',
          docTypeHint: 'expose',
          source: 'project_intake',
        });
        if (result.error) throw new Error(result.error);
        storagePaths.expose = result.storagePath;
      }

      if (pricelistFile) {
        const result = await universalUpload(pricelistFile, {
          moduleCode: 'MOD_13',
          docTypeHint: 'pricelist',
          source: 'project_intake',
        });
        if (result.error) throw new Error(result.error);
        storagePaths.pricelist = result.storagePath;
      }

      // Step 2: Call Edge Function with storage paths only (JSON mode, no file content)
      const { data, error: fnError } = await supabase.functions.invoke('sot-project-intake', {
        body: {
          storagePaths,
          autoCreateContext: true,
        },
      });

      if (fnError) throw fnError;

      if (data?.projectId) {
        toast.success('Projekt wird erstellt', {
          description: 'Die KI analysiert Ihre Dokumente. Sie werden zur Projektakte weitergeleitet.',
        });
        resetForm();
        navigate(`/portal/projekte/${data.projectId}`);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Magic intake error:', err);
      const message = err instanceof Error ? err.message : 'Fehler beim Starten des Imports';
      setError(message);
      toast.error('Fehler beim Import', { description: message });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setExposeFile(null);
    setPricelistFile(null);
    setError(null);
  };

  // Stats from portfolio
  const stats = {
    totalProjects: portfolioRows.length,
    activeProjects: portfolioRows.filter(p => p.status === 'in_distribution' || p.status === 'active').length,
    totalUnits: portfolioRows.reduce((sum, p) => sum + p.total_units_count, 0),
    soldUnits: portfolioRows.reduce((sum, p) => sum + p.units_sold, 0),
    totalRevenue: portfolioRows.reduce((sum, p) => sum + (p.sale_revenue_actual || 0), 0),
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projekte</h1>
        <p className="text-muted-foreground">
          Bauträger- und Aufteiler-Projekte verwalten
        </p>
      </div>

      {/* Magic Intake Card - Primary CTA */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Neues Projekt starten</CardTitle>
              <CardDescription>
                Laden Sie Exposé und/oder Wohnungsliste hoch — die KI erstellt Ihr Projekt automatisch.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Exposé Upload */}
            <div
              {...getExposeRootProps()}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                isExposeDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                exposeFile && "border-primary bg-primary/5"
              )}
            >
              <input {...getExposeInputProps()} />
              {exposeFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{exposeFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(exposeFile.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExposeFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Projekt-Exposé</p>
                    <p className="text-sm text-muted-foreground">PDF hier ablegen</p>
                  </div>
                </div>
              )}
            </div>

            {/* Pricelist Upload */}
            <div
              {...getPricelistRootProps()}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                isPricelistDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                pricelistFile && "border-primary bg-primary/5"
              )}
            >
              <input {...getPricelistInputProps()} />
              {pricelistFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{pricelistFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(pricelistFile.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPricelistFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Table2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Wohnungsliste / Preisliste</p>
                    <p className="text-sm text-muted-foreground">XLSX, CSV oder PDF</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              <Sparkles className="inline h-3 w-3 mr-1" />
              KI extrahiert automatisch Projektdaten, Einheiten & Preise
            </p>
            <div className="flex gap-2">
              {(exposeFile || pricelistFile) && (
                <Button variant="ghost" onClick={resetForm} disabled={isProcessing}>
                  Zurücksetzen
                </Button>
              )}
              <Button 
                onClick={handleMagicIntake}
                disabled={isProcessing || (!exposeFile && !pricelistFile)}
                className="gap-2"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    KI arbeitet...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Projekt automatisch anlegen
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {portfolioRows.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projekte</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeProjects} aktiv im Vertrieb
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Einheiten</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUnits}</div>
              <p className="text-xs text-muted-foreground">
                {stats.soldUnits} verkauft
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abverkaufsquote</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalUnits > 0 ? Math.round((stats.soldUnits / stats.totalUnits) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Gesamt-Portfolio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Umsatz IST</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Aus Verkäufen
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Meine Projekte</CardTitle>
            <CardDescription>
              {portfolioRows.length === 0 
                ? 'Noch keine Projekte vorhanden'
                : `${portfolioRows.length} Projekte im Portfolio`
              }
            </CardDescription>
          </div>
          {portfolioRows.length > 0 && (
            <Button variant="outline" onClick={() => navigate('/portal/projekte/projekte')}>
              Alle anzeigen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingPortfolio ? (
            <LoadingState />
          ) : portfolioRows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Laden Sie oben ein Exposé hoch, um Ihr erstes Projekt zu erstellen.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Standort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Einheiten</TableHead>
                  <TableHead className="text-right">Fortschritt</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioRows.slice(0, 5).map((project) => (
                  <TableRow 
                    key={project.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/portal/projekte/${project.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.project_code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.postal_code && `${project.postal_code} `}{project.city || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={project.status === 'in_distribution' || project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-primary font-medium">{project.units_sold}</span>
                      <span className="text-muted-foreground"> / {project.total_units_count}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{project.progress_percent}%</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(project);
                          }}
                          title="Projekt löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <ProjectDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        project={projectToDelete}
        tenantId={tenantId}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
