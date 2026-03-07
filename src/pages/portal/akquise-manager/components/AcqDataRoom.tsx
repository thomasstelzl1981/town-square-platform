/**
 * Acquisition Data Room — 3-Level Data-Driven Hierarchy
 * 
 * Level 1: Mandate list (from acq_mandates) + "Nicht zugeordnet" for unassigned
 * Level 2: Offers within a mandate (from acq_offers)
 * Level 3: Document categories (expose, recherche, korrespondenz, sonstiges) with files
 * 
 * Navigation is breadcrumb-based, not Storage-based.
 */

import * as React from 'react';
import { DESIGN } from '@/config/designManifest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, FolderOpen, FileText, File, Image, Download,
  ChevronRight, ArrowLeft, Building2, Briefcase, FolderArchive
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

// ── Types ──────────────────────────────────────────────────────────────
interface MandateItem {
  id: string;
  code: string;
  client_display_name: string | null;
  status: string;
  offerCount: number;
}

interface OfferItem {
  id: string;
  title: string | null;
  address: string | null;
  city: string | null;
  status: string;
  created_at: string;
}

interface DocumentFile {
  id: string;
  file_name: string;
  storage_path: string;
  document_type: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

type DrillLevel = 'mandates' | 'offers' | 'documents';

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  expose: { label: 'Exposé', icon: <FileText className="h-3.5 w-3.5 text-primary" /> },
  recherche: { label: 'Recherche', icon: <FolderArchive className="h-3.5 w-3.5 text-primary" /> },
  korrespondenz: { label: 'Korrespondenz', icon: <File className="h-3.5 w-3.5 text-primary" /> },
  sonstiges: { label: 'Sonstiges', icon: <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /> },
};

