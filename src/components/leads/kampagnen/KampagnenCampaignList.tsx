/**
 * KampagnenCampaignList — List of existing campaigns with expand/collapse
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone, CreditCard, Calendar, MapPin } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Eingereicht', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  live: { label: 'Live', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  paused: { label: 'Pausiert', color: 'bg-muted text-muted-foreground' },
  stopped: { label: 'Gestoppt', color: 'bg-red-500/10 text-red-700 border-red-200' },
  completed: { label: 'Abgeschlossen', color: 'bg-muted text-muted-foreground' },
};

const BRAND_GRADIENTS: Record<string, string> = {
  kaufy: 'from-[hsl(220,85%,55%)] to-[hsl(245,75%,60%)]',
  futureroom: 'from-[hsl(165,70%,36%)] to-[hsl(158,64%,52%)]',
  acquiary: 'from-[hsl(210,80%,50%)] to-[hsl(200,70%,40%)]',
  project: 'from-[hsl(270,60%,50%)] to-[hsl(280,50%,60%)]',
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);
}

interface KampagnenCampaignListProps {
  mandates: any[] | undefined;
  isLoading: boolean;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
}

export function KampagnenCampaignList({ mandates, isLoading, expandedId, onToggleExpand }: KampagnenCampaignListProps) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-muted-foreground" /><h2 className="text-sm font-medium">Meine Kampagnen</h2></div>
        {isLoading ? (
          <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : mandates && mandates.length > 0 ? (
          <div className="space-y-3">
            {mandates.map(m => {
              const status = STATUS_CONFIG[m.status] || { label: m.status, color: 'bg-muted text-muted-foreground' };
              const gradient = BRAND_GRADIENTS[m.brand_context] || BRAND_GRADIENTS.kaufy;
              const isExpanded = expandedId === m.id;
              return (
                <div key={m.id} className={`rounded-xl overflow-hidden border transition-all cursor-pointer ${isExpanded ? 'border-primary shadow-md' : 'hover:border-primary/30'}`} onClick={() => onToggleExpand(m.id)}>
                  <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{m.brand_context?.toUpperCase()}</span>
                      <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{formatCurrency(m.budget_total_cents || 0)}</span>
                      {m.start_date && (
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(m.start_date).toLocaleDateString('de-DE')} – {m.end_date ? new Date(m.end_date).toLocaleDateString('de-DE') : '—'}</span>
                      )}
                      {m.regions && Array.isArray(m.regions) && (m.regions as string[]).length > 0 && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{(m.regions as string[]).join(', ')}</span>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="pt-2 border-t border-border/50 mt-2 text-xs text-muted-foreground">Erstellt: {new Date(m.created_at).toLocaleDateString('de-DE')}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Megaphone} title="Noch keine Kampagnen" description="Erstellen Sie Ihre erste Kampagne, um Leads zu generieren." />
        )}
      </CardContent>
    </Card>
  );
}
