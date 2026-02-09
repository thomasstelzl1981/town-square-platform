/**
 * Social Inspiration — Quellen & Patterns
 * Phase 5: Sources list (max 10), sample paste, pattern extraction
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Lightbulb, Plus, Trash2, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function useUserId() {
  const { user } = useAuth();
  return user?.id || 'dev-user';
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface InspirationSource {
  id: string;
  platform: string;
  display_name: string;
  profile_url: string | null;
}

interface InspirationSample {
  id: string;
  source_id: string;
  content_text: string;
  extracted_patterns: Record<string, unknown> | null;
}

export function InspirationPage() {
  const { activeOrganization } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSampleDialog, setShowSampleDialog] = useState<string | null>(null);
  const [newSource, setNewSource] = useState({ platform: 'linkedin', display_name: '', profile_url: '' });
  const [sampleText, setSampleText] = useState('');
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const userId = useUserId();

  const { data: sources = [] } = useQuery({
    queryKey: ['social-inspiration-sources', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      const { data } = await supabase
        .from('social_inspiration_sources')
        .select('*')
        .eq('tenant_id', activeOrganization.id)
        .order('created_at', { ascending: true });
      return (data || []) as InspirationSource[];
    },
    enabled: !!activeOrganization?.id,
  });

  const { data: samples = [] } = useQuery({
    queryKey: ['social-inspiration-samples', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      const { data } = await supabase
        .from('social_inspiration_samples')
        .select('*')
        .eq('tenant_id', activeOrganization.id)
        .order('created_at', { ascending: true });
      return (data || []) as InspirationSample[];
    },
    enabled: !!activeOrganization?.id,
  });

  const addSourceMutation = useMutation({
    mutationFn: async () => {
      if (!activeOrganization?.id) throw new Error('No org');
      const { error } = await supabase.from('social_inspiration_sources').insert({
        tenant_id: activeOrganization.id,
        owner_user_id: userId,
        platform: newSource.platform,
        display_name: newSource.display_name,
        profile_url: newSource.profile_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-inspiration-sources'] });
      setNewSource({ platform: 'linkedin', display_name: '', profile_url: '' });
      setShowAddDialog(false);
    },
    onError: () => toast({ title: 'Fehler', variant: 'destructive' }),
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('social_inspiration_samples').delete().eq('source_id', id);
      const { error } = await supabase.from('social_inspiration_sources').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-inspiration-sources'] });
      queryClient.invalidateQueries({ queryKey: ['social-inspiration-samples'] });
    },
  });

  const addSampleMutation = useMutation({
    mutationFn: async ({ sourceId, text }: { sourceId: string; text: string }) => {
      if (!activeOrganization?.id) throw new Error('No org');
      const { error } = await supabase.from('social_inspiration_samples').insert({
        tenant_id: activeOrganization.id,
        owner_user_id: userId,
        source_id: sourceId,
        content_text: text,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-inspiration-samples'] });
      setSampleText('');
      setShowSampleDialog(null);
    },
  });

  const extractPatterns = async (sampleId: string) => {
    const sample = samples.find((s) => s.id === sampleId);
    if (!sample) return;
    setExtractingId(sampleId);
    try {
      const { data, error } = await supabase.functions.invoke('sot-social-extract-patterns', {
        body: { sample_id: sampleId, content_text: sample.content_text },
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['social-inspiration-samples'] });
      toast({ title: 'Patterns extrahiert' });
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' });
    } finally {
      setExtractingId(null);
    }
  };

  const platformLabel: Record<string, string> = { linkedin: 'LinkedIn', instagram: 'Instagram', twitter: 'X/Twitter', youtube: 'YouTube', tiktok: 'TikTok' };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ideen & Inspiration</h1>
          <p className="text-muted-foreground mt-1">
            Hinterlege bis zu 10 Profile als Ideengeber — Patterns werden extrahiert, nichts kopiert.
          </p>
        </div>
        {sources.length > 0 && <Badge variant="outline">{sources.length}/10</Badge>}
      </div>

      {/* Add source */}
      {sources.length < 10 && (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Quelle hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Inspirationsquelle hinzufügen</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Plattform</Label>
                <Select value={newSource.platform} onValueChange={(v) => setNewSource((p) => ({ ...p, platform: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">X / Twitter</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name / Handle</Label>
                <Input placeholder="z.B. @garyvee" value={newSource.display_name} onChange={(e) => setNewSource((p) => ({ ...p, display_name: e.target.value }))} />
              </div>
              <div>
                <Label>Profil-URL (optional)</Label>
                <Input placeholder="https://..." value={newSource.profile_url} onChange={(e) => setNewSource((p) => ({ ...p, profile_url: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => addSourceMutation.mutate()} disabled={!newSource.display_name.trim()}>Hinzufügen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Sources list */}
      {sources.length > 0 ? (
        <div className="space-y-3">
          {sources.map((source) => {
            const sourceSamples = samples.filter((s) => s.source_id === source.id);
            return (
              <Card key={source.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{platformLabel[source.platform] || source.platform}</Badge>
                      <span className="font-medium text-sm">{source.display_name}</span>
                      {source.profile_url && (
                        <a href={source.profile_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Dialog open={showSampleDialog === source.id} onOpenChange={(o) => setShowSampleDialog(o ? source.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs gap-1"><Plus className="h-3 w-3" /> Beispielpost</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Beispielpost einfügen</DialogTitle></DialogHeader>
                          <Textarea placeholder="Post-Text hier einfügen…" rows={6} value={sampleText} onChange={(e) => setSampleText(e.target.value)} />
                          <DialogFooter>
                            <Button onClick={() => addSampleMutation.mutate({ sourceId: source.id, text: sampleText })} disabled={!sampleText.trim()}>Speichern</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSourceMutation.mutate(source.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {sourceSamples.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                      {sourceSamples.map((sample) => (
                        <div key={sample.id} className="text-xs space-y-1">
                          <p className="text-muted-foreground line-clamp-2">{sample.content_text}</p>
                          {sample.extracted_patterns ? (
                            <Badge variant="outline" className="text-xs">Patterns ✓</Badge>
                          ) : (
                            <Button variant="ghost" size="sm" className="text-xs gap-1 h-6" onClick={() => extractPatterns(sample.id)} disabled={extractingId === sample.id}>
                              {extractingId === sample.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                              Patterns extrahieren
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Lightbulb className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Keine Inspirationsquellen</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Füge Profile hinzu, deren Posting-Stil dich inspiriert.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
