/**
 * IntakeUploadZone — Context-aware upload dropzone for the Magic Intake Center.
 * 
 * Activated only after entity selection. Shows allowed document types
 * and progress of the intake pipeline.
 */

import { useCallback, useState } from 'react';
import { Upload, FileCheck, Loader2, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDocumentIntake } from '@/hooks/useDocumentIntake';
import { getParserProfile } from '@/config/parserManifest';
import type { IntakeSelection } from './IntakeEntityPicker';
import type { ExtractedRecord } from '@/types/parser-engine';

interface IntakeUploadZoneProps {
  selection: IntakeSelection | null;
}

export function IntakeUploadZone({ selection }: IntakeUploadZoneProps) {
  const {
    intake,
    confirmImport,
    resetIntake,
    intakeProgress,
    pendingRecords,
    setPendingRecords,
    parserResponse,
  } = useDocumentIntake();
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const profile = selection ? getParserProfile(selection.parseMode) : null;

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!selection || accepted.length === 0) return;
      const file = accepted[0];
      setUploadedFileName(file.name);

      await intake(file, {
        parseMode: selection.parseMode,
        entityId: selection.entityId || undefined,
        moduleCode: profile?.moduleCode,
      });
    },
    [selection, intake, profile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: !selection,
    maxFiles: 1,
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
  };

  const handleReset = () => {
    resetIntake();
    setUploadedFileName(null);
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

  // Show pipeline progress
  if (intakeProgress.step !== 'idle') {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{uploadedFileName}</span>
              <span className="text-muted-foreground">{intakeProgress.message}</span>
            </div>
            <Progress value={intakeProgress.progress} className="h-2" />
          </div>

          {/* Error state */}
          {intakeProgress.step === 'error' && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{intakeProgress.error}</span>
              <Button variant="outline" size="sm" onClick={handleReset}>Erneut versuchen</Button>
            </div>
          )}

          {/* Preview state */}
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

          {/* Parsing state */}
          {intakeProgress.step === 'parsing' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>KI analysiert Dokument…</span>
            </div>
          )}

          {/* Done state */}
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
            Dokument für {selection.categoryLabel}
            {selection.isNewEntity ? ' (neues Objekt)' : ''} hochladen
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, Bilder, Word oder Excel — bis 20 MB
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
