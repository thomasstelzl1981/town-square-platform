/**
 * IS24PublicationStatus — Inline-Komponente für IS24-Status & Buchung im ExposeDetail
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Loader2, CheckCircle2, XCircle, Coins } from 'lucide-react';

interface IS24PublicationStatusProps {
  listingId?: string;
  tenantId?: string;
  propertyData: {
    title: string;
    asking_price: number;
    description: string;
    commission_rate: number;
    street: string;
    postal_code: string;
    city: string;
    area_sqm: number;
    rooms?: number;
    year_built?: number;
  };
}

export function IS24PublicationStatus({ listingId, tenantId, propertyData }: IS24PublicationStatusProps) {
  const queryClient = useQueryClient();

  // Fetch IS24 publication status
  const { data: is24Pub } = useQuery({
    queryKey: ['listing-pub-scout24', listingId],
    queryFn: async () => {
      if (!listingId) return null;
      const { data } = await supabase
        .from('listing_publications')
        .select('channel, status, external_id, published_at')
        .eq('listing_id', listingId)
        .eq('channel', 'scout24')
        .maybeSingle();
      return data;
    },
    enabled: !!listingId,
  });

  const isActive = is24Pub?.status === 'active';
  const isError = (is24Pub?.status as string) === 'error';

  // Publish to IS24
  const publishMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-is24-gateway', {
        body: {
          action: 'create_listing',
          listing_id: listingId,
          object_type: 'ApartmentBuy',
          data: propertyData,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-pub-scout24', listingId] });
      queryClient.invalidateQueries({ queryKey: ['listing-publications', listingId] });
    },
  });

  // Deactivate
  const deactivateMutation = useMutation({
    mutationFn: async () => {
      if (!is24Pub?.external_id) throw new Error('Keine IS24-ID');
      const { data, error } = await supabase.functions.invoke('sot-is24-gateway', {
        body: {
          action: 'deactivate_listing',
          is24_id: is24Pub.external_id,
          listing_id: listingId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-pub-scout24', listingId] });
      queryClient.invalidateQueries({ queryKey: ['listing-publications', listingId] });
    },
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="font-medium">ImmobilienScout24</span>
        </div>
        {isActive ? (
          <Badge variant="default" className="text-xs">
            <CheckCircle2 className="mr-1 h-3 w-3" />Aktiv
          </Badge>
        ) : isError ? (
          <Badge variant="destructive" className="text-xs">Fehler</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">Nicht gebucht</Badge>
        )}
      </div>

      {isActive && is24Pub?.external_id && (
        <p className="text-xs text-muted-foreground">
          IS24-ID: {is24Pub.external_id}
        </p>
      )}

      {!isActive ? (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs"
          onClick={() => publishMutation.mutate()}
          disabled={publishMutation.isPending || !listingId}
        >
          {publishMutation.isPending ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Coins className="mr-1 h-3 w-3" />
          )}
          Auf IS24 buchen (2 Credits)
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="w-full h-8 text-xs"
          onClick={() => deactivateMutation.mutate()}
          disabled={deactivateMutation.isPending}
        >
          {deactivateMutation.isPending ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <XCircle className="mr-1 h-3 w-3" />
          )}
          IS24 deaktivieren
        </Button>
      )}
    </div>
  );
}
