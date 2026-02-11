/**
 * FM Finanzierungsakte — Empty fillable form for creating a new finance case
 * Creates finance_request + applicant_profile on submit
 */
import * as React from 'react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText, Loader2, PlusCircle, User, Building2, MapPin, Euro } from 'lucide-react';
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

/** Computed value row (bold, no input) */
function TRComputed({ label, value }: { label: string; value: string }) {
  return (
    <TableRow className="bg-muted/30">
      <TableCell className="text-xs font-semibold py-1.5 px-3 w-[180px] border-r">{label}</TableCell>
      <TableCell className="text-sm font-semibold py-1.5 px-3">{value}</TableCell>
    </TableRow>
  );
}

const inputCls = "h-7 text-xs border-0 bg-transparent shadow-none";

export default function FMFinanzierungsakte() {
  const navigate = useNavigate();
  const { activeOrganization, user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [purpose, setPurpose] = useState('kauf');

  // Eckdaten
  const [objectAddress, setObjectAddress] = useState('');
  const [objectType, setObjectType] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [equityAmount, setEquityAmount] = useState('');

  // Finanzierungsobjekt — Objektdaten
  const [objStreet, setObjStreet] = useState('');
  const [objHouseNo, setObjHouseNo] = useState('');
  const [objPostalCode, setObjPostalCode] = useState('');
  const [objCity, setObjCity] = useState('');
  const [objArt, setObjArt] = useState('');
  const [objBaujahr, setObjBaujahr] = useState('');
  const [objWohnflaeche, setObjWohnflaeche] = useState('');
  const [objGrundstueck, setObjGrundstueck] = useState('');
  const [objAusstattung, setObjAusstattung] = useState('');
  const [objWohnlage, setObjWohnlage] = useState('');
  const [objZimmer, setObjZimmer] = useState('');
  const [objStellplaetze, setObjStellplaetze] = useState('');

  // Kostenzusammenstellung
  const [costKaufpreis, setCostKaufpreis] = useState('');
  const [costModernisierung, setCostModernisierung] = useState('');
  const [costNotar, setCostNotar] = useState('');
  const [costGrunderwerbsteuer, setCostGrunderwerbsteuer] = useState('');
  const [costMakler, setCostMakler] = useState('');

  // Finanzierungsplan
  const [finEigenkapital, setFinEigenkapital] = useState('');
  const [finDarlehen, setFinDarlehen] = useState('');
  const [finZinsbindung, setFinZinsbindung] = useState('');
  const [finTilgung, setFinTilgung] = useState('');
  const [finMaxRate, setFinMaxRate] = useState('');

  // Computed values
  const n = (v: string) => (v ? Number(v) : 0);
  const gesamtkosten = useMemo(() =>
    n(costKaufpreis) + n(costModernisierung) + n(costNotar) + n(costGrunderwerbsteuer) + n(costMakler),
    [costKaufpreis, costModernisierung, costNotar, costGrunderwerbsteuer, costMakler]
  );
  const finanzierungsbedarf = useMemo(() =>
    Math.max(0, gesamtkosten - n(finEigenkapital)),
    [gesamtkosten, finEigenkapital]
  );
  const fmt = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

    const fullAddress = [objStreet, objHouseNo, objPostalCode, objCity].filter(Boolean).join(', ') || objectAddress;

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
          object_address: fullAddress || null,
          purchase_price: n(costKaufpreis) || n(purchasePrice) || null,
          custom_object_data: {
            object_type: objArt || objectType,
            street: objStreet,
            house_no: objHouseNo,
            postal_code: objPostalCode,
            city: objCity,
            year_built: objBaujahr ? Number(objBaujahr) : null,
            living_area_sqm: objWohnflaeche ? Number(objWohnflaeche) : null,
            plot_area_sqm: objGrundstueck ? Number(objGrundstueck) : null,
            equipment_level: objAusstattung,
            location_quality: objWohnlage,
            rooms: objZimmer ? Number(objZimmer) : null,
            parking_spaces: objStellplaetze ? Number(objStellplaetze) : null,
            modernization_costs: n(costModernisierung) || null,
            notary_costs: n(costNotar) || null,
            transfer_tax: n(costGrunderwerbsteuer) || null,
            broker_fee: n(costMakler) || null,
            total_costs: gesamtkosten || null,
            equity: n(finEigenkapital) || null,
            loan_request: n(finDarlehen) || null,
            fixed_rate_years: finZinsbindung ? Number(finZinsbindung) : null,
            initial_repayment_pct: finTilgung ? Number(finTilgung) : null,
            max_monthly_rate: n(finMaxRate) || null,
            financing_need: finanzierungsbedarf || null,
          },
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
          purchase_price: n(costKaufpreis) || n(purchasePrice) || null,
          loan_amount_requested: n(finDarlehen) || n(loanAmount) || null,
          equity_amount: n(finEigenkapital) || n(equityAmount) || null,
          object_address: fullAddress || null,
          object_type: objArt || objectType || null,
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
                  <SelectTrigger className={inputCls}>
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
                <Input value={objectAddress} onChange={e => setObjectAddress(e.target.value)}
                  placeholder="Straße, PLZ Ort" className={inputCls} />
              </TR>
              <TR label="Objekttyp">
                <Select value={objectType} onValueChange={setObjectType}>
                  <SelectTrigger className={inputCls}>
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
                <Input value={loanAmount} onChange={e => setLoanAmount(e.target.value)}
                  type="number" placeholder="0" className={inputCls} />
              </TR>
              {purpose !== 'umschuldung' && (
                <>
                  <TR label="Kaufpreis (€)">
                    <Input value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)}
                      type="number" placeholder="0" className={inputCls} />
                  </TR>
                  <TR label="Eigenkapital (€)">
                    <Input value={equityAmount} onChange={e => setEquityAmount(e.target.value)}
                      type="number" placeholder="0" className={inputCls} />
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

      {/* Block 3: Finanzierungsobjekt */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2.5 border-b bg-muted/20">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Finanzierungsobjekt erfassen
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Objektdaten, Kostenzusammenstellung und Finanzierungsplan
            </p>
          </div>

          {/* 3a: Objektdaten */}
          <div className="px-4 py-2 border-b">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Objektdaten
            </h4>
          </div>
          <Table>
            <TableBody>
              <TR label="Straße">
                <Input value={objStreet} onChange={e => setObjStreet(e.target.value)}
                  placeholder="Musterstraße" className={inputCls} />
              </TR>
              <TR label="Hausnummer">
                <Input value={objHouseNo} onChange={e => setObjHouseNo(e.target.value)}
                  placeholder="12a" className={inputCls} />
              </TR>
              <TR label="PLZ">
                <Input value={objPostalCode} onChange={e => setObjPostalCode(e.target.value)}
                  placeholder="10115" className={inputCls} />
              </TR>
              <TR label="Ort">
                <Input value={objCity} onChange={e => setObjCity(e.target.value)}
                  placeholder="Berlin" className={inputCls} />
              </TR>
              <TR label="Objektart">
                <Select value={objArt} onValueChange={setObjArt}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eigentumswohnung">Eigentumswohnung</SelectItem>
                    <SelectItem value="einfamilienhaus">Einfamilienhaus (EFH)</SelectItem>
                    <SelectItem value="zweifamilienhaus">Zweifamilienhaus (ZFH)</SelectItem>
                    <SelectItem value="mehrfamilienhaus">Mehrfamilienhaus (MFH)</SelectItem>
                    <SelectItem value="grundstueck">Grundstück</SelectItem>
                    <SelectItem value="gewerbe">Gewerbeimmobilie</SelectItem>
                  </SelectContent>
                </Select>
              </TR>
              <TR label="Baujahr">
                <Input value={objBaujahr} onChange={e => setObjBaujahr(e.target.value)}
                  type="number" placeholder="1990" className={inputCls} />
              </TR>
              <TR label="Wohnfläche (m²)">
                <Input value={objWohnflaeche} onChange={e => setObjWohnflaeche(e.target.value)}
                  type="number" placeholder="0" className={inputCls} />
              </TR>
              <TR label="Grundstücksfläche (m²)">
                <Input value={objGrundstueck} onChange={e => setObjGrundstueck(e.target.value)}
                  type="number" placeholder="0" className={inputCls} />
              </TR>
              <TR label="Ausstattungsniveau">
                <Select value={objAusstattung} onValueChange={setObjAusstattung}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="einfach">Einfach</SelectItem>
                    <SelectItem value="mittel">Mittel</SelectItem>
                    <SelectItem value="gehoben">Gehoben</SelectItem>
                    <SelectItem value="luxus">Luxus</SelectItem>
                  </SelectContent>
                </Select>
              </TR>
              <TR label="Wohnlage">
                <Select value={objWohnlage} onValueChange={setObjWohnlage}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="einfach">Einfach</SelectItem>
                    <SelectItem value="mittel">Mittel</SelectItem>
                    <SelectItem value="gut">Gut</SelectItem>
                    <SelectItem value="sehr_gut">Sehr gut</SelectItem>
                  </SelectContent>
                </Select>
              </TR>
              <TR label="Anzahl Zimmer">
                <Input value={objZimmer} onChange={e => setObjZimmer(e.target.value)}
                  type="number" placeholder="0" className={inputCls} />
              </TR>
              <TR label="Stellplätze / Garagen">
                <Input value={objStellplaetze} onChange={e => setObjStellplaetze(e.target.value)}
                  type="number" placeholder="0" className={inputCls} />
              </TR>
            </TableBody>
          </Table>

          {/* 3b: Kostenzusammenstellung */}
          <div className="px-4 py-2 border-b border-t">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <Euro className="h-3.5 w-3.5" /> Kostenzusammenstellung
            </h4>
          </div>
          <Table>
            <TableBody>
              <TR label="Kaufpreis / Baukosten (€)">
                <Input value={costKaufpreis} onChange={e => setCostKaufpreis(e.target.value)}
                  type="number" placeholder="0" className={inputCls} />
              </TR>
              <TR label="Modernisierungskosten (€)">
                <Input value={costModernisierung} onChange={e => setCostModernisierung(e.target.value)}
                  type="number" placeholder="0" className={inputCls} />
              </TR>
              <TR label="Notar und Grundbuch (€)">
                <Input value={costNotar} onChange={e => setCostNotar(e.target.value)}
                  type="number" placeholder="0" className={inputCls} />
              </TR>
              <TR label="Grunderwerbsteuer (€)">
                <Input value={costGrunderwerbsteuer} onChange={e => setCostGrunderwerbsteuer(e.target.value)}
                  type="number" placeholder="0" className={inputCls} />
              </TR>
              <TR label="Maklerprovision (€)">
                <Input value={costMakler} onChange={e => setCostMakler(e.target.value)}
                  type="number" placeholder="0" className={inputCls} />
              </TR>
              <TRComputed label="Gesamtkosten (€)" value={`${fmt(gesamtkosten)} €`} />
            </TableBody>
          </Table>

          {/* 3c: Finanzierungsplan */}
          <div className="px-4 py-2 border-b border-t">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> Finanzierungsplan
            </h4>
          </div>
          <Table>
            <TableBody>
              <TR label="Eigenkapital (€)">
                <Input value={finEigenkapital} onChange={e => setFinEigenkapital(e.target.value)}
                  type="number" placeholder="0" className={inputCls} />
              </TR>
              <TR label="Darlehenswunsch (€)">
                <Input value={finDarlehen} onChange={e => setFinDarlehen(e.target.value)}
                  type="number" placeholder="0" className={inputCls} />
              </TR>
              <TR label="Zinsbindung (Jahre)">
                <Select value={finZinsbindung} onValueChange={setFinZinsbindung}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Jahre</SelectItem>
                    <SelectItem value="10">10 Jahre</SelectItem>
                    <SelectItem value="15">15 Jahre</SelectItem>
                    <SelectItem value="20">20 Jahre</SelectItem>
                    <SelectItem value="25">25 Jahre</SelectItem>
                    <SelectItem value="30">30 Jahre</SelectItem>
                  </SelectContent>
                </Select>
              </TR>
              <TR label="Anfängliche Tilgung (%)">
                <Input value={finTilgung} onChange={e => setFinTilgung(e.target.value)}
                  type="number" placeholder="z.B. 2" className={inputCls} />
              </TR>
              <TR label="Max. Monatsrate (€)">
                <Input value={finMaxRate} onChange={e => setFinMaxRate(e.target.value)}
                  type="number" placeholder="0" className={inputCls} />
              </TR>
              <TRComputed label="Finanzierungsbedarf (€)" value={`${fmt(finanzierungsbedarf)} €`} />
            </TableBody>
          </Table>
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
