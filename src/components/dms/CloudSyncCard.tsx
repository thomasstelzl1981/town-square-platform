/**
 * CloudSyncCard — Google Drive connect/sync/disconnect + Dropbox/OneDrive coming soon.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cloud, HardDrive, RefreshCw, Unplug, FolderOpen, Loader2, CheckCircle2 } from 'lucide-react';
import { useCloudSync } from '@/hooks/useCloudSync';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export function CloudSyncCard() {
  const {
    googleDriveConnector,
    isConnected,
    isLoading,
    isConnecting,
    isSyncing,
    isAuthReady,
    folders,
    isFoldersLoading,
    connectGoogleDrive,
    disconnectProvider,
    loadFolders,
    setFolder,
    syncNow,
  } = useCloudSync();

  const [showFolders, setShowFolders] = useState(false);

  const handleOpenFolders = () => {
    setShowFolders(true);
    loadFolders();
  };

  const handleSelectFolder = (folder: { id: string; name: string }) => {
    setFolder(folder.id, folder.name);
    setShowFolders(false);
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Cloud className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Cloud-Synchronisation</p>
            <p className="text-xs text-muted-foreground">
              Verbinden Sie externe Cloud-Speicher mit Ihrem Datenraum
            </p>
          </div>
        </div>

        {/* Google Drive */}
        <div className="p-3 rounded-lg border border-border/40 bg-muted/30 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-lg shrink-0">🟢</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">Google Drive</span>
                {isConnected ? (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary/15 text-primary border-primary/30">
                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Verbunden
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border/60 text-muted-foreground">
                    Nicht verbunden
                  </Badge>
                )}
              </div>
              {isConnected && googleDriveConnector && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {googleDriveConnector.account_email}
                  {googleDriveConnector.remote_folder_name && (
                    <> · Ordner: <strong>{googleDriveConnector.remote_folder_name}</strong></>
                  )}
                  {googleDriveConnector.last_sync_at && (
                    <> · Letzter Sync: {format(new Date(googleDriveConnector.last_sync_at), 'dd.MM.yyyy HH:mm', { locale: de })} ({googleDriveConnector.last_sync_files_count} Dateien)</>
                  )}
                </p>
              )}
              {!isConnected && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Dokumente automatisch mit Google Drive synchronisieren
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!isConnected ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={connectGoogleDrive}
                disabled={isConnecting || isLoading || !isAuthReady}
              >
                {isConnecting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Cloud className="h-3 w-3 mr-1" />}
                {!isAuthReady ? 'Anmeldung erforderlich' : 'Mit Google Drive verbinden'}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={handleOpenFolders}
                  disabled={isFoldersLoading}
                >
                  {isFoldersLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FolderOpen className="h-3 w-3 mr-1" />}
                  Ordner wählen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={syncNow}
                  disabled={isSyncing || !googleDriveConnector?.remote_folder_id}
                >
                  {isSyncing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                  Jetzt synchronisieren
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 text-destructive hover:text-destructive"
                  onClick={disconnectProvider}
                >
                  <Unplug className="h-3 w-3 mr-1" />
                  Trennen
                </Button>
              </>
            )}
          </div>

          {/* Folder picker */}
          {showFolders && isConnected && (
            <div className="border border-border/40 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1 bg-background">
              {isFoldersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : folders.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2">Keine Ordner gefunden.</p>
              ) : (
                folders.map((folder) => (
                  <button
                    key={folder.id}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted/50 flex items-center gap-2 transition-colors"
                    onClick={() => handleSelectFolder(folder)}
                  >
                    <FolderOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Dropbox & OneDrive — Coming Soon */}
        {[
          { name: 'Dropbox', icon: '🔵', desc: 'Nahtlose Anbindung an Ihren Dropbox-Speicher' },
          { name: 'Microsoft OneDrive', icon: '🟣', desc: 'Integration mit OneDrive und SharePoint' },
        ].map((provider) => (
          <div
            key={provider.name}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/30"
          >
            <span className="text-lg shrink-0">{provider.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">{provider.name}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border/60 text-muted-foreground">
                  Bald verfügbar
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{provider.desc}</p>
            </div>
          </div>
        ))}

        {/* Info */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
          <HardDrive className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Cloud-Sync importiert Dokumente aus dem gewählten Ordner in Ihren Datenraum.
            Neue und geänderte Dateien werden bei jedem Sync automatisch erkannt.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
