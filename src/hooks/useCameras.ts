import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface Camera {
  id: string;
  user_id: string;
  name: string;
  snapshot_url: string;
  auth_user: string | null;
  auth_pass: string | null;
  refresh_interval_sec: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CameraFormData {
  name: string;
  snapshot_url: string;
  auth_user?: string;
  auth_pass?: string;
  refresh_interval_sec?: number;
}

export function useCameras() {
  const queryClient = useQueryClient();

  const camerasQuery = useQuery({
    queryKey: ['cameras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Camera[];
    },
  });

  const addCamera = useMutation({
    mutationFn: async (form: CameraFormData) => {
      const { data, error } = await supabase
        .from('cameras')
        .insert({
          name: form.name,
          snapshot_url: form.snapshot_url,
          auth_user: form.auth_user || null,
          auth_pass: form.auth_pass || null,
          refresh_interval_sec: form.refresh_interval_sec ?? 30,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Camera;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      toast.success('Kamera hinzugefügt');
    },
    onError: (err) => toast.error(`Fehler: ${err.message}`),
  });

  const updateCamera = useMutation({
    mutationFn: async ({ id, ...form }: CameraFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('cameras')
        .update({
          name: form.name,
          snapshot_url: form.snapshot_url,
          auth_user: form.auth_user || null,
          auth_pass: form.auth_pass || null,
          refresh_interval_sec: form.refresh_interval_sec ?? 30,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Camera;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      toast.success('Kamera aktualisiert');
    },
    onError: (err) => toast.error(`Fehler: ${err.message}`),
  });

  const deleteCamera = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cameras').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      toast.success('Kamera gelöscht');
    },
    onError: (err) => toast.error(`Fehler: ${err.message}`),
  });

  return { camerasQuery, addCamera, updateCamera, deleteCamera };
}

export function useCameraSnapshot(cameraId: string | null, refreshIntervalSec = 30) {
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'online' | 'offline' | 'error'>('loading');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevBlobUrl = useRef<string | null>(null);

  const fetchSnapshot = useCallback(async () => {
    if (!cameraId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus('error');
        return;
      }

      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = `${baseUrl}/functions/v1/sot-camera-snapshot?camera_id=${cameraId}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setStatus(errData.status === 'offline' ? 'offline' : 'error');
        return;
      }

      const blob = await res.blob();
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
      const blobUrl = URL.createObjectURL(blob);
      prevBlobUrl.current = blobUrl;
      setSnapshotUrl(blobUrl);
      setStatus('online');
    } catch {
      setStatus('offline');
    }
  }, [cameraId]);

  useEffect(() => {
    if (!cameraId) return;

    setStatus('loading');
    fetchSnapshot();

    intervalRef.current = setInterval(fetchSnapshot, refreshIntervalSec * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
    };
  }, [cameraId, refreshIntervalSec, fetchSnapshot]);

  return { snapshotUrl, status, refresh: fetchSnapshot };
}
