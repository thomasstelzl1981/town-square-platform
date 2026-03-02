/**
 * TLC Section: Dienstleister-Verwaltung (Ranking + SLA)
 * via useServiceProviders — read-only display until DB tables exist
 */
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Wrench, Star, Clock, Users } from 'lucide-react';
import { useServiceProviders, CATEGORY_LABELS, type ServiceProviderCategory } from '@/hooks/useServiceProviders';

interface Props {
  propertyId: string;
}

export function TLCServiceProviderSection({ propertyId }: Props) {
  const [open, setOpen] = useState(false);
  const { rankedProviders, emergencyProviders, selectedCategory, setSelectedCategory, categoryLabels } = useServiceProviders();

  const categories = Object.entries(categoryLabels) as [ServiceProviderCategory, string][];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-8 text-xs">
          <span className="flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5" />
            Dienstleister
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 px-1 pt-2">
        <div className="space-y-1">
          <Select
            value={selectedCategory || ''}
            onValueChange={(v) => setSelectedCategory(v as ServiceProviderCategory)}
          >
            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Kategorie filtern…" /></SelectTrigger>
            <SelectContent>
              {categories.map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {rankedProviders.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            <Users className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40" />
            <p>Keine Dienstleister hinterlegt</p>
            <p className="text-[10px] mt-1">Dienstleister werden über die Stammdaten gepflegt</p>
          </div>
        ) : (
          <div className="space-y-1">
            {rankedProviders.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-muted-foreground">
                    {p.categories.map(c => categoryLabels[c]).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {p.preferredForEmergency && (
                    <Badge variant="destructive" className="text-[10px] px-1">Notfall</Badge>
                  )}
                  <div className="flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 text-amber-500" />
                    <span className="font-medium">{p.averageRating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{p.totalAssignments > 0 ? Math.round((p.completedOnTime / p.totalAssignments) * 100) : 0}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {emergencyProviders.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Notfall-Kontakte</p>
            {emergencyProviders.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs py-0.5">
                <span>{p.name}</span>
                <span className="text-muted-foreground">{p.phone || '–'}</span>
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
