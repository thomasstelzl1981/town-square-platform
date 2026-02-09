/**
 * Social Performance — Light Tracking + AI Analysis
 * Phase 10: Manual metrics per post, AI analysis
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { BarChart3, Plus, Sparkles, Loader2, TrendingUp, Eye, Heart, MessageCircle, Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface SocialMetric {
  id: string;
  draft_id: string;
  platform: string;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  clicks: number | null;
  collected_at: string;
  created_at: string;
}

interface PostedDraft {
  id: string;
  draft_title: string | null;
  posted_at: string | null;
  platform_targets: string[] | null;
}

export function PerformancePage() {
  const { activeOrganization } = useAuth();
  const queryClient = useQueryClient();
  const userId = useAuth().user?.id || 'dev-user';
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [metricForm, setMetricForm] = useState({
    platform: 'linkedin',
    impressions: 0,
    likes: 0,
    comments: 0,
    saves: 0,
    clicks: 0,
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['social-metrics', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      const { data } = await supabase
        .from('social_metrics')
        .select('*')
        .eq('tenant_id', activeOrganization.id)
        .order('created_at', { ascending: false });
      return (data || []) as SocialMetric[];
    },
    enabled: !!activeOrganization?.id,
  });

  const { data: postedDrafts = [] } = useQuery({
    queryKey: ['social-posted-drafts', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      const { data } = await supabase
        .from('social_drafts')
        .select('id, draft_title, posted_at, platform_targets')
        .eq('tenant_id', activeOrganization.id)
        .eq('status', 'posted_manual')
        .order('posted_at', { ascending: false });
      return (data || []) as PostedDraft[];
    },
    enabled: !!activeOrganization?.id,
  });

  const addMetric = useMutation({
    mutationFn: async () => {
      if (!activeOrganization?.id) throw new Error('No org');
      const { error } = await supabase.from('social_metrics').insert({
        tenant_id: activeOrganization.id,
        draft_id: selectedDraft || postedDrafts[0]?.id || '',
        platform: metricForm.platform,
        impressions: metricForm.impressions,
        likes: metricForm.likes,
        comments: metricForm.comments,
        saves: metricForm.saves,
        clicks: metricForm.clicks,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-metrics'] });
      setShowAddDialog(false);
      setMetricForm({ platform: 'linkedin', impressions: 0, likes: 0, comments: 0, saves: 0, clicks: 0 });
      toast({ title: 'Kennzahlen gespeichert' });
    },
  });

  const analyzePerformance = async () => {
    if (metrics.length === 0) {
      toast({ title: 'Keine Daten', description: 'Erfasse erst Kennzahlen.', variant: 'destructive' });
      return;
    }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-social-analyze-performance', {
        body: { tenant_id: activeOrganization?.id, metrics },
      });
      if (error) throw error;
      setAnalysisResult(data?.analysis || 'Keine Analyse verfügbar.');
    } catch {
      toast({ title: 'Analyse fehlgeschlagen', variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };

  const totalImpressions = metrics.reduce((s, m) => s + (m.impressions || 0), 0);
  const totalLikes = metrics.reduce((s, m) => s + (m.likes || 0), 0);
  const totalComments = metrics.reduce((s, m) => s + (m.comments || 0), 0);
  const avgEngagement = totalImpressions > 0 ? (((totalLikes + totalComments) / totalImpressions) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance</h1>
          <p className="text-muted-foreground mt-1">
            Erfasse Kennzahlen pro Post und erhalte KI-Analysen.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={analyzePerformance} disabled={analyzing || metrics.length === 0}>
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            KI-Analyse
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Kennzahlen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Kennzahlen erfassen</DialogTitle></DialogHeader>
              <div className="space-y-3">
                {postedDrafts.length > 0 && (
                  <div>
                    <Label>Post zuordnen</Label>
                    <select className="w-full border rounded-md p-2 text-sm" value={selectedDraft} onChange={(e) => setSelectedDraft(e.target.value)}>
                      <option value="">— Kein Post —</option>
                      {postedDrafts.map((d) => (
                        <option key={d.id} value={d.id}>{d.draft_title || 'Unbenannt'}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Plattform</Label>
                    <select className="w-full border rounded-md p-2 text-sm" value={metricForm.platform} onChange={(e) => setMetricForm((p) => ({ ...p, platform: e.target.value }))}>
                      <option value="linkedin">LinkedIn</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                    </select>
                  </div>
                  <div><Label>Impressions</Label><Input type="number" value={metricForm.impressions} onChange={(e) => setMetricForm((p) => ({ ...p, impressions: +e.target.value }))} /></div>
                  <div><Label>Likes</Label><Input type="number" value={metricForm.likes} onChange={(e) => setMetricForm((p) => ({ ...p, likes: +e.target.value }))} /></div>
                  <div><Label>Kommentare</Label><Input type="number" value={metricForm.comments} onChange={(e) => setMetricForm((p) => ({ ...p, comments: +e.target.value }))} /></div>
                  <div><Label>Saves</Label><Input type="number" value={metricForm.saves} onChange={(e) => setMetricForm((p) => ({ ...p, saves: +e.target.value }))} /></div>
                  <div><Label>Clicks</Label><Input type="number" value={metricForm.clicks} onChange={(e) => setMetricForm((p) => ({ ...p, clicks: +e.target.value }))} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => addMetric.mutate()}>Speichern</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary cards */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="py-3 text-center">
            <Eye className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <div className="text-lg font-bold">{totalImpressions.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Impressions</div>
          </CardContent></Card>
          <Card><CardContent className="py-3 text-center">
            <Heart className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <div className="text-lg font-bold">{totalLikes.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Likes</div>
          </CardContent></Card>
          <Card><CardContent className="py-3 text-center">
            <MessageCircle className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <div className="text-lg font-bold">{totalComments.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Kommentare</div>
          </CardContent></Card>
          <Card><CardContent className="py-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <div className="text-lg font-bold">{avgEngagement}%</div>
            <div className="text-xs text-muted-foreground">Engagement</div>
          </CardContent></Card>
        </div>
      )}

      {/* Analysis result */}
      {analysisResult && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">🤖 KI-Analyse</h3>
            <p className="text-sm whitespace-pre-line">{analysisResult}</p>
          </CardContent>
        </Card>
      )}

      {/* Metrics list */}
      {metrics.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Letzte Einträge</h3>
          {metrics.slice(0, 10).map((m) => (
            <Card key={m.id}>
              <CardContent className="py-3 flex items-center gap-3 text-sm">
                <Badge variant="secondary" className="text-xs">{m.platform}</Badge>
                <span className="text-muted-foreground">{m.impressions} Imp.</span>
                <span className="text-muted-foreground">{m.likes} ❤️</span>
                <span className="text-muted-foreground">{m.comments} 💬</span>
                <span className="text-muted-foreground ml-auto text-xs">
                  {new Date(m.created_at).toLocaleDateString('de-DE')}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Keine Kennzahlen</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Trage nach dem Posten Impressions, Likes und Kommentare ein.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
