/**
 * AdminRecherche — SOAT Search Engine: Desk-aligned Kacheln + Inline Case
 * Golden Path Standard: Desk-Karten → Auftrags-Liste → Inline-Flow
 */
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useSoatOrders, useSoatResults, useCreateSoatOrder, useStartSoatOrder,
  useCancelSoatOrder, useUpdateSoatResult, useDeleteSoatOrder,
  type SoatSearchOrder, type SoatSearchResult,
} from '@/hooks/useSoatSearchEngine';
import { useResearchImport } from '@/hooks/useResearchImport';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getXlsx } from '@/lib/lazyXlsx';
import {
  Plus, Search, Play, Square, Loader2, CheckCircle2, XCircle, Clock,
  Building2, Mail, Phone, Globe, User, Download, AlertTriangle, Zap,
  FileSpreadsheet, Upload, X, ShieldCheck, ShieldAlert, MinusCircle,
  Briefcase, TrendingUp, PawPrint, Trash2,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/* ── Desk Categories ─────────────────────────────────────────── */
const DESK_CATEGORIES = [
  { code: 'acquiary', label: 'Acquiary', subtitle: 'Family Offices & Immobilienunternehmen', icon: Building2 },
  { code: 'sales', label: 'Sales', subtitle: 'Immobilienmakler & Hausverwaltungen', icon: Briefcase },
  { code: 'finance', label: 'Finance', subtitle: 'Finanzvertriebe & Finanzdienstleister', icon: TrendingUp },
  { code: 'pet', label: 'Pet', subtitle: 'Hundepensionen, -hotels & -friseure', icon: PawPrint },
] as const;

type DeskCode = typeof DESK_CATEGORIES[number]['code'];

/* ── Status / Phase Maps ─────────────────────────────────────── */
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
  strategy: 'Strategie', discovery: 'Suche', crawl: 'Crawling',
  extract: 'Extraktion', validate: 'Validierung', finalize: 'Abschluss',
};

