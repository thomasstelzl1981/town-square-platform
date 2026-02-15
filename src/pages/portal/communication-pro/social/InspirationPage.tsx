/**
 * Social Inspiration — Quellen & Patterns
 * Enhanced: Platform icons, expandable patterns, "Pattern anwenden" button
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
import { Lightbulb, Plus, Trash2, Loader2, Sparkles, ExternalLink, ChevronDown, PenTool, Linkedin, Instagram, Facebook, Youtube } from 'lucide-react';
import { DesktopOnly } from '@/components/shared/DesktopOnly';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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

const PLATFORM_META: Record<string, { label: string; icon: typeof Linkedin; color: string }> = {
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'text-[#0A66C2]' },
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-[#E4405F]' },
  facebook: { label: 'Facebook', icon: Facebook, color: 'text-[#1877F2]' },
  twitter: { label: 'X/Twitter', icon: ExternalLink, color: 'text-foreground' },
  youtube: { label: 'YouTube', icon: Youtube, color: 'text-[#FF0000]' },
  tiktok: { label: 'TikTok', icon: ExternalLink, color: 'text-foreground' },
};

export function InspirationPage() {
  const { activeOrganization, user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSampleDialog, setShowSampleDialog] = useState<string | null>(null);
  const [newSource, setNewSource] = useState({ platform: 'linkedin', display_name: '', profile_url: '' });
  const [sampleText, setSampleText] = useState('');
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set());
  const userId = user?.id || 'dev-user';

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
      const { error } = await supabase.functions.invoke('sot-social-extract-patterns', {
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

  const togglePatterns = (sampleId: string) => {
    setExpandedPatterns((prev) => {
      const next = new Set(prev);
      if (next.has(sampleId)) next.delete(sampleId);
      else next.add(sampleId);
      return next;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ideen & Inspiration</h1>
          <p className="text-muted-foreground mt-1">
            Hinterlege bis zu 10 Profile als Ideengeber — Patterns werden extrahiert, nichts kopiert.
          </p>
        </div>
        {sources.length > 0 && <Badge variant="outline">{sources.length}/10</Badge>}
      </div>

      {/* Add source — Desktop only */}
      <DesktopOnly>
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
                      <SelectItem value="facebook">Facebook</SelectItem>
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
      </DesktopOnly>

      {/* Sources list */}
      {sources.length > 0 ? (
        <div className="space-y-4">
          {sources.map((source) => {
            const meta = PLATFORM_META[source.platform] || PLATFORM_META.twitter;
            const PlatformIcon = meta.icon;
            const sourceSamples = samples.filter((s) => s.source_id === source.id);
            return (
              <Card key={source.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon className={`h-5 w-5 ${meta.color}`} />
                      <span className="font-medium text-sm">{source.display_name}</span>
                      <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                      {source.profile_url && (
                        <a href={source.profile_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Dialog open={showSampleDialog === source.id} onOpenChange={(o) => setShowSampleDialog(o ? source.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs gap-1 h-7"><Plus className="h-3 w-3" /> Beispielpost</Button>
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

                  {/* Samples */}
                  {sourceSamples.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                      {sourceSamples.map((sample) => {
                        const patterns = sample.extracted_patterns;
                        const isExpanded = expandedPatterns.has(sample.id);
                        return (
                          <div key={sample.id} className="text-xs space-y-1.5">
                            <p className="text-muted-foreground line-clamp-2">{sample.content_text}</p>
                            {patterns ? (
                              <div className="space-y-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs gap-1 h-6 px-2"
                                  onClick={() => togglePatterns(sample.id)}
                                >
                                  <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  Patterns anzeigen
                                </Button>

                                {isExpanded && (
                                  <div className="bg-muted/50 rounded-md p-2 space-y-1.5">
                                    {patterns.hook_type && (
                                      <div><span className="font-medium">Hook-Typ:</span> <span className="text-muted-foreground">{String(patterns.hook_type)}</span></div>
                                    )}
                                    {patterns.structure && (
                                      <div><span className="font-medium">Struktur:</span> <span className="text-muted-foreground">{String(patterns.structure)}</span></div>
                                    )}
                                    {patterns.cta_pattern && (
                                      <div><span className="font-medium">CTA-Pattern:</span> <span className="text-muted-foreground">{String(patterns.cta_pattern)}</span></div>
                                    )}
                                    {patterns.tone && (
                                      <div><span className="font-medium">Tonalität:</span> <span className="text-muted-foreground">{String(patterns.tone)}</span></div>
                                    )}
                                    {/* Fallback for other keys */}
                                    {Object.entries(patterns)
                                      .filter(([k]) => !['hook_type', 'structure', 'cta_pattern', 'tone'].includes(k))
                                      .map(([k, v]) => (
                                        <div key={k}><span className="font-medium capitalize">{k}:</span> <span className="text-muted-foreground">{typeof v === 'string' ? v : JSON.stringify(v)}</span></div>
                                      ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs gap-1 h-6 mt-1"
                                      onClick={() => navigate('../create', { state: { angle: `Inspiriert von Pattern: ${patterns.hook_type || 'Hook'}` } })}
                                    >
                                      <PenTool className="h-3 w-3" />
                                      Pattern anwenden
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs gap-1 h-6"
                                onClick={() => extractPatterns(sample.id)}
                                disabled={extractingId === sample.id}
                              >
                                {extractingId === sample.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                Patterns extrahieren
                              </Button>
                            )}
                          </div>
                        );
                      })}
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
