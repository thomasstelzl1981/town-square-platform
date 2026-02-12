/**
 * CaseDocumentRoom — Compact document room with KWG-compliant folder structure,
 * drag-and-drop upload, and progress. ~24 folders organized by section,
 * conditionally displayed based on employment type.
 */
import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { FileDropZone } from '@/components/dms/FileDropZone';
import {
  ChevronRight, ChevronDown, Folder, FolderOpen,
  User, Building, Upload, FileText, Check, Briefcase,
  PiggyBank, Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface DocFolder {
  id: string;
  name: string;
  required: number;
  section: 'persoenlich' | 'einkommen_angestellt' | 'einkommen_selbststaendig' | 'vermoegen' | 'objekt';
  condition?: 'only_etw' | 'only_neubau';
}

export const CASE_FOLDERS: DocFolder[] = [
  // Sektion A: Persönliche Unterlagen (immer)
  { id: 'identity', name: '01_Personalausweis / Reisepass', required: 1, section: 'persoenlich' },
  { id: 'registration', name: '02_Meldebescheinigung', required: 1, section: 'persoenlich' },
  { id: 'family_status', name: '03_Familienstandsnachweis', required: 1, section: 'persoenlich' },
  { id: 'schufa', name: '04_SCHUFA / Selbstauskunft', required: 1, section: 'persoenlich' },

  // Sektion B: Einkommensunterlagen — Angestellte
  { id: 'payslips', name: '05_Gehaltsabrechnungen', required: 3, section: 'einkommen_angestellt' },
  { id: 'tax_certificate', name: '06_Lohnsteuerbescheinigung', required: 1, section: 'einkommen_angestellt' },
  { id: 'employment_contract', name: '07_Arbeitsvertrag', required: 1, section: 'einkommen_angestellt' },
  { id: 'income_tax_employed', name: '08_Einkommensteuerbescheide', required: 2, section: 'einkommen_angestellt' },

  // Sektion C: Einkommensunterlagen — Selbständige / GmbH-GF
  { id: 'balance_sheets', name: '09_Bilanzen / GuV', required: 3, section: 'einkommen_selbststaendig' },
  { id: 'bwa', name: '10_BWA (aktuelle)', required: 1, section: 'einkommen_selbststaendig' },
  { id: 'company_tax', name: '11_Steuerbescheide Firma', required: 2, section: 'einkommen_selbststaendig' },
  { id: 'company_contract', name: '12_Gesellschaftsvertrag / HR-Auszug', required: 1, section: 'einkommen_selbststaendig' },
  { id: 'income_tax_self', name: '13_Einkommensteuerbescheide privat', required: 2, section: 'einkommen_selbststaendig' },

  // Sektion D: Vermögen und Verbindlichkeiten
  { id: 'equity_proof', name: '14_Kontoauszüge / Eigenkapitalnachweis', required: 1, section: 'vermoegen' },
  { id: 'existing_loans', name: '15_Bestehende Darlehen', required: 1, section: 'vermoegen' },
  { id: 'insurance', name: '16_Versicherungen', required: 1, section: 'vermoegen' },

  // Sektion E: Objektunterlagen
  { id: 'expose_contract', name: '17_Exposé / Kaufvertragsentwurf', required: 1, section: 'objekt' },
  { id: 'land_register', name: '18_Grundbuchauszug', required: 1, section: 'objekt' },
  { id: 'floor_plans', name: '19_Grundrisse / Bauzeichnungen', required: 1, section: 'objekt' },
  { id: 'area_calc', name: '20_Flächenberechnung', required: 1, section: 'objekt' },
  { id: 'building_desc', name: '21_Baubeschreibung', required: 1, section: 'objekt', condition: 'only_neubau' },
  { id: 'photos', name: '22_Fotos', required: 1, section: 'objekt' },
  { id: 'division_declaration', name: '23_Teilungserklärung', required: 1, section: 'objekt', condition: 'only_etw' },
  { id: 'weg_protocols', name: '24_Nebenkostenabrechnung / WEG-Protokolle', required: 1, section: 'objekt', condition: 'only_etw' },
];

/** Section metadata for rendering */
export const FOLDER_SECTIONS = [
  { key: 'persoenlich', label: 'Persönliche Unterlagen', icon: User },
  { key: 'einkommen_angestellt', label: 'Einkommen — Angestellt', icon: Briefcase },
  { key: 'einkommen_selbststaendig', label: 'Einkommen — Selbständig / GmbH-GF', icon: Briefcase },
  { key: 'vermoegen', label: 'Vermögen & Verbindlichkeiten', icon: PiggyBank },
  { key: 'objekt', label: 'Objektunterlagen', icon: Home },
] as const;

/** Determine which sections to show based on employment type */
export function getVisibleSections(employmentType?: string): string[] {
  const always = ['persoenlich', 'vermoegen', 'objekt'];
  if (!employmentType) return [...always, 'einkommen_angestellt', 'einkommen_selbststaendig'];
  if (employmentType === 'angestellt') return [...always, 'einkommen_angestellt'];
  if (employmentType === 'selbststaendig') return [...always, 'einkommen_selbststaendig'];
  // gmbh_gf / geschaeftsfuehrer → both
  if (employmentType === 'gmbh_gf' || employmentType === 'geschaeftsfuehrer') {
    return [...always, 'einkommen_angestellt', 'einkommen_selbststaendig'];
  }
  return [...always, 'einkommen_angestellt', 'einkommen_selbststaendig'];
}

/** Filter folders for visibility */
export function getVisibleFolders(employmentType?: string): DocFolder[] {
  const sections = getVisibleSections(employmentType);
  return CASE_FOLDERS.filter(f => sections.includes(f.section));
}

interface UploadedDoc {
  folderId: string;
  fileName: string;
}

interface Props {
  requestId: string;
  publicId: string;
  employmentType?: string;
}

export default function CaseDocumentRoom({ requestId, publicId, employmentType }: Props) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(FOLDER_SECTIONS.map(s => s.key))
  );

  const visibleFolders = useMemo(() => getVisibleFolders(employmentType), [employmentType]);
  const foldersWithDocs = (folderId: string) => uploadedDocs.filter(d => d.folderId === folderId).length;

  const uploadedFolderCount = useMemo(() => {
    return visibleFolders.filter(f => foldersWithDocs(f.id) >= f.required).length;
  }, [visibleFolders, uploadedDocs]);

  const progressPercent = visibleFolders.length > 0
    ? Math.round((uploadedFolderCount / visibleFolders.length) * 100)
    : 0;

  const toggleSection = (s: string) => {
    const next = new Set(expandedSections);
    next.has(s) ? next.delete(s) : next.add(s);
    setExpandedSections(next);
  };

  const handleDrop = useCallback((files: File[]) => {
    const targetFolder = selectedFolder || visibleFolders[0]?.id;
    if (!targetFolder) return;
    const newDocs = files.map(f => ({ folderId: targetFolder, fileName: f.name }));
    setUploadedDocs(prev => [...prev, ...newDocs]);
    toast.success(`${files.length} Datei(en) hinzugefügt`);
  }, [selectedFolder, visibleFolders]);

  const visibleSections = getVisibleSections(employmentType);

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
        {FOLDER_SECTIONS.filter(s => visibleSections.includes(s.key)).map(section => {
          const Icon = section.icon;
          const sectionFolders = visibleFolders.filter(f => f.section === section.key);
          if (sectionFolders.length === 0) return null;
          return (
            <div key={section.key}>
              <button
                onClick={() => toggleSection(section.key)}
                className="flex items-center gap-1.5 w-full py-1 px-1 rounded hover:bg-muted/50 text-xs font-medium"
              >
                {expandedSections.has(section.key) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                <Icon className="h-3.5 w-3.5 text-primary" />
                {section.label}
              </button>
              {expandedSections.has(section.key) && (
                <div className="ml-5 space-y-0.5">{sectionFolders.map(renderFolder)}</div>
              )}
            </div>
          );
        })}

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
              ? `Dateien in "${visibleFolders.find(f => f.id === selectedFolder)?.name}" ablegen`
              : 'Ordner auswählen, dann Dateien ablegen'}
          </p>
        </div>
      </FileDropZone>

      {/* Progress */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Fortschritt</span>
          <span className="font-medium">{uploadedFolderCount}/{visibleFolders.length} Ordner ({progressPercent}%)</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
    </div>
  );
}
