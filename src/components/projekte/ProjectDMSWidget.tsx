/**
 * ProjectDMSWidget — StorageFileManager-style DMS for MOD-13 Projekte
 * Modern toolbar + list view with drag-and-drop support.
 * Demo mode shows placeholder structure at reduced opacity.
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Folder, ChevronRight, ChevronDown, Upload, FolderPlus, MoreHorizontal } from 'lucide-react';
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

interface FolderRowProps {
  name: string;
  level: number;
  hasChildren?: boolean;
  childCount?: number;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

function FolderRow({ name, level, hasChildren, childCount, defaultOpen = false, children }: FolderRowProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        className={cn(
          'flex items-center gap-3 w-full text-left py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group text-sm',
        )}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren ? (
          open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <span className="w-4 shrink-0" />
        )}
        {open ? (
          <FolderOpen className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <span className="truncate font-medium">{name}</span>
        {childCount !== undefined && (
          <span className="text-xs text-muted-foreground ml-auto mr-2">
            {childCount} {childCount === 1 ? 'Ordner' : 'Ordner'}
          </span>
        )}
        <MoreHorizontal className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>
      {open && children}
    </div>
  );
}

export function ProjectDMSWidget({ projectName, units, isDemo }: ProjectDMSWidgetProps) {
  const handleDrop = (files: File[]) => {
    // TODO: implement actual upload to project-documents bucket
    console.log('Drop files:', files);
  };

  const folderTree = (
    <div className="divide-y divide-border/30">
      {/* Root: Project */}
      <FolderRow name={projectName} level={0} hasChildren defaultOpen childCount={2}>
        {/* General project folders */}
        <FolderRow name="Allgemein" level={1} hasChildren defaultOpen childCount={PROJECT_FOLDERS.length}>
          {PROJECT_FOLDERS.map((f) => (
            <FolderRow key={f} name={f} level={2} />
          ))}
        </FolderRow>

        {/* Unit folders */}
        <FolderRow name={`Einheiten (${units.length})`} level={1} hasChildren childCount={units.length}>
          {units.map((u) => (
            <FolderRow key={u.id} name={`${u.unit_number} — ${u.public_id}`} level={2} hasChildren childCount={UNIT_FOLDERS.length}>
              {UNIT_FOLDERS.map((f) => (
                <FolderRow key={f} name={f} level={3} />
              ))}
            </FolderRow>
          ))}
        </FolderRow>
      </FolderRow>
    </div>
  );

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
        {isDemo ? (
          <div className="pointer-events-none">
            {folderTree}
            <div className="px-4 py-4 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground border border-dashed rounded-lg p-4 justify-center">
                <Upload className="h-4 w-4" />
                Dateien per Drag & Drop in einen Ordner ziehen
              </div>
            </div>
          </div>
        ) : (
          <FileDropZone onDrop={handleDrop}>
            <div className="min-h-[200px]">
              {folderTree}
              <div className="px-4 py-4 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground border border-dashed rounded-lg p-4 justify-center">
                  <Upload className="h-4 w-4" />
                  Dateien per Drag & Drop in einen Ordner ziehen
                </div>
              </div>
            </div>
          </FileDropZone>
        )}
      </CardContent>
    </Card>
  );
}
