/**
 * MOD-07: Finance Upload Zone
 * Drag & drop upload area with smart document handling
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, 
  X, Loader2, Sparkles 
} from 'lucide-react';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';
import { UploadResultList } from '@/components/shared/UploadResultCard';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FinanceUploadZoneProps {
  profileId?: string | null;
  requestId?: string | null;
  selectedDocType?: string | null;
  onComplete?: () => void;
}

// Common document types for quick selection
const QUICK_DOC_TYPES = [
  { value: 'DOC_PAYSLIP', label: 'Gehaltsabrechnung' },
  { value: 'DOC_TAX_ASSESSMENT', label: 'Steuerbescheid' },
  { value: 'DOC_ID_CARD', label: 'Personalausweis' },
  { value: 'DOC_BANK_STATEMENT', label: 'Kontoauszug' },
  { value: 'DOC_EXPOSE', label: 'Exposé' },
  { value: 'DOC_LAND_REGISTER', label: 'Grundbuchauszug' },
  { value: 'DOC_FLOOR_PLAN', label: 'Grundriss' },
  { value: 'DOC_ENERGY_CERT', label: 'Energieausweis' },
];

export function FinanceUploadZone({
  profileId,
  requestId,
  selectedDocType,
  onComplete,
}: FinanceUploadZoneProps) {
  const { activeTenantId } = useAuth();
  const { upload, progress, reset, uploadedFiles, clearUploadedFiles } = useUniversalUpload();
  const [manualDocType, setManualDocType] = useState<string>(selectedDocType || '');
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);

  // Determine target based on doc type
  const getTargetInfo = useCallback((docType: string) => {
    const isRequestDoc = docType.startsWith('DOC_EXPOSE') || 
                         docType.startsWith('DOC_LAND') ||
                         docType.startsWith('DOC_PURCHASE') ||
                         docType.startsWith('DOC_FLOOR') ||
                         docType.startsWith('DOC_SECTION') ||
                         docType.startsWith('DOC_BUILDING_DESC') ||
                         docType.startsWith('DOC_ENERGY') ||
                         docType.startsWith('DOC_SITE') ||
                         docType.startsWith('DOC_PHOTOS') ||
                         docType.startsWith('DOC_PARTITION') ||
                         docType.startsWith('DOC_COST');

    if (isRequestDoc && requestId) {
      return { objectType: 'finance_request' as const, objectId: requestId };
    }
    if (profileId) {
      return { objectType: 'applicant_profile' as const, objectId: profileId };
    }
    return null;
  }, [profileId, requestId]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!activeTenantId) {
      toast.error('Kein aktiver Tenant');
      return;
    }

    const docType = manualDocType || selectedDocType;
    if (!docType) {
      // Queue files and ask for doc type
      setUploadQueue(acceptedFiles);
      toast.info('Bitte wählen Sie den Dokumententyp aus');
      return;
    }

    const target = getTargetInfo(docType);
    if (!target) {
      toast.error('Kein Ziel für Upload verfügbar');
      return;
    }

    // Upload files via useUniversalUpload
    for (const file of acceptedFiles) {
      await upload(file, {
        moduleCode: 'MOD_07',
        objectType: target.objectType,
        objectId: target.objectId,
        docTypeHint: docType,
        triggerAI: false,
        parseMode: 'financing',
        source: 'finance_upload',
      });
    }

    setUploadQueue([]);
    setManualDocType('');
    onComplete?.();
  }, [activeTenantId, manualDocType, selectedDocType, getTargetInfo, upload, onComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const handleDocTypeSelect = async (docType: string) => {
    setManualDocType(docType);
    
    // If files are queued, upload them now
    if (uploadQueue.length > 0) {
      const target = getTargetInfo(docType);
      if (!target) {
        toast.error('Kein Ziel für Upload verfügbar');
        return;
      }

      for (const file of uploadQueue) {
        await upload(file, {
          moduleCode: 'MOD_07',
          objectType: target.objectType,
          objectId: target.objectId,
          docTypeHint: docType,
          triggerAI: false,
          parseMode: 'financing',
          source: 'finance_upload',
        });
      }

      setUploadQueue([]);
      setManualDocType('');
      onComplete?.();
    }
  };

  const isUploading = progress.status === 'uploading' || progress.status === 'linking';
  const showDocTypeSelector = uploadQueue.length > 0 && !manualDocType;
  const uploadStatus = progress.status === 'analyzing' ? 'analyzing' : progress.status === 'done' ? 'done' : 'uploaded';

  return (
    <Card className="border-dashed border-2 border-border/50 bg-muted/20">
      <CardContent className="pt-6">
        {/* Doc Type Selector (when files are queued) */}
        {showDocTypeSelector && (
          <div className="mb-4 p-4 bg-amber-500/10 rounded-lg border border-amber-200/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-sm">
                {uploadQueue.length} Datei(en) bereit zum Hochladen
              </span>
            </div>
            <Select value={manualDocType} onValueChange={handleDocTypeSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Dokumententyp auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {QUICK_DOC_TYPES.map(dt => (
                  <SelectItem key={dt.value} value={dt.value}>
                    {dt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="mb-4 p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">{progress.message}</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
          </div>
        )}

        {/* Upload Complete */}
        {progress.status === 'done' && (
          <div className="mb-4 p-4 bg-green-500/10 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">Upload erfolgreich!</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={reset}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Upload Error */}
        {progress.status === 'error' && (
          <div className="mb-4 p-4 bg-destructive/10 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{progress.error}</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={reset}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            flex flex-col items-center justify-center py-8 px-4 rounded-lg
            border-2 border-dashed transition-colors cursor-pointer
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className={`h-8 w-8 mb-3 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="text-sm font-medium text-center">
            {isDragActive 
              ? 'Dateien hier ablegen...' 
              : 'Dokumente hier ablegen oder klicken'
            }
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, PNG, JPG bis 10 MB
          </p>
          {selectedDocType && (
            <Badge variant="outline" className="mt-3">
              Zieltyp: {QUICK_DOC_TYPES.find(d => d.value === selectedDocType)?.label || selectedDocType}
            </Badge>
          )}
        </div>

        {/* Uploaded Files List */}
        <UploadResultList
          files={uploadedFiles}
          status={uploadStatus}
          onClear={clearUploadedFiles}
          compact
        />

        {/* Quick Doc Type Buttons */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {QUICK_DOC_TYPES.slice(0, 4).map(dt => (
            <Button
              key={dt.value}
              variant={manualDocType === dt.value ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => setManualDocType(dt.value)}
            >
              {dt.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default FinanceUploadZone;
