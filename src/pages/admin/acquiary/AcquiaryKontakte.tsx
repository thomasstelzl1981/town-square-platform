/**
 * AcquiaryKontakte — Aggregated Contact View across all Mandates
 */
import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Loader2, Search, Mail, Building2, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface StagedContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_name: string | null;
  source: string;
  status: string;
  mandate_id: string | null;
  created_at: string;
  mandate?: { code: string } | null;
}

export default function AcquiaryKontakte() {
  const [search, setSearch] = React.useState('');
  const [sourceFilter, setSourceFilter] = React.useState('all');

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['acquiary-kontakte'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_staging')
        .select(`
          id, first_name, last_name, email, company_name, source, status, mandate_id, created_at,
          mandate:acq_mandates(code)
        `)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as StagedContact[];
    },
  });

  const filtered = React.useMemo(() => {
    return contacts.filter(c => {
      if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
      if (search) {
        const term = search.toLowerCase();
        const name = [c.first_name, c.last_name].filter(Boolean).join(' ').toLowerCase();
        return (
          name.includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.company_name?.toLowerCase().includes(term) ||
          c.mandate?.code?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [contacts, search, sourceFilter]);

  const stats = {
    total: contacts.length,
    pending: contacts.filter(c => c.status === 'pending').length,
    approved: contacts.filter(c => c.status === 'approved').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm text-muted-foreground">Kontakte gesamt</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.pending}</div><div className="text-sm text-muted-foreground">Ausstehend</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.approved}</div><div className="text-sm text-muted-foreground">Freigegeben</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Name, E-Mail, Firma, Mandat..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-44">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Quelle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Quellen</SelectItem>
            <SelectItem value="apollo">Apollo</SelectItem>
            <SelectItem value="import">Import</SelectItem>
            <SelectItem value="manual">Manuell</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground">{filtered.length} Kontakte</div>

      {/* Contact List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Keine Kontakte</h3>
            <p className="text-muted-foreground mt-2">Noch keine Kontakte in der Staging-Tabelle.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(contact => {
            const displayName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unbenannt';
            return (
            <Card key={contact.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{displayName}</span>
                        {contact.status && (
                          <Badge variant={contact.status === 'approved' ? 'default' : 'secondary'}>
                            {contact.status}
                          </Badge>
                        )}
                        {contact.mandate && (
                          <Badge variant="outline" className="font-mono text-xs">{contact.mandate.code}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        {contact.email && (
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>
                        )}
                        {contact.company_name && (
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{contact.company_name}</span>
                        )}
                        <span>{formatDistanceToNow(new Date(contact.created_at), { locale: de, addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  {contact.source && (
                    <Badge variant="outline">{contact.source}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