// ── Component ──────────────────────────────────────────────────────────
export function AcqDataRoom() {
  const { activeTenantId } = useAuth();
  const [level, setLevel] = React.useState<DrillLevel>('mandates');
  const [selectedMandate, setSelectedMandate] = React.useState<MandateItem | null>(null);
  const [selectedOffer, setSelectedOffer] = React.useState<OfferItem | null>(null);

  // ── Level 1: Mandates with offer counts ──
  const { data: mandates, isLoading: loadingMandates } = useQuery({
    queryKey: ['acq-dataroom-mandates', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      
      const { data: mands, error } = await supabase
        .from('acq_mandates')
        .select('id, code, client_display_name, status')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Count offers per mandate
      const { data: offerCounts } = await supabase
        .from('acq_offers')
        .select('mandate_id')
        .eq('tenant_id', activeTenantId)
        .not('mandate_id', 'is', null);

      const countMap: Record<string, number> = {};
      for (const o of offerCounts || []) {
        if (o.mandate_id) countMap[o.mandate_id] = (countMap[o.mandate_id] || 0) + 1;
      }

      // Count unassigned offers
      const { count: unassignedCount } = await supabase
        .from('acq_offers')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', activeTenantId)
        .is('mandate_id', null);

      const items: MandateItem[] = (mands || []).map(m => ({
        id: m.id,
        code: m.code,
        client_display_name: m.client_display_name,
        status: m.status,
        offerCount: countMap[m.id] || 0,
      }));

      // Add virtual "unassigned" entry
      if ((unassignedCount || 0) > 0) {
        items.push({
          id: '__unassigned__',
          code: 'Nicht zugeordnet',
          client_display_name: 'Exposés ohne Mandatszuordnung',
          status: 'active',
          offerCount: unassignedCount || 0,
        });
      }

      return items;
    },
    enabled: !!activeTenantId,
  });

  // ── Level 2: Offers within selected mandate ──
  const { data: offers, isLoading: loadingOffers } = useQuery({
    queryKey: ['acq-dataroom-offers', selectedMandate?.id],
    queryFn: async () => {
      if (!activeTenantId || !selectedMandate) return [];

      let query = supabase
        .from('acq_offers')
        .select('id, title, address, city, status, created_at')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });

      if (selectedMandate.id === '__unassigned__') {
        query = query.is('mandate_id', null);
      } else {
        query = query.eq('mandate_id', selectedMandate.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as OfferItem[];
    },
    enabled: level === 'offers' && !!selectedMandate,
  });

  // ── Level 3: Documents for selected offer ──
  const { data: documents, isLoading: loadingDocs } = useQuery({
    queryKey: ['acq-dataroom-docs', selectedOffer?.id],
    queryFn: async () => {
      if (!activeTenantId || !selectedOffer) return [];

      const { data, error } = await supabase
        .from('acq_offer_documents')
        .select('id, file_name, storage_path, document_type, mime_type, file_size, created_at')
        .eq('offer_id', selectedOffer.id)
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DocumentFile[];
    },
    enabled: level === 'documents' && !!selectedOffer,
  });

  // ── Navigation handlers ──
  const openMandate = (mandate: MandateItem) => {
    setSelectedMandate(mandate);
    setLevel('offers');
  };

  const openOffer = (offer: OfferItem) => {
    setSelectedOffer(offer);
    setLevel('documents');
  };

  const goBack = () => {
    if (level === 'documents') {
      setSelectedOffer(null);
      setLevel('offers');
    } else if (level === 'offers') {
      setSelectedMandate(null);
      setLevel('mandates');
    }
  };

  // ── Helpers ──
  const getFileIcon = (name: string) => {
    if (/\.(pdf|doc|docx)$/i.test(name)) return <FileText className="h-3.5 w-3.5 text-primary" />;
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(name)) return <Image className="h-3.5 w-3.5 text-primary" />;
    return <File className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return '–';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleDownload = async (storagePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from('tenant-documents')
      .download(storagePath);
    
    if (error || !data) {
      toast.error('Download fehlgeschlagen');
      return;
    }
    
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Breadcrumb ──
  const breadcrumb = () => {
    const parts: { label: string; onClick?: () => void }[] = [
      { label: 'Datenraum', onClick: level !== 'mandates' ? () => { setSelectedMandate(null); setSelectedOffer(null); setLevel('mandates'); } : undefined },
    ];
    if (selectedMandate) {
      parts.push({ label: selectedMandate.code, onClick: level === 'documents' ? () => { setSelectedOffer(null); setLevel('offers'); } : undefined });
    }
    if (selectedOffer) {
      parts.push({ label: selectedOffer.title || 'Objekt' });
    }
    return parts;
  };

  const isLoading = (level === 'mandates' && loadingMandates) || (level === 'offers' && loadingOffers) || (level === 'documents' && loadingDocs);

  // Group documents by category
  const groupedDocs = React.useMemo(() => {
    if (!documents) return {};
    const groups: Record<string, DocumentFile[]> = {};
    for (const doc of documents) {
      const cat = doc.document_type || 'sonstiges';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(doc);
    }
    return groups;
  }, [documents]);

  const totalFiles = mandates?.reduce((sum, m) => sum + m.offerCount, 0) ?? 0;

  return (
    <Card className={DESIGN.CARD.BASE}>
      <CardHeader className={DESIGN.CARD.SECTION_HEADER}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {level !== 'mandates' && (
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
              {breadcrumb().map((part, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                  {part.onClick ? (
                    <button onClick={part.onClick} className="text-muted-foreground hover:text-foreground truncate">
                      {part.label}
                    </button>
                  ) : (
                    <span className="font-medium truncate">{part.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          {level === 'mandates' && (
            <Badge variant="secondary" className="text-xs shrink-0">{totalFiles} Objekte</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : level === 'mandates' ? (
          /* ── Level 1: Mandate List ── */
          !mandates || mandates.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className={DESIGN.TYPOGRAPHY.MUTED}>Noch keine Mandate vorhanden</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {mandates.map((mandate) => (
                <button
                  key={mandate.id}
                  onClick={() => openMandate(mandate)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <Briefcase className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mandate.code}</p>
                    {mandate.client_display_name && (
                      <p className="text-xs text-muted-foreground truncate">{mandate.client_display_name}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {mandate.offerCount} {mandate.offerCount === 1 ? 'Objekt' : 'Objekte'}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )
        ) : level === 'offers' ? (
          /* ── Level 2: Offers List ── */
          !offers || offers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className={DESIGN.TYPOGRAPHY.MUTED}>Keine Objekte in diesem Mandat</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {offers.map((offer) => (
                <button
                  key={offer.id}
                  onClick={() => openOffer(offer)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{offer.title || 'Ohne Titel'}</p>
                    {offer.address && (
                      <p className="text-xs text-muted-foreground truncate">
                        {offer.address}{offer.city ? `, ${offer.city}` : ''}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{offer.status}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )
        ) : (
          /* ── Level 3: Document Categories & Files ── */
          !documents || documents.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className={DESIGN.TYPOGRAPHY.MUTED}>Keine Dokumente für dieses Objekt</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {/* Show all categories, even empty ones for structure */}
              {Object.entries(CATEGORY_LABELS).map(([cat, { label, icon }]) => {
                const catDocs = groupedDocs[cat] || [];
                return (
                  <div key={cat}>
                    <div className="px-4 py-2 bg-muted/20 flex items-center gap-2">
                      {icon}
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
                      <Badge variant="outline" className="text-xs ml-auto">{catDocs.length}</Badge>
                    </div>
                    {catDocs.length === 0 ? (
                      <div className="px-4 py-2 text-center">
                        <span className="text-xs text-muted-foreground">Leer</span>
                      </div>
                    ) : (
                      catDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-muted/10 transition-colors"
                        >
                          {getFileIcon(doc.file_name)}
                          <span className="text-sm flex-1 truncate">{doc.file_name}</span>
                          <span className="text-xs text-muted-foreground">{formatSize(doc.file_size)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => handleDownload(doc.storage_path, doc.file_name)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
              {/* Show any docs with unknown categories */}
              {Object.entries(groupedDocs)
                .filter(([cat]) => !CATEGORY_LABELS[cat])
                .map(([cat, docs]) => (
                  <div key={cat}>
                    <div className="px-4 py-2 bg-muted/20 flex items-center gap-2">
                      <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{cat}</span>
                      <Badge variant="outline" className="text-xs ml-auto">{docs.length}</Badge>
                    </div>
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-muted/10 transition-colors"
                      >
                        {getFileIcon(doc.file_name)}
                        <span className="text-sm flex-1 truncate">{doc.file_name}</span>
                        <span className="text-xs text-muted-foreground">{formatSize(doc.file_size)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => handleDownload(doc.storage_path, doc.file_name)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
