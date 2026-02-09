/**
 * ProjectDeleteDialog — Bestätigungsdialog mit Löschprotokoll
 * 
 * Zeigt vor dem Löschen:
 * - Projektinfo (Name, Code, Einheiten)
 * - Zu löschende Storage-Dateien (rekursiver Baum)
 * - Warnungen zu kaskadierten Löschungen
 * 
 * Nach dem Löschen:
 * - Detailliertes Protokoll was gelöscht wurde
 */

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Trash2,
  AlertTriangle,
  FolderTree,
  FileText,
  CheckCircle2,
  XCircle,
  Building2,
  FileBox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectPortfolioRow } from '@/types/projekte';

export interface DeletionProtocol {
  projectId: string;
  projectName: string;
  projectCode: string;
  storageFilesFound: string[];
  storageFilesDeleted: string[];
  storageErrors: string[];
  dbRecordsDeleted: {
    units: number;
    reservations: number;
    documents: number;
  };
  success: boolean;
  timestamp: string;
}

interface ProjectDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectPortfolioRow | null;
  tenantId: string | undefined;
  onConfirmDelete: (projectId: string) => Promise<DeletionProtocol>;
}

interface StorageTreeItem {
  path: string;
  name: string;
  isFolder: boolean;
  size?: number;
}

