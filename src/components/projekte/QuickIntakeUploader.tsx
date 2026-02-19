/**
 * Quick Intake Uploader - Upload Exposé + Preisliste for AI-powered project creation
 * MOD-13 PROJEKTE
 * 
 * Multi-step workflow:
 * 1. IDLE - Files selected locally via dropzones
 * 2. UPLOADING - Files being uploaded via useUniversalUpload (Phase 1)
 * 3. UPLOADED - Files persisted, UploadResultCards shown with preview links
 * 4. ANALYZING - AI extraction in progress (user-triggered)
 * 5. REVIEW - User reviews/edits extracted data + sees column mapping
 * 6. CREATING - Project being created
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Table2, Sparkles, X, Loader2, AlertCircle, CheckCircle2, Building2, Download, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperContexts } from '@/hooks/useDeveloperContexts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';
import type { UploadedFileInfo } from '@/hooks/useUniversalUpload';
import { UploadResultCard } from '@/components/shared/UploadResultCard';
import { getXlsx } from '@/lib/lazyXlsx';

interface QuickIntakeUploaderProps {
  onSuccess?: (projectId: string) => void;
}

type UploadPhase = 'idle' | 'uploading' | 'uploaded' | 'analyzing' | 'review' | 'creating';

interface ColumnMapping {
  original_column: string;
  mapped_to: string;
}

interface ExtractedData {
  projectName: string;
  address: string;
  city: string;
  postalCode: string;
  unitsCount: number;
  totalArea: number;
  priceRange: string;
  extractedUnits?: Array<{
    unitNumber: string;
    type: string;
    area: number;
    price: number;
  }>;
  columnMapping?: ColumnMapping[];
}

const MAPPED_TO_LABELS: Record<string, string> = {
  unitNumber: 'Einheit-Nr.',
  type: 'Typ',
  area: 'Fläche (m²)',
  rooms: 'Zimmer',
  floor: 'Etage',
  price: 'Kaufpreis (EUR)',
  currentRent: 'Akt. Miete (EUR/Monat)',
};

export function QuickIntakeUploader({ onSuccess }: QuickIntakeUploaderProps) {
  const [open, setOpen] = useState(false);
  const [exposeFile, setExposeFile] = useState<File | null>(null);
  const [pricelistFile, setPricelistFile] = useState<File | null>(null);
  const [selectedContextId, setSelectedContextId] = useState<string>('');
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  
  // Uploaded file info from Phase 1
  const [uploadedExpose, setUploadedExpose] = useState<UploadedFileInfo | null>(null);
  const [uploadedPricelist, setUploadedPricelist] = useState<UploadedFileInfo | null>(null);
  
  const { upload: universalUpload } = useUniversalUpload();
  const { contexts, defaultContext, isLoading: loadingContexts } = useDeveloperContexts();

  // ── Download Muster-Vorlage ───────────────────────────────────────────────
  const downloadPreislistenVorlage = async () => {
    try {
      const XLSX = await getXlsx();
      const wb = XLSX.utils.book_new();
      const header = [
        'Einheit-Nr.', 'Typ', 'Fläche (m²)', 'Zimmer',
        'Etage', 'Kaufpreis (EUR)', 'Aktuelle Miete (EUR/Monat)',
      ];
      const example1 = ['WE-001', 'Wohnung', 65.0, 2, 'EG', 289000, 650];
      const example2 = ['WE-002', 'Penthouse', 120.0, 4, 'DG', 589000, 0];
      const ws = XLSX.utils.aoa_to_sheet([header, example1, example2]);

      // Column widths
      ws['!cols'] = [
        { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
        { wch: 10 }, { wch: 18 }, { wch: 26 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Preisliste');
      XLSX.writeFile(wb, 'Preisliste_Vorlage.xlsx');
      toast.success('Vorlage heruntergeladen');
    } catch (err) {
      console.error('Template download error:', err);
      toast.error('Fehler beim Download der Vorlage');
    }
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
    disabled: phase !== 'idle',
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
    disabled: phase !== 'idle',
  });

  // Step 1: Upload files via useUniversalUpload (Phase 1 only)
  const handleUploadFiles = async () => {
    if (!exposeFile && !pricelistFile) {
      setError('Bitte laden Sie mindestens eine Datei hoch.');
      return;
    }

    const contextId = selectedContextId || defaultContext?.id;
    if (!contextId) {
      setError('Bitte wählen Sie eine Verkäufer-Gesellschaft aus.');
      return;
    }

    setPhase('uploading');
    setError(null);
    setUploadProgress(0);

    try {
      const totalFiles = (exposeFile ? 1 : 0) + (pricelistFile ? 1 : 0);
      let uploadedCount = 0;

      if (exposeFile) {
        const result = await universalUpload(exposeFile, {
          moduleCode: 'MOD_13',
          entityId: contextId,
          docTypeHint: 'expose',
          source: 'quick_intake',
          triggerAI: false,
          onFileUploaded: (info) => setUploadedExpose(info),
        });
        if (result.error) throw new Error(result.error);
        uploadedCount++;
        setUploadProgress((uploadedCount / totalFiles) * 100);
      }

      if (pricelistFile) {
        const result = await universalUpload(pricelistFile, {
          moduleCode: 'MOD_13',
          entityId: contextId,
          docTypeHint: 'pricelist',
          source: 'quick_intake',
          triggerAI: false,
          onFileUploaded: (info) => setUploadedPricelist(info),
        });
        if (result.error) throw new Error(result.error);
        uploadedCount++;
        setUploadProgress((uploadedCount / totalFiles) * 100);
      }

      setUploadProgress(100);
      setPhase('uploaded');
      toast.success('Dateien hochgeladen', {
        description: 'Bereit für die KI-Analyse.',
      });
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Hochladen');
      setPhase('idle');
    }
  };

  // Step 2: Start AI analysis (user-triggered)
  const handleStartAnalysis = async () => {
    const contextId = selectedContextId || defaultContext?.id;
    if (!contextId) return;

    const storagePaths: Record<string, string> = {};
    if (uploadedExpose?.storagePath) storagePaths.expose = uploadedExpose.storagePath;
    if (uploadedPricelist?.storagePath) storagePaths.pricelist = uploadedPricelist.storagePath;

    setPhase('analyzing');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('sot-project-intake', {
        body: {
          storagePaths,
          contextId,
          mode: 'analyze',
        },
      });

      if (fnError) throw fnError;

      if (data?.extractedData) {
        setExtractedData(data.extractedData);
        setPhase('review');
        toast.success('Analyse abgeschlossen', {
          description: 'Bitte überprüfen Sie die extrahierten Daten.',
        });
      } else if (data?.error) {
        throw new Error(data.error);
      } else if (data?.projectId) {
        toast.success('Projekt erstellt');
        setOpen(false);
        resetForm();
        onSuccess?.(data.projectId);
        return;
      } else {
        throw new Error('Keine Daten von der Analyse erhalten');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Fehler bei der Analyse');
      setPhase('uploaded'); // Back to uploaded, allow retry
    }
  };

  // Step 3: Create project with reviewed data
  const handleCreateProject = async () => {
    if (!extractedData) {
      setError('Keine extrahierten Daten vorhanden.');
      return;
    }

    const contextId = selectedContextId || defaultContext?.id;
    if (!contextId) {
      setError('Keine Verkäufer-Gesellschaft ausgewählt.');
      return;
    }

    const storagePaths: Record<string, string> = {};
    if (uploadedExpose?.storagePath) storagePaths.expose = uploadedExpose.storagePath;
    if (uploadedPricelist?.storagePath) storagePaths.pricelist = uploadedPricelist.storagePath;

    setPhase('creating');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('sot-project-intake', {
        body: {
          storagePaths,
          contextId,
          mode: 'create',
          reviewedData: extractedData,
        },
      });

      if (fnError) throw fnError;

      if (data?.projectId) {
        toast.success('Projekt erfolgreich erstellt', {
          description: `"${extractedData.projectName}" wurde angelegt.`,
        });
        setOpen(false);
        resetForm();
        onSuccess?.(data.projectId);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Create error:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Projekts');
      setPhase('review');
    }
  };

  const resetForm = () => {
    setExposeFile(null);
    setPricelistFile(null);
    setSelectedContextId('');
    setPhase('idle');
    setUploadProgress(0);
    setError(null);
    setExtractedData(null);
    setUploadedExpose(null);
    setUploadedPricelist(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && phase !== 'idle' && phase !== 'uploaded' && phase !== 'review') {
      return;
    }
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const handleEditExtractedField = (field: keyof ExtractedData, value: string | number) => {
    if (!extractedData) return;
    setExtractedData({ ...extractedData, [field]: value });
  };

  const renderPhaseContent = () => {
    switch (phase) {
      case 'uploading':
        return (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="text-center">
                <p className="font-medium">Dateien werden hochgeladen...</p>
                <p className="text-sm text-muted-foreground">
                  {exposeFile && pricelistFile ? 'Exposé und Preisliste' : exposeFile ? 'Exposé' : 'Preisliste'}
                </p>
              </div>
              <Progress value={uploadProgress} className="w-full max-w-xs" />
              <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</p>
            </div>
          </div>
        );

      case 'uploaded':
        return (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 text-accent-foreground">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">Dateien erfolgreich hochgeladen</span>
            </div>
            
            <div className="space-y-2">
              {uploadedExpose && (
                <UploadResultCard file={uploadedExpose} status="uploaded" />
              )}
              {uploadedPricelist && (
                <UploadResultCard file={uploadedPricelist} status="uploaded" />
              )}
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Prüfen Sie die Dateien über die Vorschau-Links. Starten Sie dann die KI-Analyse.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 'analyzing':
        return (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Sparkles className="h-12 w-12 text-primary" />
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="h-12 w-12 text-primary opacity-50" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium">KI analysiert Dokumente...</p>
                <p className="text-sm text-muted-foreground">
                  Projektdaten und Einheiten werden extrahiert
                </p>
              </div>
              <div className="flex gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Dies kann 10-30 Sekunden dauern
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">Analyse abgeschlossen - bitte Daten überprüfen</span>
            </div>

            {extractedData && (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Projektname</Label>
                    <Input 
                      value={extractedData.projectName}
                      onChange={(e) => handleEditExtractedField('projectName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stadt</Label>
                    <Input 
                      value={extractedData.city}
                      onChange={(e) => handleEditExtractedField('city', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>PLZ</Label>
                    <Input 
                      value={extractedData.postalCode}
                      onChange={(e) => handleEditExtractedField('postalCode', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Einheiten</Label>
                    <Input 
                      type="number"
                      value={extractedData.unitsCount}
                      onChange={(e) => handleEditExtractedField('unitsCount', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gesamtfläche (m²)</Label>
                    <Input 
                      type="number"
                      value={extractedData.totalArea}
                      onChange={(e) => handleEditExtractedField('totalArea', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input 
                    value={extractedData.address}
                    onChange={(e) => handleEditExtractedField('address', e.target.value)}
                  />
                </div>

                {/* Column Mapping Display */}
                {extractedData.columnMapping && extractedData.columnMapping.length > 0 && (
                  <div className="mt-2">
                    <Label className="mb-2 block text-muted-foreground">KI-Spalten-Zuordnung</Label>
                    <div className="border rounded-lg p-3 bg-muted/30 space-y-1.5">
                      {extractedData.columnMapping.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[180px]" title={m.original_column}>
                            "{m.original_column}"
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-foreground">
                            {MAPPED_TO_LABELS[m.mapped_to] || m.mapped_to}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {extractedData.extractedUnits && extractedData.extractedUnits.length > 0 && (
                  <div className="mt-2">
                    <Label className="mb-2 block">Erkannte Einheiten: {extractedData.extractedUnits.length}</Label>
                    <div className="max-h-32 overflow-y-auto border rounded-lg p-2 text-sm">
                      {extractedData.extractedUnits.slice(0, 5).map((unit, i) => (
                        <div key={i} className="flex justify-between py-1 border-b last:border-0">
                          <span>{unit.unitNumber} - {unit.type}</span>
                          <span>{unit.area} m² / {unit.price.toLocaleString('de-DE')} €</span>
                        </div>
                      ))}
                      {extractedData.extractedUnits.length > 5 && (
                        <div className="text-muted-foreground pt-1">
                          ...und {extractedData.extractedUnits.length - 5} weitere Einheiten
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'creating':
        return (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <Building2 className="h-12 w-12 text-primary animate-pulse" />
              <div className="text-center">
                <p className="font-medium">Projekt wird erstellt...</p>
                <p className="text-sm text-muted-foreground">
                  {extractedData?.projectName}
                </p>
              </div>
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </div>
        );

      default: // 'idle'
        return (
          <div className="space-y-4 py-4">
            {/* Context Selection */}
            <div className="space-y-2">
              <Label>Verkäufer-Gesellschaft</Label>
              <Select
                value={selectedContextId || defaultContext?.id || ''}
                onValueChange={setSelectedContextId}
                disabled={loadingContexts}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Gesellschaft wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {contexts.map((ctx) => (
                    <SelectItem key={ctx.id} value={ctx.id}>
                      {ctx.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Expose Upload */}
            <div className="space-y-2">
              <Label>Exposé (PDF)</Label>
              <div
                {...getExposeRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  isExposeDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                  exposeFile && "border-primary bg-primary/5"
                )}
              >
                <input {...getExposeInputProps()} />
                {exposeFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="font-medium">{exposeFile.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({Math.round(exposeFile.size / 1024)} KB)
                      </span>
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
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <p>PDF hier ablegen oder klicken</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pricelist Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Preisliste (XLSX/CSV/PDF)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    downloadPreislistenVorlage();
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Muster-Vorlage
                </Button>
              </div>
              <div
                {...getPricelistRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  isPricelistDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                  pricelistFile && "border-primary bg-primary/5"
                )}
              >
                <input {...getPricelistInputProps()} />
                {pricelistFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Table2 className="h-5 w-5 text-primary" />
                      <span className="font-medium">{pricelistFile.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({Math.round(pricelistFile.size / 1024)} KB)
                      </span>
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
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <p>XLSX, CSV oder PDF hier ablegen oder klicken</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Workflow:</strong> 1. Dateien hochladen → 2. Vorschau prüfen → 3. KI-Analyse starten → 4. Daten prüfen → 5. Projekt erstellen
                </p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  const renderActions = () => {
    const isProcessing = phase === 'uploading' || phase === 'analyzing' || phase === 'creating';

    switch (phase) {
      case 'uploaded':
        return (
          <>
            <Button variant="outline" onClick={resetForm}>
              Zurück
            </Button>
            <Button onClick={handleStartAnalysis} className="gap-2">
              <Sparkles className="h-4 w-4" />
              KI-Analyse starten
            </Button>
          </>
        );

      case 'review':
        return (
          <>
            <Button variant="outline" onClick={resetForm}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateProject} className="gap-2">
              <Building2 className="h-4 w-4" />
              Projekt anlegen
            </Button>
          </>
        );

      case 'idle':
        return (
          <>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleUploadFiles} 
              disabled={!exposeFile && !pricelistFile}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Dateien hochladen
            </Button>
          </>
        );

      default:
        return (
          <Button variant="outline" disabled={isProcessing}>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Bitte warten...
          </Button>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          KI-Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Schnell-Import mit KI
          </DialogTitle>
          <DialogDescription>
            {phase === 'idle' && 'Laden Sie Exposé und/oder Preisliste hoch.'}
            {phase === 'uploading' && 'Dateien werden in den Speicher übertragen...'}
            {phase === 'uploaded' && 'Dateien hochgeladen — prüfen Sie die Vorschau.'}
            {phase === 'analyzing' && 'KI extrahiert Projektdaten und Einheiten...'}
            {phase === 'review' && 'Überprüfen und korrigieren Sie die extrahierten Daten.'}
            {phase === 'creating' && 'Projekt wird mit den bestätigten Daten erstellt...'}
          </DialogDescription>
        </DialogHeader>

        {renderPhaseContent()}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {renderActions()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
