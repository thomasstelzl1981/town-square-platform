import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InsuranceCreateDialogProps {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  insurer_name: string;
  policy_number: string;
  coverage_type: 'liability_only' | 'liability_tk' | 'liability_vk';
  sf_liability: number;
  sf_full_casco?: number;
  annual_premium_cents: number;
  deductible_partial_cents?: number;
  deductible_full_cents?: number;
  term_start: string;
  term_end?: string;
  payment_frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';
}

export function InsuranceCreateDialog({ 
  vehicleId, 
  open, 
  onOpenChange, 
  onSuccess 
}: InsuranceCreateDialogProps) {
  const { activeTenantId } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      coverage_type: 'liability_only',
      sf_liability: 0,
      payment_frequency: 'yearly',
    }
  });

  const coverageType = watch('coverage_type');

  const onSubmit = async (data: FormData) => {
    if (!activeTenantId) {
      toast({ title: 'Fehler', description: 'Kein aktiver Tenant', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('cars_insurances').insert({
        tenant_id: activeTenantId,
        vehicle_id: vehicleId,
        insurer_name: data.insurer_name,
        policy_number: data.policy_number,
        coverage_type: data.coverage_type,
        sf_liability: data.sf_liability,
        sf_full_casco: data.sf_full_casco || null,
        annual_premium_cents: Math.round(data.annual_premium_cents * 100),
        deductible_partial_cents: data.deductible_partial_cents ? Math.round(data.deductible_partial_cents * 100) : null,
        deductible_full_cents: data.deductible_full_cents ? Math.round(data.deductible_full_cents * 100) : null,
        term_start: data.term_start,
        term_end: data.term_end || null,
        payment_frequency: data.payment_frequency,
        status: 'active',
      });

      if (error) throw error;

      toast({ title: 'Versicherung erstellt', description: 'Die Police wurde erfolgreich hinzugefügt.' });
      reset();
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Neue Versicherung</DialogTitle>
          <DialogDescription>
            Erfassen Sie die Versicherungsdaten für dieses Fahrzeug.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insurer_name">Versicherer *</Label>
              <Input
                id="insurer_name"
                placeholder="z.B. Allianz"
                {...register('insurer_name', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy_number">Policen-Nr. *</Label>
              <Input
                id="policy_number"
                placeholder="z.B. VS-123456"
                {...register('policy_number', { required: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Deckung *</Label>
              <Select 
                defaultValue="liability_only"
                onValueChange={(v) => setValue('coverage_type', v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="liability_only">Nur KH (Haftpflicht)</SelectItem>
                  <SelectItem value="liability_tk">KH + Teilkasko</SelectItem>
                  <SelectItem value="liability_vk">Vollkasko</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sf_liability">SF-Klasse KH *</Label>
              <Input
                id="sf_liability"
                type="number"
                min="0"
                max="35"
                {...register('sf_liability', { required: true, min: 0, max: 35, valueAsNumber: true })}
              />
            </div>
          </div>

          {coverageType === 'liability_vk' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sf_full_casco">SF-Klasse VK</Label>
                <Input
                  id="sf_full_casco"
                  type="number"
                  min="0"
                  max="35"
                  {...register('sf_full_casco', { min: 0, max: 35, valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deductible_full_cents">SB Vollkasko (€)</Label>
                <Input
                  id="deductible_full_cents"
                  type="number"
                  step="0.01"
                  placeholder="z.B. 300"
                  {...register('deductible_full_cents', { valueAsNumber: true })}
                />
              </div>
            </div>
          )}

          {(coverageType === 'liability_tk' || coverageType === 'liability_vk') && (
            <div className="space-y-2">
              <Label htmlFor="deductible_partial_cents">SB Teilkasko (€)</Label>
              <Input
                id="deductible_partial_cents"
                type="number"
                step="0.01"
                placeholder="z.B. 150"
                {...register('deductible_partial_cents', { valueAsNumber: true })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="annual_premium_cents">Jahresbeitrag (€) *</Label>
              <Input
                id="annual_premium_cents"
                type="number"
                step="0.01"
                placeholder="z.B. 780.00"
                {...register('annual_premium_cents', { required: true, valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Zahlweise</Label>
              <Select 
                defaultValue="yearly"
                onValueChange={(v) => setValue('payment_frequency', v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                  <SelectItem value="semi_annual">Halbjährlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="term_start">Versicherungsbeginn *</Label>
              <Input
                id="term_start"
                type="date"
                {...register('term_start', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term_end">Versicherungsende</Label>
              <Input
                id="term_end"
                type="date"
                {...register('term_end')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
