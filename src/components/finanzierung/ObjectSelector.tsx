import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Building2, Home, Star, PenLine, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { FinanceRequest, ObjectSource } from '@/types/finance';

interface ObjectSelectorProps {
  request: FinanceRequest;
  onUpdate: () => void;
  readOnly?: boolean;
}

export function ObjectSelector({ request, onUpdate, readOnly = false }: ObjectSelectorProps) {
  const { activeOrganization } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSource, setSelectedSource] = React.useState<ObjectSource>(
    (request.object_source as ObjectSource) || 'custom'
  );
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<string | null>(
    request.property_id || null
  );
  const [customData, setCustomData] = React.useState({
    address: (request.custom_object_data as any)?.address || '',
    type: (request.custom_object_data as any)?.type || '',
    price: (request.custom_object_data as any)?.price || '',
  });

  // Fetch properties from MOD-04
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties-for-finance', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, code, address, city, postal_code, purchase_price')
        .eq('tenant_id', activeOrganization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeOrganization?.id,
  });

  // Fetch favorites from MOD-08
  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: ['investment-favorites-for-finance', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      const { data, error } = await supabase
        .from('investment_favorites')
        .select('id, title, location, price, external_listing_url')
        .eq('tenant_id', activeOrganization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeOrganization?.id,
  });

  const updateObjectSource = useMutation({
    mutationFn: async () => {
      const updateData = {
        object_source: selectedSource,
        property_id: selectedSource === 'mod04_property' ? selectedPropertyId : null,
        listing_id: selectedSource === 'mod08_favorite' ? selectedPropertyId : null,
        custom_object_data: selectedSource === 'custom' ? customData as any : null,
      };

      const { error } = await supabase
        .from('finance_requests')
        .update(updateData)
        .eq('id', request.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-request'] });
      toast.success('Objektauswahl gespeichert');
      onUpdate();
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  const handleSave = () => {
    updateObjectSource.mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Objektauswahl</CardTitle>
          <CardDescription>
            Wählen Sie ein Objekt aus Ihrem Portfolio, Ihren Favoriten oder geben Sie die Daten manuell ein.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedSource}
            onValueChange={(v) => {
              setSelectedSource(v as ObjectSource);
              setSelectedPropertyId(null);
            }}
            disabled={readOnly}
            className="space-y-4"
          >
            {/* Option: From Portfolio (MOD-04) */}
            <div className="flex items-start gap-3">
              <RadioGroupItem value="mod04_property" id="mod04_property" />
              <Label htmlFor="mod04_property" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">Aus meinem Portfolio</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Wählen Sie ein Objekt aus Ihrem Immobilienportfolio (MOD-04)
                </p>
              </Label>
            </div>

            {/* Option: From Favorites (MOD-08) */}
            <div className="flex items-start gap-3">
              <RadioGroupItem value="mod08_favorite" id="mod08_favorite" />
              <Label htmlFor="mod08_favorite" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span className="font-medium">Aus meinen Favoriten</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Wählen Sie ein Objekt aus Ihren Investment-Favoriten (MOD-08)
                </p>
              </Label>
            </div>

            {/* Option: Custom Entry */}
            <div className="flex items-start gap-3">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <PenLine className="h-4 w-4" />
                  <span className="font-medium">Manuelle Eingabe</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Geben Sie die Objektdaten manuell ein
                </p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Property Selection from Portfolio */}
      {selectedSource === 'mod04_property' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Portfolio-Objekte
            </CardTitle>
          </CardHeader>
          <CardContent>
            {propertiesLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : properties?.length ? (
              <div className="grid gap-3">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPropertyId === property.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    } ${readOnly ? 'pointer-events-none opacity-60' : ''}`}
                    onClick={() => !readOnly && setSelectedPropertyId(property.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{property.code}</span>
                          {selectedPropertyId === property.id && (
                            <Badge variant="default" className="gap-1">
                              <Check className="h-3 w-3" />
                              Ausgewählt
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1">
                          {property.address}, {property.postal_code} {property.city}
                        </p>
                      </div>
                      {property.purchase_price && (
                        <span className="font-medium">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.purchase_price)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Keine Objekte im Portfolio vorhanden.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Favorites Selection */}
      {selectedSource === 'mod08_favorite' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Investment-Favoriten
            </CardTitle>
          </CardHeader>
          <CardContent>
            {favoritesLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : favorites?.length ? (
              <div className="grid gap-3">
                {favorites.map((favorite) => (
                  <div
                    key={favorite.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPropertyId === favorite.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    } ${readOnly ? 'pointer-events-none opacity-60' : ''}`}
                    onClick={() => !readOnly && setSelectedPropertyId(favorite.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{favorite.title || 'Ohne Titel'}</span>
                          {selectedPropertyId === favorite.id && (
                            <Badge variant="default" className="gap-1">
                              <Check className="h-3 w-3" />
                              Ausgewählt
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {favorite.location || 'Standort unbekannt'}
                        </p>
                      </div>
                      {favorite.price && (
                        <span className="font-medium">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(favorite.price)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Keine Favoriten vorhanden.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Custom Entry Form */}
      {selectedSource === 'custom' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5" />
              Objektdaten eingeben
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-address">Adresse</Label>
              <Input
                id="custom-address"
                value={customData.address}
                onChange={(e) => setCustomData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Musterstraße 1, 80331 München"
                disabled={readOnly}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="custom-type">Objektart</Label>
                <Input
                  id="custom-type"
                  value={customData.type}
                  onChange={(e) => setCustomData(prev => ({ ...prev, type: e.target.value }))}
                  placeholder="ETW, MFH, EFH, etc."
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-price">Kaufpreis (€)</Label>
                <Input
                  id="custom-price"
                  type="number"
                  value={customData.price}
                  onChange={(e) => setCustomData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="350000"
                  disabled={readOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateObjectSource.isPending}>
            {updateObjectSource.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Speichern
          </Button>
        </div>
      )}
    </div>
  );
}
