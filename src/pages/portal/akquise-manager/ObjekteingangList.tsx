/**
 * ObjekteingangList — Central Hub: Mandate list (75%) + Upload (25%) + Object table
 * Layout: Mandate+Upload row → Fixed ScrollArea table card → Search/Filter card → Datenraum
 */
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Inbox, Loader2, Search, Upload, FileText, Calculator, ArrowRight, Calendar
} from 'lucide-react';
import { AcqDataRoom } from '@/pages/portal/akquise-manager/components/AcqDataRoom';
import { useAuth } from '@/contexts/AuthContext';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
import { useAcqMandatesForManager } from '@/hooks/useAcqMandate';
import { useExposeUpload } from '@/hooks/useExposeUpload';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, subDays, isAfter } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { useAssignOfferToMandate } from '@/hooks/useAcqOffers';
import type { AcqOffer, AcqOfferStatus } from '@/hooks/useAcqOffers';

const { TABLE, CARD, TYPOGRAPHY, SPACING } = DESIGN;

const STATUS_CONFIG: Record<AcqOfferStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  new: { label: 'Eingegangen', variant: 'default' },
  analyzing: { label: 'Analyse läuft', variant: 'secondary' },
  analyzed: { label: 'Analysiert', variant: 'outline' },
  presented: { label: 'Präsentiert', variant: 'outline' },
  accepted: { label: 'Akzeptiert', variant: 'default' },
  rejected: { label: 'Abgelehnt', variant: 'destructive' },
  archived: { label: 'Archiviert', variant: 'secondary' },
};

const FILTER_CHIPS = [
  { value: 'all', label: 'Alle' },
  { value: 'new', label: 'Eingegangen' },
  { value: 'analyzed', label: 'Analysiert' },
  { value: 'accepted', label: 'Akzeptiert' },
];

const TIME_RANGES = [
  { value: 'all', label: 'Gesamter Zeitraum' },
  { value: '7', label: 'Letzte 7 Tage' },
  { value: '30', label: 'Letzte 30 Tage' },
  { value: '90', label: 'Letzte 90 Tage' },
];

