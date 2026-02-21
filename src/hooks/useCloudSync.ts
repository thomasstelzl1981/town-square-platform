import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CloudConnector {
  id: string;
  provider: string;
  status: string;
  account_email: string | null;
  account_name: string | null;
  remote_folder_id: string | null;
  remote_folder_name: string | null;
  last_sync_at: string | null;
  last_sync_files_count: number | null;
  error_message: string | null;
  token_expires_at: string | null;
}

interface DriveFolder {
  id: string;
  name: string;
}

export function useCloudSync() {
  const [connectors, setConnectors] = useState<CloudConnector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [isFoldersLoading, setIsFoldersLoading] = useState(false);

  const invoke = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke('sot-cloud-sync', {
      body: { action, ...extra },
    });
    if (error) throw error;
    return data;
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await invoke('status');
      setConnectors(data.connectors || []);
    } catch (err) {
      // Silent fail on status — user might not be logged in yet
      console.warn('[useCloudSync] status error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [invoke]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Listen for OAuth callback result in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cloud_sync_success') === 'true') {
      toast.success('Google Drive erfolgreich verbunden!');
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
      fetchStatus();
    }
    const error = params.get('cloud_sync_error');
    if (error) {
      toast.error(`Google Drive Verbindung fehlgeschlagen: ${error}`);
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [fetchStatus]);

  const connectGoogleDrive = useCallback(async () => {
    try {
      setIsConnecting(true);
      const returnUrl = window.location.origin + window.location.pathname;
      const data = await invoke('init', { returnUrl });

      if (!data?.redirect_url) {
        toast.error('OAuth URL konnte nicht erstellt werden.');
        return;
      }

      // Use popup to avoid iframe redirect issues in preview
      const popup = window.open(data.redirect_url, 'google_drive_oauth', 'width=600,height=700,scrollbars=yes');

      if (!popup) {
        // Popup blocked — fall back to direct redirect
        toast.info('Popup blockiert — Sie werden weitergeleitet...');
        window.location.href = data.redirect_url;
        return;
      }

      // Listen for postMessage from popup (callback page sends result)
      const messageHandler = (event: MessageEvent) => {
        try {
          const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (msg?.type === 'cloud_sync_result') {
            window.removeEventListener('message', messageHandler);
            clearInterval(pollTimer);
            popup?.close();
            setIsConnecting(false);
            if (msg.success) {
              toast.success('Google Drive erfolgreich verbunden!');
            } else {
              toast.error(`Google Drive Verbindung fehlgeschlagen: ${msg.error || 'Unbekannter Fehler'}`);
            }
            fetchStatus();
          }
        } catch { /* ignore non-JSON messages */ }
      };
      window.addEventListener('message', messageHandler);

      // Fallback: poll for popup close
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          window.removeEventListener('message', messageHandler);
          setIsConnecting(false);
          fetchStatus();
        }
      }, 500);
    } catch (err) {
      console.error('[useCloudSync] init error:', err);
      toast.error('Verbindung konnte nicht gestartet werden. Bitte stellen Sie sicher, dass Sie eingeloggt sind.');
    } finally {
      setIsConnecting(false);
    }
  }, [invoke, fetchStatus]);

  const disconnectProvider = useCallback(async () => {
    try {
      await invoke('disconnect');
      toast.success('Google Drive getrennt.');
      await fetchStatus();
    } catch (err) {
      console.error('[useCloudSync] disconnect error:', err);
      toast.error('Trennen fehlgeschlagen.');
    }
  }, [invoke, fetchStatus]);

  const loadFolders = useCallback(async (parentId?: string) => {
    try {
      setIsFoldersLoading(true);
      const data = await invoke('folders', { parentId });
      setFolders(data.folders || []);
    } catch (err) {
      console.error('[useCloudSync] folders error:', err);
      toast.error('Ordner konnten nicht geladen werden.');
    } finally {
      setIsFoldersLoading(false);
    }
  }, [invoke]);

  const setFolder = useCallback(async (folderId: string, folderName: string) => {
    try {
      await invoke('set_folder', { folderId, folderName });
      toast.success(`Ordner "${folderName}" ausgewählt.`);
      await fetchStatus();
    } catch (err) {
      console.error('[useCloudSync] set_folder error:', err);
      toast.error('Ordner konnte nicht gesetzt werden.');
    }
  }, [invoke, fetchStatus]);

  const syncNow = useCallback(async () => {
    try {
      setIsSyncing(true);
      const data = await invoke('sync');
      toast.success(`Sync abgeschlossen: ${data.files_synced} Datei(en) importiert.`);
      await fetchStatus();
    } catch (err) {
      console.error('[useCloudSync] sync error:', err);
      toast.error('Sync fehlgeschlagen.');
    } finally {
      setIsSyncing(false);
    }
  }, [invoke, fetchStatus]);

  const googleDriveConnector = connectors.find(c => c.provider === 'google_drive');
  const isConnected = googleDriveConnector?.status === 'connected';

  return {
    connectors,
    googleDriveConnector,
    isConnected,
    isLoading,
    isConnecting,
    isSyncing,
    folders,
    isFoldersLoading,
    connectGoogleDrive,
    disconnectProvider,
    loadFolders,
    setFolder,
    syncNow,
    refreshStatus: fetchStatus,
  };
}
