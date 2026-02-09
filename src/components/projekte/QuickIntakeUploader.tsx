/**
 * Quick Intake Uploader - Upload Exposé + Preisliste for AI-powered project creation
 * MOD-13 PROJEKTE - Phase E
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Table2, Sparkles, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperContexts } from '@/hooks/useDeveloperContexts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface QuickIntakeUploaderProps {
  onSuccess?: (projectId: string) => void;
}

interface UploadedFile {
  file: File;
  type: 'expose' | 'pricelist';
}

export function QuickIntakeUploader({ onSuccess }: QuickIntakeUploaderProps) {
  const [open, setOpen] = useState(false);
  const [exposeFile, setExposeFile] = useState<File | null>(null);
  const [pricelistFile, setPricelistFile] = useState<File | null>(null);
  const [selectedContextId, setSelectedContextId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { contexts, defaultContext, isLoading: loadingContexts } = useDeveloperContexts();

  // Expose dropzone
  const onDropExpose = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setExposeFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps: getExposeRootProps, getInputProps: getExposeInputProps, isDragActive: isExposeDragActive } = useDropzone({
    onDrop: onDropExpose,
    accept: {
      'application/pdf': ['.pdf'],
    },
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

  const handleStartIntake = async () => {
    if (!exposeFile && !pricelistFile) {
      setError('Bitte laden Sie mindestens eine Datei hoch.');
      return;
    }

    const contextId = selectedContextId || defaultContext?.id;
    if (!contextId) {
      setError('Bitte wählen Sie eine Verkäufer-Gesellschaft aus.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Prepare form data for edge function
      const formData = new FormData();
      if (exposeFile) {
        formData.append('expose', exposeFile);
      }
      if (pricelistFile) {
        formData.append('pricelist', pricelistFile);
      }
      formData.append('contextId', contextId);

      // Call edge function
      const { data, error: fnError } = await supabase.functions.invoke('sot-project-intake', {
        body: formData,
      });

      if (fnError) throw fnError;

      if (data?.projectId) {
        toast.success('Projekt-Import gestartet', {
          description: 'Die KI analysiert Ihre Dokumente. Sie werden zur Überprüfung weitergeleitet.',
        });
        setOpen(false);
        resetForm();
        onSuccess?.(data.projectId);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Intake error:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Starten des Imports');
      toast.error('Fehler beim Import', {
        description: err instanceof Error ? err.message : 'Unbekannter Fehler',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setExposeFile(null);
    setPricelistFile(null);
    setSelectedContextId('');
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
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
            Laden Sie Exposé und/oder Preisliste hoch. Die KI extrahiert Projektdaten und Einheiten automatisch.
          </DialogDescription>
        </DialogHeader>

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
            <Label>Preisliste (XLSX/CSV/PDF)</Label>
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

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                <strong>So funktioniert's:</strong> Die KI analysiert Ihre Dokumente und extrahiert Projektname, 
                Standort, Einheiten und Preise. Sie können alle Daten vor dem Import überprüfen und korrigieren.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isProcessing}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleStartIntake} 
            disabled={isProcessing || (!exposeFile && !pricelistFile)}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verarbeite...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                KI-Aufbereitung starten
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
