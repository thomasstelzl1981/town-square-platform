import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, FileText, User, Briefcase, 
  Building2, CheckCircle2, AlertCircle, Clock 
} from 'lucide-react';
import { SmartDropZone } from '@/components/shared/SmartDropZone';
import { AIProcessingOverlay } from '@/components/shared/AIProcessingOverlay';
import { FileUploader } from '@/components/shared/FileUploader';
import { toast } from 'sonner';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';
import type { UploadedFileInfo } from '@/hooks/useUniversalUpload';
import { UploadResultList } from '@/components/shared/UploadResultCard';

interface DocumentUploadSectionProps {
  requestId: string;
  storageFolderId: string | null;
  readOnly?: boolean;
}

interface DocumentCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  required: boolean;
  hint: string;
  files: { name: string; uploaded: boolean }[];
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: 'identity',
    label: 'Identität',
    icon: <User className="h-4 w-4" />,
    required: true,
    hint: 'Personalausweis oder Reisepass (Vorder- und Rückseite)',
    files: [
      { name: 'Personalausweis', uploaded: false },
      { name: 'Meldebescheinigung', uploaded: false },
    ],
  },
  {
    id: 'income',
    label: 'Einkommen',
    icon: <Briefcase className="h-4 w-4" />,
    required: true,
    hint: 'Gehaltsabrechnungen der letzten 3 Monate, Arbeitsvertrag',
    files: [
      { name: 'Gehaltsabrechnung 1', uploaded: false },
      { name: 'Gehaltsabrechnung 2', uploaded: false },
      { name: 'Gehaltsabrechnung 3', uploaded: false },
      { name: 'Arbeitsvertrag', uploaded: false },
    ],
  },
  {
    id: 'assets',
    label: 'Vermögen',
    icon: <FileText className="h-4 w-4" />,
    required: false,
    hint: 'Kontoauszüge, Depotauszüge, Bausparer',
    files: [
      { name: 'Kontoauszug', uploaded: false },
      { name: 'Depotauszug', uploaded: false },
    ],
  },
  {
    id: 'property',
    label: 'Objektunterlagen',
    icon: <Building2 className="h-4 w-4" />,
    required: true,
    hint: 'Exposé, Grundbuchauszug, Energieausweis',
    files: [
      { name: 'Exposé', uploaded: false },
      { name: 'Grundbuchauszug', uploaded: false },
      { name: 'Energieausweis', uploaded: false },
      { name: 'Grundrisse', uploaded: false },
    ],
  },
];

export function DocumentUploadSection({ requestId, storageFolderId, readOnly = false }: DocumentUploadSectionProps) {
  const [uploadingCategory, setUploadingCategory] = React.useState<string | null>(null);
  const [uploadedFilesByCategory, setUploadedFilesByCategory] = React.useState<Record<string, UploadedFileInfo[]>>({});
  const { upload: universalUpload } = useUniversalUpload();

  const handleUpload = async (categoryId: string, files: File[]) => {
    if (files.length === 0) return;
    
    setUploadingCategory(categoryId);
    
    try {
      for (const file of files) {
        const result = await universalUpload(file, {
          moduleCode: 'MOD_07',
          entityId: requestId,
          objectType: 'finance_request',
          objectId: requestId,
          parentNodeId: storageFolderId || undefined,
          docTypeHint: categoryId,
          triggerAI: false,
          parseMode: 'financing',
          source: 'document_checklist',
          onFileUploaded: (fileInfo) => {
            setUploadedFilesByCategory(prev => ({
              ...prev,
              [categoryId]: [...(prev[categoryId] || []), fileInfo],
            }));
          },
        });

        if (result.error) throw new Error(result.error);
      }
      
      toast.success(`${files.length} Datei(en) hochgeladen`);
    } catch (error) {
      toast.error('Upload fehlgeschlagen: ' + (error as Error).message);
    } finally {
      setUploadingCategory(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Dokumenten-Checkliste
          </CardTitle>
          <CardDescription>
            Laden Sie die erforderlichen Dokumente für Ihren Finanzierungsantrag hoch.
            Die Dokumente werden automatisch analysiert und die Selbstauskunft wird vorausgefüllt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Hochgeladen und verifiziert</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span>Wird analysiert</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span>Pflichtdokument fehlt</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Categories */}
      <div className="grid gap-4">
        {DOCUMENT_CATEGORIES.map((category) => {
          const categoryUploadedFiles = uploadedFilesByCategory[category.id] || [];
          const uploadedCount = categoryUploadedFiles.length;
          const totalCount = category.files.length;
          const isComplete = uploadedCount >= totalCount;
          const isUploading = uploadingCategory === category.id;

          return (
            <Card key={category.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {category.icon}
                    {category.label}
                    {category.required && (
                      <Badge variant="outline" className="text-xs">Pflicht</Badge>
                    )}
                  </CardTitle>
                  <Badge 
                    variant={isComplete ? 'default' : 'secondary'}
                    className={isComplete ? 'bg-green-500' : ''}
                  >
                    {uploadedCount}/{totalCount}
                  </Badge>
                </div>
                <CardDescription>{category.hint}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* File List */}
                <div className="grid gap-2 mb-4">
                  {category.files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      {file.uploaded ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Fehlt</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Upload Area */}
                {!readOnly && (
                  <>
                    <AIProcessingOverlay
                      active={isUploading}
                      steps={[
                        { label: 'Dokument wird hochgeladen' },
                        { label: 'KI erkennt Dokumenttyp' },
                        { label: 'Daten werden extrahiert' },
                      ]}
                      currentStep={isUploading ? 1 : 0}
                      headline={`${category.label} wird verarbeitet…`}
                      variant="primary"
                    />
                    {!isUploading && (
                      <SmartDropZone
                        onFiles={(files) => handleUpload(category.id, files)}
                        accept={{
                          'application/pdf': ['.pdf'],
                          'image/*': ['.jpg', '.jpeg', '.png'],
                        }}
                        formatsLabel="PDF, JPG, PNG"
                        variant="primary"
                      />
                    )}
                  </>
                )}
                {categoryUploadedFiles.length > 0 && (
                  <UploadResultList
                    files={categoryUploadedFiles}
                    status="uploaded"
                    compact
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
