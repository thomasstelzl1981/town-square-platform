/**
 * AcqOfferDetailSheet — Mini-Immobilienakte als Seitenleiste
 * Zeigt strukturierte Daten, Dokumente & Mandat-Zuordnung
 */
import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Building2, MapPin, Euro, Calendar, ExternalLink, FileText, Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { AcqOfferStatus } from '@/hooks/useAcqOffers';

const STATUS_CONFIG: Record<AcqOfferStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  new: { label: 'Neu', variant: 'default' },
  analyzing: { label: 'Analyse', variant: 'secondary' },
  analyzed: { label: 'Analysiert', variant: 'outline' },
  presented: { label: 'Präsentiert', variant: 'outline' },
  accepted: { label: 'Akzeptiert', variant: 'default' },
  rejected: { label: 'Abgelehnt', variant: 'destructive' },
  archived: { label: 'Archiv', variant: 'secondary' },
};

interface Props {
  offerId: string | null;
  onClose: () => void;
  mandates: { id: string; code: string; client_display_name: string | null }[];
}

export function AcqOfferDetailSheet({ offerId, onClose, mandates }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: offer, isLoading } = useQuery({
    queryKey: ['acq-offer-detail', offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acq_offers')
        .select(`*, mandate:acq_mandates(id, code, client_display_name), documents:acq_offer_documents(id, file_name, storage_path, document_type, mime_type)`)
        .eq('id', offerId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!offerId,
  });

  const assignMandate = useMutation({
    mutationFn: async (mandateId: string | null) => {
      const { error } = await supabase
        .from('acq_offers')
        .update({ mandate_id: mandateId, updated_at: new Date().toISOString() } as any)
        .eq('id', offerId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-offers-tenant'] });
      queryClient.invalidateQueries({ queryKey: ['acq-offer-detail', offerId] });
      toast.success('Mandat-Zuordnung aktualisiert');
    },
  });

  const formatPrice = (price: number | null) => {
    if (!price) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  const formatFaktor = (yieldPct: number | null) => {
    if (!yieldPct || yieldPct <= 0) return '–';
    return (100 / yieldPct).toFixed(1) + 'x';
  };

  return (
    <Sheet open={!!offerId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Objekt-Kurzakte
          </SheetTitle>
        </SheetHeader>

        {isLoading || !offer ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 mt-4">
            {/* Status & Source */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={STATUS_CONFIG[offer.status as AcqOfferStatus]?.variant || 'default'}>
                {STATUS_CONFIG[offer.status as AcqOfferStatus]?.label || offer.status}
              </Badge>
              <Badge variant="outline" className="text-xs">{offer.source_type}</Badge>
              {(offer.mandate as any)?.code && (
                <Badge variant="outline" className="text-xs font-mono">{(offer.mandate as any).code}</Badge>
              )}
            </div>

            {/* Location */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Standort
              </div>
              <p className="text-sm font-medium">
                {[offer.address, offer.postal_code, offer.city].filter(Boolean).join(', ') || 'Keine Adresse'}
              </p>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-2 gap-3">
              <KpiItem label="Kaufpreis" value={formatPrice(offer.price_asking)} icon={<Euro className="h-3.5 w-3.5" />} />
              <KpiItem label="Faktor" value={formatFaktor(offer.yield_indicated)} />
              <KpiItem label="Einheiten" value={offer.units_count ? `${offer.units_count} WE` : '–'} />
              <KpiItem label="Fläche" value={offer.area_sqm ? `${Math.round(offer.area_sqm)} m²` : '–'} />
              <KpiItem label="NOI" value={offer.noi_indicated ? formatPrice(offer.noi_indicated) : '–'} />
              <KpiItem label="Baujahr" value={offer.year_built ? String(offer.year_built) : '–'} />
            </div>

            <Separator />

            {/* Provider & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Anbieter</p>
                <p className="text-sm font-medium">{(offer.provider_name as string) || '–'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Eingang</p>
                <p className="text-sm font-medium">
                  {format(new Date((offer.received_at as string) || offer.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                </p>
              </div>
            </div>

            <Separator />

            {/* Mandate Assignment */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Mandat-Zuordnung</p>
              <Select
                value={offer.mandate_id || 'none'}
                onValueChange={(val) => assignMandate.mutate(val === 'none' ? null : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kein Mandat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">– Kein Mandat –</SelectItem>
                  {mandates.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.code} {m.client_display_name ? `(${m.client_display_name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Documents */}
            {(offer.documents as any[])?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Dokumente</p>
                {(offer.documents as any[]).map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{doc.file_name}</span>
                    <Badge variant="outline" className="text-xs shrink-0">{doc.document_type}</Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Extracted Data Preview */}
            {offer.extracted_data && typeof offer.extracted_data === 'object' && Object.keys(offer.extracted_data as object).length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Extrahierte Daten (Rohdaten)</p>
                  <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-x-auto max-h-48 overflow-y-auto">
                    {JSON.stringify(offer.extracted_data, null, 2)}
                  </pre>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={() => {
                  onClose();
                  navigate(`/portal/akquise-manager/objekteingang/${offer.id}`);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Zur Objektakte
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function KpiItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="p-2.5 rounded-md bg-muted/50">
      <p className="text-xs text-muted-foreground flex items-center gap-1">{icon}{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}
