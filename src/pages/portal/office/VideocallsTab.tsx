import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Video, Plus, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export const VideocallsTab = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

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
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Erstellen');
    } finally {
      setCreating(false);
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
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Videocalls</h2>
            <p className="text-sm text-muted-foreground">Starten Sie gebrandete Videocalls direkt aus dem Portal</p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Neuer Videocall</label>
          <Input
            placeholder="Call-Titel (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </div>
        <Button onClick={handleCreate} disabled={creating} className="gap-2">
          <Plus className="h-4 w-4" />
          {creating ? 'Erstelle...' : 'Starten'}
        </Button>
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
    </div>
  );
};

export default VideocallsTab;
