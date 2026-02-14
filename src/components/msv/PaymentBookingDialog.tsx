/**
 * PaymentBookingDialog — Manuelle Zahlungserfassung
 * 
 * Schreibt in msv_rent_payments (nicht mehr rent_payments).
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Euro, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaseId: string;
  unitId?: string;
  propertyId?: string;
  sollmiete: number;
  mieterName: string | null;
  onSuccess?: () => void;
}

export const PaymentBookingDialog = ({
  open, onOpenChange, leaseId, unitId, propertyId, sollmiete, mieterName, onSuccess,
}: PaymentBookingDialogProps) => {
  const { activeTenantId } = useAuth();
  const [amount, setAmount] = useState(sollmiete.toString());
  const [paidDate, setPaidDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<'paid' | 'partial'>('paid');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const now = new Date();

  const bookPayment = useMutation({
    mutationFn: async () => {
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error('Ungültiger Betrag');
      if (!activeTenantId) throw new Error('Keine Organisation aktiv');

      const computedStatus = parsedAmount >= sollmiete ? 'paid' : 'partial';

      const { error } = await supabase.from('msv_rent_payments').insert({
        tenant_id: activeTenantId,
        lease_id: leaseId,
        unit_id: unitId || null,
        property_id: propertyId || null,
        expected_amount: sollmiete,
        received_amount: parsedAmount,
        received_date: paidDate,
        period_month: now.getMonth() + 1,
        period_year: now.getFullYear(),
        status: computedStatus,
        note: notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Zahlung erfolgreich gebucht');
      queryClient.invalidateQueries({ queryKey: ['msv-data'] });
      onOpenChange(false);
      onSuccess?.();
      setAmount(sollmiete.toString());
      setNotes('');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" /> Zahlung buchen
          </DialogTitle>
          <DialogDescription>
            Manuelle Buchung für {mieterName || 'Mieter'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Betrag (€)</Label>
            <Input id="amount" type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
            <p className="text-xs text-muted-foreground">Sollmiete: {sollmiete.toLocaleString('de-DE')} €</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidDate">Zahlungsdatum</Label>
            <Input id="paidDate" type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={v => setStatus(v as 'paid' | 'partial')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Vollständig bezahlt</SelectItem>
                <SelectItem value="partial">Teilzahlung</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notizen (optional)</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="z.B. Überweisung vom 15.01." rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={() => bookPayment.mutate()} disabled={bookPayment.isPending}>
            {bookPayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Zahlung buchen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};