const VALIDATION_STATES: Record<string, { label: string; color: string }> = {
  candidate: { label: 'Kandidat', color: 'bg-muted text-muted-foreground' },
  validated: { label: 'Validiert', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  needs_review: { label: 'Review', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  rejected: { label: 'Abgelehnt', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  imported: { label: 'Importiert', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  suppressed: { label: 'Unterdrückt', color: 'bg-muted text-muted-foreground' },
};

type DupeCheckResult = {
  resultId: string;
  status: 'new' | 'duplicate' | 'no_email';
  existingContactId?: string;
};

export default function AdminRecherche() {
  const { data: orders = [], isLoading } = useSoatOrders();
  const createOrder = useCreateSoatOrder();
  const startOrder = useStartSoatOrder();
  const cancelOrder = useCancelSoatOrder();
  const deleteOrder = useDeleteSoatOrder();
  const updateResult = useUpdateSoatResult();
  const researchImport = useResearchImport();

  const [selectedDesk, setSelectedDesk] = useState<DeskCode | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());

  // Inline draft editing state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftIntent, setDraftIntent] = useState('');
  const [draftTarget, setDraftTarget] = useState('25');

  // Import preview state
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [dupeChecks, setDupeChecks] = useState<DupeCheckResult[]>([]);
  const [dupePolicy, setDupePolicy] = useState<'skip' | 'update'>('skip');
  const [isCheckingDupes, setIsCheckingDupes] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteDialogOrderId, setDeleteDialogOrderId] = useState<string | null>(null);

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;
  const { data: results = [] } = useSoatResults(selectedOrderId);

  /* ── Computed: Desk-level stats ─────────────────────────────── */
  const deskStats = useMemo(() => {
    const stats: Record<string, { active: number; contacts: number }> = {};
    for (const desk of DESK_CATEGORIES) {
      const deskOrders = orders.filter(o => (o as any).desk === desk.code);
      const active = deskOrders.filter(o => ['draft', 'queued', 'running', 'needs_review'].includes(o.status)).length;
      const contacts = deskOrders.reduce((sum, o) => {
        const c = o.counters_json as Record<string, number> | null;
        return sum + (c?.contacts_extracted || 0);
      }, 0);
      stats[desk.code] = { active, contacts };
    }
    return stats;
  }, [orders]);

  const deskOrders = useMemo(() => {
    if (!selectedDesk) return [];
    return orders.filter(o => (o as any).desk === selectedDesk);
  }, [orders, selectedDesk]);

  const filteredResults = filter === 'all'
    ? results
    : results.filter(r => r.validation_state === filter);

  const counters = selectedOrder?.counters_json || {};

  // Import preview stats
  const importStats = useMemo(() => {
    const newCount = dupeChecks.filter(d => d.status === 'new').length;
    const dupeCount = dupeChecks.filter(d => d.status === 'duplicate').length;
    const noEmailCount = dupeChecks.filter(d => d.status === 'no_email').length;
    return { newCount, dupeCount, noEmailCount };
  }, [dupeChecks]);

  /* ── Handlers ───────────────────────────────────────────────── */
  const handleSelectDesk = (code: DeskCode) => {
    setSelectedDesk(code);
    setSelectedOrderId(null);
    setShowImportPreview(false);
    setSelectedResults(new Set());
  };

  const handleCreateDraft = async () => {
    if (!selectedDesk) return;
    const deskLabel = DESK_CATEGORIES.find(d => d.code === selectedDesk)?.label || selectedDesk;
    try {
      const order = await createOrder.mutateAsync({
        title: `${deskLabel} — Neue Recherche`,
        intent: '',
        target_count: 25,
        desk: selectedDesk,
      });
      setDraftTitle(order.title || '');
      setDraftIntent(order.intent || '');
      setDraftTarget(String(order.target_count || 25));
      setSelectedOrderId(order.id);
      toast.success('Auftrag erstellt — bitte definieren');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSaveAndStart = async () => {
    if (!selectedOrderId || !draftTitle.trim()) {
      toast.error('Titel erforderlich');
      return;
    }
    try {
      const { error: updateError } = await supabase
        .from('soat_search_orders')
        .update({
          title: draftTitle.trim(),
          intent: draftIntent.trim(),
          target_count: parseInt(draftTarget) || 25,
        } as any)
        .eq('id', selectedOrderId);
      if (updateError) throw updateError;
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

  const handleExport = async () => {
    if (filteredResults.length === 0) { toast.error('Keine Ergebnisse zum Exportieren'); return; }
    const rows = filteredResults.map(r => ({
      Firma: r.company_name || '', Kategorie: r.category || '',
      Kontaktperson: r.contact_person_name || '', Rolle: r.contact_person_role || '',
      'E-Mail': r.email || '', Telefon: r.phone || '', Stadt: r.city || '',
      PLZ: r.postal_code || '', Website: r.website_url || '',
      'Score (%)': r.confidence_score || 0,
      Status: VALIDATION_STATES[r.validation_state]?.label || r.validation_state,
    }));
    const XLSX = await getXlsx();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ergebnisse');
    XLSX.writeFile(wb, `recherche_${selectedOrder?.title || 'export'}.xlsx`);
    toast.success(`${rows.length} Ergebnisse exportiert`);
  };

  const handleOpenImportPreview = async () => {
    if (selectedResults.size === 0) { toast.error('Keine Ergebnisse ausgewählt'); return; }
    setIsCheckingDupes(true);
    setShowImportPreview(true);
    const selected = results.filter(r => selectedResults.has(r.id));
    const checks: DupeCheckResult[] = [];
    for (const r of selected) {
      if (!r.email) { checks.push({ resultId: r.id, status: 'no_email' }); continue; }
      const { data } = await supabase.from('contacts').select('id').eq('email', r.email).limit(1);
      if (data && data.length > 0) {
        checks.push({ resultId: r.id, status: 'duplicate', existingContactId: data[0].id });
      } else {
        checks.push({ resultId: r.id, status: 'new' });
      }
    }
    setDupeChecks(checks);
    setIsCheckingDupes(false);
  };

  const handleExecuteImport = async () => {
    if (!selectedOrderId) return;
    const importableIds = dupeChecks
      .filter(d => d.status === 'new' || (d.status === 'duplicate' && dupePolicy === 'update'))
      .map(d => d.resultId);
    if (importableIds.length === 0) { toast.error('Keine importierbaren Kontakte'); return; }
    setIsImporting(true);
    try {
      const data = await researchImport.mutateAsync({
        orderId: selectedOrderId, resultIds: importableIds, duplicatePolicy: dupePolicy,
      });
      toast.success(`${data.imported_count} importiert, ${data.skipped_count} übersprungen`);
      setShowImportPreview(false);
      setSelectedResults(new Set());
      setDupeChecks([]);
    } catch (e: any) {
      toast.error(e.message || 'Import fehlgeschlagen');
    } finally {
      setIsImporting(false);
    }
  };

  const toggleResult = (id: string) => {
    const s = new Set(selectedResults);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedResults(s);
  };

  const toggleAll = () => {
    if (selectedResults.size === filteredResults.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(filteredResults.map(r => r.id)));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setDraftTitle(order.title || '');
      setDraftIntent(order.intent || '');
      setDraftTarget(String(order.target_count || 25));
    }
    setSelectedOrderId(orderId);
    setShowImportPreview(false);
    setSelectedResults(new Set());
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* ── Desk Category Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DESK_CATEGORIES.map((desk) => {
          const Icon = desk.icon;
          const stats = deskStats[desk.code] || { active: 0, contacts: 0 };
          const isActive = selectedDesk === desk.code;
          return (
            <Card
              key={desk.code}
              className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-primary border-primary/50' : 'hover:border-primary/40'}`}
              onClick={() => handleSelectDesk(desk.code)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-2 ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <span className="font-medium text-sm">{desk.label}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{desk.subtitle}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-medium ${stats.active > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {stats.active} aktiv
                  </span>
                  <span className="text-muted-foreground">
                    {stats.contacts > 0 ? `${stats.contacts} Kont.` : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Desk Orders List ─────────────────────────────────── */}
      {selectedDesk && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm uppercase tracking-wide">
                Aufträge: {DESK_CATEGORIES.find(d => d.code === selectedDesk)?.label} ({deskOrders.length})
              </h3>
              <Button size="sm" variant="outline" onClick={handleCreateDraft} disabled={createOrder.isPending}>
                {createOrder.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Neuer Auftrag
              </Button>
            </div>

            {deskOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Noch keine Aufträge für diesen Desk</p>
              </div>
            ) : (
              <div className="space-y-2">
                {deskOrders.map((order) => {
                  const st = STATUS_MAP[order.status] || STATUS_MAP.draft;
                  const isSelected = selectedOrderId === order.id;
                  const c = order.counters_json as Record<string, number> | null;
                  return (
                    <div
                      key={order.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => handleSelectOrder(order.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">{order.title || 'Ohne Titel'}</span>
                        <Badge variant="outline" className={`text-xs shrink-0 ${st.color}`}>
                          <span className="mr-1">{st.icon}</span>{st.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0 ml-3">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{c?.contacts_extracted || 0}</span>
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c?.emails_found || 0}</span>
                        {order.status !== 'running' && (
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={(e) => { e.stopPropagation(); setDeleteDialogOrderId(order.id); }}
                            aria-label="Auftrag löschen"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialogOrderId} onOpenChange={(open) => !open && setDeleteDialogOrderId(null)}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Auftrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Rechercheauftrag und alle zugehörigen Ergebnisse werden unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteDialogOrderId) return;
                try {
                  await deleteOrder.mutateAsync(deleteDialogOrderId);
                  if (selectedOrderId === deleteDialogOrderId) setSelectedOrderId(null);
                  toast.success('Auftrag gelöscht');
                } catch (e: any) {
                  toast.error(e.message);
                }
                setDeleteDialogOrderId(null);
              }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Inline Case — Selected Order ─────────────────────── */}
      {selectedOrder && (
        <div className="space-y-4">
          {/* Draft or Read-Only Header */}
          <Card>
            <CardContent className="p-4">
              {selectedOrder.status === 'draft' ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Auftrag definieren</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Titel *</Label>
                      <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="z.B. Makler Hamburg" />
                    </div>
                    <div className="space-y-2">
                      <Label>Zielanzahl</Label>
                      <Select value={draftTarget} onValueChange={setDraftTarget}>
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
                  <div className="space-y-2">
                    <Label>Was suchen Sie?</Label>
                    <Textarea
                      value={draftIntent}
                      onChange={(e) => setDraftIntent(e.target.value)}
                      placeholder="z.B. Immobilienmakler in Hamburg mit Fokus Gewerbe"
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveAndStart} disabled={startOrder.isPending || !draftTitle.trim()}>
                      {startOrder.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                      Recherche starten
                    </Button>
                  </div>
                </div>
              ) : (
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
                    {(selectedOrder.status === 'running' || selectedOrder.status === 'queued') && (
                      <Button variant="destructive" onClick={handleCancel}>
                        <Square className="h-4 w-4 mr-2" />Abbrechen
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Progress */}
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
                  <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-muted-foreground" /> {(counters as any).firms_found || 0} Firmen</span>
                  <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-muted-foreground" /> {(counters as any).contacts_extracted || 0} Kontakte</span>
                  <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-muted-foreground" /> {(counters as any).emails_found || 0} E-Mails</span>
                  <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-muted-foreground" /> {(counters as any).phones_found || 0} Telefon</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Table */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">Ergebnisse ({results.length})</h3>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="candidate">Kandidaten</SelectItem>
                      <SelectItem value="validated">Validiert</SelectItem>
                      <SelectItem value="needs_review">Review</SelectItem>
                      <SelectItem value="imported">Importiert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleExport} disabled={filteredResults.length === 0}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />Export
                  </Button>
                  {selectedResults.size > 0 && (
                    <Button size="sm" onClick={handleOpenImportPreview}>
                      <Upload className="h-4 w-4 mr-2" />{selectedResults.size} importieren…
                    </Button>
                  )}
                </div>
              </div>

              {filteredResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>{selectedOrder.status === 'draft' ? 'Starten Sie den Auftrag, um Ergebnisse zu erhalten' : 'Noch keine Ergebnisse'}</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox checked={selectedResults.size === filteredResults.length && filteredResults.length > 0} onCheckedChange={toggleAll} />
                          </TableHead>
                          <TableHead className="min-w-[160px]">Firma</TableHead>
                          <TableHead className="min-w-[100px]">Kategorie</TableHead>
                          <TableHead className="min-w-[140px]">Kontaktperson</TableHead>
                          <TableHead className="min-w-[110px]">Rolle</TableHead>
                          <TableHead className="min-w-[180px]">E-Mail</TableHead>
                          <TableHead className="min-w-[120px]">Telefon</TableHead>
                          <TableHead className="min-w-[90px]">Stadt</TableHead>
                          <TableHead className="min-w-[60px]">PLZ</TableHead>
                          <TableHead className="w-10">Web</TableHead>
                          <TableHead className="w-14 text-right">Score</TableHead>
                          <TableHead className="min-w-[90px]">Status</TableHead>
                          <TableHead className="w-24">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredResults.map((r) => {
                          const vs = VALIDATION_STATES[r.validation_state] || VALIDATION_STATES.candidate;
                          return (
                            <TableRow key={r.id} className={selectedResults.has(r.id) ? 'bg-primary/5' : ''}>
                              <TableCell><Checkbox checked={selectedResults.has(r.id)} onCheckedChange={() => toggleResult(r.id)} /></TableCell>
                              <TableCell className="font-medium">{r.company_name || '—'}</TableCell>
                              <TableCell><span className="text-xs">{r.category || '—'}</span></TableCell>
                              <TableCell>
                                {r.contact_person_name ? (
                                  <span className="flex items-center gap-1 text-sm"><User className="h-3 w-3 text-muted-foreground shrink-0" />{r.contact_person_name}</span>
                                ) : '—'}
                              </TableCell>
                              <TableCell><span className="text-xs text-muted-foreground">{r.contact_person_role || '—'}</span></TableCell>
                              <TableCell>
                                {r.email ? (
                                  <span className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3 text-muted-foreground shrink-0" /><span className="truncate max-w-[150px]">{r.email}</span></span>
                                ) : <span className="text-muted-foreground text-xs">—</span>}
                              </TableCell>
                              <TableCell>
                                {r.phone ? (
                                  <span className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3 text-muted-foreground shrink-0" />{r.phone}</span>
                                ) : '—'}
                              </TableCell>
                              <TableCell><span className="text-sm">{r.city || '—'}</span></TableCell>
                              <TableCell><span className="text-xs">{r.postal_code || '—'}</span></TableCell>
                              <TableCell>
                                {r.website_url ? (
                                  <a href={r.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80"><Globe className="h-4 w-4" /></a>
                                ) : '—'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">{r.confidence_score || 0}%</TableCell>
                              <TableCell><Badge variant="outline" className={`text-xs ${vs.color}`}>{vs.label}</Badge></TableCell>
                              <TableCell>
                                {r.validation_state === 'candidate' && (
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleValidate(r, 'validated')} title="OK">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleValidate(r, 'rejected')} title="Ablehnen">
                                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Import Preview with Dedup */}
          {showImportPreview && (
            <Card className="border-primary/30">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2"><Upload className="h-4 w-4" />Import-Vorschau</h3>
                  <Button variant="ghost" size="sm" onClick={() => { setShowImportPreview(false); setDupeChecks([]); }}><X className="h-4 w-4" /></Button>
                </div>

                {isCheckingDupes ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" /><span>Duplikat-Prüfung läuft…</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        <ShieldCheck className="h-3 w-3 mr-1" />{importStats.newCount} neue Kontakte
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        <ShieldAlert className="h-3 w-3 mr-1" />{importStats.dupeCount} bereits vorhanden
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                        <MinusCircle className="h-3 w-3 mr-1" />{importStats.noEmailCount} ohne E-Mail
                      </Badge>
                    </div>

                    <ScrollArea className="max-h-[250px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[160px]">Firma</TableHead>
                            <TableHead className="min-w-[140px]">Kontakt</TableHead>
                            <TableHead className="min-w-[180px]">E-Mail</TableHead>
                            <TableHead className="min-w-[100px]">Prüfung</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dupeChecks.map((check) => {
                            const r = results.find(res => res.id === check.resultId);
                            if (!r) return null;
                            return (
                              <TableRow key={check.resultId}>
                                <TableCell className="text-sm">{r.company_name || '—'}</TableCell>
                                <TableCell className="text-sm">{r.contact_person_name || '—'}</TableCell>
                                <TableCell className="text-sm">{r.email || '—'}</TableCell>
                                <TableCell>
                                  {check.status === 'new' && <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">NEU</Badge>}
                                  {check.status === 'duplicate' && <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">DUPLIKAT</Badge>}
                                  {check.status === 'no_email' && <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">KEINE EMAIL</Badge>}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>

                    <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Duplikate:</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant={dupePolicy === 'skip' ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setDupePolicy('skip')}>Überspringen</Button>
                          <Button size="sm" variant={dupePolicy === 'update' ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setDupePolicy('update')}>Aktualisieren</Button>
                        </div>
                      </div>
                      <Button onClick={handleExecuteImport} disabled={isImporting || (importStats.newCount === 0 && (importStats.dupeCount === 0 || dupePolicy === 'skip'))}>
                        {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        Jetzt importieren ({dupePolicy === 'update' ? importStats.newCount + importStats.dupeCount : importStats.newCount})
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty state — no desk selected */}
      {!selectedDesk && (
        <div className="text-center py-12 text-muted-foreground">
          <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Wählen Sie einen Desk, um die zugehörigen Recherchen zu sehen</p>
        </div>
      )}
    </div>
  );
}
