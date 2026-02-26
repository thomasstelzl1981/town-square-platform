/**
 * useLennoxInitialSeed — Einmaliger Seed-Hook für Lennox & Friends
 * 
 * Wird beim Login des Lennox-Tenants (Robyn) ausgeführt.
 * Lädt Gallery-Bilder in Storage hoch, schreibt Signed URLs in die DB,
 * und erstellt die DMS-Ordnerstruktur für den Provider.
 * 
 * Idempotent: Prüft vor jedem Schritt ob Daten bereits existieren.
 */

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_PET_PROVIDER_LENNOX } from '@/engines/demoData/constants';

// Gallery images — imported as static assets (Vite resolves to URLs)
import pmGalleryPension1 from '@/assets/demo/pm-gallery-pension-1.jpg';
import pmGalleryPension2 from '@/assets/demo/pm-gallery-pension-2.jpg';
import pmGalleryGrooming1 from '@/assets/demo/pm-gallery-grooming-1.jpg';
import pmGalleryGrooming2 from '@/assets/demo/pm-gallery-grooming-2.jpg';

const LENNOX_TENANT_ID = 'eac1778a-23bc-4d03-b3f9-b26be27c9505';
const PROVIDER_ID = DEMO_PET_PROVIDER_LENNOX; // d0000000-0000-4000-a000-000000000050
const BUCKET = 'tenant-documents';
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365; // 1 year in seconds

const GALLERY_ASSETS = [
  pmGalleryPension1,
  pmGalleryPension2,
  pmGalleryGrooming1,
  pmGalleryGrooming2,
];

function storagePath(index: number): string {
  return `${LENNOX_TENANT_ID}/pet-provider/${PROVIDER_ID}/gallery_${index}.jpg`;
}

/**
 * Fetch an image from a Vite asset URL and return it as a Blob
 */
async function fetchAsBlob(assetUrl: string): Promise<Blob> {
  const res = await fetch(assetUrl);
  if (!res.ok) throw new Error(`Failed to fetch asset: ${assetUrl}`);
  return res.blob();
}

export function useLennoxInitialSeed() {
  const runningRef = useRef(false);

  const runSeed = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    try {
      // ── Phase 0: Check if provider exists ────────────────
      const { data: provider } = await supabase
        .from('pet_providers')
        .select('id, gallery_images, cover_image_url')
        .eq('id', PROVIDER_ID)
        .maybeSingle();

      if (!provider) {
        console.warn('[LennoxSeed] Provider not found in DB — skipping seed');
        return;
      }

      // If gallery_images already populated, skip everything
      const existingGallery = (provider.gallery_images as string[]) || [];
      if (existingGallery.length >= 4) {
        if (import.meta.env.DEV) console.log('[LennoxSeed] Gallery already seeded — skipping');
        await ensureDMSTree();
        return;
      }

      // ── Phase 1: Upload images to Storage ────────────────
      if (import.meta.env.DEV) console.log('[LennoxSeed] Uploading gallery images...');
      const uploadedPaths: string[] = [];

      for (let i = 0; i < GALLERY_ASSETS.length; i++) {
        const path = storagePath(i);

        // Check if file already exists
        const { data: existing } = await supabase.storage
          .from(BUCKET)
          .list(`${LENNOX_TENANT_ID}/pet-provider/${PROVIDER_ID}`, {
            search: `gallery_${i}.jpg`,
          });

        if (existing && existing.length > 0) {
          if (import.meta.env.DEV) console.log(`[LennoxSeed] gallery_${i}.jpg already exists — skipping upload`);
          uploadedPaths.push(path);
          continue;
        }

        const blob = await fetchAsBlob(GALLERY_ASSETS[i]);
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadErr) {
          // If duplicate, that's fine
          if (uploadErr.message?.includes('already exists') || uploadErr.message?.includes('Duplicate')) {
            if (import.meta.env.DEV) console.log(`[LennoxSeed] gallery_${i}.jpg duplicate — ok`);
          } else {
            console.error(`[LennoxSeed] Upload error for gallery_${i}:`, uploadErr);
            continue;
          }
        }
        uploadedPaths.push(path);
      }

      // ── Phase 2: Generate Signed URLs ────────────────────
      if (uploadedPaths.length === 0) {
        console.warn('[LennoxSeed] No images uploaded — skipping URL generation');
        return;
      }

      const { data: signedData, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(uploadedPaths, SIGNED_URL_EXPIRY);

      if (signErr || !signedData) {
        console.error('[LennoxSeed] Signed URL generation failed:', signErr);
        return;
      }

      const signedUrls = signedData
        .filter(s => s.signedUrl)
        .map(s => s.signedUrl);

      if (signedUrls.length === 0) {
        console.warn('[LennoxSeed] No signed URLs generated');
        return;
      }

      // ── Phase 3: Update provider record ──────────────────
      const { error: updateErr } = await supabase
        .from('pet_providers')
        .update({
          gallery_images: signedUrls,
          cover_image_url: signedUrls[0],
        })
        .eq('id', PROVIDER_ID);

      if (updateErr) {
        console.error('[LennoxSeed] Failed to update provider gallery:', updateErr);
      } else {
        if (import.meta.env.DEV) console.log('[LennoxSeed] Gallery images saved to DB ✓');
      }

      // ── Phase 4: DMS Tree ────────────────────────────────
      await ensureDMSTree();

    } catch (err) {
      console.error('[LennoxSeed] Seed failed:', err);
    } finally {
      runningRef.current = false;
    }
  }, []);

  return { runSeed };
}

