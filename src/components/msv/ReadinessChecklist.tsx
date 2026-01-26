import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface ReadinessChecklistProps {
  enrollmentId: string;
  onComplete?: () => void;
}

const REQUIREMENTS = [
  { code: 'LEASE_ACTIVE', label: 'Mindestens ein aktiver Mietvertrag', description: 'Sie benötigen mindestens einen aktiven Mietvertrag.' },
  { code: 'CONTACT_EMAIL', label: 'Mieter-E-Mail hinterlegt', description: 'Alle Mieter müssen eine E-Mail-Adresse haben.' },
  { code: 'RENT_AMOUNT', label: 'Mietbetrag definiert', description: 'Die monatliche Miete muss festgelegt sein.' },
];

export const ReadinessChecklist = ({ enrollmentId, onComplete }: ReadinessChecklistProps) => {
  const { data: items } = useQuery({
    queryKey: ['msv-readiness', enrollmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('msv_readiness_items')
        .select('*')
        .eq('enrollment_id', enrollmentId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!enrollmentId
  });

  const getItemStatus = (code: string) => {
    return items?.find(i => i.requirement_code === code)?.status || 'missing';
  };

  const allComplete = REQUIREMENTS.every(r => getItemStatus(r.code) === 'provided');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          Premium-Aktivierung
          {allComplete ? (
            <Badge className="bg-status-success">Bereit</Badge>
          ) : (
            <Badge variant="outline">Nicht bereit</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {REQUIREMENTS.map((req) => {
          const status = getItemStatus(req.code);
          return (
            <div key={req.code} className="flex items-start gap-3">
              {status === 'provided' ? (
                <CheckCircle className="h-5 w-5 text-status-success shrink-0" />
              ) : status === 'waived' ? (
                <AlertCircle className="h-5 w-5 text-status-warning shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium">{req.label}</p>
                <p className="text-xs text-muted-foreground">{req.description}</p>
              </div>
            </div>
          );
        })}

        <Button 
          className="w-full mt-4" 
          disabled={!allComplete}
          onClick={onComplete}
        >
          Premium aktivieren
        </Button>
      </CardContent>
    </Card>
  );
};
