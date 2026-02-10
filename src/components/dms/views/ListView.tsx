import { Folder, File, FileText, Image, FileSpreadsheet, ChevronUp, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { FileRowMenu } from '@/components/dms/FileRowMenu';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SortField, SortDir } from '@/components/dms/StorageToolbar';

export interface FileManagerItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  mimeType?: string;
  createdAt: string;
  nodeId?: string;
  childCount?: number;
  moduleCode?: string;
  templateId?: string;
  documentId?: string;
  filePath?: string;
  publicId?: string;
}

interface ListViewProps {
  items: FileManagerItem[];
  selectedIds: Set<string>;
  sortField: SortField;
  sortDir: SortDir;
  onSortChange: (field: SortField, dir: SortDir) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onNavigateFolder: (nodeId: string) => void;
  onDownload: (documentId: string) => void;
  onPreview: (item: FileManagerItem) => void;
  onDelete: (item: FileManagerItem) => void;
  onNewSubfolder: (parentNodeId: string) => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
}

function getFileIcon(mime?: string) {
  if (!mime) return File;
  if (mime.startsWith('image/')) return Image;
  if (mime.includes('pdf')) return FileText;
  if (mime.includes('sheet') || mime.includes('excel')) return FileSpreadsheet;
  return File;
}

function formatFileSize(bytes?: number) {
  if (!bytes || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatType(mime?: string) {
  if (!mime) return '—';
  return mime;
}

function formatShortType(mime?: string) {
  if (!mime) return '';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.startsWith('image/')) return mime.split('/')[1]?.toUpperCase() || 'Bild';
  if (mime.includes('sheet') || mime.includes('excel')) return 'Excel';
  if (mime.includes('word') || mime.includes('document')) return 'Word';
  return mime.split('/')[1]?.toUpperCase() || '';
}

interface SortHeaderProps {
  label: string;
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
  onClick: (field: SortField, dir: SortDir) => void;
  className?: string;
}

function SortHeader({ label, field, currentField, currentDir, onClick, className }: SortHeaderProps) {
  const isActive = currentField === field;
  return (
    <button
      className={cn(
        'flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors',
        className,
      )}
      onClick={() => onClick(field, isActive && currentDir === 'asc' ? 'desc' : 'asc')}
    >
      {label}
      {isActive && (currentDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
    </button>
  );
}

export function ListView({
  items,
  selectedIds,
  sortField,
  sortDir,
  onSortChange,
  onToggleSelect,
  onToggleSelectAll,
  onNavigateFolder,
  onDownload,
  onPreview,
  onDelete,
  onNewSubfolder,
  isDownloading,
  isDeleting,
}: ListViewProps) {
  const isMobile = useIsMobile();
  const allSelected = items.length > 0 && selectedIds.size === items.length;

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
              <File className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">Dieser Ordner ist leer</p>
              <p className="text-xs mt-1">Dateien hochladen über den + Button</p>
            </div>
          ) : (
            items.map(item => {
              const IconComponent = item.type === 'folder' ? Folder : getFileIcon(item.mimeType);
              const meta = item.type === 'file'
                ? [formatFileSize(item.size), formatShortType(item.mimeType), formatDate(item.createdAt)].filter(Boolean).join(' · ')
                : item.childCount !== undefined ? `${item.childCount} Elemente` : '';

              return (
                <div
                  key={item.id}
                  className="group/row flex items-center gap-3 px-4 py-3 border-b border-border/50 active:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (item.type === 'folder' && item.nodeId) {
                      onNavigateFolder(item.nodeId);
                    } else {
                      onPreview(item);
                    }
                  }}
                >
                  <IconComponent className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.name}</p>
                    {meta && <p className="text-xs text-muted-foreground mt-0.5 truncate">{meta}</p>}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <FileRowMenu
                      type={item.type}
                      onOpen={item.type === 'folder' && item.nodeId ? () => onNavigateFolder(item.nodeId!) : undefined}
                      onNewSubfolder={item.type === 'folder' && item.nodeId ? () => onNewSubfolder(item.nodeId!) : undefined}
                      onDownload={item.type === 'file' && item.documentId ? () => onDownload(item.documentId!) : undefined}
                      onPreview={item.type === 'file' ? () => onPreview(item) : undefined}
                      onDelete={() => onDelete(item)}
                      isDownloading={isDownloading}
                      isDeleting={isDeleting}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_100px_140px_120px_40px] items-center px-4 py-2 bg-muted/30 border-b gap-2">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onToggleSelectAll}
          className="justify-self-center"
        />
        <SortHeader label="Name" field="name" currentField={sortField} currentDir={sortDir} onClick={onSortChange} />
        <SortHeader label="Größe" field="size" currentField={sortField} currentDir={sortDir} onClick={onSortChange} />
        <SortHeader label="Typ" field="type" currentField={sortField} currentDir={sortDir} onClick={onSortChange} />
        <SortHeader label="Erstellt am" field="created_at" currentField={sortField} currentDir={sortDir} onClick={onSortChange} />
        <span />
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
            <File className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Dieser Ordner ist leer</p>
            <p className="text-xs mt-1">Dateien hierher ziehen oder hochladen</p>
          </div>
        ) : (
          items.map(item => {
            const isSelected = selectedIds.has(item.id);
            const IconComponent = item.type === 'folder' ? Folder : getFileIcon(item.mimeType);

            return (
              <div
                key={item.id}
                className={cn(
                  'group/row grid grid-cols-[40px_1fr_100px_140px_120px_40px] items-center px-4 py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer gap-2',
                  isSelected && 'bg-primary/5',
                )}
                onClick={() => {
                  if (item.type === 'folder' && item.nodeId) {
                    onNavigateFolder(item.nodeId);
                  } else {
                    onPreview(item);
                  }
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="justify-self-center"
                />
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm truncate">{item.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{formatFileSize(item.size)}</span>
                <span className="text-sm text-muted-foreground truncate">{formatType(item.mimeType)}</span>
                <span className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</span>
                <FileRowMenu
                  type={item.type}
                  onOpen={item.type === 'folder' && item.nodeId ? () => onNavigateFolder(item.nodeId!) : undefined}
                  onNewSubfolder={item.type === 'folder' && item.nodeId ? () => onNewSubfolder(item.nodeId!) : undefined}
                  onDownload={item.type === 'file' && item.documentId ? () => onDownload(item.documentId!) : undefined}
                  onPreview={item.type === 'file' ? () => onPreview(item) : undefined}
                  onDelete={() => onDelete(item)}
                  isDownloading={isDownloading}
                  isDeleting={isDeleting}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
