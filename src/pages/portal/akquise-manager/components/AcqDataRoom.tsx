/**
 * Acquisition Data Room
 * 
 * Tree view of files in acq-documents bucket for the current tenant.
 * Read-only overview — downloads go through edge functions per SBC v1.0.
 */

import * as React from 'react';
import { DESIGN } from '@/config/designManifest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FolderOpen, FileText, File, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface StorageFile {
  name: string;
  id?: string;
  metadata?: {
    size?: number;
    mimetype?: string;
  };
  created_at?: string;
}

interface FolderContent {
  folder: string;
  files: StorageFile[];
}

export function AcqDataRoom() {
  const { activeTenantId } = useAuth();

  const { data: folders, isLoading } = useQuery({
    queryKey: ['acq-dataroom', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];

      // List top-level folders under tenant
      const { data: topLevel, error } = await supabase.storage
        .from('acq-documents')
        .list(activeTenantId, { limit: 100 });

      if (error) throw error;

      const folderContents: FolderContent[] = [];

      // For each subfolder, list files
      for (const item of topLevel || []) {
        if (!item.id) {
          // It's a folder
          const { data: files } = await supabase.storage
            .from('acq-documents')
            .list(`${activeTenantId}/${item.name}`, { limit: 100 });

          folderContents.push({
            folder: item.name,
            files: (files || []).filter(f => f.id), // Only actual files
          });
        }
      }

      // Also check for root-level files
      const rootFiles = (topLevel || []).filter(f => f.id);
      if (rootFiles.length > 0) {
        folderContents.unshift({ folder: '/', files: rootFiles });
      }

      return folderContents;
    },
    enabled: !!activeTenantId,
  });

  const totalFiles = folders?.reduce((sum, f) => sum + f.files.length, 0) ?? 0;

  const getFileIcon = (name: string) => {
    if (/\.(pdf|doc|docx)$/i.test(name)) return <FileText className="h-3.5 w-3.5 text-primary" />;
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(name)) return <Image className="h-3.5 w-3.5 text-primary" />;
    return <File className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '–';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <Card className={DESIGN.CARD.BASE}>
      <CardHeader className={DESIGN.CARD.SECTION_HEADER}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${DESIGN.TYPOGRAPHY.CARD_TITLE} flex items-center gap-2`}>
            <FolderOpen className="h-4 w-4 text-primary" />
            Datenraum
          </CardTitle>
          <Badge variant="secondary" className="text-xs">{totalFiles} Dateien</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !folders || folders.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className={DESIGN.TYPOGRAPHY.MUTED}>Noch keine Dokumente im Datenraum</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {folders.map((folder) => (
              <div key={folder.folder}>
                {/* Folder Header */}
                <div className={`${DESIGN.STORAGE.ROW_PADDING} bg-muted/20 flex items-center gap-2`}>
                  <FolderOpen className="h-3.5 w-3.5 text-primary" />
                  <span className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>{folder.folder === '/' ? 'Root' : folder.folder}</span>
                  <Badge variant="outline" className="text-xs ml-auto">{folder.files.length}</Badge>
                </div>
                {/* Files */}
                {folder.files.map((file) => (
                  <div
                    key={file.name}
                    className={`${DESIGN.STORAGE.ROW_PADDING} flex items-center gap-3 ${DESIGN.STORAGE.ROW_BORDER} hover:bg-muted/10 transition-colors`}
                  >
                    {getFileIcon(file.name)}
                    <span className="text-sm flex-1 truncate">{file.name}</span>
                    <span className={DESIGN.TYPOGRAPHY.HINT}>{formatSize(file.metadata?.size)}</span>
                  </div>
                ))}
                {folder.files.length === 0 && (
                  <div className={`${DESIGN.STORAGE.ROW_PADDING} text-center`}>
                    <span className={DESIGN.TYPOGRAPHY.HINT}>Leer</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
