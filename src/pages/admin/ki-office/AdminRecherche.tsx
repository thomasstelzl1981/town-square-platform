/**
 * AdminRecherche — SOAT Search Engine with Widget-Grid + Inline Case
 * Golden Path Standard: CTA-Widget → Draft → Inline-Flow (kein Dialog)
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useResearchImport } from '@/hooks/useResearchImport';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getXlsx } from '@/lib/lazyXlsx';
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
  Save,
  FileSpreadsheet,
  Upload,
  X,
  ShieldCheck,
  ShieldAlert,
  MinusCircle,
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
  const updateResult = useUpdateSoatResult();
  const researchImport = useResearchImport();

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

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;
  const { data: results = [] } = useSoatResults(selectedOrderId);

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

  /** CTA-Widget: Sofort Draft erstellen, inline öffnen */
  const handleCreateDraft = async () => {
    try {
      const order = await createOrder.mutateAsync({
        title: 'Neuer Rechercheauftrag',
        intent: '',
        target_count: 25,
      });
      setDraftTitle(order.title || 'Neuer Rechercheauftrag');
      setDraftIntent(order.intent || '');
      setDraftTarget(String(order.target_count || 25));
      setSelectedOrderId(order.id);
      toast.success('Auftrag erstellt — bitte definieren');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  /** Draft-Felder speichern und Recherche starten */
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

  /** Excel Export */
  const handleExport = async () => {
    if (filteredResults.length === 0) {
      toast.error('Keine Ergebnisse zum Exportieren');
      return;
    }
    const rows = filteredResults.map(r => ({
      Firma: r.company_name || '',
      Kategorie: r.category || '',
      Kontaktperson: r.contact_person_name || '',
      Rolle: r.contact_person_role || '',
      'E-Mail': r.email || '',
      Telefon: r.phone || '',
      Stadt: r.city || '',
      PLZ: r.postal_code || '',
      Website: r.website_url || '',
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

  /** Deduplizierungs-Check vor Import */
  const handleOpenImportPreview = async () => {
    if (selectedResults.size === 0) {
      toast.error('Keine Ergebnisse ausgewählt');
      return;
    }
    setIsCheckingDupes(true);
    setShowImportPreview(true);

    const selected = results.filter(r => selectedResults.has(r.id));
    const checks: DupeCheckResult[] = [];

    for (const r of selected) {
      if (!r.email) {
        checks.push({ resultId: r.id, status: 'no_email' });
        continue;
      }
      // Check for existing contact by email
      const { data } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', r.email)
        .limit(1);

      if (data && data.length > 0) {
        checks.push({ resultId: r.id, status: 'duplicate', existingContactId: data[0].id });
      } else {
        checks.push({ resultId: r.id, status: 'new' });
      }
    }

    setDupeChecks(checks);
    setIsCheckingDupes(false);
  };

  /** Import via Edge Function mit duplicate_policy */
  const handleExecuteImport = async () => {
    if (!selectedOrderId) return;
    const importableIds = dupeChecks
      .filter(d => d.status === 'new' || (d.status === 'duplicate' && dupePolicy === 'update'))
      .map(d => d.resultId);

    if (importableIds.length === 0) {
      toast.error('Keine importierbaren Kontakte');
      return;
    }

    setIsImporting(true);
    try {
      const data = await researchImport.mutateAsync({
        orderId: selectedOrderId,
        resultIds: importableIds,
        duplicatePolicy: dupePolicy,
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
      {/* Widget Grid — Orders */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* CTA-Widget */}
        <Card
          className="cursor-pointer border-dashed hover:border-primary/50 transition-colors"
          onClick={handleCreateDraft}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 min-h-[120px]">
            {createOrder.isPending ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            ) : (
              <Plus className="h-8 w-8 text-muted-foreground mb-2" />
            )}
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
              onClick={() => handleSelectOrder(order.id)}
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
          {/* Section 1: Draft or Read-Only Header */}
          <Card>
            <CardContent className="p-4">
              {selectedOrder.status === 'draft' ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Auftrag definieren</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Titel *</Label>
                      <Input
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        placeholder="z.B. Makler Hamburg"
                      />
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
                      placeholder="z.B. Immobilienmakler in Hamburg mit Fokus Gewerbe, idealerweise mit Erfahrung im Bereich Anlageimmobilien"
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveAndStart} disabled={startOrder.isPending || !draftTitle.trim()}>
                      {startOrder.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
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
                        <Square className="h-4 w-4 mr-2" />
                        Abbrechen
                      </Button>
                    )}
                  </div>
                </div>
              )}
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
              <div className="flex items-center justify-between flex-wrap gap-2">
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
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleExport} disabled={filteredResults.length === 0}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  {selectedResults.size > 0 && (
                    <Button size="sm" onClick={handleOpenImportPreview}>
                      <Upload className="h-4 w-4 mr-2" />
                      {selectedResults.size} importieren…
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
                            <Checkbox
                              checked={selectedResults.size === filteredResults.length && filteredResults.length > 0}
                              onCheckedChange={toggleAll}
                            />
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
                              <TableCell>
                                <Checkbox
                                  checked={selectedResults.has(r.id)}
                                  onCheckedChange={() => toggleResult(r.id)}
                                />
                              </TableCell>
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
                                  <a href={r.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                    <Globe className="h-4 w-4" />
                                  </a>
                                ) : '—'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">{r.confidence_score || 0}%</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-xs ${vs.color}`}>{vs.label}</Badge>
                              </TableCell>
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

          {/* Section 4: Import Preview with Dedup */}
          {showImportPreview && (
            <Card className="border-primary/30">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Import-Vorschau
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => { setShowImportPreview(false); setDupeChecks([]); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {isCheckingDupes ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Duplikat-Prüfung läuft…</span>
                  </div>
                ) : (
                  <>
                    {/* Summary Badges */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {importStats.newCount} neue Kontakte
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        <ShieldAlert className="h-3 w-3 mr-1" />
                        {importStats.dupeCount} bereits vorhanden
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                        <MinusCircle className="h-3 w-3 mr-1" />
                        {importStats.noEmailCount} ohne E-Mail
                      </Badge>
                    </div>

                    {/* Dedup Detail Table */}
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
                                  {check.status === 'new' && (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">NEU</Badge>
                                  )}
                                  {check.status === 'duplicate' && (
                                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">DUPLIKAT</Badge>
                                  )}
                                  {check.status === 'no_email' && (
                                    <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">KEINE EMAIL</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>

                    {/* Dupe Policy + Action */}
                    <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Duplikate:</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={dupePolicy === 'skip' ? 'default' : 'outline'}
                            className="h-7 text-xs"
                            onClick={() => setDupePolicy('skip')}
                          >
                            Überspringen
                          </Button>
                          <Button
                            size="sm"
                            variant={dupePolicy === 'update' ? 'default' : 'outline'}
                            className="h-7 text-xs"
                            onClick={() => setDupePolicy('update')}
                          >
                            Aktualisieren
                          </Button>
                        </div>
                      </div>
                      <Button
                        onClick={handleExecuteImport}
                        disabled={isImporting || (importStats.newCount === 0 && (importStats.dupeCount === 0 || dupePolicy === 'skip'))}
                      >
                        {isImporting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
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

      {/* Empty state */}
      {!selectedOrder && orders.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Wählen Sie einen Auftrag oder erstellen Sie einen neuen</p>
        </div>
      )}
    </div>
  );
}
