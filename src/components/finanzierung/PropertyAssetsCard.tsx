/**
 * PropertyAssetsCard — Aufstellung Immobilienvermögen
 * 
 * Allows capturing up to 5 existing properties with loans.
 * Sums flow back into the Kapitaldienstfähigkeit calculation.
 */
import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, Trash2 } from 'lucide-react';

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export interface PropertyAsset {
  id: string;
  property_index: number;
  property_type: string;
  address: string;
  living_area_sqm: number | null;
  rented_area_sqm: number | null;
  commercial_area_sqm: number | null;
  construction_year: number | null;
  purchase_price: number | null;
  estimated_value: number | null;
  net_rent_monthly: number | null;
  units_count: number | null;
  loan1_lender: string;
  loan1_balance: number | null;
  loan1_rate_monthly: number | null;
  loan1_interest_rate: number | null;
  loan2_lender: string;
  loan2_balance: number | null;
  loan2_rate_monthly: number | null;
  loan2_interest_rate: number | null;
}

function createEmptyProperty(index: number): PropertyAsset {
  return {
    id: `temp-${Date.now()}-${index}`,
    property_index: index,
    property_type: '',
    address: '',
    living_area_sqm: null,
    rented_area_sqm: null,
    commercial_area_sqm: null,
    construction_year: null,
    purchase_price: null,
    estimated_value: null,
    net_rent_monthly: null,
    units_count: null,
    loan1_lender: '',
    loan1_balance: null,
    loan1_rate_monthly: null,
    loan1_interest_rate: null,
    loan2_lender: '',
    loan2_balance: null,
    loan2_rate_monthly: null,
    loan2_interest_rate: null,
  };
}

const PROPERTY_TYPES = [
  { value: 'etw', label: 'ETW (Eigentumswohnung)' },
  { value: 'efh', label: 'EFH (Einfamilienhaus)' },
  { value: 'dhh', label: 'DHH (Doppelhaushälfte)' },
  { value: 'reh', label: 'REH (Reihenhaus)' },
  { value: 'mfh', label: 'MFH (Mehrfamilienhaus)' },
  { value: 'gewerbe', label: 'Gewerbeobjekt' },
  { value: 'grundstueck', label: 'Grundstück' },
  { value: 'sonstige', label: 'Sonstige' },
];

interface PropertyAssetsCardProps {
  properties: PropertyAsset[];
  onChange: (properties: PropertyAsset[]) => void;
  readOnly?: boolean;
  showImportButton?: boolean;
  onImportFromPortfolio?: () => void;
}

