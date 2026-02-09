/**
 * Social Content Creation — Draft Editor + Copywriter Tools
 * Phase 8: 3-step generator, platform tabs, copywriter toolbar
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PenTool, Sparkles, Loader2, Copy, ArrowRight, Trash2, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface Draft {
  id: string;
  draft_title: string | null;
  content_linkedin: string | null;
  content_instagram: string | null;
  content_facebook: string | null;
  status: string;
  origin: string;
  platform_targets: string[] | null;
  created_at: string;
}

const COPYWRITER_ACTIONS = [
  { code: 'shorter', label: 'Kürzer', emoji: '✂️' },
  { code: 'longer', label: 'Ausführlicher', emoji: '📝' },
  { code: 'emotional', label: 'Emotionaler', emoji: '❤️' },
  { code: 'direct', label: 'Direkter', emoji: '🎯' },
  { code: 'professional', label: 'Professioneller', emoji: '👔' },
  { code: 'casual', label: 'Lockerer', emoji: '😊' },
  { code: 'story', label: 'Story-Format', emoji: '📖' },
  { code: 'controversial', label: 'Kontroverser', emoji: '🔥' },
  { code: 'cta_stronger', label: 'Stärkerer CTA', emoji: '💪' },
  { code: 'hook_better', label: 'Besserer Hook', emoji: '🪝' },
];

export function CreatePage() {
  const { activeOrganization, user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || 'dev-user';
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [rewriting, setRewriting] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({ topic: '', angle: '', format: 'linkedin_post' });
  const [editContent, setEditContent] = useState({ linkedin: '', instagram: '', facebook: '' });

  const { data: drafts = [] } = useQuery({
    queryKey: ['social-drafts', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      const { data } = await supabase
        .from('social_drafts')
        .select('*')
        .eq('tenant_id', activeOrganization.id)
        .order('created_at', { ascending: false });
      return (data || []) as Draft[];
    },
    enabled: !!activeOrganization?.id,
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['social-topics-list', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      const { data } = await supabase
        .from('social_topics')
        .select('id, topic_label')
        .eq('tenant_id', activeOrganization.id)
        .order('priority');
      return data || [];
    },
    enabled: !!activeOrganization?.id,
  });

  const generateDraft = async () => {
    if (!activeOrganization?.id) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-social-draft-generate', {
        body: {
          inbound_item_id: null,
          tenant_id: activeOrganization.id,
          topic: newForm.topic,
          angle: newForm.angle,
          format: newForm.format,
          owner_user_id: userId,
        },
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['social-drafts'] });
      setShowNewDialog(false);
      toast({ title: 'Draft generiert' });
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const openEditor = (draft: Draft) => {
    setEditingDraft(draft);
    setEditContent({
      linkedin: draft.content_linkedin || '',
      instagram: draft.content_instagram || '',
      facebook: draft.content_facebook || '',
    });
  };

  const saveDraft = async () => {
    if (!editingDraft) return;
    const { error } = await supabase.from('social_drafts').update({
      content_linkedin: editContent.linkedin,
      content_instagram: editContent.instagram,
      content_facebook: editContent.facebook,
    }).eq('id', editingDraft.id);
    if (error) {
      toast({ title: 'Fehler', variant: 'destructive' });
    } else {
      toast({ title: 'Gespeichert' });
      queryClient.invalidateQueries({ queryKey: ['social-drafts'] });
    }
  };

  const handleCopywriterAction = async (action: string, platform: string) => {
    const content = platform === 'linkedin' ? editContent.linkedin : platform === 'instagram' ? editContent.instagram : editContent.facebook;
    if (!content) return;
    setRewriting(action);
    try {
      const { data, error } = await supabase.functions.invoke('sot-social-draft-rewrite', {
        body: { content, action, platform, tenant_id: activeOrganization?.id },
      });
      if (error) throw error;
      const newContent = data?.rewritten || content;
      setEditContent((prev) => ({ ...prev, [platform]: newContent }));
    } catch {
      toast({ title: 'Rewrite fehlgeschlagen', variant: 'destructive' });
    } finally {
      setRewriting(null);
    }
  };

  const deleteDraft = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_drafts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-drafts'] });
      if (editingDraft) setEditingDraft(null);
    },
  });

  const markReady = async (id: string) => {
    await supabase.from('social_drafts').update({ status: 'ready' }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['social-drafts'] });
    toast({ title: 'Als fertig markiert' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Kopiert!' });
  };

  const statusColor: Record<string, string> = { draft: 'outline', ready: 'secondary', planned: 'default', posted_manual: 'default' };
  const statusLabel: Record<string, string> = { draft: 'Entwurf', ready: 'Fertig', planned: 'Geplant', posted_manual: 'Gepostet' };

  // Editor view
  if (editingDraft) {
    return (
      <div className="p-6 space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setEditingDraft(null)}>← Zurück</Button>
            <h1 className="text-xl font-bold mt-1">{editingDraft.draft_title || 'Unbenannter Draft'}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={saveDraft}>Speichern</Button>
            <Button size="sm" onClick={() => markReady(editingDraft.id)}>Als fertig markieren</Button>
          </div>
        </div>

        <Tabs defaultValue="linkedin">
          <TabsList>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="facebook">Facebook</TabsTrigger>
          </TabsList>
          {(['linkedin', 'instagram', 'facebook'] as const).map((platform) => (
            <TabsContent key={platform} value={platform} className="space-y-3">
              <Textarea
                rows={10}
                value={editContent[platform]}
                onChange={(e) => setEditContent((prev) => ({ ...prev, [platform]: e.target.value }))}
                className="font-mono text-sm"
              />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => copyToClipboard(editContent[platform])}>
                  <Copy className="h-3 w-3" /> Kopieren
                </Button>
                <span className="text-xs text-muted-foreground ml-2">{editContent[platform].length} Zeichen</span>
              </div>
              {/* Copywriter toolbar */}
              <div className="flex flex-wrap gap-1.5">
                {COPYWRITER_ACTIONS.map((a) => (
                  <Button
                    key={a.code}
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1 h-7"
                    onClick={() => handleCopywriterAction(a.code, platform)}
                    disabled={!!rewriting}
                  >
                    {rewriting === a.code ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>{a.emoji}</span>}
                    {a.label}
                  </Button>
                ))}
                {/* HeyGen Video Stub */}
                <HeyGenVideoStub draftId={editingDraft.id} tenantId={activeOrganization?.id} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  }

  // Draft list
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Creation</h1>
          <p className="text-muted-foreground mt-1">
            Erstelle und verfeinere Posts — KI-gestützt, in deinem Stil.
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Sparkles className="h-4 w-4" /> Neuer Entwurf</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Neuen Entwurf erstellen</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Thema</Label>
                <Input placeholder="z.B. Mietrendite optimieren" value={newForm.topic} onChange={(e) => setNewForm((p) => ({ ...p, topic: e.target.value }))} />
              </div>
              <div>
                <Label>Winkel / Angle</Label>
                <Input placeholder="z.B. Persönliche Erfahrung, Mythos entkräften" value={newForm.angle} onChange={(e) => setNewForm((p) => ({ ...p, angle: e.target.value }))} />
              </div>
              <div>
                <Label>Format</Label>
                <Select value={newForm.format} onValueChange={(v) => setNewForm((p) => ({ ...p, format: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linkedin_post">LinkedIn Post</SelectItem>
                    <SelectItem value="carousel">Karussell</SelectItem>
                    <SelectItem value="story">Story / Narrative</SelectItem>
                    <SelectItem value="listicle">Listicle</SelectItem>
                    <SelectItem value="hot_take">Hot Take / Meinung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={generateDraft} disabled={generating || !newForm.topic.trim()} className="gap-2">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generieren
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {drafts.length > 0 ? (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <Card key={draft.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => openEditor(draft)}>
              <CardContent className="py-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{draft.draft_title || 'Unbenannt'}</span>
                    <Badge variant={(statusColor[draft.status] as any) || 'outline'} className="text-xs">
                      {statusLabel[draft.status] || draft.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {draft.content_linkedin?.slice(0, 100) || 'Kein Inhalt'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <PenTool className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Noch kein Entwurf</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Erstelle deinen ersten Content — KI-gestützt, in deinem Stil.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Phase 11: HeyGen Video Stub — disabled button + config modal */
function HeyGenVideoStub({ draftId, tenantId }: { draftId: string; tenantId?: string }) {
  const [open, setOpen] = useState(false);

  const createStubJob = async () => {
    if (!tenantId) return;
    await supabase.from('social_video_jobs').insert({
      tenant_id: tenantId,
      draft_id: draftId,
      provider: 'stub',
      job_type: 'hook_video',
      input_payload: { aspect_ratio: '9:16', voice: 'auto', output_type: 'hook_video' },
      status: 'queued',
    });
    toast({ title: 'Video-Job erstellt (Stub)', description: 'HeyGen-Integration wird in einem zukünftigen Update verfügbar.' });
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-xs gap-1 h-7 opacity-60"
        onClick={() => setOpen(true)}
        disabled
      >
        <Video className="h-3 w-3" />
        Video (HeyGen) — bald verfügbar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Video aus Draft erstellen</DialogTitle>
            <DialogDescription>HeyGen-Integration — Konfiguration (Coming Soon)</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <Label>Video-Typ</Label>
              <Select defaultValue="hook_video">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hook_video">Hook-Video (15s)</SelectItem>
                  <SelectItem value="story_video">Story-Video (60s)</SelectItem>
                  <SelectItem value="reel_script">Reel-Script</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Aspect Ratio</Label>
              <Select defaultValue="9:16">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:16">9:16 (Story/Reel)</SelectItem>
                  <SelectItem value="1:1">1:1 (Feed)</SelectItem>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Diese Funktion wird mit der HeyGen-API-Integration verfügbar. Der Job wird als Stub gespeichert.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={createStubJob} variant="outline">Job erstellen (Stub)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
