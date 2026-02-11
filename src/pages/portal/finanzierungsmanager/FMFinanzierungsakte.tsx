/**
 * FM Finanzierungsakte — Empty fillable form for creating a new finance case
 * Creates finance_request + applicant_profile on submit
 */
import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText, Loader2, PlusCircle, User, Building2 } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  PersonSection, EmploymentSection, BankSection, IncomeSection,
  ExpensesSection, AssetsSection, createEmptyApplicantFormData,
  type ApplicantFormData,
} from '@/components/finanzierung/ApplicantPersonFields';

/** Simple label-value row for the top summary */
function TR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground py-1.5 px-3 w-[180px] border-r">{label}</TableCell>
      <TableCell className="text-sm py-1.5 px-3">{children}</TableCell>
    </TableRow>
  );
}

export default function FMFinanzierungsakte() {
  const navigate = useNavigate();
  const { activeOrganization, user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [purpose, setPurpose] = useState('kauf');

  // Object fields (not part of ApplicantFormData)
  const [objectAddress, setObjectAddress] = useState('');
  const [objectType, setObjectType] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [equityAmount, setEquityAmount] = useState('');

  // Applicant form
  const [formData, setFormData] = useState<ApplicantFormData>(createEmptyApplicantFormData());
  const [coFormData, setCoFormData] = useState<ApplicantFormData>(createEmptyApplicantFormData());

  const handleChange = (field: string, value: unknown) =>
    setFormData(prev => ({ ...prev, [field]: value }));
  const handleCoChange = (field: string, value: unknown) =>
    setCoFormData(prev => ({ ...prev, [field]: value }));

  const handleCreate = async () => {
    if (!formData.first_name || !formData.last_name) {
      toast.error('Bitte mindestens Vor- und Nachname ausfüllen.');
      return;
    }

    const tenantId = activeOrganization?.id;
    if (!tenantId || !user?.id) {
      toast.error('Keine Organisation ausgewählt.');
      return;
    }

    setIsCreating(true);
    try {
      // 1. Create finance_request
      const { data: request, error: reqError } = await supabase
        .from('finance_requests')
        .insert({
          tenant_id: tenantId,
          user_id: user.id,
          status: 'draft',
          purpose,
          object_address: objectAddress || null,
          custom_object_data: objectAddress ? { address: objectAddress, type: objectType } : null,
        })
        .select('id, public_id')
        .single();

      if (reqError) throw reqError;

      // 2. Create primary applicant_profile
      const { error: profileError } = await supabase
        .from('applicant_profiles')
        .insert({
          tenant_id: tenantId,
          finance_request_id: request.id,
          party_role: 'primary',
          profile_type: 'person',
          ...formData,
          purchase_price: purchasePrice ? Number(purchasePrice) : null,
          loan_amount_requested: loanAmount ? Number(loanAmount) : null,
          equity_amount: equityAmount ? Number(equityAmount) : null,
          object_address: objectAddress || null,
          object_type: objectType || null,
        });

      if (profileError) throw profileError;

      // 3. Create co-applicant if any data was entered
      const hasCoData = coFormData.first_name || coFormData.last_name || coFormData.email;
      if (hasCoData) {
        await supabase.from('applicant_profiles').insert({
          tenant_id: tenantId,
          finance_request_id: request.id,
          party_role: 'co_applicant',
          profile_type: 'person',
          ...coFormData,
        });
      }

      // 4. Create finance_mandate + future_room_case for this manager
      const { data: mandate, error: mandateError } = await supabase
        .from('finance_mandates')
        .insert({
          tenant_id: tenantId,
          finance_request_id: request.id,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          assigned_manager_id: user.id,
        })
        .select('id')
        .single();

      if (mandateError) throw mandateError;

      // 5. Create FutureRoom case
      await supabase.from('future_room_cases').insert({
        manager_tenant_id: tenantId,
        finance_mandate_id: mandate.id,
        status: 'active',
      });

      toast.success(`Finanzierungsakte ${request.public_id || ''} erstellt`);
      navigate(`/portal/finanzierungsmanager/faelle/${request.id}`);
    } catch (err) {
      console.error('Create error:', err);
      toast.error('Fehler beim Erstellen der Finanzierungsakte');
    } finally {
      setIsCreating(false);
    }
  };

  const dualProps = {
    formData,
    coFormData,
    onChange: handleChange,
    onCoChange: handleCoChange,
    readOnly: false,
  };

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase">Neue Finanzierungsakte</h2>
          <p className="text-sm text-muted-foreground">Leere Akte manuell befüllen und erstellen</p>
        </div>
      </div>

      {/* Block 1: Eckdaten */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2.5 border-b bg-muted/20">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" /> Eckdaten
            </h3>
          </div>
          <Table>
            <TableBody>
              <TR label="Zweck">
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kauf">Kauf / Neubau</SelectItem>
                    <SelectItem value="umschuldung">Prolongation / Umschuldung</SelectItem>
                    <SelectItem value="modernisierung">Modernisierung</SelectItem>
                    <SelectItem value="kapitalbeschaffung">Kapitalbeschaffung</SelectItem>
                  </SelectContent>
                </Select>
              </TR>
              <TR label="Objekt-Adresse">
                <Input
                  value={objectAddress}
                  onChange={e => setObjectAddress(e.target.value)}
                  placeholder="Straße, PLZ Ort"
                  className="h-7 text-xs border-0 bg-transparent shadow-none"
                />
              </TR>
              <TR label="Objekttyp">
                <Select value={objectType} onValueChange={setObjectType}>
                  <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none">
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wohnung">Eigentumswohnung</SelectItem>
                    <SelectItem value="einfamilienhaus">Einfamilienhaus</SelectItem>
                    <SelectItem value="mehrfamilienhaus">Mehrfamilienhaus</SelectItem>
                    <SelectItem value="grundstueck">Grundstück</SelectItem>
                    <SelectItem value="gewerbe">Gewerbeimmobilie</SelectItem>
                    <SelectItem value="sonstiges">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </TR>
              <TR label={purpose === 'umschuldung' ? 'Restschuld (€)' : 'Darlehenswunsch (€)'}>
                <Input
                  value={loanAmount}
                  onChange={e => setLoanAmount(e.target.value)}
                  type="number"
                  placeholder="0"
                  className="h-7 text-xs border-0 bg-transparent shadow-none"
                />
              </TR>
              {purpose !== 'umschuldung' && (
                <>
                  <TR label="Kaufpreis (€)">
                    <Input
                      value={purchasePrice}
                      onChange={e => setPurchasePrice(e.target.value)}
                      type="number"
                      placeholder="0"
                      className="h-7 text-xs border-0 bg-transparent shadow-none"
                    />
                  </TR>
                  <TR label="Eigenkapital (€)">
                    <Input
                      value={equityAmount}
                      onChange={e => setEquityAmount(e.target.value)}
                      type="number"
                      placeholder="0"
                      className="h-7 text-xs border-0 bg-transparent shadow-none"
                    />
                  </TR>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Block 2: Selbstauskunft */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2.5 border-b bg-muted/20">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4" /> Selbstauskunft
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Persönliche Daten, Beschäftigung, Einkommen und Vermögen der Antragsteller
            </p>
          </div>
          <div className="p-4 space-y-6">
            <PersonSection {...dualProps} />
            <EmploymentSection {...dualProps} />
            <BankSection {...dualProps} />
            <IncomeSection {...dualProps} />
            <ExpensesSection {...dualProps} />
            <AssetsSection {...dualProps} />
          </div>
        </CardContent>
      </Card>

      {/* Create Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleCreate}
          disabled={isCreating}
          className="min-w-[280px]"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <PlusCircle className="h-4 w-4 mr-2" />
          )}
          Finanzierungsakte erstellen
        </Button>
      </div>
    </PageShell>
  );
}
