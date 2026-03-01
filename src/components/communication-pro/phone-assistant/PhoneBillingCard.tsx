import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Phone, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PhoneUsageSummary {
  total_calls: number;
  total_seconds: number;
  total_call_credits: number;
  subscription_credits: number;
}

interface Props {
  usage: PhoneUsageSummary | null;
  isLoading: boolean;
  hasNumber: boolean;
}

export function PhoneBillingCard({ usage, isLoading, hasNumber }: Props) {
  const totalCredits = (usage?.total_call_credits ?? 0) + (usage?.subscription_credits ?? 0);
  const totalMinutes = usage ? Math.ceil(usage.total_seconds / 60) : 0;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4 text-primary" />
          Verbrauch &amp; Kosten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pricing info banner */}
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
            <span><strong>Grundgebühr:</strong> 15 Credits/Monat (3,75 €)</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span><strong>Gespräche:</strong> 2 Credits/Minute (0,50 €)</span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !hasNumber ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Noch keine Telefonnummer aktiv — keine Abrechnung.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
              <p className="text-2xl font-bold">{usage?.total_calls ?? 0}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Anrufe</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
              <p className="text-2xl font-bold">{totalMinutes}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Minuten</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
              <p className="text-2xl font-bold">{totalCredits}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Credits</p>
            </div>
          </div>
        )}

        {hasNumber && usage && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
            <span>Aktueller Monat</span>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-[10px]">
                {usage.subscription_credits} Cr Grundgebühr
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {usage.total_call_credits} Cr Gespräche
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
