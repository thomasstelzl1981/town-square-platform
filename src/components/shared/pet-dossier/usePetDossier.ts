/**
 * usePetDossier — Central data hook for the universal pet dossier
 * Handles loading, saving, and photo uploads for all zones
 * Z3 context uses edge function proxies (no direct Supabase auth)
 * 
 * SSOT: Uses UPLOAD_BUCKET ('tenant-documents') with MOD_22 paths
 * Photos stored at: {tenant_id}/MOD_22/{pet_id}/profile.jpg
 * Gallery at: {tenant_id}/MOD_22/{pet_id}/gallery/{filename}
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UPLOAD_BUCKET } from '@/config/storageManifest';
import type { PetData, PetOwnerData, PetDossierContext } from './types';

const FUNC_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface UsePetDossierOptions {
  /** Z3 session token — required when context is 'z3' */
  z3SessionToken?: string | null;
}

export function usePetDossier(petId: string, context: PetDossierContext, options?: UsePetDossierOptions) {
  const [pet, setPet] = useState<PetData | null>(null);
  const [owner, setOwner] = useState<PetOwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  const z3Token = options?.z3SessionToken;

  // Load pet data
  useEffect(() => {
    if (!petId) return;
    setLoading(true);

    const loadPet = async () => {
      try {
        const { data, error } = await supabase
          .from('pets')
          .select('*')
          .eq('id', petId)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setPet(data as unknown as PetData);

          // Load owner based on context
          if (context === 'z2-provider' && data.customer_id) {
            const { data: cust } = await supabase
              .from('pet_customers')
              .select('id, first_name, last_name, email, phone, address, city, postal_code')
              .eq('id', data.customer_id)
              .maybeSingle();
            if (cust) setOwner(cust as PetOwnerData);
          } else if (context === 'z2-client' && data.owner_user_id) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, email, phone')
              .eq('id', data.owner_user_id)
              .maybeSingle();
            if (prof) setOwner(prof as PetOwnerData);
          }

          // Load gallery photos via signed URLs
          await loadGallery(data.tenant_id, petId);
        }
      } catch (err) {
        console.error('usePetDossier load error:', err);
        toast.error('Tierakte konnte nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    loadPet();
  }, [petId, context]);

  const loadGallery = async (tenantId: string, id: string) => {
    try {
      const galleryPath = `${tenantId}/MOD_22/${id}/gallery`;
      const { data: files } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .list(galleryPath, { limit: 10, sortBy: { column: 'created_at', order: 'asc' } });

      if (files?.length) {
        const urls: string[] = [];
        for (const f of files) {
          const { data } = await supabase.storage
            .from(UPLOAD_BUCKET)
            .createSignedUrl(`${galleryPath}/${f.name}`, 3600);
          if (data?.signedUrl) urls.push(data.signedUrl);
        }
        setGalleryUrls(urls);
      }
    } catch {
      // Gallery optional
    }
  };

  const updatePet = useCallback(async (updates: Partial<PetData>) => {
    if (!pet) return;

    // Z3: use edge function proxy
    if (context === 'z3' && z3Token) {
      setSaving(true);
      try {
        const res = await fetch(`${FUNC_BASE}/sot-pslc-z3-upsert-pet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
          body: JSON.stringify({ session_token: z3Token, pet_id: pet.id, pet_data: { ...pet, ...updates } }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
        setPet(prev => prev ? { ...prev, ...updates } : prev);
        toast.success('Gespeichert');
      } catch (err) {
        console.error('updatePet z3 error:', err);
        toast.error('Speichern fehlgeschlagen');
      } finally {
        setSaving(false);
      }
      return;
    }

    // Z2/Z1: direct Supabase
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pets')
        .update(updates as Record<string, unknown>)
        .eq('id', pet.id);

      if (error) throw error;
      setPet(prev => prev ? { ...prev, ...updates } : prev);
      toast.success('Gespeichert');
    } catch (err) {
      console.error('updatePet error:', err);
      toast.error('Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }, [pet, context, z3Token]);

  const updateOwner = useCallback(async (updates: Partial<PetOwnerData>) => {
    if (!owner) return;
    setSaving(true);
    try {
      if (context === 'z2-provider') {
        const { error } = await supabase
          .from('pet_customers')
          .update(updates as Record<string, unknown>)
          .eq('id', owner.id);
        if (error) throw error;
      } else if (context === 'z2-client') {
        const { error } = await supabase
          .from('profiles')
          .update(updates as Record<string, unknown>)
          .eq('id', owner.id);
        if (error) throw error;
      }
      setOwner(prev => prev ? { ...prev, ...updates } : prev);
      toast.success('Besitzer aktualisiert');
    } catch (err) {
      console.error('updateOwner error:', err);
      toast.error('Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }, [owner, context]);

  const uploadProfilePhoto = useCallback(async (file: File) => {
    if (!pet) return;

    // Z3: use edge function proxy
    if (context === 'z3' && z3Token) {
      try {
        const formData = new FormData();
        formData.append('session_token', z3Token);
        formData.append('pet_id', pet.id);
        formData.append('photo_type', 'profile');
        formData.append('file', file);

        const res = await fetch(`${FUNC_BASE}/sot-pslc-z3-upload-photo`, {
          method: 'POST',
          headers: { apikey: ANON_KEY },
          body: formData,
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Upload-Fehler');
        const { url } = await res.json();
        setPet(prev => prev ? { ...prev, photo_url: url } : prev);
        toast.success('Profilfoto aktualisiert');
      } catch (err) {
        console.error('uploadProfilePhoto z3 error:', err);
        toast.error('Foto-Upload fehlgeschlagen');
      }
      return;
    }

    // Z2/Z1: SSOT storage path
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${pet.tenant_id}/MOD_22/${pet.id}/profile.${ext}`;
    try {
      const { error: upErr } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data } = await supabase.storage.from(UPLOAD_BUCKET).createSignedUrl(path, 3600);
      const photoUrl = data?.signedUrl || '';
      await updatePet({ photo_url: photoUrl });
    } catch (err) {
      console.error('uploadProfilePhoto error:', err);
      toast.error('Foto-Upload fehlgeschlagen');
    }
  }, [pet, updatePet, context, z3Token]);

  const uploadGalleryPhoto = useCallback(async (file: File) => {
    if (!pet) return;

    // Z3: use edge function proxy
    if (context === 'z3' && z3Token) {
      try {
        const formData = new FormData();
        formData.append('session_token', z3Token);
        formData.append('pet_id', pet.id);
        formData.append('photo_type', 'gallery');
        formData.append('file', file);

        const res = await fetch(`${FUNC_BASE}/sot-pslc-z3-upload-photo`, {
          method: 'POST',
          headers: { apikey: ANON_KEY },
          body: formData,
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Upload-Fehler');
        const { url } = await res.json();
        setGalleryUrls(prev => [...prev, url]);
        toast.success('Foto hinzugefügt');
      } catch (err) {
        console.error('uploadGalleryPhoto z3 error:', err);
        toast.error('Foto-Upload fehlgeschlagen');
      }
      return;
    }

    // Z2/Z1: SSOT storage path
    const name = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const path = `${pet.tenant_id}/MOD_22/${pet.id}/gallery/${name}`;
    try {
      const { error: upErr } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      const { data } = await supabase.storage.from(UPLOAD_BUCKET).createSignedUrl(path, 3600);
      if (data?.signedUrl) setGalleryUrls(prev => [...prev, data.signedUrl]);
      toast.success('Foto hinzugefügt');
    } catch (err) {
      console.error('uploadGalleryPhoto error:', err);
      toast.error('Foto-Upload fehlgeschlagen');
    }
  }, [pet, context, z3Token]);

  return {
    pet,
    owner,
    loading,
    saving,
    galleryUrls,
    updatePet,
    updateOwner,
    uploadProfilePhoto,
    uploadGalleryPhoto,
  };
}