/**
 * Ensures DMS folder structure exists for the Lennox provider.
 * Uses same pattern as usePetDMS but for entity_type 'pet' with provider entity.
 */
async function ensureDMSTree() {
  try {
    // Check if root folder already exists
    const { data: existing } = await supabase
      .from('storage_nodes')
      .select('id')
      .eq('tenant_id', LENNOX_TENANT_ID)
      .eq('entity_type', 'pet')
      .eq('entity_id', PROVIDER_ID)
      .eq('node_type', 'folder')
      .is('parent_id', null)
      .maybeSingle();

    if (existing?.id) {
      if (import.meta.env.DEV) console.log('[LennoxSeed] DMS tree already exists — skipping');
      return;
    }

    // Create root folder
    const { data: rootFolder, error: rootErr } = await supabase
      .from('storage_nodes')
      .insert({
        tenant_id: LENNOX_TENANT_ID,
        name: 'Lennox & Friends Dog Resorts',
        node_type: 'folder',
        module_code: 'MOD_05',
        entity_type: 'pet',
        entity_id: PROVIDER_ID,
        parent_id: null,
        auto_created: true,
      } as any)
      .select('id')
      .single();

    if (rootErr) {
      console.error('[LennoxSeed] DMS root creation failed:', rootErr);
      return;
    }

    // Create subfolders
    const subfolders = [
      '01_Impfpass',
      '02_Tierarzt',
      '03_Versicherung',
      '04_Sonstiges',
      '05_Galerie',
    ].map(name => ({
      tenant_id: LENNOX_TENANT_ID,
      name,
      node_type: 'folder',
      module_code: 'MOD_05',
      entity_type: 'pet',
      entity_id: PROVIDER_ID,
      parent_id: rootFolder.id,
      auto_created: true,
    }));

    const { error: subErr } = await supabase
      .from('storage_nodes')
      .insert(subfolders as any);

    if (subErr) {
      console.error('[LennoxSeed] DMS subfolder creation failed:', subErr);
    } else {
      if (import.meta.env.DEV) console.log('[LennoxSeed] DMS tree created ✓');
    }
  } catch (err) {
    console.error('[LennoxSeed] DMS tree error:', err);
  }
}
