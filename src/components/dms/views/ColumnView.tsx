import { useMemo } from 'react';
import { Folder, File, FileText, Image, FileSpreadsheet, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { FileManagerItem } from './ListView';

interface ColumnViewProps {
  allNodes: { id: string; parent_id: string | null; name: string; template_id: string | null; module_code: string | null; created_at: string }[];
  documents: { id: string; name: string; mime_type: string; size_bytes: number; created_at: string; public_id: string; file_path: string }[];
  documentLinks: { document_id: string; node_id: string | null }[];
  columnPath: string[];  // array of node IDs representing current column path
  onNavigateColumn: (nodeId: string, depth: number) => void;
  onSelectFile: (item: FileManagerItem) => void;
}

function getFileIcon(mime?: string) {
  if (!mime) return File;
  if (mime.startsWith('image/')) return Image;
  if (mime.includes('pdf')) return FileText;
  if (mime.includes('sheet') || mime.includes('excel')) return FileSpreadsheet;
  return File;
}

interface ColumnProps {
  items: { id: string; name: string; type: 'folder' | 'file'; mimeType?: string; nodeId?: string }[];
  selectedId?: string;
  onSelect: (item: { id: string; name: string; type: 'folder' | 'file'; nodeId?: string }) => void;
}

function Column({ items, selectedId, onSelect }: ColumnProps) {
  return (
    <div className="w-[220px] min-w-[220px] border-r h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="py-1">
          {items.map(item => {
            const isSelected = selectedId === item.id;
            const Icon = item.type === 'folder' ? Folder : getFileIcon(item.mimeType);
            return (
              <button
                key={item.id}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors text-left',
                  isSelected && 'bg-primary/10 text-primary',
                )}
                onClick={() => onSelect(item)}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{item.name}</span>
                {item.type === 'folder' && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
              </button>
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

export function ColumnView({ allNodes, documents, documentLinks, columnPath, onNavigateColumn, onSelectFile }: ColumnViewProps) {
  // Build columns: root + each level in columnPath
  const columns = useMemo(() => {
    const result: { parentId: string | null; selectedId?: string; items: { id: string; name: string; type: 'folder' | 'file'; mimeType?: string; nodeId?: string }[] }[] = [];

    // Root column
    const rootFolders = allNodes.filter(n => !n.parent_id).sort((a, b) => a.name.localeCompare(b.name));
    result.push({
      parentId: null,
      selectedId: columnPath[0],
      items: rootFolders.map(n => ({ id: n.id, name: n.name, type: 'folder' as const, nodeId: n.id })),
    });

    // Subsequent columns
    columnPath.forEach((nodeId, depth) => {
      const childFolders = allNodes.filter(n => n.parent_id === nodeId).sort((a, b) => a.name.localeCompare(b.name));
      const nodeDocLinks = documentLinks.filter(l => l.node_id === nodeId);
      const nodeDocs = nodeDocLinks
        .map(l => documents.find(d => d.id === l.document_id))
        .filter(Boolean)
        .map(d => ({ id: d!.id, name: d!.name, type: 'file' as const, mimeType: d!.mime_type }));

      const items = [
        ...childFolders.map(n => ({ id: n.id, name: n.name, type: 'folder' as const, nodeId: n.id })),
        ...nodeDocs,
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
