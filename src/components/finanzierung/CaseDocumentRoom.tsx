/**
 * CaseDocumentRoom — Compact document room with folder structure, drag-and-drop upload, and progress.
 */
import * as React from 'react';
import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileDropZone } from '@/components/dms/FileDropZone';
import {
  ChevronRight, ChevronDown, Folder, FolderOpen,
  User, Building, Upload, FileText, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DocFolder {
  id: string;
  name: string;
  required: number;
  section: 'bonität' | 'objekt';
}

const CASE_FOLDERS: DocFolder[] = [
  { id: 'identity', name: '01_Identität', required: 2, section: 'bonität' },
  { id: 'income', name: '02_Einkommen', required: 3, section: 'bonität' },
  { id: 'assets', name: '03_Vermögen', required: 1, section: 'bonität' },
  { id: 'liabilities', name: '04_Verpflichtungen', required: 1, section: 'bonität' },
  { id: 'expose', name: '05_Exposé', required: 1, section: 'objekt' },
  { id: 'legal', name: '06_Rechtliches', required: 1, section: 'objekt' },
  { id: 'plans', name: '07_Pläne', required: 1, section: 'objekt' },
  { id: 'photos', name: '08_Fotos', required: 1, section: 'objekt' },
];

interface UploadedDoc {
  folderId: string;
  fileName: string;
}

interface Props {
  requestId: string;
  publicId: string;
}

export default function CaseDocumentRoom({ requestId, publicId }: Props) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['bonität', 'objekt']));

  const totalRequired = CASE_FOLDERS.reduce((s, f) => s + f.required, 0);
  const uploadedCount = new Set(uploadedDocs.map(d => d.folderId)).size;
  const foldersWithDocs = (folderId: string) => uploadedDocs.filter(d => d.folderId === folderId).length;
  const progressPercent = Math.round((uploadedCount / CASE_FOLDERS.length) * 100);

  const toggleSection = (s: string) => {
    const next = new Set(expandedSections);
    next.has(s) ? next.delete(s) : next.add(s);
    setExpandedSections(next);
  };

  const handleDrop = useCallback((files: File[]) => {
    const targetFolder = selectedFolder || CASE_FOLDERS[0].id;
    const newDocs = files.map(f => ({ folderId: targetFolder, fileName: f.name }));
    setUploadedDocs(prev => [...prev, ...newDocs]);
    toast.success(`${files.length} Datei(en) hinzugefügt`);
    // TODO: actual upload to tenant-documents bucket + document_links
  }, [selectedFolder]);

  const bonitaetFolders = CASE_FOLDERS.filter(f => f.section === 'bonität');
  const objektFolders = CASE_FOLDERS.filter(f => f.section === 'objekt');

  const renderFolder = (folder: DocFolder) => {
    const count = foldersWithDocs(folder.id);
    const isSelected = selectedFolder === folder.id;
    const isFilled = count >= folder.required;

    return (
      <button
        key={folder.id}
        onClick={() => setSelectedFolder(isSelected ? null : folder.id)}
        className={cn(
          "flex items-center gap-2 w-full py-1 px-2 rounded-md transition-colors text-xs",
          isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
        )}
      >
        {isSelected ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="flex-1 text-left truncate">{folder.name}</span>
        <span className={cn("text-[10px] font-mono", isFilled ? "text-emerald-600" : "text-muted-foreground")}>
          {isFilled ? <Check className="h-3 w-3 inline" /> : `${count}/${folder.required}`}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Folder tree */}
      <div className="flex-1 overflow-y-auto space-y-2 text-xs">
        {/* Bonitätsunterlagen */}
        <div>
          <button
            onClick={() => toggleSection('bonität')}
            className="flex items-center gap-1.5 w-full py-1 px-1 rounded hover:bg-muted/50 text-xs font-medium"
          >
            {expandedSections.has('bonität') ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <User className="h-3.5 w-3.5 text-primary" />
            Bonitätsunterlagen
          </button>
          {expandedSections.has('bonität') && (
            <div className="ml-5 space-y-0.5">{bonitaetFolders.map(renderFolder)}</div>
          )}
        </div>

        {/* Objektunterlagen */}
        <div>
          <button
            onClick={() => toggleSection('objekt')}
            className="flex items-center gap-1.5 w-full py-1 px-1 rounded hover:bg-muted/50 text-xs font-medium"
          >
            {expandedSections.has('objekt') ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Building className="h-3.5 w-3.5 text-primary" />
            Objektunterlagen
          </button>
          {expandedSections.has('objekt') && (
            <div className="ml-5 space-y-0.5">{objektFolders.map(renderFolder)}</div>
          )}
        </div>

        {/* Upload files in selected folder */}
        {selectedFolder && (
          <div className="mt-2 ml-1 space-y-1">
            {uploadedDocs.filter(d => d.folderId === selectedFolder).map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-2">
                <FileText className="h-3 w-3" />
                <span className="truncate">{d.fileName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drop zone */}
      <FileDropZone onDrop={handleDrop} className="mt-2">
        <div className="border-2 border-dashed border-border/50 rounded-lg p-3 text-center hover:border-primary/30 transition-colors cursor-pointer">
          <Upload className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-[10px] text-muted-foreground">
            {selectedFolder
              ? `Dateien in "${CASE_FOLDERS.find(f => f.id === selectedFolder)?.name}" ablegen`
              : 'Ordner auswählen, dann Dateien ablegen'}
          </p>
        </div>
      </FileDropZone>

      {/* Progress */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Fortschritt</span>
          <span className="font-medium">{uploadedCount}/{CASE_FOLDERS.length} Ordner ({progressPercent}%)</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
    </div>
  );
}
