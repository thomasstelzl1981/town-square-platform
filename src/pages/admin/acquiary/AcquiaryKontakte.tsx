/**
 * AcquiaryKontakte — Aggregated Contact View with SOAT Search Engine
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Users, Loader2, Search, Mail, Building2, Filter,
  Plus, Play, X, CheckCircle2, Clock, Sparkles,
  Globe, Phone, ExternalLink, UserPlus, Eye, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  useSoatOrders,
  useSoatResults,
  useCreateSoatOrder,
  useStartSoatOrder,
  useCancelSoatOrder,
  type SoatSearchOrder,
  type SoatSearchResult,
} from '@/hooks/useSoatSearchEngine';

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

/* ─── SOAT Search Section ─── */

function SoatNewOrderForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = React.useState('');
  const [intent, setIntent] = React.useState('');
  const [count, setCount] = React.useState(25);
  const createOrder = useCreateSoatOrder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createOrder.mutateAsync({ title, intent: intent || title, target_count: count });
      toast.success('Recherche-Auftrag erstellt');
      setTitle('');
      setIntent('');
      setCount(25);
      onCreated();
    } catch {
      toast.error('Fehler beim Erstellen');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] items-end p-4 bg-muted/30 rounded-xl border border-border/50">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Titel</label>
        <Input placeholder="z.B. Makler Berlin" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Suchintent</label>
        <Input placeholder="z.B. Immobilienmakler Großraum Berlin" value={intent} onChange={e => setIntent(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Anzahl</label>
        <Input type="number" min={5} max={100} value={count} onChange={e => setCount(Number(e.target.value))} className="w-20" />
      </div>
      <Button type="submit" disabled={createOrder.isPending} size="sm">
        {createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Erstellen
      </Button>
    </form>
  );
}

function statusBadge(status: string) {
  switch (status) {
    case 'running':
      return <Badge variant="default"><Clock className="h-3 w-3 mr-1" />Läuft</Badge>;
    case 'completed':
      return <Badge variant="default" className="bg-primary/10 text-primary border-primary/20"><CheckCircle2 className="h-3 w-3 mr-1" />Fertig</Badge>;
    case 'queued':
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Warteschlange</Badge>;
    case 'cancelled':
      return <Badge variant="secondary"><X className="h-3 w-3 mr-1" />Abgebrochen</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function SoatOrderCard({
  order, isSelected, onToggle, onStart,
}: {
  order: SoatSearchOrder;
  isSelected: boolean;
  onToggle: () => void;
  onStart: () => void;
}) {
  const cancelOrder = useCancelSoatOrder();

  return (
    <div
      className={`rounded-xl border transition-all cursor-pointer ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 hover:border-primary/30'}`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between p-3 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{order.title || 'Ohne Titel'}</span>
              {statusBadge(order.status)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {order.target_count} Ziel · {formatDistanceToNow(new Date(order.created_at), { locale: de, addSuffix: true })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          {order.status === 'draft' && (
            <Button size="sm" variant="default" onClick={onStart}>
              <Play className="h-3 w-3 mr-1" />Starten
            </Button>
          )}
          {(order.status === 'running' || order.status === 'queued') && (
            <Button size="sm" variant="ghost" onClick={() => cancelOrder.mutate(order.id)}>
              <X className="h-3 w-3" />
            </Button>
          )}
          {isSelected ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {(order.status === 'running' || order.status === 'queued') && (
        <div className="px-3 pb-3">
          <Progress value={order.progress_percent} className="h-1.5" />
        </div>
      )}
    </div>
  );
}

function SoatResultsInline({ orderId }: { orderId: string }) {
  const { data: results = [], isLoading } = useSoatResults(orderId);
  const queryClient = useQueryClient();
  const adoptMutation = useMutation({
    mutationFn: async (result: SoatSearchResult) => {
      const { error } = await supabase.from('contact_staging').insert({
        first_name: result.contact_person_name?.split(' ')[0] || null,
        last_name: result.contact_person_name?.split(' ').slice(1).join(' ') || null,
        email: result.email,
        company_name: result.company_name,
        source: 'soat',
        status: 'pending',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acquiary-kontakte'] });
      toast.success('Kontakt übernommen');
    },
    onError: () => toast.error('Fehler beim Übernehmen'),
  });

  if (isLoading) return <div className="p-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (results.length === 0) return <div className="p-4 text-sm text-muted-foreground text-center">Noch keine Ergebnisse.</div>;

  return (
    <div className="space-y-1.5 p-3 max-h-[400px] overflow-y-auto">
      {results.map(r => (
        <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/40 p-3 hover:bg-muted/30 transition-colors">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{r.company_name || r.contact_person_name || '–'}</span>
              {r.confidence_score > 0.7 && <Badge variant="outline" className="text-xs text-primary">✓ {Math.round(r.confidence_score * 100)}%</Badge>}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
              {r.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>}
              {r.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>}
              {r.city && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{r.city}</span>}
              {r.website_url && (
                <a href={r.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline" onClick={e => e.stopPropagation()}>
                  <ExternalLink className="h-3 w-3" />Web
                </a>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => adoptMutation.mutate(r)}
            disabled={adoptMutation.isPending}
            className="shrink-0"
          >
            <UserPlus className="h-3 w-3 mr-1" />Übernehmen
          </Button>
        </div>
      ))}
    </div>
  );
}

function SoatSearchSection() {
  const { data: orders = [], isLoading } = useSoatOrders();
  const startOrder = useStartSoatOrder();
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  const activeOrders = orders.filter(o => ['draft', 'queued', 'running'].includes(o.status));
  const doneOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status));

  const handleStart = async (orderId: string) => {
    try {
      await startOrder.mutateAsync(orderId);
      toast.success('Recherche gestartet');
    } catch {
      toast.error('Fehler beim Starten');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            SOAT Search Engine
          </CardTitle>
          <Button size="sm" variant={showForm ? 'secondary' : 'default'} onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {showForm ? 'Schließen' : 'Neue Recherche'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && <SoatNewOrderForm onCreated={() => setShowForm(false)} />}

        {isLoading ? (
          <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Noch keine Recherche-Aufträge. Starte eine neue Suche!
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="active" className="flex-1">Aktiv ({activeOrders.length})</TabsTrigger>
              <TabsTrigger value="done" className="flex-1">Abgeschlossen ({doneOrders.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="space-y-2 mt-3">
              {activeOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Keine aktiven Aufträge</p>
              ) : activeOrders.map(o => (
                <React.Fragment key={o.id}>
                  <SoatOrderCard
                    order={o}
                    isSelected={selectedOrderId === o.id}
                    onToggle={() => setSelectedOrderId(prev => prev === o.id ? null : o.id)}
                    onStart={() => handleStart(o.id)}
                  />
                  {selectedOrderId === o.id && <SoatResultsInline orderId={o.id} />}
                </React.Fragment>
              ))}
            </TabsContent>
            <TabsContent value="done" className="space-y-2 mt-3">
              {doneOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Keine abgeschlossenen Aufträge</p>
              ) : doneOrders.map(o => (
                <React.Fragment key={o.id}>
                  <SoatOrderCard
                    order={o}
                    isSelected={selectedOrderId === o.id}
                    onToggle={() => setSelectedOrderId(prev => prev === o.id ? null : o.id)}
                    onStart={() => handleStart(o.id)}
                  />
                  {selectedOrderId === o.id && <SoatResultsInline orderId={o.id} />}
                </React.Fragment>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Contact Pool Section (existing logic preserved) ─── */

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

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm text-muted-foreground">Kontakte gesamt</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.pending}</div><div className="text-sm text-muted-foreground">Ausstehend</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.approved}</div><div className="text-sm text-muted-foreground">Freigegeben</div></CardContent></Card>
      </div>

      {/* SOAT Search Engine */}
      <SoatSearchSection />

      {/* Contact Pool */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Kontakt-Pool
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Name, E-Mail, Firma..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 w-56" />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Quelle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Quellen</SelectItem>
                  <SelectItem value="apollo">Apollo</SelectItem>
                  <SelectItem value="soat">SOAT</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                  <SelectItem value="manual">Manuell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-3">{filtered.length} Kontakte</div>

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Keine Kontakte</h3>
              <p className="text-muted-foreground mt-2">Noch keine Kontakte in der Staging-Tabelle.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(contact => {
                const displayName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unbenannt';
                return (
                  <div key={contact.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{displayName}</span>
                          {contact.status && (
                            <Badge variant={contact.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                              {contact.status}
                            </Badge>
                          )}
                          {contact.mandate && (
                            <Badge variant="outline" className="font-mono text-xs">{contact.mandate.code}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>}
                          {contact.company_name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{contact.company_name}</span>}
                          <span>{formatDistanceToNow(new Date(contact.created_at), { locale: de, addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    {contact.source && <Badge variant="outline" className="shrink-0">{contact.source}</Badge>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
