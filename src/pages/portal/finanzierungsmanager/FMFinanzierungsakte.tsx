/**
 * FM Finanzierungsakte — Empty fillable form for creating a new finance case
 * Eckdaten + Selbstauskunft + shared Object/Finance cards with localStorage
 */
import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText, User } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import {
  PersonSection, EmploymentSection, BankSection, IncomeSection,
  ExpensesSection, AssetsSection, createEmptyApplicantFormData,
  type ApplicantFormData,
} from '@/components/finanzierung/ApplicantPersonFields';
import FinanceObjectCard from '@/components/finanzierung/FinanceObjectCard';
import FinanceRequestCard from '@/components/finanzierung/FinanceRequestCard';

/** Simple label-value row for the top summary */
function TR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground py-1.5 px-3 w-[180px] border-r">{label}</TableCell>
      <TableCell className="text-sm py-1.5 px-3">{children}</TableCell>
    </TableRow>
  );
}

const inputCls = "h-7 text-xs border-0 bg-transparent shadow-none";

export default function FMFinanzierungsakte() {
  const navigate = useNavigate();
  const [purpose, setPurpose] = useState('kauf');
  const [objectAddress, setObjectAddress] = useState('');
  const [objectType, setObjectType] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [equityAmount, setEquityAmount] = useState('');

  // Applicant form
  const [formData, setFormData] = useState<ApplicantFormData>(createEmptyApplicantFormData());
  const [coFormData, setCoFormData] = useState<ApplicantFormData>(createEmptyApplicantFormData());

  const handleChange = (field: string, value: unknown) =>
    setFormData(prev => ({ ...prev, [field]: value }));
  const handleCoChange = (field: string, value: unknown) =>
    setCoFormData(prev => ({ ...prev, [field]: value }));

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

      {/* Block 3: Finanzierungsobjekt (shared card) */}
      <FinanceObjectCard storageKey="mod11-akte" />

      {/* Block 4: Beantragte Finanzierung (shared card) */}
      <FinanceRequestCard storageKey="mod11-akte" />
    </PageShell>
  );
}
