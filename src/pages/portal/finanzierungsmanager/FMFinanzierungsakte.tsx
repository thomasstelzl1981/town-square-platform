/**
 * FM Finanzierungsakte — Empty fillable form for creating a new finance case
 * Eckdaten + Selbstauskunft + shared Object/Finance cards with localStorage
 */
import * as React from 'react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText, User, Building2, Search } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import {
  PersonSection, EmploymentSection, BankSection, IncomeSection,
  ExpensesSection, AssetsSection, createEmptyApplicantFormData,
  type ApplicantFormData,
} from '@/components/finanzierung/ApplicantPersonFields';
import FinanceObjectCard, { type ObjectFormData } from '@/components/finanzierung/FinanceObjectCard';
import FinanceRequestCard from '@/components/finanzierung/FinanceRequestCard';
import { supabase } from '@/integrations/supabase/client';

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

/** Map v_public_listings property_type to ObjectFormData objectType */
function mapPropertyType(pt: string | null): string {
  if (!pt) return '';
  const map: Record<string, string> = {
    apartment: 'eigentumswohnung',
    house: 'einfamilienhaus',
    multi_family: 'mehrfamilienhaus',
    land: 'grundstueck',
    commercial: 'gewerbe',
  };
  return map[pt] || '';
}

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

  // Listing selection for auto-fill
  const [selectedListingId, setSelectedListingId] = useState('');
  const [externalObjectData, setExternalObjectData] = useState<Partial<ObjectFormData> | undefined>();
  const [externalPurchasePrice, setExternalPurchasePrice] = useState<string | undefined>();

  const { data: listings } = useQuery({
    queryKey: ['v_public_listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_public_listings')
        .select('public_id, title, city, postal_code, property_type, total_area_sqm, year_built, asking_price')
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleListingSelect = (publicId: string) => {
    setSelectedListingId(publicId);
    if (!publicId || publicId === '__none__') {
      setExternalObjectData(undefined);
      setExternalPurchasePrice(undefined);
      return;
    }
    const listing = listings?.find(l => l.public_id === publicId);
    if (!listing) return;
    setExternalObjectData({
      city: listing.city ?? '',
      postalCode: listing.postal_code ?? '',
      objectType: mapPropertyType(listing.property_type),
      yearBuilt: listing.year_built?.toString() ?? '',
      livingArea: listing.total_area_sqm?.toString() ?? '',
    });
    setExternalPurchasePrice(listing.asking_price?.toString() ?? '');
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

      {/* Section heading: Finanzierungsobjekt */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Finanzierungsobjekt</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Hier erfassen Sie Ihr Finanzierungsobjekt.
        </p>
      </div>

      {/* Listing selector (MOD-11 only) */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Objekt aus Marktplatz übernehmen</span>
            <Select value={selectedListingId} onValueChange={handleListingSelect}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Kein Listing — manuell eingeben" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Kein Listing — manuell eingeben</SelectItem>
                {listings?.map(l => (
                  <SelectItem key={l.public_id} value={l.public_id ?? ''}>
                    {l.title ?? 'Ohne Titel'} — {l.city ?? ''}{l.asking_price ? ` — ${Number(l.asking_price).toLocaleString('de-DE')} €` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Block 3: Finanzierungsobjekt (shared card) */}
      <FinanceObjectCard storageKey="mod11-akte" externalData={externalObjectData} />

      {/* Block 4: Beantragte Finanzierung (shared card) */}
      <FinanceRequestCard storageKey="mod11-akte" externalPurchasePrice={externalPurchasePrice} />
    </PageShell>
  );
}
