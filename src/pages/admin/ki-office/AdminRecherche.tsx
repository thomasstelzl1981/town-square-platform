/**
 * AdminRecherche — SOAT Search Engine with Widget-Grid + Inline Case
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useSoatOrders,
  useSoatResults,
  useCreateSoatOrder,
  useStartSoatOrder,
  useCancelSoatOrder,
  useUpdateSoatResult,
  type SoatSearchOrder,
  type SoatSearchResult,
} from '@/hooks/useSoatSearchEngine';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Play,
  Square,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Mail,
  Phone,
  Globe,
  User,
  Download,
  AlertTriangle,
  Zap,
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Entwurf', color: 'bg-muted text-muted-foreground', icon: <Clock className="h-3 w-3" /> },
  queued: { label: 'Warteschlange', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', icon: <Clock className="h-3 w-3" /> },
  running: { label: 'Läuft...', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  needs_review: { label: 'Review', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: <AlertTriangle className="h-3 w-3" /> },
  done: { label: 'Fertig', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { label: 'Fehler', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: <XCircle className="h-3 w-3" /> },
  cancelled: { label: 'Abgebrochen', color: 'bg-muted text-muted-foreground', icon: <Square className="h-3 w-3" /> },
};

const PHASE_LABELS: Record<string, string> = {
  strategy: 'Strategie',
  discovery: 'Suche',
  crawl: 'Crawling',
  extract: 'Extraktion',
  validate: 'Validierung',
  finalize: 'Abschluss',
};

const VALIDATION_STATES: Record<string, { label: string; color: string }> = {
  candidate: { label: 'Kandidat', color: 'bg-muted text-muted-foreground' },
  validated: { label: 'Validiert', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  needs_review: { label: 'Review', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  rejected: { label: 'Abgelehnt', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  imported: { label: 'Importiert', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  suppressed: { label: 'Unterdrückt', color: 'bg-muted text-muted-foreground' },
};

export default function AdminRecherche() {
  const { data: orders = [], isLoading } = useSoatOrders();
  const createOrder = useCreateSoatOrder();
  const startOrder = useStartSoatOrder();
  const cancelOrder = useCancelSoatOrder();
  const updateResult = useUpdateSoatResult();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIntent, setNewIntent] = useState('');
  const [newTarget, setNewTarget] = useState('25');
  const [filter, setFilter] = useState<string>('all');
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;
  const { data: results = [] } = useSoatResults(selectedOrderId);

  const filteredResults = filter === 'all'
    ? results
    : results.filter(r => r.validation_state === filter);

  const counters = selectedOrder?.counters_json || {};

  const handleCreate = async () => {
    if (!newTitle.trim()) { toast.error('Titel erforderlich'); return; }
    try {
      const order = await createOrder.mutateAsync({
        title: newTitle,
        intent: newIntent,
        target_count: parseInt(newTarget) || 25,
      });
      setSelectedOrderId(order.id);
      setCreateOpen(false);
      setNewTitle('');
      setNewIntent('');
      toast.success('Auftrag erstellt');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleStart = async () => {
    if (!selectedOrderId) return;
    try {
      await startOrder.mutateAsync(selectedOrderId);
      toast.success('Recherche gestartet');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCancel = async () => {
    if (!selectedOrderId) return;
    await cancelOrder.mutateAsync(selectedOrderId);
    toast.info('Auftrag abgebrochen');
  };

  const handleValidate = (result: SoatSearchResult, state: string) => {
    updateResult.mutate({ id: result.id, orderId: result.order_id, validation_state: state });
  };

  const handleBulkImport = async () => {
    if (selectedResults.size === 0) { toast.error('Keine Ergebnisse ausgewählt'); return; }
    const toImport = results.filter(r => selectedResults.has(r.id) && r.email);
    let imported = 0;
    for (const r of toImport) {
      try {
        const { error } = await supabase.from('contacts').insert({
          first_name: r.contact_person_name?.split(' ')[0] || 'Unbekannt',
          last_name: r.contact_person_name?.split(' ').slice(1).join(' ') || r.company_name || 'Unbekannt',
          email: r.email,
          phone: r.phone,
          company: r.company_name,
          city: r.city,
          category: r.category || 'Sonstige',
          scope: 'zone1_admin',
          tenant_id: null,
          permission_status: 'unknown',
        } as any);
        if (!error) {
          imported++;
          updateResult.mutate({ id: r.id, orderId: r.order_id, validation_state: 'imported' });
        }
      } catch { /* skip dupes */ }
    }
    toast.success(`${imported} Kontakte importiert`);
    setSelectedResults(new Set());
  };

  const toggleResult = (id: string) => {
    const s = new Set(selectedResults);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedResults(s);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Widget Grid — Orders */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Create Widget */}
        <Card
          className="cursor-pointer border-dashed hover:border-primary/50 transition-colors"
          onClick={() => setCreateOpen(true)}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 min-h-[120px]">
            <Plus className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm font-medium">Neuer Auftrag</span>
          </CardContent>
        </Card>

        {/* Order Widgets */}
        {orders.map((order) => {
          const st = STATUS_MAP[order.status] || STATUS_MAP.draft;
          const isSelected = selectedOrderId === order.id;
          const c = order.counters_json as Record<string, number> | null;
          return (
            <Card
              key={order.id}
              className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}
              onClick={() => setSelectedOrderId(order.id)}
            >
              <CardContent className="p-4 space-y-2 min-h-[120px]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate flex-1">{order.title || 'Ohne Titel'}</span>
                  <Badge variant="outline" className={`text-xs ${st.color} ml-2 shrink-0`}>
                    <span className="mr-1">{st.icon}</span>
                    {st.label}
                  </Badge>
                </div>
                {(order.status === 'running' || order.status === 'queued') && (
                  <Progress value={order.progress_percent} className="h-1.5" />
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{c?.firms_found || 0}</span>
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c?.emails_found || 0}</span>
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{c?.contacts_extracted || 0}</span>
                </div>
                {order.phase && (order.status === 'running') && (
                  <span className="text-xs text-primary">{PHASE_LABELS[order.phase] || order.phase}</span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inline Case — Selected Order */}
      {selectedOrder && (
        <div className="space-y-4">
          {/* Section 1: Define + Start */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <h2 className="text-lg font-semibold">{selectedOrder.title || 'Ohne Titel'}</h2>
                  {selectedOrder.intent && <p className="text-sm text-muted-foreground">{selectedOrder.intent}</p>}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Ziel: {selectedOrder.target_count} Kontakte</span>
                    <Badge variant="outline" className={STATUS_MAP[selectedOrder.status]?.color}>
                      {STATUS_MAP[selectedOrder.status]?.label}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {selectedOrder.status === 'draft' && (
                    <Button onClick={handleStart} disabled={startOrder.isPending}>
                      {startOrder.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                      Starten
                    </Button>
                  )}
                  {(selectedOrder.status === 'running' || selectedOrder.status === 'queued') && (
                    <Button variant="destructive" onClick={handleCancel}>
                      <Square className="h-4 w-4 mr-2" />
                      Abbrechen
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Live Progress */}
          {(selectedOrder.status === 'running' || selectedOrder.status === 'queued') && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fortschritt</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedOrder.progress_percent}% — {PHASE_LABELS[selectedOrder.phase || ''] || 'Vorbereitung'}
                  </span>
                </div>
                <Progress value={selectedOrder.progress_percent} className="h-2" />
                <div className="flex items-center gap-6 text-sm">
                  <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-muted-foreground" /> {counters.firms_found || 0} Firmen</span>
                  <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-muted-foreground" /> {counters.contacts_extracted || 0} Kontakte</span>
                  <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-muted-foreground" /> {counters.emails_found || 0} E-Mails</span>
                  <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-muted-foreground" /> {counters.phones_found || 0} Telefon</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 3: Results Table */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">Ergebnisse ({results.length})</h3>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="candidate">Kandidaten</SelectItem>
                      <SelectItem value="validated">Validiert</SelectItem>
                      <SelectItem value="needs_review">Review</SelectItem>
                      <SelectItem value="imported">Importiert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedResults.size > 0 && (
                  <Button size="sm" onClick={handleBulkImport}>
                    <Download className="h-4 w-4 mr-2" />
                    {selectedResults.size} ins Kontaktbuch
                  </Button>
                )}
              </div>

              {filteredResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>{selectedOrder.status === 'draft' ? 'Starten Sie den Auftrag, um Ergebnisse zu erhalten' : 'Noch keine Ergebnisse'}</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {filteredResults.map((r) => {
                      const vs = VALIDATION_STATES[r.validation_state] || VALIDATION_STATES.candidate;
                      return (
                        <div
                          key={r.id}
                          className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                            selectedResults.has(r.id) ? 'border-primary bg-primary/5' : 'hover:border-border/80'
                          }`}
                        >
                          <Checkbox
                            checked={selectedResults.has(r.id)}
                            onCheckedChange={() => toggleResult(r.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{r.company_name || 'Unbekannt'}</span>
                              {r.category && <Badge variant="outline" className="text-xs">{r.category}</Badge>}
                              <Badge variant="outline" className={`text-xs ${vs.color}`}>{vs.label}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {r.contact_person_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{r.contact_person_name}</span>}
                              {r.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>}
                              {r.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>}
                              {r.city && <span>{r.city}</span>}
                              {r.website_url && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />Web</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {r.validation_state === 'candidate' && (
                              <>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleValidate(r, 'validated')}>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />OK
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleValidate(r, 'rejected')}>
                                  <XCircle className="h-3 w-3 mr-1" />Nein
                                </Button>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground w-8 text-right shrink-0">
                            {r.confidence_score}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state when no order selected */}
      {!selectedOrder && orders.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Wählen Sie einen Auftrag oder erstellen Sie einen neuen</p>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Recherche-Auftrag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Titel *</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="z.B. Makler Hamburg" />
            </div>
            <div className="space-y-2">
              <Label>Was suchen Sie?</Label>
              <Input value={newIntent} onChange={(e) => setNewIntent(e.target.value)} placeholder="z.B. Immobilienmakler in Hamburg mit Fokus Gewerbe" />
            </div>
            <div className="space-y-2">
              <Label>Zielanzahl</Label>
              <Select value={newTarget} onValueChange={setNewTarget}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Kontakte</SelectItem>
                  <SelectItem value="25">25 Kontakte</SelectItem>
                  <SelectItem value="50">50 Kontakte</SelectItem>
                  <SelectItem value="100">100 Kontakte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Abbrechen</Button>
            <Button onClick={handleCreate} disabled={createOrder.isPending}>
              {createOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
