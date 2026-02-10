/**
 * MeterReadingDrawer — Inline Drawer for recording meter readings
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DetailDrawer } from '@/components/shared/DetailDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

const METER_TYPES = [
  { value: 'strom', label: 'Strom' },
  { value: 'gas', label: 'Gas' },
  { value: 'wasser', label: 'Wasser' },
  { value: 'heizung', label: 'Heizung' },
];

interface MeterReadingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeId: string;
}

export function MeterReadingDrawer({ open, onOpenChange, homeId }: MeterReadingDrawerProps) {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [meterType, setMeterType] = useState('strom');
  const [readingValue, setReadingValue] = useState('');
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId) throw new Error('Kein Mandant');
      if (!readingValue) throw new Error('Bitte Zählerstand eingeben');
      const { error } = await supabase.from('miety_meter_readings').insert({
        home_id: homeId,
        tenant_id: activeTenantId,
        meter_type: meterType,
        reading_value: parseFloat(readingValue),
        reading_date: readingDate,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miety-meter-readings', homeId] });
      toast.success('Zählerstand erfasst');
      setReadingValue('');
      setNotes('');
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Zählerstand erfassen"
      description="Aktuellen Zählerstand eintragen"
      footer={
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {createMutation.isPending ? 'Speichern...' : 'Zählerstand speichern'}
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Zählertyp</Label>
          <Select value={meterType} onValueChange={setMeterType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {METER_TYPES.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Zählerstand</Label>
          <Input type="number" value={readingValue} onChange={e => setReadingValue(e.target.value)} placeholder="z.B. 12345" />
        </div>
        <div>
          <Label>Ablesedatum</Label>
          <Input type="date" value={readingDate} onChange={e => setReadingDate(e.target.value)} />
        </div>
        <div>
          <Label>Notizen</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional..." rows={2} />
        </div>
      </div>
    </DetailDrawer>
  );
}
