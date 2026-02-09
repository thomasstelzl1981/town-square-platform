/**
 * Social Inbound — Individual Content Studio
 * Phase 7: Inbox list, upload, moment/effect/level dialog, draft generation
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Inbox, Plus, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface InboundItem {
  id: string;
  source: string;
  one_liner: string | null;
  moment_voice_text: string | null;
  desired_effect: string | null;
  personal_level: number | null;
  status: string;
}

export function InboundPage() {
  const { activeOrganization, user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || 'dev-user';
  const [showDialog, setShowDialog] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [form, setForm] = useState({
    one_liner: '',
    moment_voice_text: '',
    desired_effect: 'authority',
    personal_level: 5,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['social-inbound', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      const { data } = await supabase
        .from('social_inbound_items')
        .select('*')
        .eq('tenant_id', activeOrganization.id)
        .order('created_at', { ascending: false });
      return (data || []) as InboundItem[];
    },
    enabled: !!activeOrganization?.id,
  });

  const addItem = useMutation({
    mutationFn: async () => {
      if (!activeOrganization?.id) throw new Error('No org');
      const { error } = await supabase.from('social_inbound_items').insert({
        tenant_id: activeOrganization.id,
        owner_user_id: userId,
        source: 'manual',
        one_liner: form.one_liner,
        moment_voice_text: form.moment_voice_text,
        desired_effect: form.desired_effect,
        personal_level: form.personal_level,
        status: 'new',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-inbound'] });
      setShowDialog(false);
      setForm({ one_liner: '', moment_voice_text: '', desired_effect: 'authority', personal_level: 5 });
      toast({ title: 'Moment gespeichert' });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_inbound_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-inbound'] }),
  });

  const generateDraft = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item || !activeOrganization?.id) return;
    setGenerating(itemId);
    try {
      const { data, error } = await supabase.functions.invoke('sot-social-draft-generate', {
        body: { inbound_item_id: itemId, tenant_id: activeOrganization.id },
      });
      if (error) throw error;
      await supabase.from('social_inbound_items').update({ status: 'drafted' }).eq('id', itemId);
      queryClient.invalidateQueries({ queryKey: ['social-inbound'] });
      queryClient.invalidateQueries({ queryKey: ['social-drafts'] });
      toast({ title: 'Draft generiert', description: 'Wechsle zu Content Creation zum Bearbeiten.' });
    } catch {
      toast({ title: 'Fehler bei Draft-Generierung', variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  const statusLabel: Record<string, string> = { new: 'Neu', drafted: 'Draft erstellt', archived: 'Archiviert' };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Individual Content</h1>
          <p className="text-muted-foreground mt-1">
            Halte Momente fest und lass die KI daraus Posts erstellen.
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Moment festhalten</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Neuer Moment</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Einzeiler / Headline</Label>
                <Input placeholder="z.B. Heute einen Deal abgeschlossen" value={form.one_liner} onChange={(e) => setForm((p) => ({ ...p, one_liner: e.target.value }))} />
              </div>
              <div>
                <Label>Was ist passiert? (ausführlich)</Label>
                <Textarea placeholder="Beschreibe den Moment…" rows={4} value={form.moment_voice_text} onChange={(e) => setForm((p) => ({ ...p, moment_voice_text: e.target.value }))} />
              </div>
              <div>
                <Label>Gewünschter Effekt</Label>
                <Select value={form.desired_effect} onValueChange={(v) => setForm((p) => ({ ...p, desired_effect: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="authority">Authority / Expertise</SelectItem>
                    <SelectItem value="sympathy">Sympathie / Nahbarkeit</SelectItem>
                    <SelectItem value="leads">Lead-Generierung</SelectItem>
                    <SelectItem value="recruiting">Recruiting</SelectItem>
                    <SelectItem value="brand">Personal Brand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Persönlichkeitsgrad: {form.personal_level}/10</Label>
                <Slider value={[form.personal_level]} onValueChange={([v]) => setForm((p) => ({ ...p, personal_level: v }))} min={1} max={10} step={1} className="mt-2" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => addItem.mutate()} disabled={!form.one_liner.trim()}>Speichern</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{item.one_liner || 'Ohne Titel'}</span>
                    <Badge variant={item.status === 'drafted' ? 'secondary' : 'outline'} className="text-xs">
                      {statusLabel[item.status] || item.status}
                    </Badge>
                  </div>
                  {item.moment_voice_text && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.moment_voice_text}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.status === 'new' && (
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => generateDraft(item.id)} disabled={generating === item.id}>
                      {generating === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Draft
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteItem.mutate(item.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Inbox className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Kein Content eingereicht</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Halte einen Moment fest — per Text oder Sprache. Die KI erstellt daraus professionelle Posts.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
