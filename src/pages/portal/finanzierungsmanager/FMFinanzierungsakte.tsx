/**
 * FM Finanzierungsakte — Empty fillable form for creating a new finance case
 * Eckdaten + Selbstauskunft + shared Object/Finance cards with localStorage
 */
import * as React from 'react';
import { useState, useMemo, useRef } from 'react';
import type { CalcData } from '@/components/finanzierung/FinanceCalculatorCard';
import HouseholdCalculationCard from '@/components/finanzierung/HouseholdCalculationCard';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText, User, Building2, Search, Save, Banknote } from 'lucide-react';
import FinanceOfferCard from '@/components/finanzierung/FinanceOfferCard';
import AmortizationScheduleCard from '@/components/finanzierung/AmortizationScheduleCard';
import { toast } from 'sonner';
import { PageShell } from '@/components/shared/PageShell';
import FinanceCalculatorCard from '@/components/finanzierung/FinanceCalculatorCard';
import {
  PersonSection, EmploymentSection, BankSection, IncomeSection,
  ExpensesSection, AssetsSection, DualHeader, SectionHeaderRow,
  createEmptyApplicantFormData,
  type ApplicantFormData,
} from '@/components/finanzierung/ApplicantPersonFields';
import { Table, TableBody } from '@/components/ui/table';
import FinanceObjectCard, { type ObjectFormData, type FinanceObjectCardHandle } from '@/components/finanzierung/FinanceObjectCard';
import FinanceRequestCard, { type FinanceRequestCardHandle } from '@/components/finanzierung/FinanceRequestCard';
import PropertyAssetsCard, { type PropertyAsset, createEmptyProperty } from '@/components/finanzierung/PropertyAssetsCard';
import GenerateCaseCard from '@/components/finanzierung/GenerateCaseCard';
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

  // Listing search for auto-fill
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [externalObjectData, setExternalObjectData] = useState<Partial<ObjectFormData> | undefined>();
  const [externalPurchasePrice, setExternalPurchasePrice] = useState<string | undefined>();
  const [calculatorBedarf, setCalculatorBedarf] = useState(0);
  const [calculatorPurchasePrice, setCalculatorPurchasePrice] = useState(0);
  const [calcData, setCalcData] = useState<CalcData | null>(null);
  const [showAmortization, setShowAmortization] = useState(false);
  const [eckdatenUsage, setEckdatenUsage] = useState('');
  const [eckdatenRentalIncome, setEckdatenRentalIncome] = useState(0);
  const [propertyAssets, setPropertyAssets] = useState<PropertyAsset[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const objectCardRef = useRef<FinanceObjectCardHandle>(null);
  const requestCardRef = useRef<FinanceRequestCardHandle>(null);

  const handleFloatingSave = () => {
    objectCardRef.current?.save();
    requestCardRef.current?.save();
    toast.success('Daten zwischengespeichert');
  };

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

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim() || !listings) return [];
    const q = searchQuery.toLowerCase();
    return listings.filter(l =>
      (l.public_id?.toLowerCase().includes(q)) ||
      (l.title?.toLowerCase().includes(q)) ||
      (l.city?.toLowerCase().includes(q)) ||
      (l.postal_code?.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchQuery, listings]);

  const handleListingSelect = (listing: NonNullable<typeof listings>[number]) => {
    if (!listing) return;
    setSearchQuery(`${listing.title ?? ''} — ${listing.city ?? ''}`);
    setShowDropdown(false);
    setExternalObjectData({
      city: listing.city ?? '',
      postalCode: listing.postal_code ?? '',
      objectType: mapPropertyType(listing.property_type),
      yearBuilt: listing.year_built?.toString() ?? '',
      livingArea: listing.total_area_sqm?.toString() ?? '',
    });
    setExternalPurchasePrice(listing.asking_price?.toString() ?? '');
  };

  const handleCalculate = (bedarf: number) => {
    setCalculatorBedarf(bedarf);
    // purchasePrice from external or from FinanceRequestCard data
    const pp = Number(externalPurchasePrice) || 0;
    setCalculatorPurchasePrice(pp);
  };

  const handleTransferToApplication = React.useCallback(() => {
    // Transfer eckdaten into Selbstauskunft fields
    toast.success('Eckdaten wurden in den Finanzierungsantrag übernommen');
  }, []);

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

      {/* Listing search (full width, top) */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Objekt aus Marktplatz übernehmen</span>
            <div className="relative flex-1" ref={searchRef}>
              <Input
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Objekt suchen (ID, Ort, Straße...)"
                className="h-8 text-xs"
              />
              {showDropdown && filteredListings.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-64 overflow-y-auto">
                  {filteredListings.map(l => (
                    <button
                      key={l.public_id}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors border-b last:border-b-0"
                      onMouseDown={() => handleListingSelect(l)}
                    >
                      <div className="font-medium">{l.title ?? 'Ohne Titel'}</div>
                      <div className="text-muted-foreground">
                        {l.city ?? ''}{l.postal_code ? ` (${l.postal_code})` : ''}
                        {l.asking_price ? ` — ${Number(l.asking_price).toLocaleString('de-DE')} €` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block 1: Eckdaten + Kalkulator (2-spaltig) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FinanceRequestCard
          ref={requestCardRef}
          storageKey="mod11-akte"
          externalPurchasePrice={externalPurchasePrice}
          showCalculator
          onCalculate={handleCalculate}
          hideFooter
          showObjectFields
          title="Eckdaten"
          onDataChange={({ usage, rentalIncome }) => {
            setEckdatenUsage(usage);
            setEckdatenRentalIncome(rentalIncome);
          }}
        />
        <FinanceCalculatorCard
          finanzierungsbedarf={calculatorBedarf}
          purchasePrice={calculatorPurchasePrice}
          onCalcUpdate={setCalcData}
        />
      </div>

      {/* Block 1b: Überschlägiges Finanzierungsangebot (full width) */}
      <FinanceOfferCard
        calcData={calcData}
        onTransferToApplication={handleTransferToApplication}
        onShowAmortization={() => setShowAmortization(prev => !prev)}
        showAmortizationActive={showAmortization}
      />

      {/* Tilgungsplan (conditional) */}
      {showAmortization && calcData && calcData.loanAmount > 0 && calcData.interestRate > 0 && (
        <AmortizationScheduleCard calcData={calcData} />
      )}

      {/* Section heading: Finanzierungsantrag */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Finanzierungsantrag</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Detaillierte Angaben für die Bankeinreichung
        </p>
      </div>

      {/* Block 2a: Selbstauskunft — Person, Beschäftigung, Bankverbindung */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2.5 border-b bg-muted/20">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4" /> Selbstauskunft
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Persönliche Daten, Beschäftigung und Bankverbindung der Antragsteller
            </p>
          </div>
          <div className="p-4 space-y-0">
            {/* Shared DualHeader for Card 1 */}
            <Table><DualHeader /><TableBody /></Table>
            <PersonSection {...dualProps} hideHeader />
            <EmploymentSection {...dualProps} hideHeader />
            <BankSection {...dualProps} hideHeader />
          </div>
        </CardContent>
      </Card>

      {/* Block 2b: Einnahmen, Ausgaben & Vermögen */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2.5 border-b bg-muted/20">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Banknote className="h-4 w-4" /> Einnahmen, Ausgaben & Vermögen
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monatliche Einnahmen/Ausgaben und Vermögenswerte der Antragsteller
            </p>
          </div>
          <div className="p-4 space-y-0">
            {/* Shared DualHeader for Card 2 */}
            <Table><DualHeader /><TableBody /></Table>
            <IncomeSection {...dualProps} hideHeader />
            <ExpensesSection {...dualProps} hideHeader />
            {/* Sub-heading for Assets */}
            <div className="pt-4">
              <Table><TableBody><SectionHeaderRow title="Vermögen und Verbindlichkeiten" /></TableBody></Table>
            </div>
            <AssetsSection {...dualProps} hideHeader />
          </div>
        </CardContent>
      </Card>

      {/* PropertyAssetsCard — visible when has_rental_properties */}
      {(formData.has_rental_properties || coFormData.has_rental_properties) && (
        <PropertyAssetsCard
          properties={propertyAssets}
          onChange={(updated) => {
            setPropertyAssets(updated);
            // Write back sum of net rents to rental_income_monthly
            const totalRent = updated.reduce((s, p) => s + (p.net_rent_monthly || 0), 0);
            if (formData.has_rental_properties) {
              handleChange('rental_income_monthly', totalRent > 0 ? totalRent : null);
            }
          }}
        />
      )}

      {/* Section heading: Finanzierungsobjekt */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Finanzierungsobjekt</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Hier erfassen Sie Ihr Finanzierungsobjekt.
        </p>
      </div>

      {/* Block 3: Finanzierungsobjekt (shared card) */}
      <FinanceObjectCard ref={objectCardRef} storageKey="mod11-akte" externalData={externalObjectData} hideFooter />

      {/* Section heading: Kapitaldienstfähigkeit */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Kapitaldienstfähigkeit</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Simulation der monatlichen Einnahmen und Ausgaben nach Abschluss der neuen Finanzierung
        </p>
      </div>

      {/* Haushaltsrechnung */}
      <HouseholdCalculationCard
        formData={formData}
        coFormData={coFormData}
        calcData={calcData}
        usage={eckdatenUsage}
        rentalIncome={eckdatenRentalIncome}
        livingArea={Number(externalObjectData?.livingArea) || 0}
        propertyAssets={propertyAssets}
      />

      {/* GenerateCaseCard — Finanzierungsfall anlegen */}
      <GenerateCaseCard
        formData={formData}
        coFormData={coFormData}
        propertyAssets={propertyAssets}
        objectData={{
          address: externalObjectData?.city ? `${externalObjectData.city}` : undefined,
          type: externalObjectData?.objectType,
          livingArea: externalObjectData?.livingArea,
          yearBuilt: externalObjectData?.yearBuilt,
          purchasePrice: externalPurchasePrice ? Number(externalPurchasePrice) : undefined,
        }}
        financeData={{
          loanAmount: calculatorBedarf || undefined,
          equityAmount: undefined,
          purpose: eckdatenUsage || 'kauf',
        }}
      />

      {/* Spacer to prevent floating button overlap */}
      <div className="h-20" />

      {/* Floating save button */}
      <Button
        onClick={handleFloatingSave}
        variant="glass"
        className="fixed bottom-6 right-6 z-50 shadow-lg gap-2"
      >
        <Save className="h-4 w-4" /> Zwischenspeichern
      </Button>
    </PageShell>
  );
}
