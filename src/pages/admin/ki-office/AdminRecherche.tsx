/**
 * AdminRecherche — SOAT Search Engine + Market Directory Engine
 * Layout: Eingaben → Aufträge → Filter + Ergebnisse (alles immer sichtbar)
 */
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
  Search, Play, Square, Loader2, CheckCircle2, XCircle, Clock,
  Download, AlertTriangle, FileSpreadsheet, Upload, Trash2, RotateCcw,
  ShieldCheck, ShieldAlert, MinusCircle, X,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CATEGORY_OPTIONS, CATEGORY_GROUPS } from '@/config/contactSchema';
import {
  DESK_OPTIONS,
  QUALITY_STATUS_LABELS,
  type CategoryGroupCode,
} from '@/engines/marketDirectory/spec';
import {
  normalizeContact,
  calcConfidence,
  applyQualityGate,
  getCategoriesByGroup,
} from '@/engines/marketDirectory/engine';
import { StrategyOverview } from '@/components/admin/recherche/StrategyOverview';
import { AutomationPanel } from '@/components/admin/recherche/AutomationPanel';
import { LedgerSummary } from '@/components/admin/recherche/LedgerSummary';

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

type DupeCheckResult = { resultId: string; status: 'new' | 'duplicate' | 'no_email'; existingContactId?: string };

