/**
 * IntakeUploadZone — Context-aware upload dropzone for the Magic Intake Center.
 * Supports multi-file upload (up to 10 files) with per-file status tracking.
 */

import { useCallback, useState } from 'react';
import { Upload, FileCheck, Loader2, AlertCircle, File, CheckCircle2, XCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDocumentIntake } from '@/hooks/useDocumentIntake';
import { getParserProfile } from '@/config/parserManifest';
import type { IntakeSelection } from './IntakeEntityPicker';

interface FileStatus {
  file: File;
  status: 'queued' | 'uploading' | 'parsing' | 'done' | 'error';
  error?: string;
}

interface IntakeUploadZoneProps {
  selection: IntakeSelection | null;
  onUploadComplete?: () => void;
}

export function IntakeUploadZone({ selection, onUploadComplete }: IntakeUploadZoneProps) {
  const {
    intake,
    confirmImport,
    resetIntake,
    intakeProgress,
    pendingRecords,
  } = useDocumentIntake();
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(-1);

  const profile = selection ? getParserProfile(selection.parseMode) : null;

  const processFiles = useCallback(
    async (files: File[]) => {
      if (!selection || files.length === 0) return;

      const statuses: FileStatus[] = files.map((f) => ({ file: f, status: 'queued' as const }));
      setFileStatuses(statuses);

      for (let i = 0; i < files.length; i++) {
        setActiveFileIndex(i);
        setFileStatuses((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'uploading' } : s)),
        );

        try {
          await intake(files[i], {
            parseMode: selection.parseMode,
            entityId: selection.entityId || undefined,
            moduleCode: profile?.moduleCode,
          });

          setFileStatuses((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: 'done' } : s)),
          );
        } catch (err) {
          setFileStatuses((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, status: 'error', error: (err as Error).message } : s,
            ),
          );
        }
      }

      setActiveFileIndex(-1);
      onUploadComplete?.();
    },
    [selection, intake, profile, onUploadComplete],
  );

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!selection || accepted.length === 0) return;

      // For single file, use original preview flow
      if (accepted.length === 1) {
        setFileStatuses([{ file: accepted[0], status: 'uploading' }]);
        await intake(accepted[0], {
          parseMode: selection.parseMode,
          entityId: selection.entityId || undefined,
          moduleCode: profile?.moduleCode,
        });
        return;
      }

      // For multi-file, use batch processing
      await processFiles(accepted);
    },
    [selection, intake, profile, processFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: !selection,
    maxFiles: 10,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const handleConfirm = async () => {
    if (!selection) return;
    await confirmImport(selection.parseMode, pendingRecords, selection.entityId || undefined);
    onUploadComplete?.();
  };

  const handleReset = () => {
    resetIntake();
    setFileStatuses([]);
    setActiveFileIndex(-1);
  };

  if (!selection) {
    return (
      <Card className="border-dashed opacity-50">
        <CardContent className="p-8 flex flex-col items-center text-center gap-2 text-muted-foreground">
          <Upload className="h-8 w-8" />
          <p className="text-sm">Bitte zuerst Kategorie und Objekt wählen</p>
        </CardContent>
      </Card>
    );
  }

  // Show single-file pipeline progress (original flow)
  if (intakeProgress.step !== 'idle' && fileStatuses.length <= 1) {
    const uploadedFileName = fileStatuses[0]?.file.name ?? 'Dokument';
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{uploadedFileName}</span>
              <span className="text-muted-foreground">{intakeProgress.message}</span>
            </div>
            <Progress value={intakeProgress.progress} className="h-2" />
          </div>

          {intakeProgress.step === 'error' && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{intakeProgress.error}</span>
              <Button variant="outline" size="sm" onClick={handleReset}>Erneut versuchen</Button>
            </div>
          )}

          {intakeProgress.step === 'preview' && pendingRecords.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Erkannte Daten:</p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                {profile?.fields.map((field) => {
                  const value = pendingRecords[0]?.[field.key];
                  if (value === undefined || value === null) return null;
                  return (
                    <div key={field.key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{field.label}</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConfirm} size="sm">
                  <FileCheck className="h-4 w-4 mr-1.5" />
                  {selection.entityId ? 'Daten aktualisieren' : 'Objekt anlegen'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Abbrechen
                </Button>
              </div>
            </div>
          )}

          {intakeProgress.step === 'parsing' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>KI analysiert Dokument…</span>
            </div>
          )}

          {intakeProgress.step === 'done' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-primary">
                <FileCheck className="h-4 w-4" />
                <span>{intakeProgress.message}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Weiteres Dokument
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show multi-file batch status
  if (fileStatuses.length > 1) {
    const doneCount = fileStatuses.filter((s) => s.status === 'done').length;
    const errorCount = fileStatuses.filter((s) => s.status === 'error').length;
    const totalPercent = Math.round((doneCount / fileStatuses.length) * 100);

    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Batch-Upload ({fileStatuses.length} Dateien)</span>
              <span className="text-muted-foreground">
                {doneCount}/{fileStatuses.length} fertig
                {errorCount > 0 && ` · ${errorCount} Fehler`}
              </span>
            </div>
            <Progress value={totalPercent} className="h-2" />
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {fileStatuses.map((fs, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs py-1">
                {fs.status === 'done' && <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                {fs.status === 'error' && <XCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
                {(fs.status === 'uploading' || fs.status === 'parsing') && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary flex-shrink-0" />
                )}
                {fs.status === 'queued' && <File className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />}
                <span className={cn(
                  'truncate',
                  fs.status === 'done' && 'text-foreground',
                  fs.status === 'error' && 'text-destructive',
                  fs.status === 'queued' && 'text-muted-foreground',
                )}>
                  {fs.file.name}
                </span>
                {fs.error && <span className="text-destructive ml-auto flex-shrink-0">{fs.error}</span>}
              </div>
            ))}
          </div>

          {activeFileIndex === -1 && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              Weiteres Upload
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Dropzone state
  return (
    <Card
      {...getRootProps()}
      className={cn(
        'border-dashed cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5',
        isDragActive && 'border-primary bg-primary/10',
      )}
    >
      <input {...getInputProps()} />
      <CardContent className="p-8 flex flex-col items-center text-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">
            Dokumente für {selection.categoryLabel}
            {selection.isNewEntity ? ' (neues Objekt)' : ''} hochladen
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, Bilder, Word oder Excel — bis 20 MB · bis zu 10 Dateien
          </p>
        </div>
        {profile && profile.exampleDocuments.length > 0 && (
          <p className="text-xs text-muted-foreground">
            z.B. {profile.exampleDocuments.slice(0, 3).join(', ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
