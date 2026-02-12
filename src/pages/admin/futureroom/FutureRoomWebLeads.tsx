/**
 * FutureRoomWebLeads — Zone 1: Incoming leads from Zone 3 website
 * 
 * Shows finance_requests where source = 'zone3_quick' or 'zone3_website'
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Mail, Phone, Building2, Clock, Eye, UserCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function FutureRoomWebLeads() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: leads, isLoading } = useQuery({
    queryKey: ['futureroom-web-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_requests')
        .select('*')
        .in('source', ['zone3_quick', 'zone3_website'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const selectedLead = leads?.find(l => l.id === selectedId);

  const getSourceBadge = (source: string) => {
    if (source === 'zone3_quick') return <Badge variant="secondary" className="text-xs">Schnellanfrage</Badge>;
    return <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Akte</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted_to_zone1': return <Badge variant="destructive" className="text-xs">Neu</Badge>;
      case 'draft': return <Badge variant="outline" className="text-xs">Entwurf</Badge>;
      default: return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Globe className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Website-Anfragen</h2>
        <Badge variant="secondary">{leads?.length || 0}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {(!leads || leads.length === 0) ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Noch keine Website-Anfragen eingegangen.</p>
              </CardContent>
            </Card>
          ) : (
            leads.map(lead => (
              <Card 
                key={lead.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${selectedId === lead.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedId(lead.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {(lead as any).contact_first_name || '–'} {(lead as any).contact_last_name || ''}
                        </span>
                        {getSourceBadge((lead as any).source || 'portal')}
                        {getStatusBadge(lead.status)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {(lead as any).contact_email && (
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{(lead as any).contact_email}</span>
                        )}
                        {lead.purchase_price && (
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{Number(lead.purchase_price).toLocaleString('de-DE')} €</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(lead.created_at), 'dd.MM.yy HH:mm', { locale: de })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div>
          {selectedLead ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Anfrage-Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{(selectedLead as any).contact_first_name} {(selectedLead as any).contact_last_name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">E-Mail</span><span className="font-medium">{(selectedLead as any).contact_email || '–'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Telefon</span><span className="font-medium">{(selectedLead as any).contact_phone || '–'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Kaufpreis</span><span className="font-medium">{selectedLead.purchase_price ? `${Number(selectedLead.purchase_price).toLocaleString('de-DE')} €` : '–'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Eigenkapital</span><span className="font-medium">{selectedLead.equity_amount ? `${Number(selectedLead.equity_amount).toLocaleString('de-DE')} €` : '–'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Zweck</span><span className="font-medium">{selectedLead.purpose || '–'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Quelle</span>{getSourceBadge((selectedLead as any).source)}</div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span>{getStatusBadge(selectedLead.status)}</div>
                </div>
                {selectedLead.applicant_snapshot && (
                  <details className="pt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer">Snapshot-Daten anzeigen</summary>
                    <pre className="text-xs mt-2 p-2 rounded bg-muted overflow-auto max-h-48">
                      {JSON.stringify(selectedLead.applicant_snapshot, null, 2)}
                    </pre>
                  </details>
                )}
                <button className="w-full mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Manager zuweisen
                </button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="text-sm">Anfrage auswählen</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
