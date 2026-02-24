/**
 * DeskContactBook — Shared, desk-scoped Contact Research + Pool component
 * Used by all operative desks (Acquiary, Sales, Finance, Lead, Pet).
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Loader2, Search, Mail, Building2,
  Plus, Play, X, CheckCircle2, Clock, Sparkles,
  Globe, Phone, ExternalLink, UserPlus, ChevronDown, ChevronUp, MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  useDeskContacts,
  useDeskSoatOrders,
  useDeskSoatResults,
  useCreateDeskSoatOrder,
  useStartDeskSoatOrder,
  useAdoptSoatResult,
  type SoatSearchOrder,
  type SoatSearchResult,
} from '@/hooks/useDeskContacts';
import { useCancelSoatOrder } from '@/hooks/useSoatSearchEngine';

/* ─── Types ─── */

export interface SearchPreset {
  label: string;
  intent: string;
  icon?: LucideIcon;
  /** Maps to CATEGORY_REGISTRY code for strategy-based pipelines */
  category_code?: string;
}

interface DeskContactBookProps {
  desk: string;
  title: string;
  searchPresets: SearchPreset[];
}

/* ─── Preset Search Panel ─── */

function PresetSearchPanel({ desk, presets }: { desk: string; presets: SearchPreset[] }) {
  const [selectedPreset, setSelectedPreset] = React.useState<SearchPreset | null>(null);
  const [region, setRegion] = React.useState('');
  const [count, setCount] = React.useState(25);
  const createOrder = useCreateDeskSoatOrder(desk);
  const startOrder = useStartDeskSoatOrder(desk);

  const handleSearch = async () => {
    if (!selectedPreset) {
      toast.error('Bitte wähle eine Kategorie');
      return;
    }
    const title = region
      ? `${selectedPreset.label} ${region}`
      : selectedPreset.label;
    const intent = region
      ? `${selectedPreset.intent} ${region}`
      : selectedPreset.intent;

    try {
      const order = await createOrder.mutateAsync({ title, intent, target_count: count });
      await startOrder.mutateAsync(order.id);
      toast.success('Recherche gestartet');
      setSelectedPreset(null);
      setRegion('');
    } catch {
      toast.error('Fehler beim Starten der Recherche');
    }
  };

  const isPending = createOrder.isPending || startOrder.isPending;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Kontakt-Recherche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Chips */}
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const Icon = preset.icon || Building2;
            const isActive = selectedPreset?.label === preset.label;
            return (
              <button
                key={preset.label}
                onClick={() => setSelectedPreset(isActive ? null : preset)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                  transition-all border cursor-pointer
                  ${isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background border-border/60 hover:border-primary/40 hover:bg-primary/5 text-foreground'
                  }
                `}
              >
                <Icon className="h-3.5 w-3.5" />
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Region + Count + Button */}
        {selectedPreset && (
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />Region
              </label>
              <Input
                placeholder="z.B. München, Berlin, Hamburg..."
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Anzahl</label>
              <Input
                type="number"
                min={5}
                max={100}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-20"
              />
            </div>
            <Button onClick={handleSearch} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              Recherche starten
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Status Badge ─── */

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

/* ─── Order Card ─── */

function OrderCard({ order, isSelected, onToggle }: {
  order: SoatSearchOrder; isSelected: boolean; onToggle: () => void;
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

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
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

/* ─── Results Inline ─── */

function ResultsInline({ orderId, desk }: { orderId: string; desk: string }) {
  const { data: results = [], isLoading } = useDeskSoatResults(orderId);
  const adoptMutation = useAdoptSoatResult(desk);

  if (isLoading) return <div className="p-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (results.length === 0) return <div className="p-4 text-sm text-muted-foreground text-center">Noch keine Ergebnisse.</div>;

  return (
    <div className="space-y-1.5 p-3 max-h-[400px] overflow-y-auto">
      {results.map((r) => {
        // Map SoatSearchResult to ResearchContact shape for shared card
        const mapped = {
          name: r.company_name || r.contact_person_name || '–',
          email: r.email || null,
          phone: r.phone || null,
          website: r.website_url || null,
          address: r.city || null,
          rating: null,
          reviews_count: null,
          confidence: (r.confidence_score || 0) * 100,
          sources: ['soat'] as string[],
        };
        return (
          <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/40 p-3 hover:bg-muted/30 transition-colors">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{mapped.name}</span>
                {r.confidence_score > 0.7 && <Badge variant="outline" className="text-xs text-primary">✓ {Math.round(r.confidence_score * 100)}%</Badge>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                {r.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>}
                {r.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>}
                {r.city && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{r.city}</span>}
                {r.website_url && (
                  <a href={r.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink className="h-3 w-3" />Web
                  </a>
                )}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => adoptMutation.mutate(r)} disabled={adoptMutation.isPending} className="shrink-0">
              <UserPlus className="h-3 w-3 mr-1" />Übernehmen
            </Button>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Orders Section ─── */

function OrdersSection({ desk }: { desk: string }) {
  const { data: orders = [], isLoading } = useDeskSoatOrders(desk);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);

  const activeOrders = orders.filter((o) => ['draft', 'queued', 'running'].includes(o.status));
  const doneOrders = orders.filter((o) => ['completed', 'cancelled'].includes(o.status));

  if (isLoading) return <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (orders.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          Recherche-Aufträge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="active" className="flex-1">Aktiv ({activeOrders.length})</TabsTrigger>
            <TabsTrigger value="done" className="flex-1">Abgeschlossen ({doneOrders.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-2 mt-3">
            {activeOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Keine aktiven Aufträge</p>
            ) : activeOrders.map((o) => (
              <React.Fragment key={o.id}>
                <OrderCard order={o} isSelected={selectedOrderId === o.id} onToggle={() => setSelectedOrderId((prev) => prev === o.id ? null : o.id)} />
                {selectedOrderId === o.id && <ResultsInline orderId={o.id} desk={desk} />}
              </React.Fragment>
            ))}
          </TabsContent>
          <TabsContent value="done" className="space-y-2 mt-3">
            {doneOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Keine abgeschlossenen Aufträge</p>
            ) : doneOrders.map((o) => (
              <React.Fragment key={o.id}>
                <OrderCard order={o} isSelected={selectedOrderId === o.id} onToggle={() => setSelectedOrderId((prev) => prev === o.id ? null : o.id)} />
                {selectedOrderId === o.id && <ResultsInline orderId={o.id} desk={desk} />}
              </React.Fragment>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* ─── Contact Pool ─── */

function ContactPool({ desk }: { desk: string }) {
  const [search, setSearch] = React.useState('');
  const { data: contacts = [], isLoading } = useDeskContacts(desk);

  const filtered = React.useMemo(() => {
    if (!search) return contacts;
    const term = search.toLowerCase();
    return contacts.filter((c) => {
      const name = [c.first_name, c.last_name].filter(Boolean).join(' ').toLowerCase();
      return name.includes(term) || c.email?.toLowerCase().includes(term) || c.company_name?.toLowerCase().includes(term);
    });
  }, [contacts, search]);

  const stats = {
    total: contacts.length,
    pending: contacts.filter((c) => c.status === 'pending').length,
    approved: contacts.filter((c) => c.status === 'approved').length,
  };

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid gap-3 grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-muted-foreground">Kontakte</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.pending}</div><div className="text-xs text-muted-foreground">Ausstehend</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.approved}</div><div className="text-xs text-muted-foreground">Freigegeben</div></CardContent></Card>
      </div>

      {/* Contact Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Kontaktbuch
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Suche..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-56" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Keine Kontakte</h3>
              <p className="text-muted-foreground mt-2">Starte eine Recherche, um Kontakte zu finden.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground mb-2">{filtered.length} Kontakte</div>
              {filtered.map((c) => {
                const displayName = [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unbenannt';
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{displayName}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          {c.company_name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{c.company_name}</span>}
                          {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                        </div>
                      </div>
                    </div>
                    <Badge variant={c.status === 'approved' ? 'default' : 'secondary'} className="shrink-0">
                      {c.status === 'approved' ? 'Freigegeben' : c.status === 'pending' ? 'Ausstehend' : c.status}
                    </Badge>
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

/* ─── Main Export ─── */

export default function DeskContactBook({ desk, title, searchPresets }: DeskContactBookProps) {
  return (
    <div className="space-y-6">
      <PresetSearchPanel desk={desk} presets={searchPresets} />
      <OrdersSection desk={desk} />
      <ContactPool desk={desk} />
    </div>
  );
}
