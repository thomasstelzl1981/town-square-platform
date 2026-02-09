/**
 * Social Assets — Photo & Media Library
 * Phase 6: Upload portraits (max 20), tag editor, gallery
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ImageIcon, Upload, Trash2, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

const TAG_OPTIONS = ['Business', 'Casual', 'Outdoor', 'Speaking', 'Portrait', 'Team', 'Event'];

interface SocialAsset {
  id: string;
  document_id: string;
  tags: string[] | null;
  asset_type: string;
  sort_order: number;
}

export function AssetsPage() {
  const { activeOrganization, user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || 'dev-user';
  const [uploading, setUploading] = useState(false);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['social-assets', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      const { data } = await supabase
        .from('social_assets')
        .select('*')
        .eq('tenant_id', activeOrganization.id)
        .order('sort_order', { ascending: true });
      return (data || []) as SocialAsset[];
    },
    enabled: !!activeOrganization?.id,
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
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-assets'] }),
  });

  const handleUpload = async () => {
    if (!activeOrganization?.id) return;
    if (assets.length >= 20) {
      toast({ title: 'Maximum erreicht', description: 'Maximal 20 Assets erlaubt.', variant: 'destructive' });
      return;
    }
    // For now, create a placeholder asset (real upload would use DMS)
    setUploading(true);
    try {
      const { error } = await supabase.from('social_assets').insert({
        tenant_id: activeOrganization.id,
        owner_user_id: userId,
        document_id: crypto.randomUUID(), // placeholder
        asset_type: 'portrait',
        sort_order: assets.length + 1,
        tags: ['Portrait'],
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['social-assets'] });
      toast({ title: 'Asset hinzugefügt' });
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="text-muted-foreground mt-1">
            Lade bis zu 20 Fotos hoch und tagge sie — Business, Casual, Outdoor, Speaking.
          </p>
        </div>
        {assets.length > 0 && <Badge variant="outline">{assets.length}/20</Badge>}
      </div>

      {assets.length < 20 && (
        <Button className="gap-2" onClick={handleUpload} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Foto hinzufügen
        </Button>
      )}

      {assets.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {assets.map((asset) => (
            <Card key={asset.id} className="relative group">
              <CardContent className="p-3 space-y-2">
                <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {TAG_OPTIONS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={(asset.tags || []).includes(tag) ? 'default' : 'outline'}
                      className="text-xs cursor-pointer"
                      onClick={() => toggleTag.mutate({ id: asset.id, currentTags: asset.tags || [], tag })}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => deleteAsset.mutate(asset.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}