function NumInput({ value, onChange, disabled, placeholder, suffix }: {
  value: number | null; onChange: (v: number | null) => void; disabled?: boolean; placeholder?: string; suffix?: string;
}) {
  return (
    <div className="relative">
      <Input
        type="number"
        step="0.01"
        value={value ?? ''}
        onChange={e => onChange(e.target.value ? parseFloat(e.target.value) : null)}
        disabled={disabled}
        placeholder={placeholder}
        className="h-7 text-xs pr-8"
      />
      {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">{suffix}</span>}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-muted-foreground font-medium">{children}</span>;
}

export default function PropertyAssetsCard({ properties, onChange, readOnly = false, showImportButton, onImportFromPortfolio }: PropertyAssetsCardProps) {
  const addProperty = () => {
    if (properties.length >= 5) return;
    onChange([...properties, createEmptyProperty(properties.length + 1)]);
  };

  const removeProperty = (index: number) => {
    const updated = properties.filter((_, i) => i !== index).map((p, i) => ({ ...p, property_index: i + 1 }));
    onChange(updated);
  };

  const updateProperty = (index: number, field: keyof PropertyAsset, value: unknown) => {
    const updated = properties.map((p, i) => i === index ? { ...p, [field]: value } : p);
    onChange(updated);
  };

  const totalRent = properties.reduce((s, p) => s + (p.net_rent_monthly || 0), 0);
  const totalLoanRates = properties.reduce((s, p) => s + (p.loan1_rate_monthly || 0) + (p.loan2_rate_monthly || 0), 0);

  // Initialize with one property if empty
  React.useEffect(() => {
    if (properties.length === 0) {
      onChange([createEmptyProperty(1)]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-4 py-2.5 border-b bg-muted/20">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Aufstellung Ihres Immobilienvermögens
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ergänzende Angaben zu bestehenden Immobilien und deren Verbindlichkeiten
          </p>
          {showImportButton && onImportFromPortfolio && (
            <Button variant="outline" size="sm" className="mt-2 text-xs gap-1.5" onClick={onImportFromPortfolio}>
              <Building2 className="h-3.5 w-3.5" /> Aus Immobilienportfolio importieren
            </Button>
          )}
        </div>

        {/* Properties */}
        <div className="divide-y">
          {properties.map((prop, idx) => (
            <div key={prop.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Immobilie {idx + 1}</span>
                {!readOnly && properties.length > 1 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => removeProperty(idx)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Entfernen
                  </Button>
                )}
              </div>

              {/* Row 1: Type + Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <FieldLabel>Objektart</FieldLabel>
                  <Select value={prop.property_type} onValueChange={v => updateProperty(idx, 'property_type', v)} disabled={readOnly}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Auswählen" /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <FieldLabel>Adresse</FieldLabel>
                  <Input value={prop.address} onChange={e => updateProperty(idx, 'address', e.target.value)} disabled={readOnly} className="h-7 text-xs" placeholder="Straße, PLZ Ort" />
                </div>
              </div>

              {/* Row 2: Areas + Year */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <FieldLabel>Wohnfläche</FieldLabel>
                  <NumInput value={prop.living_area_sqm} onChange={v => updateProperty(idx, 'living_area_sqm', v)} disabled={readOnly} suffix="m²" />
                </div>
                <div className="space-y-1">
                  <FieldLabel>Davon vermietet</FieldLabel>
                  <NumInput value={prop.rented_area_sqm} onChange={v => updateProperty(idx, 'rented_area_sqm', v)} disabled={readOnly} suffix="m²" />
                </div>
                <div className="space-y-1">
                  <FieldLabel>Gewerbefläche</FieldLabel>
                  <NumInput value={prop.commercial_area_sqm} onChange={v => updateProperty(idx, 'commercial_area_sqm', v)} disabled={readOnly} suffix="m²" />
                </div>
                <div className="space-y-1">
                  <FieldLabel>Baujahr</FieldLabel>
                  <Input type="number" value={prop.construction_year ?? ''} onChange={e => updateProperty(idx, 'construction_year', e.target.value ? parseInt(e.target.value) : null)} disabled={readOnly} className="h-7 text-xs" />
                </div>
              </div>

              {/* Row 3: Prices + Rent */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <FieldLabel>Kaufpreis</FieldLabel>
                  <NumInput value={prop.purchase_price} onChange={v => updateProperty(idx, 'purchase_price', v)} disabled={readOnly} suffix="€" />
                </div>
                <div className="space-y-1">
                  <FieldLabel>Geschätzter Wert</FieldLabel>
                  <NumInput value={prop.estimated_value} onChange={v => updateProperty(idx, 'estimated_value', v)} disabled={readOnly} suffix="€" />
                </div>
                <div className="space-y-1">
                  <FieldLabel>Nettokaltmiete/Monat</FieldLabel>
                  <NumInput value={prop.net_rent_monthly} onChange={v => updateProperty(idx, 'net_rent_monthly', v)} disabled={readOnly} suffix="€" />
                </div>
                <div className="space-y-1">
                  <FieldLabel>Wohneinheiten</FieldLabel>
                  <Input type="number" min="1" value={prop.units_count ?? ''} onChange={e => updateProperty(idx, 'units_count', e.target.value ? parseInt(e.target.value) : null)} disabled={readOnly} className="h-7 text-xs" />
                </div>
              </div>

              {/* Loans */}
              <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verbindlichkeiten</span>
                {/* Loan 1 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <FieldLabel>Darlehensgeber 1</FieldLabel>
                    <Input value={prop.loan1_lender} onChange={e => updateProperty(idx, 'loan1_lender', e.target.value)} disabled={readOnly} className="h-7 text-xs" placeholder="Bank/Institut" />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel>Darlehensstand</FieldLabel>
                    <NumInput value={prop.loan1_balance} onChange={v => updateProperty(idx, 'loan1_balance', v)} disabled={readOnly} suffix="€" />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel>Rate mtl.</FieldLabel>
                    <NumInput value={prop.loan1_rate_monthly} onChange={v => updateProperty(idx, 'loan1_rate_monthly', v)} disabled={readOnly} suffix="€" />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel>Sollzinssatz</FieldLabel>
                    <NumInput value={prop.loan1_interest_rate} onChange={v => updateProperty(idx, 'loan1_interest_rate', v)} disabled={readOnly} suffix="%" />
                  </div>
                </div>
                {/* Loan 2 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <FieldLabel>Darlehensgeber 2</FieldLabel>
                    <Input value={prop.loan2_lender} onChange={e => updateProperty(idx, 'loan2_lender', e.target.value)} disabled={readOnly} className="h-7 text-xs" placeholder="Bank/Institut" />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel>Darlehensstand</FieldLabel>
                    <NumInput value={prop.loan2_balance} onChange={v => updateProperty(idx, 'loan2_balance', v)} disabled={readOnly} suffix="€" />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel>Rate mtl.</FieldLabel>
                    <NumInput value={prop.loan2_rate_monthly} onChange={v => updateProperty(idx, 'loan2_rate_monthly', v)} disabled={readOnly} suffix="€" />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel>Sollzinssatz</FieldLabel>
                    <NumInput value={prop.loan2_interest_rate} onChange={v => updateProperty(idx, 'loan2_interest_rate', v)} disabled={readOnly} suffix="%" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add button */}
        {!readOnly && properties.length < 5 && (
          <div className="p-4 border-t">
            <Button variant="outline" onClick={addProperty} className="w-full text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Immobilie hinzufügen
            </Button>
          </div>
        )}

        {/* Summary */}
        <div className="border-t bg-muted/30 px-4 py-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Summe Nettokaltmieten</span>
            <span className="font-bold">{eurFormat.format(totalRent)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Summe Darlehensraten</span>
            <span className="font-bold text-destructive">{eurFormat.format(totalLoanRates)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { createEmptyProperty };
