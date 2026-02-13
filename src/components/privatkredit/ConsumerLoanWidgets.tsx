/**
 * ConsumerLoanWidgets — Widget bar for existing consumer loan cases + CTA
 * Mirrors FinanceRequestWidgets pattern.
 * 
 * GOLDEN PATH KONFORM: Demo-Widget an Position 0, useDemoToggles
 */
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, CreditCard, Loader2 } from 'lucide-react';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { GOLDEN_PATH_PROCESSES } from '@/manifests/goldenPathProcesses';

const GP_PRIVATKREDIT = GOLDEN_PATH_PROCESSES.find(p => p.id === 'GP-PRIVATKREDIT')!;
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  offers_ready: 'Angebote',
  docs_missing: 'Dokumente fehlen',
  ready_to_submit: 'Bereit',
  submitted: 'Eingereicht',
  in_review: 'In Prüfung',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt',
  signed: 'Unterschrieben',
  paid_out: 'Ausgezahlt',
  cancelled: 'Storniert',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  offers_ready: 'secondary',
  submitted: 'default',
  approved: 'default',
  rejected: 'destructive',
  cancelled: 'destructive',
};

interface ConsumerLoanWidgetsProps {
  activeCaseId?: string;
  onSelectCase?: (id: string) => void;
}

export function ConsumerLoanWidgets({ activeCaseId, onSelectCase }: ConsumerLoanWidgetsProps) {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['consumer-loan-cases-list', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('consumer_loan_cases')
        .select('id, status, requested_amount, requested_term_months, created_at')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeTenantId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId) throw new Error('Kein Tenant');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');
      const { data, error } = await supabase
        .from('consumer_loan_cases')
        .insert({
          tenant_id: activeTenantId,
          user_id: user.id,
          status: 'draft',
          employment_status: 'employed',
        })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['consumer-loan-cases-list'] });
      onSelectCase?.(data.id);
      toast.success('Neuer Privatkredit angelegt');
    },
    onError: () => {
      toast.error('Fehler beim Erstellen');
    },
  });

  const formatCurrency = (val: number | null) =>
    val ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val) : null;

  const { isEnabled } = useDemoToggles();
  const showDemo = isEnabled('GP-PRIVATKREDIT');

  return (
    <WidgetGrid variant="widget">
      {/* Demo-Widget an Position 0 */}
      {showDemo && (
        <WidgetCell>
          <Card
            className={cn(
              `h-full cursor-pointer transition-all`,
              DESIGN.DEMO_WIDGET.CARD,
              DESIGN.DEMO_WIDGET.HOVER,
              activeCaseId === '__demo__' ? 'ring-2 ring-emerald-500' : ''
            )}
            onClick={() => onSelectCase?.('__demo__')}
          >
            <div className="flex flex-col h-full p-4 justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, "text-[10px]")}>
                    {GP_PRIVATKREDIT.demoWidget.badgeLabel}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm">25.000 €</h3>
                <p className="text-xs text-muted-foreground mt-1">60 Monate · 4,9% eff.</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{GP_PRIVATKREDIT.demoWidget.subtitle}</p>
            </div>
          </Card>
        </WidgetCell>
      )}

      {cases.map((c) => {
        const isActive = c.id === activeCaseId;
        return (
          <WidgetCell key={c.id}>
            <Card
              className={`h-full cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2 ring-primary' : ''}`}
              onClick={() => onSelectCase?.(c.id)}
            >
              <div className="flex flex-col h-full p-4 justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <Badge variant={STATUS_VARIANTS[c.status] ?? 'outline'}>
                      {STATUS_LABELS[c.status] ?? c.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm truncate">
                    {formatCurrency(c.requested_amount) ?? 'Kein Betrag'}
                  </h3>
                  {c.requested_term_months && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.requested_term_months} Monate
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {format(new Date(c.created_at), 'dd.MM.yyyy', { locale: de })}
                </p>
              </div>
            </Card>
          </WidgetCell>
        );
      })}

      {/* CTA: New Loan */}
      <WidgetCell>
        <Card
          className="h-full cursor-pointer transition-all hover:shadow-md border-dashed border-2 border-muted-foreground/20 hover:border-primary/40"
          onClick={() => createMutation.mutate()}
        >
          <div className="flex flex-col items-center justify-center h-full p-4 gap-3">
            {createMutation.isPending ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="rounded-full bg-primary/10 p-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Neuer Privatkredit
                </span>
              </>
            )}
          </div>
        </Card>
      </WidgetCell>

      {isLoading && cases.length === 0 && (
        <WidgetCell>
          <Card className="h-full">
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </Card>
        </WidgetCell>
      )}
    </WidgetGrid>
  );
}
