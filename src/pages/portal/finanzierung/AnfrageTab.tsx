/**
 * MOD-07: Anfrage Tab
 * Inline-First: Shows form directly, auto-creates draft if none exists.
 * No popup dialog — everything visible on the page.
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileStack, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AnfrageFormV2 from '@/components/finanzierung/AnfrageFormV2';

export default function AnfrageTab() {
  const { activeOrganization } = useAuth();
  const queryClient = useQueryClient();

  // 1. Load most recent draft
  const { data: draftRequest, isLoading: loadingDraft } = useQuery({
    queryKey: ['draft-finance-request', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return null;

      const { data, error } = await supabase
        .from('finance_requests')
        .select('*')
        .eq('tenant_id', activeOrganization.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!activeOrganization?.id,
  });

  // 2. Mutation to create a new draft (no dialog)
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeOrganization?.id) throw new Error('Keine Organisation');

      const { data, error } = await supabase
        .from('finance_requests')
        .insert({
          tenant_id: activeOrganization.id,
          status: 'draft',
          object_source: 'custom',
          property_id: null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Finanzierungsanfrage erstellt');
      queryClient.invalidateQueries({ queryKey: ['draft-finance-request'] });
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  // Loading state
  if (loadingDraft) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If draft exists → show form directly
  if (draftRequest?.id) {
    return <AnfrageFormV2 requestId={draftRequest.id} />;
  }

  // No draft → show simple CTA to create one (no dialog)
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <Card>
        <CardContent className="text-center py-12">
          <FileStack className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">
            Neue Finanzierungsanfrage starten
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Erstellen Sie eine neue Finanzierungsanfrage. Die Objektdaten und Ihre
            Selbstauskunft können direkt im Formular eingegeben werden.
          </p>
          <Button
            className="mt-6 gap-2"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Neue Anfrage erstellen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
