/**
 * PropertyContextAssigner — Dialog zum Zuordnen von Properties zu einem Kontext
 * 
 * Ermöglicht Multi-Select aller Properties des Tenants und speichert
 * die Zuordnungen in context_property_assignment.
 */
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, MapPin } from 'lucide-react';

interface Property {
  id: string;
  code: string | null;
  address: string;
  city: string;
  property_type: string;
  market_value: number | null;
}

interface PropertyContextAssignerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextId: string;
  contextName: string;
}

export function PropertyContextAssigner({
  open,
  onOpenChange,
  contextId,
  contextName,
}: PropertyContextAssignerProps) {
  const { activeTenantId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch all properties
  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['all-properties', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, code, address, city, property_type, market_value')
        .eq('tenant_id', activeTenantId!)
        .in('status', ['active', 'available'])
        .order('code');

      if (error) throw error;
      return data as Property[];
    },
    enabled: !!activeTenantId && open,
  });

  // Fetch existing assignments for this context
  const { data: existingAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['context-assignments', contextId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('context_property_assignment')
        .select('property_id')
        .eq('context_id', contextId)
        .eq('tenant_id', activeTenantId!);

      if (error) throw error;
      return data.map(a => a.property_id);
    },
    enabled: !!activeTenantId && !!contextId && open,
  });

  // Initialize selected IDs when assignments load
  useEffect(() => {
    if (existingAssignments.length > 0) {
      setSelectedIds(new Set(existingAssignments));
    }
  }, [existingAssignments]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId) throw new Error('No tenant');

      // Delete all existing assignments for this context
      await supabase
        .from('context_property_assignment')
        .delete()
        .eq('context_id', contextId)
        .eq('tenant_id', activeTenantId);

      // Insert new assignments
      if (selectedIds.size > 0) {
        const inserts = Array.from(selectedIds).map(propertyId => ({
          tenant_id: activeTenantId,
          context_id: contextId,
          property_id: propertyId,
          assigned_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('context_property_assignment')
          .insert(inserts);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Zuordnung gespeichert',
        description: `${selectedIds.size} Objekt(e) dem Kontext "${contextName}" zugeordnet.`,
      });
      queryClient.invalidateQueries({ queryKey: ['context-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['context-property-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['landlord-contexts'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler beim Speichern',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleToggle = (propertyId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(propertyId)) {
        next.delete(propertyId);
      } else {
        next.add(propertyId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === properties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(properties.map(p => p.id)));
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '–';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isLoading = propertiesLoading || assignmentsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Objekte zuordnen
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Wählen Sie die Objekte für den Kontext "{contextName}"
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : properties.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Keine Objekte im Portfolio vorhanden.
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center justify-between pb-2 border-b">
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedIds.size === properties.length ? 'Keine auswählen' : 'Alle auswählen'}
              </Button>
              <Badge variant="secondary">
                {selectedIds.size} / {properties.length} ausgewählt
              </Badge>
            </div>

            {/* Property List */}
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedIds.has(property.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleToggle(property.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(property.id)}
                      onCheckedChange={() => handleToggle(property.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {property.code && (
                          <Badge variant="outline" className="text-xs">{property.code}</Badge>
                        )}
                        <span className="font-medium truncate">{property.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {property.city}
                        <span>•</span>
                        <span>{property.property_type}</span>
                        {property.market_value && (
                          <>
                            <span>•</span>
                            <span>{formatCurrency(property.market_value)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