export default function AdminRecherche() {
  const { data: orders = [], isLoading } = useSoatOrders();
  const createOrder = useCreateSoatOrder();
  const startOrder = useStartSoatOrder();
  const cancelOrder = useCancelSoatOrder();
  const deleteOrder = useDeleteSoatOrder();
  const updateResult = useUpdateSoatResult();
  const researchImport = useResearchImport();

  // ── Input fields ──
  const [inputDesk, setInputDesk] = useState<string>('');
  const [inputSearch, setInputSearch] = useState('');
  const [inputRegion, setInputRegion] = useState('');
  const [inputCategoryGroup, setInputCategoryGroup] = useState<string>('all');
  const [inputCategory, setInputCategory] = useState('');
  const [inputTarget, setInputTarget] = useState('25');

  // ── Selected order ──
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { data: results = [] } = useSoatResults(selectedOrderId);

  // ── Result filters ──
  const [filterText, setFilterText] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCity, setFilterCity] = useState('');
  const [filterHasEmail, setFilterHasEmail] = useState('all');

  // ── Selection + Import ──
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [dupeChecks, setDupeChecks] = useState<DupeCheckResult[]>([]);
  const [dupePolicy, setDupePolicy] = useState<'skip' | 'update'>('skip');
  const [isCheckingDupes, setIsCheckingDupes] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteDialogOrderId, setDeleteDialogOrderId] = useState<string | null>(null);

  // ── Grouped categories for input ──
  const inputCategories = useMemo(() => {
    if (inputCategoryGroup === 'all') return CATEGORY_OPTIONS;
    return CATEGORY_OPTIONS.filter(c => c.group === inputCategoryGroup);
  }, [inputCategoryGroup]);

  // ── Filtered results with Engine scoring ──
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      if (filterStatus !== 'all' && r.validation_state !== filterStatus) return false;
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;
      if (filterHasEmail === 'yes' && !r.email) return false;
      if (filterHasEmail === 'no' && r.email) return false;
      if (filterCity && !r.city?.toLowerCase().includes(filterCity.toLowerCase())) return false;
      if (filterText) {
        const q = filterText.toLowerCase();
        const searchable = [r.first_name, r.last_name, r.company_name, r.email, r.city, r.contact_person_role].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [results, filterText, filterCategory, filterStatus, filterCity, filterHasEmail]);

  const importStats = useMemo(() => ({
    newCount: dupeChecks.filter(d => d.status === 'new').length,
    dupeCount: dupeChecks.filter(d => d.status === 'duplicate').length,
    noEmailCount: dupeChecks.filter(d => d.status === 'no_email').length,
  }), [dupeChecks]);

  /* ── Handlers ──────────────────────────────────────────────── */
  const handleStartSearch = async () => {
    if (!inputDesk) { toast.error('Bitte Desk auswählen'); return; }
    if (!inputSearch.trim()) { toast.error('Bitte Suchbegriff eingeben'); return; }
    const deskLabel = DESK_OPTIONS.find(d => d.code === inputDesk)?.label || inputDesk;
    const title = `${deskLabel} — ${inputSearch.trim()}`;
    try {
      const order = await createOrder.mutateAsync({
        title,
        intent: [inputSearch.trim(), inputRegion, inputCategory].filter(Boolean).join(', '),
        target_count: parseInt(inputTarget) || 25,
        desk: inputDesk,
      });
      setSelectedOrderId(order.id);
      await startOrder.mutateAsync(order.id);
      toast.success('Recherche gestartet');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler beim Starten');
    }
  };

  const handleReset = () => {
    setInputSearch(''); setInputRegion(''); setInputCategory(''); setInputTarget('25'); setInputCategoryGroup('all');
  };

  const handleValidate = (result: SoatSearchResult, state: string) => {
    updateResult.mutate({ id: result.id, orderId: result.order_id, validation_state: state });
  };

  const handleExport = async () => {
    if (filteredResults.length === 0) { toast.error('Keine Ergebnisse'); return; }
    const rows = filteredResults.map(r => ({
      Anrede: r.salutation || '', Vorname: r.first_name || '', Nachname: r.last_name || '',
      Firma: r.company_name || '', Kategorie: r.category || '', Position: r.contact_person_role || '',
      'E-Mail': r.email || '', Telefon: r.phone || '', PLZ: r.postal_code || '', Stadt: r.city || '',
      Website: r.website_url || '', 'Score (%)': r.confidence_score || 0,
      Status: VALIDATION_STATES[r.validation_state]?.label || r.validation_state,
    }));
    const XLSX = await getXlsx();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ergebnisse');
    XLSX.writeFile(wb, `recherche_export.xlsx`);
    toast.success(`${rows.length} Ergebnisse exportiert`);
  };

  const handleOpenImportPreview = async () => {
    if (selectedResults.size === 0) { toast.error('Keine Ergebnisse ausgewählt'); return; }
    setIsCheckingDupes(true); setShowImportPreview(true);
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
    setDupeChecks(checks); setIsCheckingDupes(false);
  };

  const handleExecuteImport = async () => {
    if (!selectedOrderId) return;
    const importableIds = dupeChecks.filter(d => d.status === 'new' || (d.status === 'duplicate' && dupePolicy === 'update')).map(d => d.resultId);
    if (importableIds.length === 0) { toast.error('Keine importierbaren Kontakte'); return; }
    setIsImporting(true);
    try {
      const data = await researchImport.mutateAsync({ orderId: selectedOrderId, resultIds: importableIds, duplicatePolicy: dupePolicy });
      toast.success(`${data.importedCount} importiert, ${data.skippedCount} übersprungen`);
      setShowImportPreview(false); setSelectedResults(new Set()); setDupeChecks([]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Import fehlgeschlagen');
    } finally { setIsImporting(false); }
  };

  const toggleResult = (id: string) => {
    const s = new Set(selectedResults); s.has(id) ? s.delete(id) : s.add(id); setSelectedResults(s);
  };
  const toggleAll = () => {
    setSelectedResults(selectedResults.size === filteredResults.length ? new Set() : new Set(filteredResults.map(r => r.id)));
  };

  /** Engine-basierter Confidence Score für ein Ergebnis */
  const getEngineScore = (r: SoatSearchResult) => {
    const norm = normalizeContact({
      salutation: r.salutation, first_name: r.first_name, last_name: r.last_name,
      company_name: r.company_name, phone: r.phone, email: r.email,
      website_url: r.website_url, postal_code: r.postal_code, city: r.city,
      contact_person_name: r.contact_person_name,
    });
    const { score } = calcConfidence(norm.normalized);
    return Math.round(score * 100);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-lg font-bold tracking-tight uppercase">Recherche-Zentrale</h2>

      {/* ═══ A. STRATEGIE-ÜBERSICHT ═══ */}
      <StrategyOverview />

      {/* ═══ B. AUTOMATISIERUNG ═══ */}
      <AutomationPanel />

      {/* ═══ C. STRATEGY LEDGER ═══ */}
      <LedgerSummary />

      {/* ═══ 1. SUCHFORMULAR ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Neue Suche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Desk *</Label>
              <Select value={inputDesk} onValueChange={setInputDesk}>
                <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
                <SelectContent>
                  {DESK_OPTIONS.map(d => <SelectItem key={d.code} value={d.code}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Kategorie-Gruppe</Label>
              <Select value={inputCategoryGroup} onValueChange={v => { setInputCategoryGroup(v); setInputCategory(''); }}>
                <SelectTrigger><SelectValue placeholder="Alle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Gruppen</SelectItem>
                  {CATEGORY_GROUPS.map(g => <SelectItem key={g.code} value={g.code}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Kategorie</Label>
              <Select value={inputCategory} onValueChange={setInputCategory}>
                <SelectTrigger><SelectValue placeholder="Alle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {inputCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Region / Stadt</Label>
              <Input value={inputRegion} onChange={e => setInputRegion(e.target.value)} placeholder="z.B. Hamburg" />
            </div>
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label className="text-xs">Suchbegriff *</Label>
              <Input value={inputSearch} onChange={e => setInputSearch(e.target.value)} placeholder="z.B. Hundeschule" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Zielanzahl</Label>
              <Select value={inputTarget} onValueChange={setInputTarget}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleStartSearch} disabled={createOrder.isPending || startOrder.isPending}>
              {(createOrder.isPending || startOrder.isPending) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Starten
            </Button>
            <Button variant="outline" onClick={handleReset}><RotateCcw className="h-4 w-4 mr-2" />Zurücksetzen</Button>
          </div>
        </CardContent>
      </Card>

      {/* ═══ 2. LAUFENDE AUFTRÄGE ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Aufträge ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Noch keine Aufträge vorhanden</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Auftrag</TableHead>
                    <TableHead className="min-w-[80px]">Desk</TableHead>
                    <TableHead className="min-w-[80px]">Phase</TableHead>
                    <TableHead className="min-w-[120px]">Fortschritt</TableHead>
                    <TableHead className="min-w-[70px]">Kontakte</TableHead>
                    <TableHead className="min-w-[70px]">E-Mails</TableHead>
                    <TableHead className="min-w-[90px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Erstellt</TableHead>
                    <TableHead className="w-16">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => {
                    const st = STATUS_MAP[order.status] || STATUS_MAP.draft;
                    const c = order.counters_json as Record<string, number> | null;
                    const isSelected = selectedOrderId === order.id;
                    const desk = (order as any).desk;
                    return (
                      <TableRow
                        key={order.id}
                        className={`cursor-pointer ${isSelected ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50'}`}
                        onClick={() => { setSelectedOrderId(order.id); setSelectedResults(new Set()); setShowImportPreview(false); }}
                      >
                        <TableCell className="font-medium text-sm">{order.title || 'Ohne Titel'}</TableCell>
                        <TableCell><span className="text-xs">{DESK_OPTIONS.find(d => d.code === desk)?.label || desk || '—'}</span></TableCell>
                        <TableCell><span className="text-xs">{PHASE_LABELS[order.phase || ''] || '—'}</span></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={order.progress_percent} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground w-8">{order.progress_percent}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{c?.total_contacts ?? '—'}</TableCell>
                        <TableCell className="text-sm">{c?.with_email ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${st.color}`}>
                            <span className="mr-1">{st.icon}</span>{st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('de-DE')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            {(order.status === 'running' || order.status === 'queued') && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => cancelOrder.mutate(order.id)}>
                                <Square className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteDialogOrderId(order.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ 3. ERGEBNIS-FILTER (IMMER SICHTBAR) ═══ */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{results.length} Ergebnisse · {filteredResults.length} angezeigt</span>
            <div className="flex items-center gap-2">
              {selectedResults.size > 0 && (
                <Button size="sm" onClick={handleOpenImportPreview} disabled={isCheckingDupes}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />{selectedResults.size} importieren
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredResults.length === 0}>
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />Export
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="Freitext..." className="pl-8 h-9 text-sm" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Kategorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {CATEGORY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                {Object.entries(VALIDATION_STATES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={filterCity} onChange={e => setFilterCity(e.target.value)} placeholder="Stadt..." className="h-9 text-sm" />
            <Select value={filterHasEmail} onValueChange={setFilterHasEmail}>
              <SelectTrigger className="h-9"><SelectValue placeholder="E-Mail" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="yes">Mit E-Mail</SelectItem>
                <SelectItem value="no">Ohne E-Mail</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ═══ 4. ERGEBNISTABELLE (IMMER SICHTBAR) ═══ */}
      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={selectedResults.size === filteredResults.length && filteredResults.length > 0} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="min-w-[60px]">Anrede</TableHead>
              <TableHead className="min-w-[100px]">Vorname</TableHead>
              <TableHead className="min-w-[100px]">Nachname</TableHead>
              <TableHead className="min-w-[140px]">Firma</TableHead>
              <TableHead className="min-w-[120px]">Kategorie</TableHead>
              <TableHead className="min-w-[100px]">Position</TableHead>
              <TableHead className="min-w-[170px]">E-Mail</TableHead>
              <TableHead className="min-w-[110px]">Telefon</TableHead>
              <TableHead className="min-w-[60px]">PLZ</TableHead>
              <TableHead className="min-w-[100px]">Stadt</TableHead>
              <TableHead className="min-w-[140px]">Website</TableHead>
              <TableHead className="min-w-[70px]">Score</TableHead>
              <TableHead className="min-w-[90px]">Status</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!selectedOrderId ? (
              <TableRow><TableCell colSpan={15} className="text-center py-8 text-muted-foreground">Bitte oben einen Auftrag auswählen oder neue Suche starten</TableCell></TableRow>
            ) : filteredResults.length === 0 ? (
              <TableRow><TableCell colSpan={15} className="text-center py-8 text-muted-foreground">Keine Ergebnisse für diesen Auftrag</TableCell></TableRow>
            ) : filteredResults.map(r => {
              const vs = VALIDATION_STATES[r.validation_state] || VALIDATION_STATES.candidate;
              const cat = CATEGORY_OPTIONS.find(c => c.value === r.category);
              const engineScore = getEngineScore(r);
              return (
                <TableRow key={r.id} className="hover:bg-muted/50">
                  <TableCell><Checkbox checked={selectedResults.has(r.id)} onCheckedChange={() => toggleResult(r.id)} /></TableCell>
                  <TableCell className="text-xs">{r.salutation || '—'}</TableCell>
                  <TableCell className="text-sm">{r.first_name || '—'}</TableCell>
                  <TableCell className="text-sm font-medium">{r.last_name || '—'}</TableCell>
                  <TableCell className="text-sm">{r.company_name || '—'}</TableCell>
                  <TableCell>{cat ? <Badge variant="outline" className={`text-xs ${cat.className}`}>{cat.label}</Badge> : <span className="text-xs text-muted-foreground">{r.category || '—'}</span>}</TableCell>
                  <TableCell className="text-xs">{r.contact_person_role || '—'}</TableCell>
                  <TableCell className="text-xs">{r.email || '—'}</TableCell>
                  <TableCell className="text-xs">{r.phone || '—'}</TableCell>
                  <TableCell className="text-xs">{r.postal_code || '—'}</TableCell>
                  <TableCell className="text-xs">{r.city || '—'}</TableCell>
                  <TableCell className="text-xs">{r.website_url ? <a href={r.website_url} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate block max-w-[120px]">{r.website_url.replace(/^https?:\/\//, '')}</a> : '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${engineScore >= 85 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : engineScore >= 60 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                      {engineScore}%
                    </Badge>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={`text-xs ${vs.color}`}>{vs.label}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Validieren" onClick={() => handleValidate(r, 'validated')}>
                        <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Review" onClick={() => handleValidate(r, 'needs_review')}>
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Ablehnen" onClick={() => handleValidate(r, 'rejected')}>
                        <MinusCircle className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ═══ IMPORT PREVIEW ═══ */}
      {showImportPreview && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Import-Vorschau</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowImportPreview(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCheckingDupes ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Prüfe Duplikate...</div>
            ) : (
              <>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600 font-medium">{importStats.newCount} neue</span>
                  <span className="text-amber-600 font-medium">{importStats.dupeCount} Duplikate</span>
                  <span className="text-muted-foreground">{importStats.noEmailCount} ohne E-Mail</span>
                </div>
                {importStats.dupeCount > 0 && (
                  <Select value={dupePolicy} onValueChange={v => setDupePolicy(v as 'skip' | 'update')}>
                    <SelectTrigger className="h-9 w-64"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Duplikate überspringen</SelectItem>
                      <SelectItem value="update">Duplikate aktualisieren</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button onClick={handleExecuteImport} disabled={isImporting}>
                  {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Importieren
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ DELETE DIALOG ═══ */}
      <AlertDialog open={!!deleteDialogOrderId} onOpenChange={() => setDeleteDialogOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auftrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>Der Auftrag und alle zugehörigen Ergebnisse werden unwiderruflich gelöscht.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteDialogOrderId) {
                deleteOrder.mutate(deleteDialogOrderId);
                if (selectedOrderId === deleteDialogOrderId) setSelectedOrderId(null);
                setDeleteDialogOrderId(null);
              }
            }}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
