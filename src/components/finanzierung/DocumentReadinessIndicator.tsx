/**
 * DocumentReadinessIndicator — Read-only traffic-light view of document folders.
 * Shows all required folders with red/yellow/green status based on uploaded doc count.
 * Reuses CASE_FOLDERS from CaseDocumentRoom.
 */
import { useMemo } from 'react';
import { User, Briefcase, PiggyBank, Home, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  CASE_FOLDERS, FOLDER_SECTIONS, getVisibleSections, getVisibleFolders,
  type DocFolder,
} from './CaseDocumentRoom';

export type FolderStatus = 'red' | 'yellow' | 'green';

export interface FolderDocCount {
  folderId: string;
  count: number;
}

interface Props {
  /** Number of uploaded docs per folder. Empty = all red (preview mode). */
  folderCounts?: FolderDocCount[];
  employmentType?: string;
  /** Compact mode for sidebar use */
  compact?: boolean;
  className?: string;
}

function getStatus(count: number, required: number): FolderStatus {
  if (count === 0) return 'red';
  if (count < required) return 'yellow';
  return 'green';
}

const statusDot: Record<FolderStatus, string> = {
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  green: 'bg-emerald-500',
};

const statusLabel: Record<FolderStatus, string> = {
  red: 'Fehlt',
  yellow: 'Unvollständig',
  green: 'Vollständig',
};

export default function DocumentReadinessIndicator({
  folderCounts = [],
  employmentType,
  compact = false,
  className,
}: Props) {
  const visibleFolders = useMemo(() => getVisibleFolders(employmentType), [employmentType]);
  const visibleSections = useMemo(() => getVisibleSections(employmentType), [employmentType]);

  const countMap = useMemo(() => {
    const m = new Map<string, number>();
    folderCounts.forEach(fc => m.set(fc.folderId, fc.count));
    return m;
  }, [folderCounts]);

  const completedCount = visibleFolders.filter(f => {
    const c = countMap.get(f.id) || 0;
    return c >= f.required;
  }).length;

  const progressPercent = visibleFolders.length > 0
    ? Math.round((completedCount / visibleFolders.length) * 100)
    : 0;

  return (
    <div className={cn('space-y-3', className)}>
      {FOLDER_SECTIONS.filter(s => visibleSections.includes(s.key)).map(section => {
        const Icon = section.icon;
        const sectionFolders = visibleFolders.filter(f => f.section === section.key);
        if (sectionFolders.length === 0) return null;

        return (
          <div key={section.key}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">{section.label}</span>
            </div>
            <div className="ml-5 space-y-0.5">
              {sectionFolders.map(folder => {
                const count = countMap.get(folder.id) || 0;
                const status = getStatus(count, folder.required);
                return (
                  <div
                    key={folder.id}
                    className="flex items-center gap-2 py-0.5 text-xs"
                  >
                    <span className={cn('h-2 w-2 rounded-full flex-shrink-0', statusDot[status])} />
                    <Folder className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 truncate text-muted-foreground">{folder.name}</span>
                    {!compact && (
                      <span className={cn(
                        'text-[10px] font-mono',
                        status === 'green' ? 'text-emerald-600' : status === 'yellow' ? 'text-yellow-600' : 'text-red-500'
                      )}>
                        {count}/{folder.required}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Progress bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Fortschritt</span>
          <span className="font-medium">{completedCount}/{visibleFolders.length} Ordner ({progressPercent}%)</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
    </div>
  );
}
