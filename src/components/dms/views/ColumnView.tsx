import { useMemo, useState, useCallback, useRef } from 'react';
import { Folder, ChevronRight, Download, Eye, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { getModuleDisplayName } from '@/config/storageManifest';
import { getFileIcon } from '@/components/dms/storageHelpers';
import { FileRowMenu } from '@/components/dms/FileRowMenu';
import { useIsMobile } from '@/hooks/use-mobile';
import type { FileManagerItem } from './ListView';

interface ColumnViewProps {
  allNodes: { id: string; parent_id: string | null; name: string; template_id: string | null; module_code: string | null; created_at: string }[];
  documents: { id: string; name: string; mime_type: string; size_bytes: number; created_at: string; public_id: string; file_path: string }[];
  documentLinks: { document_id: string; node_id: string | null }[];
  columnPath: string[];
  onNavigateColumn: (nodeId: string, depth: number) => void;
  onSelectFile: (item: FileManagerItem) => void;
  onDownload?: (documentId: string) => void;
  onDelete?: (item: FileManagerItem) => void;
  onNewSubfolder?: (parentNodeId: string) => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
}

function getDisplayName(node: { name: string; module_code: string | null; template_id: string | null }) {
  return node.module_code && node.template_id?.endsWith('_ROOT')
    ? getModuleDisplayName(node.module_code)
    : node.name;
}

type ColumnItem = { id: string; name: string; type: 'folder' | 'file'; mimeType?: string; nodeId?: string; documentId?: string; createdAt?: string; filePath?: string };

interface ColumnProps {
  items: ColumnItem[];
  selectedId?: string;
  selectedFileId?: string;
  onSelect: (item: ColumnItem) => void;
  onDoubleClickFile?: (item: ColumnItem) => void;
  onDownload?: (documentId: string) => void;
  onDelete?: (item: FileManagerItem) => void;
  onNewSubfolder?: (parentNodeId: string) => void;
  onNavigateFolder?: (nodeId: string) => void;
  onPreview?: (item: FileManagerItem) => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
}

function Column({ items, selectedId, selectedFileId, onSelect, onDoubleClickFile, onDownload, onDelete, onNewSubfolder, onNavigateFolder, onPreview, isDownloading, isDeleting }: ColumnProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn(DESIGN.STORAGE.COLUMN_WIDTH, DESIGN.STORAGE.COLUMN_BORDER, 'h-full flex flex-col')}>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {items.map(item => {
            const isFolderSelected = selectedId === item.id;
            const isFileSelected = item.type === 'file' && selectedFileId === item.id;
            const isHighlighted = isFolderSelected || isFileSelected;
            const Icon = item.type === 'folder' ? Folder : getFileIcon(item.mimeType);

            const toFileManagerItem = (): FileManagerItem => ({
              id: item.id,
              name: item.name,
              type: item.type,
              mimeType: item.mimeType,
              createdAt: item.createdAt || '',
              documentId: item.documentId,
              filePath: item.filePath,
              nodeId: item.nodeId,
            });

            return (
              <div
                key={item.id}
                className={cn(
                  'w-full flex items-center gap-2 text-sm transition-colors text-left group/row cursor-pointer',
                  DESIGN.STORAGE.ROW_PADDING,
                  DESIGN.STORAGE.ROW_BORDER,
                  isHighlighted
                    ? 'bg-primary/10 text-foreground ring-1 ring-inset ring-primary/30'
                    : 'hover:bg-muted/30',
                )}
                onClick={() => onSelect(item)}
                onDoubleClick={item.type === 'file' ? () => onDoubleClickFile?.(item) : undefined}
              >
                <Icon className={cn('h-5 w-5 shrink-0', isHighlighted ? 'text-primary' : 'text-muted-foreground')} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex-1 truncate">{item.name}</span>
                  </TooltipTrigger>
                  {item.name.length > 28 && (
                    <TooltipContent side="top" className="max-w-xs break-all text-xs">
                      {item.name}
                    </TooltipContent>
                  )}
                </Tooltip>
                {item.type === 'folder' && !isHighlighted && (
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                )}

                {/* Inline quick actions for files — always visible */}
                {item.type === 'file' && (
                  <div className="shrink-0 flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                    {item.documentId && onDownload && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onDownload(item.documentId!)}
                        disabled={isDownloading}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {onPreview && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onPreview(toFileManagerItem())}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => onDelete(toFileManagerItem())}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}

                {/* Folder context menu */}
                {item.type === 'folder' && (
                  <div className="shrink-0" onClick={e => e.stopPropagation()}>
                    <FileRowMenu
                      type="folder"
                      onOpen={item.nodeId ? () => onNavigateFolder?.(item.nodeId!) : undefined}
                      onNewSubfolder={item.nodeId ? () => onNewSubfolder?.(item.nodeId!) : undefined}
                      onDelete={onDelete ? () => onDelete(toFileManagerItem()) : undefined}
                      isDeleting={isDeleting}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-4 text-center">Leer</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function ColumnView({ allNodes, documents, documentLinks, columnPath, onNavigateColumn, onSelectFile, onDownload, onDelete, onNewSubfolder, isDownloading, isDeleting }: ColumnViewProps) {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const buildFileManagerItem = useCallback((item: ColumnItem): FileManagerItem => {
    const doc = documents.find(d => d.id === item.id);
    return {
      id: item.id,
      name: item.name,
      type: 'file',
      mimeType: item.mimeType ?? doc?.mime_type,
      createdAt: item.createdAt ?? doc?.created_at ?? '',
      documentId: item.documentId ?? item.id,
      filePath: item.filePath ?? doc?.file_path,
    };
  }, [documents]);

  const handleDoubleClickFile = useCallback((item: ColumnItem) => {
    if (item.documentId && onDownload) {
      onDownload(item.documentId);
    }
  }, [onDownload]);

  const handleSelect = useCallback((item: ColumnItem, depth: number) => {
    if (item.type === 'folder' && item.nodeId) {
      onNavigateColumn(item.nodeId, depth);
      setSelectedFileId(null);
    } else {
      setSelectedFileId(item.id);
      onSelectFile(buildFileManagerItem(item));
    }
  }, [onNavigateColumn, onSelectFile, buildFileManagerItem]);

  const columns = useMemo(() => {
    const result: { parentId: string | null; selectedId?: string; items: ColumnItem[] }[] = [];

    const rootFolders = allNodes
      .filter(n => !n.parent_id)
      .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
    result.push({
      parentId: null,
      selectedId: columnPath[0],
      items: rootFolders.map(n => ({
        id: n.id,
        name: getDisplayName(n),
        type: 'folder' as const,
        nodeId: n.id,
        createdAt: n.created_at,
      })),
    });

    columnPath.forEach((nodeId, depth) => {
      const childFolders = allNodes
        .filter(n => n.parent_id === nodeId)
        .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
      const nodeDocLinks = documentLinks.filter(l => l.node_id === nodeId);
      const nodeDocs = nodeDocLinks
        .map(l => documents.find(d => d.id === l.document_id))
        .filter(Boolean)
        .map(d => ({ id: d!.id, name: d!.name, type: 'file' as const, mimeType: d!.mime_type, documentId: d!.id, createdAt: d!.created_at, filePath: d!.file_path }));

      const items: ColumnItem[] = [
        ...childFolders.map(n => ({
          id: n.id,
          name: getDisplayName(n),
          type: 'folder' as const,
          nodeId: n.id,
          createdAt: n.created_at,
        })),
        ...nodeDocs.sort((a, b) => a.name.localeCompare(b.name)),
      ];

      result.push({
        parentId: nodeId,
        selectedId: columnPath[depth + 1],
        items,
      });
    });

    return result;
  }, [allNodes, documents, documentLinks, columnPath]);

  return (
    <div className="flex h-full overflow-x-auto">
      {columns.map((col, depth) => (
        <Column
          key={col.parentId ?? 'root'}
          items={col.items}
          selectedId={col.selectedId}
          selectedFileId={selectedFileId ?? undefined}
          onDownload={onDownload}
          onDelete={onDelete}
          onNewSubfolder={onNewSubfolder}
          onNavigateFolder={(nodeId) => onNavigateColumn(nodeId, depth)}
          onPreview={onSelectFile}
          isDownloading={isDownloading}
          isDeleting={isDeleting}
          onDoubleClickFile={handleDoubleClickFile}
          onSelect={(item) => handleSelect(item, depth)}
        />
      ))}
    </div>
  );
}
