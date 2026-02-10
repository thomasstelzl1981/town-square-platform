/**
 * MietyCreateHomeForm — Inline form for creating a new home
 * Prefills address from user profile data
 */
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Home, Plus } from 'lucide-react';

interface MietyCreateHomeFormProps {
  onCancel?: () => void;
}

export function MietyCreateHomeForm({ onCancel }: MietyCreateHomeFormProps) {
  const { activeTenantId, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('Mein Zuhause');
  const [address, setAddress] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');
  const [ownershipType, setOwnershipType] = useState('eigentum');
  const [propertyType, setPropertyType] = useState('wohnung');
  const [areaSqm, setAreaSqm] = useState('');
  const [roomsCount, setRoomsCount] = useState('');

  // Prefill from profile
  const { data: profile } = useQuery({
    queryKey: ['profile-address-prefill', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('street, house_number, postal_code, city')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile) {
      if (profile.street && !address) setAddress(profile.street);
      if (profile.house_number && !houseNo) setHouseNo(profile.house_number);
      if (profile.postal_code && !zip) setZip(profile.postal_code);
      if (profile.city && !city) setCity(profile.city);
    }
  }, [profile]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId || !user?.id) throw new Error('Nicht eingeloggt');
      if (!address || !city) throw new Error('Bitte Adresse und Stadt eingeben');

      const { data, error } = await supabase.from('miety_homes').insert({
        tenant_id: activeTenantId,
        user_id: user.id,
        name,
        address: address || null,
        address_house_no: houseNo || null,
        zip: zip || null,
        city: city || null,
        ownership_type: ownershipType,
        property_type: propertyType,
        area_sqm: areaSqm ? parseFloat(areaSqm) : null,
        rooms_count: roomsCount ? parseFloat(roomsCount) : null,
      }).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['miety-homes'] });
      toast.success('Zuhause angelegt');
      navigate(`/portal/miety/zuhause/${data.id}`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Card className="glass-card max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          Zuhause anlegen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Mein Zuhause" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Straße</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Musterstraße" />
            </div>
            <div>
              <Label>Nr.</Label>
              <Input value={houseNo} onChange={e => setHouseNo(e.target.value)} placeholder="42" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>PLZ</Label>
              <Input value={zip} onChange={e => setZip(e.target.value)} placeholder="80331" />
            </div>
            <div>
              <Label>Stadt</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="München" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Eigentum/Miete</Label>
              <Select value={ownershipType} onValueChange={setOwnershipType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="eigentum">Eigentum</SelectItem>
                  <SelectItem value="miete">Miete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Art</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wohnung">Wohnung</SelectItem>
                  <SelectItem value="haus">Haus</SelectItem>
                  <SelectItem value="zimmer">Zimmer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Wohnfläche (m²)</Label>
              <Input type="number" value={areaSqm} onChange={e => setAreaSqm(e.target.value)} placeholder="85" />
            </div>
            <div>
              <Label>Zimmer</Label>
              <Input type="number" value={roomsCount} onChange={e => setRoomsCount(e.target.value)} placeholder="3" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">Abbrechen</Button>
            )}
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              {createMutation.isPending ? 'Erstellen...' : 'Zuhause anlegen'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
