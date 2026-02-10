/**
 * MOD-07: Anfrage Tab
 * Draft-First Logic: Zeigt direkt AnfrageFormV2 wenn Draft existiert
 * Falls kein Draft: Wizard zur Erstellung mit MOD-04 Objektauswahl
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Plus, FileStack, Building2, Heart, Edit, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import AnfrageFormV2 from '@/components/finanzierung/AnfrageFormV2';

const objectSourceOptions = [
  { value: 'portfolio', label: 'Aus meinem Portfolio (MOD-04)', icon: Building2 },
  { value: 'listing', label: 'Aus Favoriten (MOD-08)', icon: Heart },
  { value: 'custom', label: 'Eigene Immobilie eingeben', icon: Edit },
];

export default function AnfrageTab() {
  const { activeOrganization } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [objectSource, setObjectSource] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);

  // 1. Lade die aktuellste Draft-Anfrage (falls vorhanden)
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

  // Fetch properties for selection (MOD-04)
  const { data: properties } = useQuery({
    queryKey: ['properties-for-finance', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];

      const { data } = await supabase
        .from('properties')
        .select('id, address, city, postal_code, property_type, total_area_sqm, purchase_price, market_value, year_built')
        .eq('tenant_id', activeOrganization.id)
        .limit(50);

      return data || [];
    },
    enabled: !!activeOrganization?.id && objectSource === 'portfolio',
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeOrganization?.id) throw new Error('Keine Organisation');

      // Get the selected property for prefilling
      const selectedProperty = objectSource === 'portfolio' && selectedPropertyId 
        ? properties?.find(p => p.id === selectedPropertyId)
        : null;

      // Build the insert payload
      const insertPayload: {
        tenant_id: string;
        status: string;
        object_source: string;
        property_id: string | null;
        object_address?: string;
        object_type?: string | null;
        object_construction_year?: number | null;
        object_living_area_sqm?: number | null;
        purchase_price?: number | null;
      } = {
        tenant_id: activeOrganization.id,
        status: 'draft',
        object_source: objectSource || 'custom',
        property_id: objectSource === 'portfolio' && selectedPropertyId ? selectedPropertyId : null,
      };

      // Auto-prefill from selected MOD-04 property
      if (selectedProperty) {
        insertPayload.object_address = `${selectedProperty.address}, ${selectedProperty.postal_code} ${selectedProperty.city}`;
        insertPayload.object_type = selectedProperty.property_type || null;
        insertPayload.object_construction_year = selectedProperty.year_built || null;
        insertPayload.object_living_area_sqm = selectedProperty.total_area_sqm || null;
        insertPayload.purchase_price = selectedProperty.purchase_price || selectedProperty.market_value || null;
      }

      const { data, error } = await supabase
        .from('finance_requests')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Finanzierungsanfrage erstellt');
      queryClient.invalidateQueries({ queryKey: ['draft-finance-request'] });
      setShowCreateDialog(false);
      setObjectSource('');
      setSelectedPropertyId('');
      setCreatedRequestId(data.id);
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

  // 2. Falls Draft existiert oder gerade erstellt → Formular direkt zeigen
  const activeRequestId = createdRequestId || draftRequest?.id;
  
  if (activeRequestId) {
    return <AnfrageFormV2 requestId={activeRequestId} />;
  }

  // 3. Falls kein Draft → Dialog zur Erstellung zeigen
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <Card>
        <CardContent className="text-center py-12">
          <FileStack className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">
            Neue Finanzierungsanfrage starten
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Erstellen Sie eine neue Finanzierungsanfrage. Sie können ein Objekt aus 
            Ihrem Portfolio wählen oder die Daten manuell eingeben.
          </p>
          <Button 
            className="mt-6 gap-2" 
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4" />
            Anfrage starten
          </Button>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Finanzierungsanfrage</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Objektquelle</Label>
              <Select value={objectSource} onValueChange={setObjectSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Woher stammt das Objekt?" />
                </SelectTrigger>
                <SelectContent>
                  {objectSourceOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {objectSource === 'portfolio' && properties && properties.length > 0 && (
              <div className="space-y-2">
                <Label>Immobilie auswählen</Label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Immobilie wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.address}, {prop.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {objectSource === 'portfolio' && properties && properties.length === 0 && (
              <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 mb-2" />
                Keine Immobilien im Portfolio gefunden. Bitte legen Sie erst eine Immobilie in MOD-04 an.
              </div>
            )}

            {objectSource === 'listing' && (
              <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                <Heart className="h-4 w-4 mb-2" />
                Favoriten-Auswahl wird in einer späteren Phase implementiert.
              </div>
            )}

            {objectSource === 'custom' && (
              <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                <Edit className="h-4 w-4 mb-2" />
                Objektdaten können im Formular manuell eingegeben werden.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={() => createMutation.mutate()}
              disabled={!objectSource || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Anfrage erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