export function ObjekteingangList() {
  const { activeTenantId } = useAuth();
  const navigate = useNavigate();
  const { data: mandates = [], isLoading: loadingMandates } = useAcqMandatesForManager();
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [timeRange, setTimeRange] = React.useState<string>('all');
  const [selectedMandateId, setSelectedMandateId] = React.useState<string | null>(null);
  const assignMutation = useAssignOfferToMandate();

  // Upload tile state
  const { upload, phase, isUploading } = useExposeUpload();
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch ALL offers for this tenant
  const { data: allOffers = [], isLoading: loadingOffers } = useQuery({
    queryKey: ['acq-offers-inbox'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_tenant_id')
        .eq('id', user.id)
        .single();
      if (!profile?.active_tenant_id) return [];

      const { data, error } = await supabase
        .from('acq_offers')
        .select('*, documents:acq_offer_documents(id, document_type, storage_path, file_name)')
        .eq('tenant_id', profile.active_tenant_id)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data as (AcqOffer & { documents: { id: string; document_type: string; storage_path: string; file_name: string }[] })[];
    },
  });

  // Mandate offer counts
  const mandateOfferCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of mandates) counts[m.id] = 0;
    let unassigned = 0;
    for (const o of allOffers) {
      if (o.mandate_id && counts[o.mandate_id] !== undefined) {
        counts[o.mandate_id]++;
      } else {
        unassigned++;
      }
    }
    return { ...counts, __unassigned: unassigned };
  }, [allOffers, mandates]);

  const filteredOffers = React.useMemo(() => {
    return allOffers.filter(offer => {
      // Mandate filter
      if (selectedMandateId === '__unassigned' && offer.mandate_id) return false;
      if (selectedMandateId && selectedMandateId !== '__unassigned' && offer.mandate_id !== selectedMandateId) return false;
      // Status filter
      if (statusFilter !== 'all' && offer.status !== statusFilter) return false;
      // Time range filter
      if (timeRange !== 'all') {
        const days = parseInt(timeRange, 10);
        const cutoff = subDays(new Date(), days);
        const offerDate = new Date(offer.received_at || offer.created_at);
        if (!isAfter(offerDate, cutoff)) return false;
      }
      // Extended text search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchFields = [
          offer.title, offer.address, offer.city, offer.postal_code,
          offer.provider_name, offer.notes, offer.source_type
        ];
        if (!searchFields.some(f => f?.toLowerCase().includes(term))) return false;
      }
      return true;
    });
  }, [allOffers, statusFilter, searchTerm, selectedMandateId, timeRange]);

  const isLoading = loadingMandates || loadingOffers;

  const formatPrice = (price: number | null) => {
    if (!price) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await upload(files[0], '');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await upload(file, '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExposeClick = async (e: React.MouseEvent, doc: { storage_path: string; file_name: string }) => {
    e.stopPropagation();
    const { data } = await supabase.storage.from('tenant-documents').createSignedUrl(doc.storage_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const handleMandateAssign = (e: React.MouseEvent, offerId: string, mandateId: string) => {
    e.stopPropagation();
    assignMutation.mutate({ offerId, mandateId: mandateId === '__none' ? null : mandateId });
  };

  if (isLoading) {
    return <PageShell><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;
  }

  const activeMandates = mandates.filter(m => m.status === 'active' || m.status === 'draft' || m.status === 'submitted_to_zone1');

  return (
    <PageShell>
      <ModulePageHeader
        title="OBJEKTEINGANG"
        description="Alle eingehenden Objekte, Exposés und Angebote"
      />

      {/* ─── TOP: Mandates (75%) + Upload (25%) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-4">
        {/* Mandate List Card */}
        <Card className={CARD.BASE}>
          <div className={CARD.SECTION_HEADER}>
            <span className={TYPOGRAPHY.CARD_TITLE}>Aktive Ankaufsmandate</span>
          </div>
          <CardContent className="p-0">
            {/* "Alle" row */}
            <div
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-border/30',
                !selectedMandateId ? 'bg-primary/10' : 'hover:bg-muted/30'
              )}
              onClick={() => setSelectedMandateId(null)}
            >
              <Inbox className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-medium text-sm flex-1">Alle Eingänge</span>
              <Badge variant="secondary" className="text-[10px]">{allOffers.length}</Badge>
            </div>

            {/* Mandate rows */}
            {activeMandates.map(m => (
              <div
                key={m.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-border/30',
                  selectedMandateId === m.id ? 'bg-primary/10' : 'hover:bg-muted/30'
                )}
                onClick={() => setSelectedMandateId(prev => prev === m.id ? null : m.id)}
              >
                <span className="font-mono text-xs text-primary font-semibold w-16 flex-shrink-0">{m.code}</span>
                <span className="text-sm truncate flex-1">{m.client_display_name || '—'}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">{m.asset_focus?.join(', ') || '—'}</span>
                <Badge variant="outline" className="text-[10px]">{mandateOfferCounts[m.id] || 0} Obj.</Badge>
              </div>
            ))}

            {/* Unassigned row */}
            <div
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors',
                selectedMandateId === '__unassigned' ? 'bg-primary/10' : 'hover:bg-muted/30'
              )}
              onClick={() => setSelectedMandateId(prev => prev === '__unassigned' ? null : '__unassigned')}
            >
              <span className="text-xs text-muted-foreground flex-shrink-0 w-16">—</span>
              <span className="text-sm text-muted-foreground flex-1">Ohne Mandat</span>
              <Badge variant="outline" className="text-[10px]">{mandateOfferCounts.__unassigned || 0} Obj.</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Upload Card */}
        <Card
          className={cn(CARD.BASE, 'flex flex-col')}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={handleDrop}
        >
          <div className={CARD.SECTION_HEADER}>
            <span className={TYPOGRAPHY.CARD_TITLE}>Exposé-Upload</span>
          </div>
          <CardContent className="flex-1 flex items-center justify-center p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-primary">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-xs font-medium">
                  {phase === 'uploading' ? 'Hochladen...' : 'KI-Analyse...'}
                </span>
              </div>
            ) : (
              <div
                className={cn(
                  'flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed w-full cursor-pointer transition-colors',
                  isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 hover:border-primary/40 hover:bg-muted/20'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">PDF hier ablegen</p>
                  <p className="text-xs text-muted-foreground mt-1">oder klicken zum Auswählen</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── TABLE CARD (fixed height with internal scroll) ─── */}
      <Card className={CARD.BASE}>
        <div className={CARD.SECTION_HEADER}>
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-primary" />
            <span className={TYPOGRAPHY.CARD_TITLE}>Objekteingänge</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {filteredOffers.length} von {allOffers.length} Objekte
          </span>
        </div>

        {filteredOffers.length === 0 ? (
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Keine Objekteingänge</h3>
              <p className="text-muted-foreground mt-2">Exposés per Upload, E-Mail oder Portal-Suche erscheinen hier.</p>
            </div>
          </CardContent>
        ) : (
          <ScrollArea className="max-h-[560px]">
            <div className={TABLE.WRAPPER}>
              {/* Sticky Header */}
              <div className={cn(
                'grid grid-cols-[1fr_160px_100px_80px_80px_100px_120px_32px] gap-2 sticky top-0 z-10 bg-card',
                TABLE.HEADER_BG,
                TABLE.HEADER_CELL
              )}>
                <span>Titel</span>
                <span>Adresse</span>
                <span className="text-right">Preis</span>
                <span>Exposé</span>
                <span>Kalk.</span>
                <span>Status</span>
                <span>Mandat</span>
                <span />
              </div>

              {/* Rows */}
              {filteredOffers.map(offer => {
                const statusConfig = STATUS_CONFIG[offer.status];
                const exposeDoc = (offer as any).documents?.find((d: any) => d.document_type === 'expose');
                const mandateCode = mandates.find(m => m.id === offer.mandate_id)?.code;

                return (
                  <div
                    key={offer.id}
                    className={cn(
                      'grid grid-cols-[1fr_160px_100px_80px_80px_100px_120px_32px] gap-2 items-center cursor-pointer',
                      TABLE.BODY_CELL,
                      TABLE.ROW_HOVER,
                      TABLE.ROW_BORDER
                    )}
                    onClick={() => navigate(`/portal/akquise-manager/objekteingang/${offer.id}`)}
                  >
                    {/* Title + metadata */}
                    <div className="min-w-0">
                      <span className="font-medium truncate block">{offer.title || 'Ohne Titel'}</span>
                      <div className="flex gap-2 mt-0.5">
                        {offer.units_count && <span className="text-[10px] text-muted-foreground">{offer.units_count} WE</span>}
                        {offer.area_sqm && <span className="text-[10px] text-muted-foreground">{offer.area_sqm} m²</span>}
                        {offer.year_built && <span className="text-[10px] text-muted-foreground">Bj. {offer.year_built}</span>}
                        {offer.yield_indicated && <span className="text-[10px] text-muted-foreground">{offer.yield_indicated}%</span>}
                      </div>
                    </div>

                    {/* Address */}
                    <span className="text-muted-foreground truncate text-sm">{[offer.postal_code, offer.city].filter(Boolean).join(' ') || '–'}</span>

                    {/* Price */}
                    <span className="text-right font-medium text-sm">{formatPrice(offer.price_asking)}</span>

                    {/* Exposé Link */}
                    <div>
                      {exposeDoc ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => handleExposeClick(e, exposeDoc)}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1 text-primary" />
                          PDF
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">–</span>
                      )}
                    </div>

                    {/* Kalkulation Link */}
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/portal/akquise-manager/objekteingang/${offer.id}`);
                        }}
                      >
                        <Calculator className="h-3.5 w-3.5 mr-1 text-primary" />
                        Kalk.
                      </Button>
                    </div>

                    {/* Status */}
                    <Badge variant={statusConfig.variant} className="w-fit text-[10px]">{statusConfig.label}</Badge>

                    {/* Mandate Assignment Dropdown */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={offer.mandate_id || '__none'}
                        onValueChange={(val) => assignMutation.mutate({ offerId: offer.id, mandateId: val === '__none' ? null : val })}
                      >
                        <SelectTrigger className="h-7 text-[10px] w-full">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">— Kein Mandat —</SelectItem>
                          {activeMandates.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* ─── SEARCH & FILTER CARD ─── */}
      <Card className={CARD.BASE}>
        <div className={CARD.SECTION_HEADER}>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <span className={TYPOGRAPHY.CARD_TITLE}>Suche & Filter</span>
          </div>
        </div>
        <CardContent className="space-y-3">
          {/* Row 1: Search + Time Range */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Titel, Adresse, PLZ, Anbieter, Notizen …"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-44">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="h-10">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map(tr => (
                    <SelectItem key={tr.value} value={tr.value}>{tr.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Status Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_CHIPS.map(chip => (
              <button
                key={chip.value}
                onClick={() => setStatusFilter(chip.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                  statusFilter === chip.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                )}
              >
                {chip.label}
                {chip.value !== 'all' && (
                  <span className="ml-1.5 opacity-70">
                    {allOffers.filter(o => o.status === chip.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── DATENRAUM ─── */}
      <AcqDataRoom />
    </PageShell>
  );
}

export default ObjekteingangList;