export function ProjectDeleteDialog({
  open,
  onOpenChange,
  project,
  tenantId,
  onConfirmDelete,
}: ProjectDeleteDialogProps) {
  const [phase, setPhase] = useState<'preview' | 'deleting' | 'complete'>('preview');
  const [storageTree, setStorageTree] = useState<StorageTreeItem[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [protocol, setProtocol] = useState<DeletionProtocol | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load storage tree when dialog opens
  useEffect(() => {
    if (open && project && tenantId) {
      loadStorageTree();
    } else {
      // Reset state when dialog closes
      setPhase('preview');
      setStorageTree([]);
      setProtocol(null);
      setError(null);
    }
  }, [open, project?.id, tenantId]);

  const loadStorageTree = async () => {
    if (!project || !tenantId) return;

    setIsLoadingTree(true);
    const basePath = `projects/${tenantId}/${project.id}`;
    const items: StorageTreeItem[] = [];

    try {
      // Recursively list all files
      const listFolder = async (folderPath: string) => {
        const { data: files, error } = await supabase.storage
          .from('project-documents')
          .list(folderPath, { limit: 500 });

        if (error) {
          console.error('Error listing folder:', folderPath, error);
          return;
        }

        if (files) {
          for (const file of files) {
            const fullPath = `${folderPath}/${file.name}`;
            
            if (file.id === null) {
              // This is a folder (Supabase returns folders with null id)
              items.push({
                path: fullPath,
                name: file.name,
                isFolder: true,
              });
              // Recurse into folder
              await listFolder(fullPath);
            } else {
              items.push({
                path: fullPath,
                name: file.name,
                isFolder: false,
                size: file.metadata?.size,
              });
            }
          }
        }
      };

      await listFolder(basePath);
      setStorageTree(items);
    } catch (err) {
      console.error('Error loading storage tree:', err);
    } finally {
      setIsLoadingTree(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    setPhase('deleting');
    setError(null);

    try {
      const result = await onConfirmDelete(project.id);
      setProtocol(result);
      setPhase('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setPhase('preview');
    }
  };

  const handleClose = () => {
    if (phase !== 'deleting') {
      onOpenChange(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileCount = storageTree.filter(i => !i.isFolder).length;
  const folderCount = storageTree.filter(i => i.isFolder).length;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {phase === 'complete' ? (
              protocol?.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Projekt gelöscht
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Löschen fehlgeschlagen
                </>
              )
            ) : (
              <>
                <Trash2 className="h-5 w-5 text-destructive" />
                Projekt unwiderruflich löschen?
              </>
            )}
          </AlertDialogTitle>
          
          {phase !== 'complete' && (
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. 
              Alle Projektdaten, Einheiten, Reservierungen und Dateien werden permanent gelöscht.
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {project && (
          <div className="space-y-4">
            {/* Project Info */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{project.name}</p>
                <p className="text-sm text-muted-foreground font-mono">{project.project_code}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {project.total_units_count} Einheiten
                  </Badge>
                  {project.units_reserved > 0 && (
                    <Badge variant="secondary" className="text-xs text-amber-600">
                      {project.units_reserved} reserviert
                    </Badge>
                  )}
                  {project.units_sold > 0 && (
                    <Badge variant="secondary" className="text-xs text-sky-600">
                      {project.units_sold} verkauft
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Phase: Preview - Show what will be deleted */}
            {phase === 'preview' && (
              <>
                {/* Warning for active reservations/sales */}
                {(project.units_reserved > 0 || project.units_sold > 0) && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Achtung: Dieses Projekt enthält aktive Reservierungen oder Verkäufe. 
                      Diese werden ebenfalls unwiderruflich gelöscht.
                    </p>
                  </div>
                )}

                {/* Storage Tree */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FolderTree className="h-4 w-4" />
                      Dateien im Storage
                    </div>
                    {isLoadingTree ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {fileCount} Dateien in {folderCount} Ordnern
                      </span>
                    )}
                  </div>

                  {isLoadingTree ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Lade Dateistruktur...
                    </div>
                  ) : storageTree.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm border rounded-lg">
                      Keine Dateien im Storage vorhanden
                    </div>
                  ) : (
                    <ScrollArea className="h-32 border rounded-lg">
                      <div className="p-2 space-y-0.5">
                        {storageTree.map((item, i) => (
                          <div 
                            key={i}
                            className={cn(
                              "flex items-center gap-2 text-xs py-1 px-2 rounded",
                              item.isFolder ? "text-muted-foreground" : "hover:bg-muted/50"
                            )}
                          >
                            {item.isFolder ? (
                              <FolderTree className="h-3 w-3" />
                            ) : (
                              <FileText className="h-3 w-3" />
                            )}
                            <span className="flex-1 truncate font-mono">{item.name}</span>
                            {item.size && (
                              <span className="text-muted-foreground">{formatFileSize(item.size)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Cascade Warning */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <FileBox className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-destructive dark:text-red-400">
                    <p className="font-medium mb-1">Wird ebenfalls gelöscht:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>Alle Einheiten und deren Daten</li>
                      <li>Alle Reservierungen</li>
                      <li>Alle Dokumente und Uploads</li>
                      <li>Alle Verknüpfungen zu Interessenten</li>
                    </ul>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}
              </>
            )}

            {/* Phase: Deleting */}
            {phase === 'deleting' && (
              <div className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                <p className="text-muted-foreground">Projekt wird gelöscht...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dateien und Datenbank-Einträge werden entfernt
                </p>
              </div>
            )}

            {/* Phase: Complete - Show Protocol */}
            {phase === 'complete' && protocol && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Zeitstempel:</span>
                    <span className="font-mono text-xs">{protocol.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Storage-Dateien gefunden:</span>
                    <span>{protocol.storageFilesFound.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Storage-Dateien gelöscht:</span>
                    <span className="text-primary">{protocol.storageFilesDeleted.length}</span>
                  </div>
                  {protocol.storageErrors.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Storage-Fehler:</span>
                      <span className="text-destructive">{protocol.storageErrors.length}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <p className="text-muted-foreground mb-1">Datenbank-Löschungen (Kaskade):</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-background rounded text-center">
                        <p className="font-medium">{protocol.dbRecordsDeleted.units}</p>
                        <p className="text-muted-foreground">Einheiten</p>
                      </div>
                      <div className="p-2 bg-background rounded text-center">
                        <p className="font-medium">{protocol.dbRecordsDeleted.reservations}</p>
                        <p className="text-muted-foreground">Reserv.</p>
                      </div>
                      <div className="p-2 bg-background rounded text-center">
                        <p className="font-medium">{protocol.dbRecordsDeleted.documents}</p>
                        <p className="text-muted-foreground">Dokumente</p>
                      </div>
                    </div>
                  </div>
                </div>

                {protocol.storageErrors.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                      Storage-Fehler:
                    </p>
                    <ScrollArea className="max-h-20">
                      <ul className="text-xs text-amber-600 space-y-0.5">
                        {protocol.storageErrors.map((err, i) => (
                          <li key={i} className="font-mono truncate">{err}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          {phase === 'preview' && (
            <>
              <AlertDialogCancel>
                Abbrechen
              </AlertDialogCancel>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isLoadingTree}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Endgültig löschen
              </Button>
            </>
          )}
          {phase === 'complete' && (
            <Button onClick={handleClose}>
              Schließen
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
