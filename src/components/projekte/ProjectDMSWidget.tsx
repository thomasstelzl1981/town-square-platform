/**
 * ProjectDMSWidget — Always-open dual-section DMS with column layout.
 * Section 1: "Allgemein" (2 cols: folders + drop-zone)
 * Section 2: "Einheiten" (3 cols: units + subfolders + drop-zone)
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Folder, Upload, FolderPlus, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileDropZone } from '@/components/dms/FileDropZone';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DemoUnit } from './demoProjectData';

interface ProjectDMSWidgetProps {
  projectId?: string;
  projectName: string;
  units: DemoUnit[];
  isDemo?: boolean;
}

const PROJECT_FOLDERS = [
  '01_Exposé',
  '02_Preisliste',
  '03_Bilder & Marketing',
  '04_Kalkulation & Exports',
  '05_Reservierungen',
  '06_Verträge',
  '99_Sonstiges',
];

const UNIT_FOLDERS = [
  '01_Grundriss',
  '02_Bilder',
  '03_Verkaufsunterlagen',
  '04_Verträge & Reservierung',
  '99_Sonstiges',
];

interface FolderListProps {
  items: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  renderLabel?: (item: string) => string;
}

function FolderList({ items, selectedId, onSelect, renderLabel }: FolderListProps) {
  return (
    <div className="flex flex-col gap-0.5 p-1.5">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          className={cn(
            'flex items-center gap-2 w-full text-left py-1.5 px-2.5 rounded-md text-sm transition-colors',
            selectedId === item
              ? 'bg-primary/10 text-primary font-medium'
              : 'hover:bg-muted/60 text-foreground',
          )}
        >
          {selectedId === item ? (
            <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <span className="truncate">{renderLabel ? renderLabel(item) : item}</span>
        </button>
      ))}
    </div>
  );
}

interface DropColumnProps {
  label: string;
  onDrop: (files: File[]) => void;
  disabled?: boolean;
  files?: { id: string; file_name: string; mime_type: string | null }[];
}

function DropColumn({ label, onDrop, disabled, files }: DropColumnProps) {
  if (disabled) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-4">
        <div className="flex flex-col items-center gap-1.5 opacity-50">
          <Upload className="h-5 w-5" />
          <span className="text-center">Dateien in<br /><strong>{label}</strong><br />ablegen</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-full">
      {files && files.length > 0 ? (
        <div className="p-3 space-y-1.5">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2 py-1.5 px-2.5 rounded-md bg-muted/30 text-sm">
              <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">{f.file_name}</span>
              {f.mime_type && (
                <Badge variant="outline" className="text-[9px] ml-auto shrink-0">
                  {f.mime_type.split('/').pop()?.toUpperCase()}
                </Badge>
              )}
            </div>
          ))}
        </div>
      ) : (
        <FileDropZone onDrop={onDrop} className="flex-1 min-h-full">
          <div className="flex items-center justify-center h-full min-h-[120px] text-xs text-muted-foreground p-4">
            <div className="flex flex-col items-center gap-1.5">
              <Upload className="h-5 w-5" />
              <span className="text-center">Dateien in<br /><strong>{label}</strong><br />ablegen</span>
            </div>
          </div>
        </FileDropZone>
      )}
    </div>
  );
}

export function ProjectDMSWidget({ projectId, projectName, units, isDemo }: ProjectDMSWidgetProps) {
  const [selectedGeneralFolder, setSelectedGeneralFolder] = useState<string | null>(PROJECT_FOLDERS[0]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(units[0]?.id ?? null);
  const [selectedUnitFolder, setSelectedUnitFolder] = useState<string | null>(UNIT_FOLDERS[0]);

  // BUG 3 FIX: Query real files from storage_nodes using entity_id
  const { data: storageFiles } = useQuery({
    queryKey: ['project-dms-files', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('storage_nodes')
        .select('id, name, node_type, storage_path, mime_type, parent_id, entity_id')
        .eq('entity_id', projectId)
        .eq('node_type', 'file');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId && !isDemo,
  });

  const fileCount = storageFiles?.length ?? 0;

  // Map files to folders by name pattern
  const getFilesForFolder = (folderName: string) => {
    if (!storageFiles || storageFiles.length === 0) return [];
    const folderPrefix = folderName.split('_')[0]; // e.g. "01", "02"
    return storageFiles.filter((f) => {
      const name = f.name?.toLowerCase() ?? '';
      if (folderPrefix === '01' && (name.includes('expos') || name.includes('exposé'))) return true;
      if (folderPrefix === '02' && (name.includes('preis') || name.includes('price'))) return true;
      return false;
    }).map((f) => ({ id: f.id, file_name: f.name ?? 'Datei', mime_type: f.mime_type }));
  };

  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  const handleGeneralDrop = (files: File[]) => {
    if (import.meta.env.DEV) {
      console.log('Drop to Allgemein/', selectedGeneralFolder, files);
    }
  };

  const handleUnitDrop = (files: File[]) => {
    if (import.meta.env.DEV) {
      console.log('Drop to Einheit/', selectedUnitId, selectedUnitFolder, files);
    }
  };

  const unitIds = units.map((u) => u.id);
  const unitLabelMap = Object.fromEntries(units.map((u) => [u.id, `${u.unit_number} — ${u.public_id}`]));

  const folderCount = PROJECT_FOLDERS.length + UNIT_FOLDERS.length;

  return (
    <Card className={cn('overflow-hidden', isDemo && 'opacity-60 select-none')}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Projektdokumente</span>
          {isDemo && (
            <Badge variant="outline" className="text-[10px] italic text-muted-foreground ml-2">Musterdaten</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" disabled={isDemo}>
            <FolderPlus className="h-3.5 w-3.5" />
            Neuer Ordner
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" disabled={isDemo}>
            <Upload className="h-3.5 w-3.5" />
            Hochladen
          </Button>
        </div>
      </div>

      <CardContent className="p-0">
        {/* === ALLGEMEIN === */}
        <div className="px-4 pt-3 pb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Allgemein</span>
        </div>
        <div className="flex divide-x divide-border border-b">
          <div className="w-[220px] shrink-0 overflow-y-auto max-h-[260px]">
            <FolderList
              items={PROJECT_FOLDERS}
              selectedId={selectedGeneralFolder}
              onSelect={setSelectedGeneralFolder}
            />
          </div>
          <div className={cn('flex-1', isDemo && 'pointer-events-none')}>
            <DropColumn
              label={selectedGeneralFolder ?? 'Ordner wählen'}
              onDrop={handleGeneralDrop}
              disabled={isDemo}
              files={selectedGeneralFolder ? getFilesForFolder(selectedGeneralFolder) : []}
            />
          </div>
        </div>

        {/* === EINHEITEN === */}
        <div className="px-4 pt-3 pb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Einheiten ({units.length})
          </span>
        </div>
        <div className="flex divide-x divide-border border-b">
          <div className="w-[220px] shrink-0 overflow-y-auto max-h-[300px]">
            <FolderList
              items={unitIds}
              selectedId={selectedUnitId}
              onSelect={(id) => {
                setSelectedUnitId(id);
                setSelectedUnitFolder(UNIT_FOLDERS[0]);
              }}
              renderLabel={(id) => unitLabelMap[id] ?? id}
            />
          </div>
          <div className="w-[200px] shrink-0 overflow-y-auto max-h-[300px]">
            <FolderList
              items={UNIT_FOLDERS}
              selectedId={selectedUnitFolder}
              onSelect={setSelectedUnitFolder}
            />
          </div>
          <div className={cn('flex-1', isDemo && 'pointer-events-none')}>
            <DropColumn
              label={`${selectedUnit ? `${selectedUnit.unit_number}` : '…'} / ${selectedUnitFolder ?? '…'}`}
              onDrop={handleUnitDrop}
              disabled={isDemo}
            />
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/10 text-xs text-muted-foreground">
          <span>{folderCount} Ordner · {fileCount} Dateien</span>
          <span className="text-[11px]">{projectName}</span>
        </div>
      </CardContent>
    </Card>
  );
}
