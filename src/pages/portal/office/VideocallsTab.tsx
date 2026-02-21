import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Video, Plus, Clock, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

export const VideocallsTab = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);

  const { data: calls, isLoading, refetch } = useQuery({
    queryKey: ['video-calls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_calls' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!session,
  });

  const handleCreate = async () => {
    if (!session) return;
    setCreating(true);
    try {
      const res = await supabase.functions.invoke('sot-videocall-create', {
        body: { title: title || 'Videocall' },
      });
      if (res.error) throw res.error;
      const { callId } = res.data;
      toast.success('Videocall erstellt');
      navigate(`/portal/office/videocalls/${callId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err) || 'Fehler beim Erstellen');
    } finally {
      setCreating(false);
    }
  };

  const handleSendInvite = async () => {
    if (!session || !inviteEmail) return;
    setSending(true);
    try {
      // 1. Create the call (stays on page)
      const res = await supabase.functions.invoke('sot-videocall-create', {
        body: { title: title || 'Videocall' },
      });
      if (res.error) throw res.error;
      const { callId } = res.data;

      // 2. Send invitation
      const inviteRes = await supabase.functions.invoke('sot-videocall-invite-send', {
        body: {
          callId,
          inviteeEmail: inviteEmail,
          inviteeName: inviteName || undefined,
        },
      });
      if (inviteRes.error) throw inviteRes.error;

      toast.success('Einladung versendet');
      setTitle('');
      setInviteEmail('');
      setInviteName('');
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err) || 'Fehler beim Versenden');
    } finally {
      setSending(false);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'active': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'ended': return 'bg-muted text-muted-foreground';
      case 'expired': return 'bg-muted text-muted-foreground';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="Videocalls"
        description="Starte gebrandete Videocalls direkt aus dem Portal"
      />

      {/* New Call + Invite Section */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="text-sm font-medium">Neuer Videocall</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="vc-title" className="text-xs">Call-Titel</Label>
            <Input
              id="vc-title"
              placeholder="Call-Titel (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="vc-email" className="text-xs">E-Mail des Eingeladenen</Label>
              <Input
                id="vc-email"
                type="email"
                placeholder="email@beispiel.de"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vc-name" className="text-xs">Name (optional)</Label>
              <Input
                id="vc-name"
                placeholder="Max Mustermann"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleSendInvite}
              disabled={sending || !inviteEmail}
              variant="outline"
              className="gap-2"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Einladung versenden
            </Button>
            <Button onClick={handleCreate} disabled={creating} className="gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Sofort starten
            </Button>
          </div>
        </div>
      </div>

      {/* Calls List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Bisherige Calls</h3>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !calls?.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Noch keine Videocalls</p>
        ) : (
          <div className="space-y-2">
            {calls.map((call: any) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/portal/office/videocalls/${call.id}`)}
              >
                <div className="flex items-center gap-3">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{call.title || 'Videocall'}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(call.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={statusColor(call.status)}>
                  {call.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default VideocallsTab;
