/**
 * CloudSourcePicker — Reusable source selector for DMS analysis & intake.
 * Lets user choose between internal DMS Storage and connected cloud folders.
 * When a cloud source is selected, provides a mode toggle (sync-first vs direct).
 */

import { useState, useEffect } from 'react';
import { HardDrive, Cloud, FolderOpen, RefreshCw, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCloudSync } from '@/hooks/useCloudSync';
import { cn } from '@/lib/utils';

export interface CloudSourceSelection {
  source: 'storage' | 'cloud';
  provider?: string;
  folderId?: string;
  folderName?: string;
  mode: 'sync_first' | 'direct';
}

interface Props {
  onSelect: (selection: CloudSourceSelection) => void;
  className?: string;
}

export function CloudSourcePicker({ onSelect, className }: Props) {
  const {
    googleDriveConnector,
    isConnected,
    isAuthReady,
  } = useCloudSync();

  const [selected, setSelected] = useState<'storage' | 'cloud'>('storage');
  const [mode, setMode] = useState<'sync_first' | 'direct'>('sync_first');

  // Emit selection changes
  useEffect(() => {
    if (selected === 'storage') {
      onSelect({ source: 'storage', mode: 'sync_first' });
    } else if (isConnected && googleDriveConnector) {
      onSelect({
        source: 'cloud',
        provider: 'google_drive',
        folderId: googleDriveConnector.remote_folder_id || undefined,
        folderName: googleDriveConnector.remote_folder_name || undefined,
        mode,
      });
    }
  }, [selected, mode, isConnected, googleDriveConnector, onSelect]);

  const cloudAvailable = isAuthReady && isConnected && !!googleDriveConnector?.remote_folder_id;

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Datenquelle
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* DMS Storage */}
        <button
          type="button"
          onClick={() => setSelected('storage')}
          className={cn(
            'flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
            selected === 'storage'
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-border/50 bg-muted/30 hover:bg-muted/50'
          )}
        >
          <div className={cn(
            'p-1.5 rounded-lg shrink-0',
            selected === 'storage' ? 'bg-primary/15' : 'bg-muted'
          )}>
            <HardDrive className={cn('h-4 w-4', selected === 'storage' ? 'text-primary' : 'text-muted-foreground')} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">DMS-Datenraum</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Ihr interner Dokumentenspeicher
            </p>
          </div>
        </button>

        {/* Google Drive */}
        <button
          type="button"
          onClick={() => cloudAvailable && setSelected('cloud')}
          disabled={!cloudAvailable}
          className={cn(
            'flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
            !cloudAvailable && 'opacity-50 cursor-not-allowed',
            selected === 'cloud'
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-border/50 bg-muted/30 hover:bg-muted/50'
          )}
        >
          <div className={cn(
            'p-1.5 rounded-lg shrink-0',
            selected === 'cloud' ? 'bg-primary/15' : 'bg-muted'
          )}>
            <Cloud className={cn('h-4 w-4', selected === 'cloud' ? 'text-primary' : 'text-muted-foreground')} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">Google Drive</p>
              {!cloudAvailable && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-border/60 text-muted-foreground">
                  {!isConnected ? 'Nicht verbunden' : 'Kein Ordner'}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {cloudAvailable
                ? <>Ordner: <strong>{googleDriveConnector?.remote_folder_name}</strong></>
                : 'Im Intelligenz-Tab verbinden'
              }
            </p>
          </div>
        </button>
      </div>

      {/* Mode toggle — only shown when cloud is selected */}
      {selected === 'cloud' && cloudAvailable && (
        <div className="flex gap-2 pl-1">
          <button
            type="button"
            onClick={() => setMode('sync_first')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border',
              mode === 'sync_first'
                ? 'border-primary/30 bg-primary/10 text-primary font-medium'
                : 'border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/50'
            )}
          >
            <RefreshCw className="h-3 w-3" />
            Erst synchronisieren
          </button>
          <button
            type="button"
            onClick={() => setMode('direct')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border',
              mode === 'direct'
                ? 'border-primary/30 bg-primary/10 text-primary font-medium'
                : 'border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/50'
            )}
          >
            <FolderOpen className="h-3 w-3" />
            Direkt analysieren
          </button>
        </div>
      )}
    </div>
  );
}
