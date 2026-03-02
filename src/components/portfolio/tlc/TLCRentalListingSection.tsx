/**
 * TLCRentalListingSection — Vermietungsinserat mit IS24-Buchung
 * 
 * TLC-Kachel in Kategorie 2 (Vertrag & Übergabe):
 * - Zeigt/erstellt rental_listings Eintrag
 * - Zeigt Status aus rental_publications
 * - Ermöglicht IS24-Buchung via sot-is24-gateway (2 Credits)
 * - Confirmation-Dialog vor kostenpflichtiger Buchung
 * - Form-Lock wenn IS24 aktiv
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ExternalLink, 
  Globe, 
  Loader2, 
  ChevronDown, 
  Home, 
  Save, 
  Coins,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface TLCRentalListingSectionProps {
  unitId: string;
  propertyId: string;
  tenantId: string;
  coldRent?: number;
  warmRent?: number;
  propertyAddress?: string;
  propertyCity?: string;
  postalCode?: string;
  areaSqm?: number;
  rooms?: number;
  yearBuilt?: number;
}

interface RentalListing {
  id: string;
  unit_id: string;
  property_id: string;
  tenant_id: string;
  cold_rent: number | null;
  warm_rent: number | null;
  deposit_months: number | null;
  available_from: string | null;
  pets_allowed: boolean | null;
  description: string | null;
  status: string;
}

interface RentalPublication {
  channel: string;
  status: string;
  external_id: string | null;
  published_at: string | null;
}

export function TLCRentalListingSection({
  unitId,
  propertyId,
  tenantId,
  coldRent = 0,
  warmRent = 0,
  propertyAddress = '',
  propertyCity = '',
  postalCode = '',
  areaSqm = 0,
  rooms = 0,
  yearBuilt,
}: TLCRentalListingSectionProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState({
    cold_rent: '',
    warm_rent: '',
    deposit_months: '3',
    available_from: '',
    pets_allowed: false,
    description: '',
  });

  // Fetch rental listing for this unit
  const { data: rentalListing, isLoading } = useQuery({
    queryKey: ['rental-listing', unitId],
    queryFn: async () => {
      const { data } = await supabase
        .from('rental_listings')
        .select('*')
        .eq('unit_id', unitId)
        .eq('tenant_id', tenantId)
        .in('status', ['draft', 'active'])
        .maybeSingle();
      
      if (data) {
        setFormData({
          cold_rent: data.cold_rent?.toString() || '',
          warm_rent: data.warm_rent?.toString() || '',
          deposit_months: data.deposit_months?.toString() || '3',
          available_from: data.available_from || '',
          pets_allowed: data.pets_allowed || false,
          description: data.description || '',
        });
      }
      return data as RentalListing | null;
    },
  });

  // Fetch publications
  const { data: publications = [] } = useQuery({
    queryKey: ['rental-publications', rentalListing?.id],
    queryFn: async () => {
      if (!rentalListing?.id) return [];
      const { data } = await supabase
        .from('rental_publications')
        .select('channel, status, external_id, published_at')
        .eq('rental_listing_id', rentalListing.id);
      return (data || []) as RentalPublication[];
    },
    enabled: !!rentalListing?.id,
  });

  const is24Pub = publications.find(p => p.channel === 'scout24');
  const is24Active = is24Pub?.status === 'active';
  const is24Error = is24Pub?.status === 'error';
  const formLocked = is24Active;

  // Create/update rental listing
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        unit_id: unitId,
        property_id: propertyId,
        tenant_id: tenantId,
        cold_rent: parseFloat(formData.cold_rent) || coldRent || 0,
        warm_rent: parseFloat(formData.warm_rent) || warmRent || 0,
        deposit_months: parseInt(formData.deposit_months) || 3,
        available_from: formData.available_from || null,
        pets_allowed: formData.pets_allowed,
        description: formData.description || null,
        status: 'draft',
      };

      if (rentalListing) {
        const { error } = await supabase
          .from('rental_listings')
          .update(payload)
          .eq('id', rentalListing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rental_listings')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-listing', unitId] });
      toast.success('Vermietungsinserat gespeichert');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Build IS24 payload
  const buildIs24Payload = () => {
    if (!rentalListing) throw new Error('Kein Inserat vorhanden');
    return {
      action: 'create_listing',
      rental_listing_id: rentalListing.id,
      object_type: 'ApartmentRent',
      data: {
        title: `Mietwohnung ${propertyAddress}, ${propertyCity}`.trim(),
        cold_rent: parseFloat(formData.cold_rent) || rentalListing.cold_rent || 0,
        warm_rent: parseFloat(formData.warm_rent) || rentalListing.warm_rent || 0,
        deposit: `${rentalListing.deposit_months || 3} Monatsmieten`,
        description: rentalListing.description || '',
        pets_allowed: rentalListing.pets_allowed,
        street: propertyAddress,
        postal_code: postalCode,
        city: propertyCity,
        area_sqm: areaSqm,
        rooms,
        year_built: yearBuilt,
      },
    };
  };

  // Book IS24 publication (2 Credits)
  const publishMutation = useMutation({
    mutationFn: async () => {
      const body = buildIs24Payload();
      const { data, error } = await supabase.functions.invoke('sot-is24-gateway', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rental-publications', rentalListing?.id] });
      toast.success(`Auf ImmobilienScout24 veröffentlicht (IS24-ID: ${data?.is24_id || '–'})`);
    },
    onError: (err: Error & { status?: number }) => {
      if (err.message?.includes('402') || err.message?.includes('Insufficient') || err.message?.includes('Credits')) {
        toast.error('Nicht genügend Credits. Bitte laden Sie Ihr Guthaben im Abrechnungs-Tab auf.', {
          duration: 6000,
        });
      } else {
        toast.error(`IS24-Fehler: ${err.message}`);
      }
    },
  });

  // Update IS24 listing
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!is24Pub?.external_id || !rentalListing) throw new Error('Keine IS24-ID vorhanden');
      const body = {
        action: 'update_listing',
        is24_id: is24Pub.external_id,
        rental_listing_id: rentalListing.id,
        object_type: 'ApartmentRent',
        data: {
          title: `Mietwohnung ${propertyAddress}, ${propertyCity}`.trim(),
          cold_rent: parseFloat(formData.cold_rent) || rentalListing.cold_rent || 0,
          warm_rent: parseFloat(formData.warm_rent) || rentalListing.warm_rent || 0,
          deposit: `${rentalListing.deposit_months || 3} Monatsmieten`,
          description: rentalListing.description || '',
          pets_allowed: rentalListing.pets_allowed,
          street: propertyAddress,
          postal_code: postalCode,
          city: propertyCity,
          area_sqm: areaSqm,
          rooms,
          year_built: yearBuilt,
        },
      };
      const { data, error } = await supabase.functions.invoke('sot-is24-gateway', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-publications', rentalListing?.id] });
      toast.success('IS24-Anzeige aktualisiert');
    },
    onError: (err: Error) => toast.error(`Update-Fehler: ${err.message}`),
  });

  // Deactivate IS24
  const deactivateMutation = useMutation({
    mutationFn: async () => {
      if (!is24Pub?.external_id) throw new Error('Keine IS24-ID vorhanden');

      const { data, error } = await supabase.functions.invoke('sot-is24-gateway', {
        body: {
          action: 'deactivate_listing',
          is24_id: is24Pub.external_id,
          rental_listing_id: rentalListing?.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-publications', rentalListing?.id] });
      toast.success('IS24-Anzeige deaktiviert');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const getStatusIcon = () => {
    if (is24Active) return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    if (is24Error) return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    if (rentalListing) return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />;
    return <Home className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (is24Active) return 'Auf IS24 aktiv';
    if (is24Error) return 'IS24-Fehler';
    if (rentalListing) return 'Entwurf';
    return 'Kein Inserat';
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between h-8 text-xs">
            <span className="flex items-center gap-2">
              {getStatusIcon()}
              Vermietungsinserat
            </span>
            <div className="flex items-center gap-2">
              {is24Active && <Badge variant="default" className="text-[10px] h-4 px-1.5">IS24</Badge>}
              {rentalListing && !is24Active && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{getStatusText()}</Badge>}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 px-2 pb-3">
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
          ) : (
            <>
              {/* Form */}
              <Card className="bg-muted/30">
                <CardContent className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Kaltmiete (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.cold_rent || coldRent || ''}
                        onChange={(e) => setFormData(p => ({ ...p, cold_rent: e.target.value }))}
                        className="h-7 text-xs"
                        placeholder={coldRent ? coldRent.toString() : ''}
                        disabled={formLocked}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Warmmiete (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.warm_rent || warmRent || ''}
                        onChange={(e) => setFormData(p => ({ ...p, warm_rent: e.target.value }))}
                        className="h-7 text-xs"
                        placeholder={warmRent ? warmRent.toString() : ''}
                        disabled={formLocked}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Kaution (Monate)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="6"
                        value={formData.deposit_months}
                        onChange={(e) => setFormData(p => ({ ...p, deposit_months: e.target.value }))}
                        className="h-7 text-xs"
                        disabled={formLocked}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Verfügbar ab</Label>
                      <Input
                        type="date"
                        value={formData.available_from}
                        onChange={(e) => setFormData(p => ({ ...p, available_from: e.target.value }))}
                        className="h-7 text-xs"
                        disabled={formLocked}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] text-muted-foreground">Haustiere erlaubt</Label>
                    <Switch
                      checked={formData.pets_allowed}
                      onCheckedChange={(v) => setFormData(p => ({ ...p, pets_allowed: v }))}
                      disabled={formLocked}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Beschreibung</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                      className="text-xs min-h-[60px]"
                      placeholder="Beschreibung der Mietwohnung..."
                      disabled={formLocked}
                    />
                  </div>

                  {formLocked ? (
                    <p className="text-[10px] text-muted-foreground text-center">
                      Formular gesperrt — Inserat ist auf IS24 aktiv. Deaktivieren Sie die Anzeige, um Änderungen vorzunehmen.
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      className="h-7 text-xs w-full"
                      onClick={() => saveMutation.mutate()}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                      {rentalListing ? 'Inserat aktualisieren' : 'Inserat erstellen'}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* IS24 Publication */}
              {rentalListing && (
                <Card className={`border ${is24Active ? 'border-green-500/30 bg-green-50/30 dark:bg-green-950/10' : 'border-muted'}`}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span className="text-xs font-medium">ImmobilienScout24</span>
                      </div>
                      {is24Active ? (
                        <Badge variant="default" className="text-[10px]">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Aktiv
                        </Badge>
                      ) : is24Error ? (
                        <Badge variant="destructive" className="text-[10px]">Fehler</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Nicht gebucht</Badge>
                      )}
                    </div>

                    {is24Active && is24Pub?.external_id && (
                      <p className="text-[11px] text-muted-foreground">
                        IS24-ID: {is24Pub.external_id} • Veröffentlicht: {is24Pub.published_at ? new Date(is24Pub.published_at).toLocaleDateString('de-DE') : '–'}
                      </p>
                    )}

                    <div className="flex gap-2">
                      {!is24Active ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={() => setShowConfirmDialog(true)}
                          disabled={publishMutation.isPending}
                        >
                          {publishMutation.isPending ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Coins className="mr-1 h-3 w-3" />
                          )}
                          Auf IS24 buchen (2 Credits)
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs flex-1"
                            onClick={() => updateMutation.mutate()}
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-1 h-3 w-3" />
                            )}
                            Auf IS24 aktualisieren
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => deactivateMutation.mutate()}
                            disabled={deactivateMutation.isPending}
                          >
                            {deactivateMutation.isPending ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="mr-1 h-3 w-3" />
                            )}
                            Deaktivieren
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Confirmation Dialog for IS24 Booking */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>IS24-Anzeige buchen?</AlertDialogTitle>
            <AlertDialogDescription>
              Für die Veröffentlichung auf ImmobilienScout24 werden <strong>2 Credits</strong> (0,50 €) abgezogen.
              Die Anzeige wird sofort auf IS24 freigeschaltet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmDialog(false);
                publishMutation.mutate();
              }}
            >
              <Coins className="mr-2 h-4 w-4" />
              Jetzt buchen (2 Credits)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
