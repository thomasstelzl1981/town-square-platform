/**
 * NcoreInbox — Inbox tab for Ncore Desk
 * Shows recent leads as timeline/inbox view
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Briefcase, Handshake } from 'lucide-react';
import { format } from 'date-fns';

export default function NcoreInbox() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .in('source', ['ncore_projekt', 'ncore_kooperation'])
        .order('created_at', { ascending: false })
        .limit(50);
      setLeads(data || []);
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Inbox — Neueste Anfragen</CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Keine Anfragen vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {leads.map(lead => {
              const raw = lead.raw_data as any;
              const isKoop = lead.source === 'ncore_kooperation';
              return (
                <div key={lead.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="mt-0.5">
                    {isKoop ? <Handshake className="h-5 w-5 text-emerald-600" /> : <Briefcase className="h-5 w-5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{raw?.name || 'Unbekannt'}</span>
                      <Badge variant="outline" className="text-xs">{isKoop ? 'Kooperation' : 'Projekt'}</Badge>
                      <Badge variant={lead.status === 'new' ? 'default' : 'secondary'} className="text-xs ml-auto">{lead.status}</Badge>
                    </div>
                    {raw?.email && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3" />{raw.email}</p>}
                    {lead.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lead.notes}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(lead.created_at), 'dd.MM. HH:mm')}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
