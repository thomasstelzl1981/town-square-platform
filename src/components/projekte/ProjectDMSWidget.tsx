/**
 * ProjectDMSWidget — Miller-Column DMS for MOD-13 Projekte
 * 3-column navigation with drag-and-drop per folder.
 * Demo mode shows placeholder structure at reduced opacity.
 */
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Folder, ChevronRight, Upload, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileDropZone } from '@/components/dms/FileDropZone';
import type { DemoUnit } from './demoProjectData';

interface ProjectDMSWidgetProps {
  projectName: string;
  units: DemoUnit[];
  isDemo?: boolean;
}

// Standard project-level folders
const PROJECT_FOLDERS = [
  '01_Exposé',
  '02_Preisliste',
  '03_Bilder & Marketing',
  '04_Kalkulation & Exports',
  '05_Reservierungen',
  '06_Verträge',
  '99_Sonstiges',
];

// Standard unit-level folders
const UNIT_FOLDERS = [
  '01_Grundriss',
  '02_Bilder',
  '03_Verkaufsunterlagen',
  '04_Verträge & Reservierung',
  '99_Sonstiges',
];

interface ColumnItem {
  id: string;
  label: string;
  hasChildren: boolean;
  count?: number;
}

interface ColumnProps {
  items: ColumnItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isDropTarget?: boolean;
  onDrop?: (files: File[]) => void;
  isDemo?: boolean;
}

function Column({ items, selectedId, onSelect, isDropTarget, onDrop, isDemo }: ColumnProps) {
  const content = (
    <div className="flex flex-col gap-0.5 p-1.5 min-h-[280px]">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cn(
            'flex items-center gap-2.5 w-full text-left py-2 px-3 rounded-md text-sm transition-colors group',
            selectedId === item.id
              ? 'bg-primary/10 text-primary font-medium'
              : 'hover:bg-muted/60 text-foreground',
          )}
        >
          {selectedId === item.id ? (
            <FolderOpen className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="truncate flex-1">{item.label}</span>
          {item.count !== undefined && (
            <span className="text-[11px] text-muted-foreground">{item.count}</span>
          )}
          {item.hasChildren && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </button>
      ))}

      {/* Drop zone hint when this is the active target column */}
      {isDropTarget && items.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg p-6 m-2">
          <div className="flex flex-col items-center gap-1.5">
            <Upload className="h-5 w-5" />
            <span>Dateien hier ablegen</span>
          </div>
        </div>
      )}
    </div>
  );

  if (isDropTarget && onDrop && !isDemo) {
    return (
      <FileDropZone onDrop={onDrop} className="flex-1 min-w-[200px] overflow-y-auto">
        {content}
      </FileDropZone>
    );
  }

  return (
    <div className="flex-1 min-w-[200px] overflow-y-auto">
      {content}
    </div>
  );
}

export function ProjectDMSWidget({ projectName, units, isDemo }: ProjectDMSWidgetProps) {
  // columnPath tracks: [col1Selection, col2Selection]
  const [col1, setCol1] = useState<string | null>(null);
  const [col2, setCol2] = useState<string | null>(null);

  // === Build column data ===

  // Column 1: Root items
  const col1Items = useMemo<ColumnItem[]>(() => [
    { id: 'allgemein', label: 'Allgemein', hasChildren: true, count: PROJECT_FOLDERS.length },
    { id: 'einheiten', label: `Einheiten (${units.length})`, hasChildren: true, count: units.length },
  ], [units.length]);

  // Column 2: depends on col1 selection
  const col2Items = useMemo<ColumnItem[]>(() => {
    if (col1 === 'allgemein') {
      return PROJECT_FOLDERS.map((f) => ({
        id: `pf-${f}`,
        label: f,
        hasChildren: false,
      }));
    }
    if (col1 === 'einheiten') {
      return units.map((u) => ({
        id: `unit-${u.id}`,
        label: `${u.unit_number} — ${u.public_id}`,
        hasChildren: true,
        count: UNIT_FOLDERS.length,
      }));
    }
    return [];
  }, [col1, units]);

  // Column 3: depends on col2 selection
  const col3Items = useMemo<ColumnItem[]>(() => {
    if (!col2) return [];
    // If col2 is a unit, show unit folders
    if (col2.startsWith('unit-')) {
      return UNIT_FOLDERS.map((f) => ({
        id: `uf-${col2}-${f}`,
        label: f,
        hasChildren: false,
      }));
    }
    // If col2 is a project folder, it's a leaf — no col3
    return [];
  }, [col2]);

  // Determine which column is the drop target (the deepest active one)
  const activeDropColumn = col3Items.length > 0 ? 3 : col2Items.length > 0 ? 2 : 1;

  const handleDrop = (files: File[]) => {
    // TODO: implement actual upload to project-documents bucket with target node
    const targetId = col2 || col1 || 'root';
    console.log('Drop files to folder:', targetId, files);
  };

  const handleCol1Select = (id: string) => {
    setCol1(id);
    setCol2(null);
  };

  const handleCol2Select = (id: string) => {
    setCol2(id);
  };

  // Count info for status bar
  const folderCount = col2Items.length + col3Items.length;

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
        <div className={cn('flex divide-x divide-border min-h-[300px]', isDemo && 'pointer-events-none')}>
          {/* Column 1: Root */}
          <Column
            items={col1Items}
            selectedId={col1}
            onSelect={handleCol1Select}
            isDropTarget={activeDropColumn === 1}
            onDrop={handleDrop}
            isDemo={isDemo}
          />

          {/* Column 2: Subfolder or Units */}
          {col2Items.length > 0 && (
            <Column
              items={col2Items}
              selectedId={col2}
              onSelect={handleCol2Select}
              isDropTarget={activeDropColumn === 2}
              onDrop={handleDrop}
              isDemo={isDemo}
            />
          )}

          {/* Column 3: Unit subfolders */}
          {col3Items.length > 0 && (
            <Column
              items={col3Items}
              selectedId={null}
              onSelect={() => {}}
              isDropTarget={activeDropColumn === 3}
              onDrop={handleDrop}
              isDemo={isDemo}
            />
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/10 text-xs text-muted-foreground">
          <span>{folderCount} Ordner · 0 Dateien</span>
          {col1 && <span className="text-[11px]">{col1 === 'allgemein' ? 'Allgemein' : 'Einheiten'}{col2 ? ` › …` : ''}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
