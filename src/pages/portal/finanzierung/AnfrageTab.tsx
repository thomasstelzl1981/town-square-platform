/**
 * MOD-07: Anfrage Tab
 * Lists finance requests with create action
 * Now auto-redirects to detail page after creation
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus, FileStack, Building2, Heart, Edit,
  Loader2, ArrowRight, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Entwurf', variant: 'secondary' },
  submitted: { label: 'Eingereicht', variant: 'default' },
  in_review: { label: 'In Prüfung', variant: 'outline' },
  delegated: { label: 'Zugewiesen', variant: 'outline' },
  accepted: { label: 'Angenommen', variant: 'default' },
  rejected: { label: 'Abgelehnt', variant: 'destructive' },
};

const objectSourceOptions = [
  { value: 'portfolio', label: 'Aus meinem Portfolio (MOD-04)', icon: Building2 },
  { value: 'listing', label: 'Aus Favoriten (MOD-08)', icon: Heart },
  { value: 'custom', label: 'Eigene Immobilie eingeben', icon: Edit },
];

export default function AnfrageTab() {
  const { activeOrganization } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [objectSource, setObjectSource] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // Fetch existing requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['finance-requests', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];

      const { data, error } = await supabase
        .from('finance_requests')
        .select(`
          *,
          property:properties(id, address, city)
        `)
        .eq('tenant_id', activeOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeOrganization?.id,
  });

  // Fetch properties for selection
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

  // Create mutation - now auto-prefills and redirects
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeOrganization?.id) throw new Error('Keine Organisation');

      // Get the selected property for prefilling
      const selectedProperty = objectSource === 'portfolio' && selectedPropertyId 
        ? properties?.find(p => p.id === selectedPropertyId)
        : null;

      // Build the insert payload with proper typing
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
      queryClient.invalidateQueries({ queryKey: ['finance-requests'] });
      setShowCreateDialog(false);
      setObjectSource('');
      setSelectedPropertyId('');
      // Auto-redirect to the detail page
      navigate(`/portal/finanzierung/anfrage/${data.id}`);
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileStack className="h-5 w-5" />
            Finanzierungsanfragen
          </h2>
          <p className="text-sm text-muted-foreground">
            Verwalten Sie Ihre Finanzierungsanfragen
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Neue Anfrage
            </Button>
          </DialogTrigger>
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

              {objectSource === 'listing' && (
                <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                  <Heart className="h-4 w-4 mb-2" />
                  Favoriten-Auswahl wird in einer späteren Phase implementiert.
                </div>
              )}

              {objectSource === 'custom' && (
                <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                  <Edit className="h-4 w-4 mb-2" />
                  Objektdaten können nach Erstellung manuell eingegeben werden.
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

      {/* Request List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !requests || requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileStack className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              Noch keine Finanzierungsanfragen
            </p>
            <Button 
              className="mt-4" 
              variant="outline"
              onClick={() => setShowCreateDialog(true)}
            >
              Erste Anfrage erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map(request => {
            const statusInfo = statusLabels[request.status] || statusLabels.draft;

            return (
              <Card key={request.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {request.property 
                            ? `${request.property.address}, ${request.property.city}`
                            : `Anfrage ${request.public_id || request.id.slice(0, 8)}`
                          }
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(request.created_at), 'dd.MM.yyyy', { locale: de })}
                          <span>•</span>
                          <span className="capitalize">{request.object_source || 'custom'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/portal/finanzierung/anfrage/${request.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
