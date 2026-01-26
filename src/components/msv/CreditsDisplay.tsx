import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Coins } from 'lucide-react';

interface CreditsDisplayProps {
  tenantId?: string;
}

export const CreditsDisplay = ({ tenantId }: CreditsDisplayProps) => {
  const { data } = useQuery({
    queryKey: ['msv-credits', tenantId],
    queryFn: async () => {
      // Count active premium enrollments with their unit counts
      const { data: enrollments } = await supabase
        .from('msv_enrollments')
        .select(`
          id,
          tier,
          credits_per_unit,
          properties (
            units (id)
          )
        `)
        .eq('tier', 'premium')
        .eq('status', 'active');

      let totalUnits = 0;
      let totalCredits = 0;

      enrollments?.forEach(e => {
        const unitCount = (e.properties as any)?.units?.length || 0;
        totalUnits += unitCount;
        totalCredits += unitCount * (e.credits_per_unit || 40);
      });

      return { totalUnits, totalCredits };
    },
    enabled: !!tenantId
  });

  return (
    <Card className="bg-accent/5 border-accent/20">
      <CardContent className="p-4 flex items-center gap-3">
        <Coins className="h-5 w-5 text-accent" />
        <div>
          <p className="font-semibold">{data?.totalCredits || 0} Credits / Monat</p>
          <p className="text-xs text-muted-foreground">
            {data?.totalUnits || 0} aktive Premium-Einheiten × 40 Credits
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
