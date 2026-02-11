/**
 * GoldenPathGuard — Route-Guard-Wrapper fuer MOD-04
 * 
 * Prueft ob der User die Property fuer die angeforderte :propertyId besitzt.
 * Bei Fehlschlag: Redirect auf /portal/immobilien/portfolio + Toast.
 * 
 * Einbindung: Als Wrapper um MOD-04 Dynamic Routes.
 * Kein generisches Gating — nur MOD-04-spezifisch.
 */

import React, { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoldenPathGuardProps {
  children: React.ReactNode;
}

export function GoldenPathGuard({ children }: GoldenPathGuardProps) {
  const { id } = useParams<{ id: string }>();

  const { data: propertyExists, isLoading } = useQuery({
    queryKey: ['golden-path-guard', id],
    queryFn: async () => {
      if (!id) return false;

      const { data } = await supabase
        .from('properties')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      return !!data;
    },
    enabled: !!id,
    staleTime: 60_000,
  });

  const shouldRedirect = !isLoading && id && propertyExists === false;

  useEffect(() => {
    if (shouldRedirect) {
      toast.error('Immobilie nicht gefunden', {
        description: 'Die angeforderte Immobilie existiert nicht oder Sie haben keinen Zugriff.',
      });
    }
  }, [shouldRedirect]);

  if (isLoading) {
    return null; // Oder Loading-Spinner
  }

  if (shouldRedirect) {
    return <Navigate to="/portal/immobilien/portfolio" replace />;
  }

  return <>{children}</>;
}
