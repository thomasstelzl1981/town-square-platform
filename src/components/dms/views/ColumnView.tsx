import { useMemo } from 'react';
import { Folder, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getModuleDisplayName } from '@/config/storageManifest';
import { getFileIcon } from '@/components/dms/storageHelpers';
import { FileRowMenu } from '@/components/dms/FileRowMenu';
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
  onSelect: (item: ColumnItem) => void;
  onDownload?: (documentId: string) => void;
  onDelete?: (item: FileManagerItem) => void;
  onNewSubfolder?: (parentNodeId: string) => void;
  onNavigateFolder?: (nodeId: string) => void;
  onPreview?: (item: FileManagerItem) => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
}

function Column({ items, selectedId, onSelect, onDownload, onDelete, onNewSubfolder, onNavigateFolder, onPreview, isDownloading, isDeleting }: ColumnProps) {
  return (
    <div className="w-[260px] min-w-[260px] border-r border-border/60 dark:border-border/50 h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="py-1">
          {items.map(item => {
            const isSelected = selectedId === item.id;
            const Icon = item.type === 'folder' ? Folder : getFileIcon(item.mimeType);
            return (
              <div
                key={item.id}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/30 transition-colors text-left group/row cursor-pointer border-b border-border/20 dark:border-border/30',
                  isSelected && 'bg-muted text-foreground',
                )}
                onClick={() => onSelect(item)}
              >
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{item.name}</span>
                {item.type === 'folder' && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground md:group-hover/row:hidden" />}
                <div className="shrink-0" onClick={e => e.stopPropagation()}>
                  <FileRowMenu
                    type={item.type}
                    onOpen={item.type === 'folder' && item.nodeId ? () => onNavigateFolder?.(item.nodeId!) : undefined}
                    onNewSubfolder={item.type === 'folder' && item.nodeId ? () => onNewSubfolder?.(item.nodeId!) : undefined}
                    onDownload={item.type === 'file' && item.documentId ? () => onDownload?.(item.documentId!) : undefined}
                    onPreview={item.type === 'file' ? () => onPreview?.({
                      id: item.id,
                      name: item.name,
                      type: 'file',
                      mimeType: item.mimeType,
                      createdAt: item.createdAt || '',
                      documentId: item.documentId,
                      filePath: item.filePath,
                    }) : undefined}
                    onDelete={onDelete ? () => onDelete({
                      id: item.id,
                      name: item.name,
                      type: item.type,
                      createdAt: item.createdAt || '',
                      nodeId: item.nodeId,
                      documentId: item.documentId,
                    }) : undefined}
                    isDownloading={isDownloading}
                    isDeleting={isDeleting}
                  />
                </div>
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
          onDownload={onDownload}
          onDelete={onDelete}
          onNewSubfolder={onNewSubfolder}
          onNavigateFolder={(nodeId) => onNavigateColumn(nodeId, depth)}
          onPreview={onSelectFile}
          isDownloading={isDownloading}
          isDeleting={isDeleting}
          onSelect={(item) => {
            if (item.type === 'folder' && item.nodeId) {
              onNavigateColumn(item.nodeId, depth);
            } else {
              const doc = documents.find(d => d.id === item.id);
              onSelectFile({
                id: item.id,
                name: item.name,
                type: 'file',
                mimeType: doc?.mime_type,
                createdAt: doc?.created_at || '',
                documentId: item.id,
                filePath: doc?.file_path,
              });
            }
          }}
        />
      ))}
    </div>
  );
}
