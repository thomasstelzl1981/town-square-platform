/**
 * Create Reservation Dialog
 * MOD-13 PROJEKTE
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjectReservations } from '@/hooks/useProjectReservations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays } from 'date-fns';
import type { DevProjectUnit } from '@/types/projekte';

const formSchema = z.object({
  unit_id: z.string().min(1, 'Bitte Einheit wählen'),
  buyer_contact_id: z.string().optional(),
  partner_org_id: z.string().optional(),
  reserved_price: z.coerce.number().positive('Preis muss positiv sein').optional(),
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateReservationDialogProps {
  projectId: string;
  units: DevProjectUnit[];
  preselectedUnitId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateReservationDialog({
  projectId,
  units,
  preselectedUnitId,
  open,
  onOpenChange,
  onSuccess,
}: CreateReservationDialogProps) {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;
  const { createReservation } = useProjectReservations(projectId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch contacts for buyer selection
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-reservation', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .eq('tenant_id', tenantId)
        .order('last_name');
      if (error) throw error;
      return data;
    },
    enabled: open && !!tenantId,
  });

  // Fetch partner organizations
  const { data: partners = [] } = useQuery({
    queryKey: ['partner-orgs-for-reservation', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('org_type', 'partner')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: open && !!tenantId,
  });

  // Get available units only
  const availableUnits = units.filter(u => u.status === 'available');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unit_id: preselectedUnitId || '',
      buyer_contact_id: '',
      partner_org_id: '',
      reserved_price: undefined,
      expiry_date: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  // Update price when unit changes
  const selectedUnitId = form.watch('unit_id');
  const selectedUnit = units.find(u => u.id === selectedUnitId);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await createReservation.mutateAsync({
        project_id: projectId,
        unit_id: values.unit_id,
        buyer_contact_id: values.buyer_contact_id || undefined,
        partner_org_id: values.partner_org_id || undefined,
        reserved_price: values.reserved_price,
        expiry_date: values.expiry_date,
        notes: values.notes,
      });
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Neue Reservierung</DialogTitle>
          <DialogDescription>
            Reservieren Sie eine Einheit für einen Käufer
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Unit Selection */}
            <FormField
              control={form.control}
              name="unit_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Einheit *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Einheit wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableUnits.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Keine verfügbaren Einheiten
                        </SelectItem>
                      ) : (
                        availableUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.unit_number} — {unit.area_sqm?.toFixed(0)} m² — {
                              unit.list_price 
                                ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(unit.list_price)
                                : 'Kein Preis'
                            }
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reserved Price */}
            <FormField
              control={form.control}
              name="reserved_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reservierungspreis (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={selectedUnit?.list_price?.toString() || 'Preis eingeben'}
                      {...field}
                      value={field.value || selectedUnit?.list_price || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Buyer Contact */}
            <FormField
              control={form.control}
              name="buyer_contact_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Käufer (Kontakt)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Kontakt wählen (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Kein Kontakt</SelectItem>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name} {contact.email && `(${contact.email})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Partner Organization */}
            <FormField
              control={form.control}
              name="partner_org_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vermittler (Partner)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Partner wählen (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Kein Partner</SelectItem>
                      {partners.map((partner) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expiry Date */}
            <FormField
              control={form.control}
              name="expiry_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ablaufdatum</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notizen</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Interne Notizen zur Reservierung..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting || availableUnits.length === 0}>
                {isSubmitting ? 'Erstelle...' : 'Reservierung erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
