/**
 * ContractInlineForm — Inline card for creating/editing contracts (AES-konform)
 * 
 * Replaces the former ContractDrawer (Drawer pattern → Inline pattern).
 * Renders below the WidgetGrid as a Card with form fields.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, X } from 'lucide-react';
import { useLegalConsent } from '@/hooks/useLegalConsent';
import { ConsentRequiredModal } from '@/components/portal/ConsentRequiredModal';

const CATEGORIES = [
  { value: 'strom', label: 'Strom' },
  { value: 'gas', label: 'Gas' },
  { value: 'wasser', label: 'Wasser' },
  { value: 'internet', label: 'Internet' },
  { value: 'mobilfunk', label: 'Mobilfunk' },
  { value: 'hausrat', label: 'Hausratversicherung' },
  { value: 'haftpflicht', label: 'Haftpflichtversicherung' },
  { value: 'miete', label: 'Mietvertrag' },
  { value: 'sonstige', label: 'Sonstige' },
];

const METERED_CATEGORIES = ['strom', 'gas', 'wasser'];
const RENTAL_CATEGORY = 'miete';

/** @deprecated Use ContractInlineForm instead */
export function ContractDrawer(props: any) {
  if (!props.open) return null;
  return (
    <ContractInlineForm
      homeId={props.homeId}
      defaultCategory={props.defaultCategory}
      onClose={() => props.onOpenChange(false)}
    />
  );
}

interface ContractInlineFormProps {
  homeId: string;
  defaultCategory?: string;
  onClose: () => void;
}

export function ContractInlineForm({ homeId, defaultCategory, onClose }: ContractInlineFormProps) {
  const { activeTenantId } = useAuth();
  const { requireConsent, showConsentModal, setShowConsentModal } = useLegalConsent();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(defaultCategory || 'sonstige');
  const [providerName, setProviderName] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [monthlyCost, setMonthlyCost] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cancellationDate, setCancellationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [previousConsumption, setPreviousConsumption] = useState('');
  // Mietvertrag-specific
  const [kaltmiete, setKaltmiete] = useState('');
  const [nebenkostenVorauszahlung, setNebenkostenVorauszahlung] = useState('');
  const [kaution, setKaution] = useState('');
  const [kuendigungsfrist, setKuendigungsfrist] = useState('');
  const [vermieterName, setVermieterName] = useState('');
  const [vermieterKontakt, setVermieterKontakt] = useState('');

  const isMetered = METERED_CATEGORIES.includes(category);
  const isRental = category === RENTAL_CATEGORY;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId) throw new Error('Kein Mandant');
      const { error } = await supabase.from('miety_contracts').insert({
        home_id: homeId,
        tenant_id: activeTenantId,
        category,
        provider_name: providerName || null,
        contract_number: contractNumber || null,
        monthly_cost: monthlyCost ? parseFloat(monthlyCost) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        cancellation_date: cancellationDate || null,
        notes: notes || null,
        meter_number: isMetered && meterNumber ? meterNumber : null,
        previous_consumption: isMetered && previousConsumption ? parseFloat(previousConsumption) : null,
        kaltmiete: isRental && kaltmiete ? parseFloat(kaltmiete) : null,
        nebenkosten_vorauszahlung: isRental && nebenkostenVorauszahlung ? parseFloat(nebenkostenVorauszahlung) : null,
        kaution: isRental && kaution ? parseFloat(kaution) : null,
        kuendigungsfrist: isRental ? kuendigungsfrist || null : null,
        vermieter_name: isRental ? vermieterName || null : null,
        vermieter_kontakt: isRental ? vermieterKontakt || null : null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miety-contracts'] });
      toast.success('Vertrag angelegt');
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const consumptionUnit = category === 'wasser' ? 'm³' : 'kWh';

  return (
    <>
      <Card className="glass-card border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Neuen Vertrag anlegen</CardTitle>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Kategorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{isRental ? 'Vermieter / Hausverwaltung' : 'Anbieter'}</Label>
            <Input value={providerName} onChange={e => setProviderName(e.target.value)} placeholder={isRental ? 'z.B. Hausverwaltung GmbH' : 'z.B. Stadtwerke München'} />
          </div>
          <div>
            <Label>Kundennummer / Vertragsnummer</Label>
            <Input value={contractNumber} onChange={e => setContractNumber(e.target.value)} placeholder="Ihre Kundennummer beim Anbieter" />
          </div>

          {/* Metered fields */}
          {isMetered && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Zählernummer</Label>
                <Input value={meterNumber} onChange={e => setMeterNumber(e.target.value)} placeholder="z.B. 1ESY1234567890" />
              </div>
              <div>
                <Label>Vorjahresverbrauch ({consumptionUnit})</Label>
                <Input type="number" value={previousConsumption} onChange={e => setPreviousConsumption(e.target.value)} placeholder={`z.B. ${category === 'wasser' ? '120' : '3500'}`} />
              </div>
            </div>
          )}

          {/* Mietvertrag-specific fields */}
          {isRental && (
            <div className="space-y-4 p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mietvertrag-Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Kaltmiete (€)</Label>
                  <Input type="number" value={kaltmiete} onChange={e => setKaltmiete(e.target.value)} placeholder="z.B. 850" />
                </div>
                <div>
                  <Label>NK-Vorauszahlung (€)</Label>
                  <Input type="number" value={nebenkostenVorauszahlung} onChange={e => setNebenkostenVorauszahlung(e.target.value)} placeholder="z.B. 200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Kaution (€)</Label>
                  <Input type="number" value={kaution} onChange={e => setKaution(e.target.value)} placeholder="z.B. 2550" />
                </div>
                <div>
                  <Label>Kündigungsfrist</Label>
                  <Input value={kuendigungsfrist} onChange={e => setKuendigungsfrist(e.target.value)} placeholder="z.B. 3 Monate" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Vermieter Name</Label>
                  <Input value={vermieterName} onChange={e => setVermieterName(e.target.value)} placeholder="z.B. Hr. Müller" />
                </div>
                <div>
                  <Label>Vermieter Kontakt</Label>
                  <Input value={vermieterKontakt} onChange={e => setVermieterKontakt(e.target.value)} placeholder="Tel. oder E-Mail" />
                </div>
              </div>
            </div>
          )}

          <div>
            <Label>Monatliche Kosten (€)</Label>
            <Input type="number" value={monthlyCost} onChange={e => setMonthlyCost(e.target.value)} placeholder="z.B. 85.00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Vertragsbeginn</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Vertragsende</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Kündigungsfrist</Label>
            <Input type="date" value={cancellationDate} onChange={e => setCancellationDate(e.target.value)} />
          </div>
          <div>
            <Label>Notizen</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optionale Notizen..." rows={3} />
          </div>

          {/* Action buttons — AES-konform: Abbrechen + Speichern inline */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
            <Button onClick={() => { if (!requireConsent()) return; createMutation.mutate(); }} disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <ConsentRequiredModal open={showConsentModal} onOpenChange={setShowConsentModal} />
    </>
  );
}
