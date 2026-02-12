/**
 * FinanceApplicationPreview — HTML-based PDF preview of the financing application
 * Renders a structured summary of all captured data, downloadable as PDF.
 */
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Mail } from 'lucide-react';
import type { ApplicantFormData } from './ApplicantPersonFields';
import type { PropertyAsset } from './PropertyAssetsCard';

const eurFmt = (v: number | null | undefined) =>
  v != null ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v) : '—';

interface Props {
  publicId: string;
  formData: ApplicantFormData;
  coFormData?: ApplicantFormData;
  propertyAssets: PropertyAsset[];
  objectData?: {
    address?: string;
    type?: string;
    livingArea?: string;
    yearBuilt?: string;
    purchasePrice?: number;
  };
  financeData?: {
    loanAmount?: number;
    equityAmount?: number;
    purpose?: string;
    brokerFee?: number;
    notaryCosts?: number;
    transferTax?: number;
    modernizationCosts?: number;
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-primary/20 pb-1 mb-2">
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || '—'}</span>
    </>
  );
}

export default function FinanceApplicationPreview({
  publicId,
  formData,
  coFormData,
  propertyAssets,
  objectData,
  financeData,
}: Props) {
  const previewRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    // Use browser print as lightweight PDF solution
    const printContent = previewRef.current;
    if (!printContent) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Finanzierungsantrag ${publicId}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; font-size: 11px; color: #1a1a1a; }
        h3 { font-size: 16px; margin-bottom: 4px; }
        h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 16px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; }
        .label { color: #666; }
        .value { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
        th, td { border: 1px solid #ddd; padding: 3px 6px; text-align: left; }
        th { background: #f5f5f5; }
      </style></head><body>
      ${printContent.innerHTML}
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const fullName = [formData.first_name, formData.last_name].filter(Boolean).join(' ') || 'Antragsteller';
  const coName = coFormData ? [coFormData.first_name, coFormData.last_name].filter(Boolean).join(' ') : '';

  const totalRent = propertyAssets.reduce((s, p) => s + (p.net_rent_monthly || 0), 0);
  const totalLoanRates = propertyAssets.reduce(
    (s, p) => s + (p.loan1_rate_monthly || 0) + (p.loan2_rate_monthly || 0), 0
  );

  // Income/expense summary
  const income1 = (formData.net_income_monthly || 0) + (formData.child_benefit_monthly || 0) +
    (formData.rental_income_monthly || 0) + (formData.other_regular_income_monthly || 0);
  const expenses1 = (formData.current_rent_monthly || 0) + (formData.health_insurance_monthly || 0) +
    (formData.living_expenses_monthly || 0) + (formData.other_fixed_costs_monthly || 0);

  return (
    <div className="flex flex-col h-full">
      {/* Preview content */}
      <div ref={previewRef} className="flex-1 overflow-y-auto p-4 bg-white dark:bg-card text-foreground rounded-lg border text-xs space-y-1">
        {/* Header */}
        <div className="text-center mb-4">
          <h3 className="text-base font-bold">Finanzierungsantrag</h3>
          <p className="text-sm text-muted-foreground">{fullName}</p>
          <p className="text-xs text-muted-foreground font-mono">{publicId}</p>
        </div>

        {/* Antragsteller */}
        <Section title="1. Antragsteller">
          <Field label="Name" value={fullName} />
          <Field label="Geburtsdatum" value={formData.birth_date} />
          <Field label="Adresse" value={formData.address_street} />
          <Field label="PLZ / Ort" value={`${formData.address_postal_code || ''} ${formData.address_city || ''}`} />
          <Field label="Nationalität" value={formData.nationality} />
          <Field label="Telefon" value={formData.phone} />
          <Field label="Beschäftigung" value={formData.employment_type} />
          <Field label="Arbeitgeber" value={formData.employer_name} />
          <Field label="Beschäftigt seit" value={formData.employed_since} />
          <Field label="Nettoeinkommen" value={eurFmt(formData.net_income_monthly)} />
        </Section>

        {/* Mitantragsteller */}
        {coName && coFormData && (
          <Section title="2. Mitantragsteller">
            <Field label="Name" value={coName} />
            <Field label="Geburtsdatum" value={coFormData.birth_date} />
            <Field label="Beschäftigung" value={coFormData.employment_type} />
            <Field label="Arbeitgeber" value={coFormData.employer_name} />
            <Field label="Nettoeinkommen" value={eurFmt(coFormData.net_income_monthly)} />
          </Section>
        )}

        {/* Finanzierungsobjekt */}
        <Section title="Finanzierungsobjekt">
          <Field label="Adresse" value={objectData?.address} />
          <Field label="Objektart" value={objectData?.type} />
          <Field label="Wohnfläche" value={objectData?.livingArea ? `${objectData.livingArea} m²` : undefined} />
          <Field label="Baujahr" value={objectData?.yearBuilt} />
          <Field label="Kaufpreis" value={eurFmt(objectData?.purchasePrice)} />
        </Section>

        {/* Finanzierungs-Eckdaten */}
        <Section title="Finanzierungs-Eckdaten">
          <Field label="Darlehenssumme" value={eurFmt(financeData?.loanAmount)} />
          <Field label="Eigenkapital" value={eurFmt(financeData?.equityAmount)} />
          <Field label="Verwendungszweck" value={financeData?.purpose} />
          <Field label="Maklergebühr" value={eurFmt(financeData?.brokerFee)} />
          <Field label="Notarkosten" value={eurFmt(financeData?.notaryCosts)} />
          <Field label="Grunderwerbsteuer" value={eurFmt(financeData?.transferTax)} />
          <Field label="Modernisierung" value={eurFmt(financeData?.modernizationCosts)} />
        </Section>

        {/* Kapitaldienstfähigkeit */}
        <Section title="Kapitaldienstfähigkeit">
          <Field label="Einnahmen (AS1)" value={eurFmt(income1)} />
          <Field label="Ausgaben (AS1)" value={eurFmt(expenses1)} />
          <Field label="Verfügbar (AS1)" value={eurFmt(income1 - expenses1)} />
        </Section>

        {/* Immobilienvermögen */}
        {propertyAssets.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-primary/20 pb-1 mb-2">
              Immobilienvermögen
            </h4>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/30">
                  <th className="border p-1 text-left">Objekt</th>
                  <th className="border p-1 text-right">Wert</th>
                  <th className="border p-1 text-right">Miete mtl.</th>
                  <th className="border p-1 text-right">Darlehen</th>
                  <th className="border p-1 text-right">Rate mtl.</th>
                </tr>
              </thead>
              <tbody>
                {propertyAssets.map((p, i) => (
                  <tr key={p.id}>
                    <td className="border p-1">{p.address || `Immobilie ${i + 1}`}</td>
                    <td className="border p-1 text-right">{eurFmt(p.estimated_value)}</td>
                    <td className="border p-1 text-right">{eurFmt(p.net_rent_monthly)}</td>
                    <td className="border p-1 text-right">{eurFmt((p.loan1_balance || 0) + (p.loan2_balance || 0))}</td>
                    <td className="border p-1 text-right">{eurFmt((p.loan1_rate_monthly || 0) + (p.loan2_rate_monthly || 0))}</td>
                  </tr>
                ))}
                <tr className="font-semibold bg-muted/20">
                  <td className="border p-1">Summe</td>
                  <td className="border p-1 text-right">{eurFmt(propertyAssets.reduce((s, p) => s + (p.estimated_value || 0), 0))}</td>
                  <td className="border p-1 text-right">{eurFmt(totalRent)}</td>
                  <td className="border p-1 text-right">{eurFmt(propertyAssets.reduce((s, p) => s + (p.loan1_balance || 0) + (p.loan2_balance || 0), 0))}</td>
                  <td className="border p-1 text-right">{eurFmt(totalLoanRates)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-3 border-t mt-2">
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleDownloadPdf}>
          <Download className="h-3.5 w-3.5" /> PDF herunterladen
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" disabled>
          <Mail className="h-3.5 w-3.5" /> Per E-Mail senden
        </Button>
      </div>
    </div>
  );
}
