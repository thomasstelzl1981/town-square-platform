/**
 * ProjectDMSWidget — DMS folder tree for MOD-13 Projekte
 * Shows project-level and unit-level document folders.
 * In demo mode: static placeholder tree (no uploads).
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Folder, ChevronRight, ChevronDown, FileText, Upload } from 'lucide-react';
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

interface TreeNodeProps {
  label: string;
  level: number;
  hasChildren?: boolean;
  defaultOpen?: boolean;
  children?: React.ReactNode;
  icon?: 'folder' | 'file';
}

function TreeNode({ label, level, hasChildren, defaultOpen = false, children, icon = 'folder' }: TreeNodeProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        className={cn(
          'flex items-center gap-1.5 w-full text-left py-1 px-2 rounded hover:bg-muted/50 transition-colors text-xs',
          level === 0 && 'font-semibold text-sm',
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren ? (
          open ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {icon === 'folder' ? (
          open ? <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" /> : <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="truncate">{label}</span>
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

  const content = (
    <div className="space-y-0.5">
      {/* Project root */}
      <TreeNode label={projectName} level={0} hasChildren defaultOpen>
        {/* General project folders */}
        <TreeNode label="Allgemein" level={1} hasChildren defaultOpen>
          {PROJECT_FOLDERS.map((f) => (
            <TreeNode key={f} label={f} level={2} />
          ))}
        </TreeNode>

        {/* Unit folders */}
        <TreeNode label={`Einheiten (${units.length})`} level={1} hasChildren>
          {units.map((u) => (
            <TreeNode key={u.id} label={`${u.unit_number} — ${u.public_id}`} level={2} hasChildren>
              {UNIT_FOLDERS.map((f) => (
                <TreeNode key={f} label={f} level={3} />
              ))}
            </TreeNode>
          ))}
        </TreeNode>
      </TreeNode>
    </div>
  );

  return (
    <Card className={cn('', isDemo && 'opacity-40 select-none pointer-events-none')}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Projektdokumente
          {isDemo && <span className="text-xs font-normal text-muted-foreground italic ml-2">Musterdaten</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isDemo ? (
          content
        ) : (
          <FileDropZone onDrop={handleDrop}>
            <div className="min-h-[120px]">
              {content}
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground border border-dashed rounded-lg p-3 justify-center">
                <Upload className="h-3.5 w-3.5" />
                Dateien per Drag & Drop in einen Ordner ziehen
              </div>
            </div>
          </FileDropZone>
        )}
      </CardContent>
    </Card>
  );
}
