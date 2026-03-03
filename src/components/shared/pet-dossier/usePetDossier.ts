/**
 * usePetDossier — Central data hook for the universal pet dossier
 * Handles loading, saving, and photo uploads for all zones
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PetData, PetOwnerData, PetDossierContext } from './types';

export function usePetDossier(petId: string, context: PetDossierContext) {
  const [pet, setPet] = useState<PetData | null>(null);
  const [owner, setOwner] = useState<PetOwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

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

          // Load gallery photos
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
      const { data: files } = await supabase.storage
        .from('pet-photos')
        .list(`${tenantId}/${id}/gallery`, { limit: 10, sortBy: { column: 'created_at', order: 'asc' } });

      if (files?.length) {
        const urls = files.map(f => {
          const { data } = supabase.storage.from('pet-photos').getPublicUrl(`${tenantId}/${id}/gallery/${f.name}`);
          return data.publicUrl;
        });
        setGalleryUrls(urls);
      }
    } catch {
      // Gallery optional
    }
  };

  const updatePet = useCallback(async (updates: Partial<PetData>) => {
    if (!pet) return;
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
  }, [pet]);

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
    const path = `${pet.tenant_id}/${pet.id}/profile.jpg`;
    try {
      const { error: upErr } = await supabase.storage
        .from('pet-photos')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from('pet-photos').getPublicUrl(path);
      const photoUrl = `${data.publicUrl}?t=${Date.now()}`;
      await updatePet({ photo_url: photoUrl });
    } catch (err) {
      console.error('uploadProfilePhoto error:', err);
      toast.error('Foto-Upload fehlgeschlagen');
    }
  }, [pet, updatePet]);

  const uploadGalleryPhoto = useCallback(async (file: File) => {
    if (!pet) return;
    const name = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const path = `${pet.tenant_id}/${pet.id}/gallery/${name}`;
    try {
      const { error: upErr } = await supabase.storage
        .from('pet-photos')
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from('pet-photos').getPublicUrl(path);
      setGalleryUrls(prev => [...prev, data.publicUrl]);
      toast.success('Foto hinzugefügt');
    } catch (err) {
      console.error('uploadGalleryPhoto error:', err);
      toast.error('Foto-Upload fehlgeschlagen');
    }
  }, [pet]);

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
