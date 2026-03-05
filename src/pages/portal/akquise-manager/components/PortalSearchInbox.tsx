/**
 * Portal Search Inbox — Phase 2
 * 
 * Displays persisted portal listings with status management:
 * New / Seen / Saved / Rejected + Suppression
 * Actions: Save, Reject, Convert to Offer
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Inbox, Building2, ExternalLink, MapPin, Home, TrendingUp,
  Check, X, ArrowRight, Loader2, Eye,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import {
  usePortalListings,
  useUpdateListingStatus,
  useConvertToOffer,
  type PortalListing,
  type ListingStatus,
} from '@/hooks/usePortalListings';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const PORTAL_LABELS: Record<string, string> = {
  immoscout24: 'ImmoScout24',
  immowelt: 'Immowelt',
  ebay_kleinanzeigen: 'Kleinanzeigen',
};

const STATUS_CONFIG: Record<ListingStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  new: { label: 'Neu', variant: 'default' },
  seen: { label: 'Gesehen', variant: 'secondary' },
  saved: { label: 'Gemerkt', variant: 'outline' },
  rejected: { label: 'Abgelehnt', variant: 'destructive' },
};

function useTenantId() {
  return useQuery({
    queryKey: ['current-tenant-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('active_tenant_id')
        .eq('id', user.id)
        .single();
      return data?.active_tenant_id || null;
    },
  });
}

export function PortalSearchInbox() {
  const [tab, setTab] = React.useState<string>('new');
  const statusFilter = tab === 'all' ? undefined : tab as ListingStatus;
  const { data: listings, isLoading } = usePortalListings(statusFilter);
  const updateStatus = useUpdateListingStatus();
  const convertToOffer = useConvertToOffer();
  const { data: tenantId } = useTenantId();

  const counts = React.useMemo(() => {
    // We show counts per tab - but since we only query one status at a time,
    // we just show the current count
    return { current: listings?.length || 0 };
  }, [listings]);

  const handleMarkSeen = (id: string) => {
    updateStatus.mutate({ id, status: 'seen' });
  };

  const handleSave = (id: string) => {
    updateStatus.mutate({ id, status: 'saved' });
  };

  const handleReject = (id: string, suppress: boolean) => {
    updateStatus.mutate({ id, status: 'rejected', suppress });
  };

  const handleConvert = (listing: PortalListing) => {
    if (!tenantId) return;
    convertToOffer.mutate({ listing, tenantId });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          Objekt-Inbox
        </CardTitle>
        <CardDescription>
          Gefundene Objekte verwalten — merken, ablehnen oder in den Objekteingang übernehmen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="new">Neu</TabsTrigger>
            <TabsTrigger value="seen">Gesehen</TabsTrigger>
            <TabsTrigger value="saved">Gemerkt</TabsTrigger>
            <TabsTrigger value="rejected">Abgelehnt</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !listings || listings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>Keine Objekte in dieser Kategorie</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onMarkSeen={handleMarkSeen}
                    onSave={handleSave}
                    onReject={handleReject}
                    onConvert={handleConvert}
                    isConverting={convertToOffer.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ListingCard({
  listing,
  onMarkSeen,
  onSave,
  onReject,
  onConvert,
  isConverting,
}: {
  listing: PortalListing;
  onMarkSeen: (id: string) => void;
  onSave: (id: string) => void;
  onReject: (id: string, suppress: boolean) => void;
  onConvert: (listing: PortalListing) => void;
  isConverting: boolean;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title + Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{listing.title}</span>
            <Badge variant="outline" className="text-xs">
              {PORTAL_LABELS[listing.source_portal] || listing.source_portal}
            </Badge>
            {listing.object_type && (
              <Badge variant="secondary" className="text-xs">
                <Home className="h-3 w-3 mr-1" />
                {listing.object_type}
              </Badge>
            )}
            {listing.linked_offer_id && (
              <Badge className="text-xs bg-primary/10 text-primary">
                Im Objekteingang
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="text-sm text-muted-foreground mt-1.5 space-y-1">
            {(listing.address || listing.city || listing.zip_code) && (
              <p className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {[listing.address, listing.zip_code, listing.city].filter(Boolean).join(', ')}
              </p>
            )}
            <div className="flex gap-3 flex-wrap text-xs">
              {listing.price != null && (
                <span className="font-semibold text-foreground">{formatCurrency(listing.price)}</span>
              )}
              {listing.living_area_sqm != null && <span>{listing.living_area_sqm} m²</span>}
              {listing.rooms != null && <span>{listing.rooms} Zi.</span>}
              {listing.units_count != null && <span>{listing.units_count} WE</span>}
              {listing.year_built != null && <span>Bj. {listing.year_built}</span>}
              {listing.gross_yield != null && (
                <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-3 w-3" />
                  {listing.gross_yield}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {listing.status === 'new' && (
            <Button size="sm" variant="ghost" onClick={() => onMarkSeen(listing.id)} title="Als gesehen markieren">
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {listing.status !== 'saved' && !listing.linked_offer_id && (
            <Button size="sm" variant="ghost" onClick={() => onSave(listing.id)} title="Merken">
              <Check className="h-4 w-4" />
            </Button>
          )}
          {listing.status !== 'rejected' && (
            <Button size="sm" variant="ghost" onClick={() => onReject(listing.id, true)} title="Ablehnen + unterdrücken">
              <X className="h-4 w-4" />
            </Button>
          )}
          {!listing.linked_offer_id && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onConvert(listing)}
              disabled={isConverting}
              title="In Objekteingang übernehmen"
            >
              <ArrowRight className="h-4 w-4 mr-1" />
              Übernehmen
            </Button>
          )}
          {listing.source_url && (
            <Button size="sm" variant="ghost" asChild>
              <a href={listing.source_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
