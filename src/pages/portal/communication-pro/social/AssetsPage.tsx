/**
 * Social Assets — Photo & Media Library with real file upload
 */
import { useState, useCallback } from 'react';
import { DESIGN } from '@/config/designManifest';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageIcon, Upload, Trash2, Loader2, X, ZoomIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { useLegalConsent } from '@/hooks/useLegalConsent';

const TAG_OPTIONS = ['Business', 'Casual', 'Outdoor', 'Speaking', 'Portrait', 'Team', 'Event'];
const MAX_ASSETS = 20;
const ACCEPTED_TYPES = { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] };

interface SocialAsset {
  id: string;
  document_id: string;
  tags: string[] | null;
  asset_type: string;
  sort_order: number;
}

function getStorageUrl(tenantId: string, documentId: string) {
  const { data } = supabase.storage.from('social-assets').getPublicUrl(`${tenantId}/${documentId}`);
  return data?.publicUrl || '';
}

export function AssetsPage() {
  const { activeOrganization, user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || 'dev-user';
  const tenantId = activeOrganization?.id;
  const consentGuard = useLegalConsent();
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['social-assets', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data } = await supabase
        .from('social_assets')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('sort_order', { ascending: true });
      return (data || []) as SocialAsset[];
    },
    enabled: !!tenantId,
  });

  const toggleTag = useMutation({
    mutationFn: async ({ id, currentTags, tag }: { id: string; currentTags: string[]; tag: string }) => {
      const newTags = currentTags.includes(tag) ? currentTags.filter((t) => t !== tag) : [...currentTags, tag];
      const { error } = await supabase.from('social_assets').update({ tags: newTags }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-assets'] }),
  });

  const deleteAsset = useMutation({
    mutationFn: async (asset: SocialAsset) => {
      // Delete file from storage
      if (tenantId) {
        await supabase.storage.from('social-assets').remove([`${tenantId}/${asset.document_id}`]);
      }
      const { error } = await supabase.from('social_assets').delete().eq('id', asset.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-assets'] });
      toast({ title: 'Gelöscht' });
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!consentGuard.requireConsent()) return;
    if (!tenantId) return;
    const remaining = MAX_ASSETS - assets.length;
    if (remaining <= 0) {
      toast({ title: 'Maximum erreicht', description: `Maximal ${MAX_ASSETS} Assets erlaubt.`, variant: 'destructive' });
      return;
    }
    const filesToUpload = acceptedFiles.slice(0, remaining);
    setUploading(true);

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const storagePath = `${tenantId}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('social-assets')
          .upload(storagePath, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        // Create DB record
        const { error: dbError } = await supabase.from('social_assets').insert({
          tenant_id: tenantId,
          owner_user_id: userId,
          document_id: fileName,
          asset_type: 'portrait',
          sort_order: assets.length + i + 1,
          tags: ['Portrait'],
        });
        if (dbError) throw dbError;
      }

      queryClient.invalidateQueries({ queryKey: ['social-assets'] });
      queryClient.invalidateQueries({ queryKey: ['social-asset-count'] });
      toast({ title: `${filesToUpload.length} Foto(s) hochgeladen` });
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Upload fehlgeschlagen', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [tenantId, userId, assets.length, queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading || assets.length >= MAX_ASSETS,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Assets</h1>
          <p className="text-muted-foreground mt-1">
            Lade bis zu {MAX_ASSETS} Fotos hoch und tagge sie — Business, Casual, Outdoor, Speaking.
          </p>
        </div>
        {assets.length > 0 && <Badge variant="outline">{assets.length}/{MAX_ASSETS}</Badge>}
      </div>

      {/* Dropzone */}
      {assets.length < MAX_ASSETS && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/20'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium text-sm">
                {isDragActive ? 'Hier ablegen…' : 'Fotos hierher ziehen oder klicken'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WebP — max. 10 MB pro Datei
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gallery */}
      {assets.length > 0 ? (
        <div className={DESIGN.WIDGET_GRID.FULL}>
          {assets.map((asset) => {
            const imageUrl = tenantId ? getStorageUrl(tenantId, asset.document_id) : '';
            return (
              <Card key={asset.id} className="relative group overflow-hidden">
                <CardContent className="p-0">
                  {/* Image thumbnail */}
                  <div
                    className="aspect-square bg-muted relative cursor-pointer overflow-hidden"
                    onClick={() => setLightboxUrl(imageUrl)}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Asset"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`${imageUrl ? 'hidden' : ''} absolute inset-0 flex items-center justify-center`}>
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="p-2 space-y-1.5">
                    <div className="flex flex-wrap gap-1">
                      {TAG_OPTIONS.map((tag) => (
                        <Badge
                          key={tag}
                          variant={(asset.tags || []).includes(tag) ? 'default' : 'outline'}
                          className="text-[10px] cursor-pointer px-1.5 py-0"
                          onClick={() => toggleTag.mutate({ id: asset.id, currentTags: asset.tags || [], tag })}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Delete button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAsset.mutate(asset);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : !isLoading ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Keine Fotos hochgeladen</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Portraits und Situationsbilder helfen der KI, passende Visuals vorzuschlagen.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={(o) => !o && setLightboxUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vorschau</DialogTitle>
          </DialogHeader>
          {lightboxUrl && (
            <img src={lightboxUrl} alt="Vorschau" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
