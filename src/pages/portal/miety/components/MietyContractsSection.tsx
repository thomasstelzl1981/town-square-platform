/**
 * MietyContractsSection — Contract cards grid with placeholder empty state
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DESIGN } from '@/config/designManifest';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Zap, Droplets, Flame, Wifi, Shield, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { WidgetDeleteOverlay } from '@/components/shared/WidgetDeleteOverlay';
import { toast } from 'sonner';

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  strom: { label: 'Strom', icon: Zap, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  gas: { label: 'Gas', icon: Flame, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  wasser: { label: 'Wasser', icon: Droplets, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  internet: { label: 'Internet', icon: Wifi, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  hausrat: { label: 'Hausrat', icon: Shield, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  haftpflicht: { label: 'Haftpflicht', icon: Shield, color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' },
  miete: { label: 'Miete', icon: FileText, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
  sonstige: { label: 'Sonstige', icon: FileText, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
};

const PLACEHOLDER_CARDS = [
  { category: 'strom', label: 'Stromvertrag' },
  { category: 'gas', label: 'Gasvertrag' },
  { category: 'wasser', label: 'Wasservertrag' },
  { category: 'internet', label: 'Internetvertrag' },
  { category: 'hausrat', label: 'Hausratversicherung' },
  { category: 'haftpflicht', label: 'Haftpflichtversicherung' },
  { category: 'miete', label: 'Mietvertrag' },
];

interface MietyContractsSectionProps {
  homeId: string;
  onOpenDrawer: () => void;
  filterCategories?: string[];
  title?: string;
}

export function MietyContractsSection({ homeId, onOpenDrawer, filterCategories, title }: MietyContractsSectionProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      setDeletingId(contractId);
      const { error } = await supabase.from('miety_contracts').delete().eq('id', contractId);
      if (error) throw error;
    },
    onSuccess: () => {
      setDeletingId(null);
      toast.success('Vertrag gelöscht');
      queryClient.invalidateQueries({ queryKey: ['miety-contracts'] });
    },
    onError: (err: Error) => {
      setDeletingId(null);
      toast.error(`Fehler: ${err.message}`);
    },
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['miety-contracts', homeId, filterCategories],
    queryFn: async () => {
      let query = supabase.from('miety_contracts').select('*').eq('home_id', homeId).order('created_at', { ascending: false });
      if (filterCategories) {
        query = query.in('category', filterCategories);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  if (contracts.length === 0) {
    return (
      <div className="space-y-3">
        {title && <p className="text-sm text-muted-foreground">{title}</p>}
        <div className={DESIGN.WIDGET_GRID.FULL}>
          {(filterCategories ? PLACEHOLDER_CARDS.filter(p => filterCategories.includes(p.category)) : PLACEHOLDER_CARDS).map(p => {
            const cfg = CATEGORY_CONFIG[p.category];
            const Icon = cfg?.icon || FileText;
            return (
              <Card key={p.category} className="border-dashed border-muted-foreground/20">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Icon className="h-8 w-8 text-muted-foreground/30" />
                  <span className="text-sm text-muted-foreground">{p.label}</span>
                  <Button size="sm" variant="ghost" onClick={onOpenDrawer} className="text-xs">
                    <Plus className="h-3 w-3 mr-1" />Anlegen
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {title && <p className="text-sm font-medium">{title}</p>}
        <Button size="sm" variant="ghost" onClick={onOpenDrawer}>
          <Plus className="h-3.5 w-3.5 mr-1" />Neuer Vertrag
        </Button>
      </div>
      <div className={DESIGN.FORM_GRID.FULL}>
        {contracts.map(c => {
          const cfg = CATEGORY_CONFIG[c.category] || CATEGORY_CONFIG.sonstige;
          const Icon = cfg.icon;
          return (
            <Card key={c.id} className="glass-card relative group">
              <WidgetDeleteOverlay
                title={c.provider_name || cfg.label}
                onConfirmDelete={() => deleteContractMutation.mutate(c.id)}
                isDeleting={deletingId === c.id}
              />
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{c.provider_name || cfg.label}</span>
                      <Badge variant="secondary" className="text-xs">{cfg.label}</Badge>
                    </div>
                    {c.monthly_cost && (
                      <p className="text-sm text-muted-foreground mt-0.5">{c.monthly_cost.toFixed(2)} €/Monat</p>
                    )}
                    {c.end_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        bis {format(new Date(c.end_date), 'dd.MM.yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
