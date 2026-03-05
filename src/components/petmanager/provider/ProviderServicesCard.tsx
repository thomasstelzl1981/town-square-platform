/**
 * ProviderServicesCard — Service listing with radio selection
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';

const SERVICE_LABELS: Record<string, string> = {
  boarding: 'Pension / Urlaubsbetreuung',
  daycare: 'Tagesstätte',
  walking: 'Gassi-Service',
  grooming: 'Hundesalon',
  puppy_class: 'Welpenspielstunde',
};

function formatPrice(cents: number, type: string) {
  const eur = (cents / 100).toFixed(0);
  const suffix = type === 'per_day' ? '/Tag' : type === 'per_hour' ? '/Std.' : '';
  return `${eur} €${suffix}`;
}

interface Service {
  id: string;
  category: string;
  title: string;
  price_cents: number;
  price_type: string;
  description?: string | null;
  duration_minutes: number;
}

interface ProviderServicesCardProps {
  services: Service[];
  selectedServiceId: string;
  onServiceChange: (id: string) => void;
}

export function ProviderServicesCard({ services, selectedServiceId, onServiceChange }: ProviderServicesCardProps) {
  const selectedService = services.find(s => s.id === selectedServiceId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><PawPrint className="h-4 w-4" />Leistungen</CardTitle>
      </CardHeader>
      <CardContent>
        {services.length > 0 ? (
          <RadioGroup value={selectedServiceId} onValueChange={onServiceChange}>
            <div className="space-y-2">
              {services.map(s => (
                <label key={s.id} className={cn('flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors', selectedServiceId === s.id ? 'border-primary/50 bg-primary/5' : 'border-border/30 hover:border-border/60')}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={s.id} />
                    <div>
                      <p className="text-sm font-medium">{SERVICE_LABELS[s.category] || s.category}</p>
                      <p className="text-xs text-muted-foreground">{s.title}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">{formatPrice(s.price_cents, s.price_type)}</Badge>
                </label>
              ))}
            </div>
          </RadioGroup>
        ) : (
          <p className="text-sm text-muted-foreground">Keine Leistungen verfügbar.</p>
        )}

        {selectedService && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/20">
            <p className="text-sm font-semibold">{formatPrice(selectedService.price_cents, selectedService.price_type)}</p>
            {selectedService.description && <p className="text-xs text-muted-foreground mt-1">{selectedService.description}</p>}
            <p className="text-xs text-muted-foreground mt-1">Dauer: {selectedService.duration_minutes} Min.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { SERVICE_LABELS };
