import { ChevronLeft, Upload, FolderPlus, List, Columns3, Eye, CheckSquare, Navigation, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

export type ViewMode = 'list' | 'columns' | 'preview' | 'multiselect' | 'navigator';
export type SortField = 'name' | 'size' | 'type' | 'created_at';
export type SortDir = 'asc' | 'desc';

interface BreadcrumbSegment {
  id: string | null;
  label: string;
}

interface StorageToolbarProps {
  breadcrumbSegments: BreadcrumbSegment[];
  viewMode: ViewMode;
  sortField: SortField;
  sortDir: SortDir;
  onNavigate: (nodeId: string | null) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSortChange: (field: SortField, dir: SortDir) => void;
  onUploadClick: () => void;
  onNewFolderClick: () => void;
  isUploading?: boolean;
}

const VIEW_OPTIONS: { mode: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { mode: 'list', label: 'Liste', icon: List },
  { mode: 'columns', label: 'Spalten', icon: Columns3 },
  { mode: 'preview', label: 'Vorschau', icon: Eye },
  { mode: 'multiselect', label: 'Auswahl', icon: CheckSquare },
  { mode: 'navigator', label: 'Pfad', icon: Navigation },
];

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'size', label: 'Größe' },
  { field: 'type', label: 'Typ' },
  { field: 'created_at', label: 'Erstellt am' },
];

const BTN = "h-8 gap-1.5 shrink-0 text-xs";

export function StorageToolbar({
  breadcrumbSegments,
  viewMode,
  sortField,
  sortDir,
  onNavigate,
  onViewModeChange,
  onSortChange,
  onUploadClick,
  onNewFolderClick,
  isUploading,
}: StorageToolbarProps) {
  const isMobile = useIsMobile();
  const currentViewOption = VIEW_OPTIONS.find(v => v.mode === viewMode);
  const CurrentViewIcon = currentViewOption?.icon || List;

  const canGoBack = breadcrumbSegments.length > 0;
  const currentFolderName = breadcrumbSegments.length > 0
    ? breadcrumbSegments[breadcrumbSegments.length - 1].label
    : 'Alle Dokumente';

  const handleSortSelect = (field: SortField) => {
    if (field === sortField) {
      onSortChange(sortField, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'asc');
    }
  };

  const handleGoBack = () => {
    const parent = breadcrumbSegments.length >= 2
      ? breadcrumbSegments[breadcrumbSegments.length - 2].id
      : null;
    onNavigate(parent);
  };

  if (isMobile) {
    return (
      <div className="px-3 py-2.5 border-b border-border/30 flex items-center gap-2">
        {canGoBack && (
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleGoBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <span className="text-sm font-medium truncate flex-1">{currentFolderName}</span>
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
      {/* Back button */}
      {canGoBack && (
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleGoBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm min-w-0 flex-1 overflow-hidden">
        <button
          onClick={() => onNavigate(null)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          Alle Dokumente
        </button>
        {breadcrumbSegments.map((seg, i) => (
          <span key={seg.id ?? i} className="flex items-center gap-1 min-w-0">
            <span className="text-muted-foreground/50 shrink-0">/</span>
            {i === breadcrumbSegments.length - 1 ? (
              <span className="font-medium text-foreground truncate">{seg.label}</span>
            ) : (
              <button
                onClick={() => onNavigate(seg.id)}
                className="text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                {seg.label}
              </button>
            )}
          </span>
        ))}
      </nav>

      {/* View switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={BTN}>
            <CurrentViewIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{currentViewOption?.label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {VIEW_OPTIONS.map(opt => (
            <DropdownMenuItem
              key={opt.mode}
              onClick={() => onViewModeChange(opt.mode)}
              className={viewMode === opt.mode ? 'bg-accent' : ''}
            >
              <opt.icon className="h-4 w-4 mr-2" />
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={BTN}>
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sortieren</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {SORT_OPTIONS.map(opt => (
            <DropdownMenuItem
              key={opt.field}
              onClick={() => handleSortSelect(opt.field)}
              className={sortField === opt.field ? 'bg-accent' : ''}
            >
              {sortField === opt.field ? (
                sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5 mr-2" /> : <ArrowDown className="h-3.5 w-3.5 mr-2" />
              ) : (
                <span className="w-3.5 mr-2" />
              )}
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Upload + New Folder combined */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={BTN} disabled={isUploading}>
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Hochladen</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onUploadClick} disabled={isUploading}>
            <Upload className="h-4 w-4 mr-2" />
            Datei hochladen
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onNewFolderClick}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Neuer Ordner
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
