/**
 * ApplicationPreview — Editable inline application form for consumer loan
 * Data can be pre-filled from Selbstauskunft but remains fully editable
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ConsumerLoanFormData } from '@/hooks/useConsumerLoan';

interface ApplicationFormProps {
  disabled?: boolean;
  formData: ConsumerLoanFormData;
  onFormDataChange: (data: ConsumerLoanFormData) => void;
}

const PLACEHOLDERS: Record<keyof ConsumerLoanFormData, string> = {
  first_name: 'Max',
  last_name: 'Mustermann',
  birth_date: '15.03.1985',
  salutation: 'Herr',
  address_street: 'Musterstr. 12',
  address_postal_code: '10115',
  address_city: 'Berlin',
  email: 'max@beispiel.de',
  phone: '0170 1234567',
  nationality: 'Deutsch',
  employer_name: 'Musterfirma GmbH',
  employed_since: '01.01.2020',
  contract_type: 'Unbefristet',
  position: 'Sachbearbeiter',
  net_income_monthly: '2.800',
  current_rent_monthly: '850',
  marital_status: 'Ledig',
  children_count: '0',
};

const LABELS: Record<keyof ConsumerLoanFormData, string> = {
  first_name: 'Vorname',
  last_name: 'Nachname',
  birth_date: 'Geburtsdatum',
  salutation: 'Anrede',
  address_street: 'Straße',
  address_postal_code: 'PLZ',
  address_city: 'Stadt',
  email: 'E-Mail',
  phone: 'Telefon',
  nationality: 'Nationalität',
  employer_name: 'Arbeitgeber',
  employed_since: 'Beschäftigt seit',
  contract_type: 'Vertragsart',
  position: 'Position',
  net_income_monthly: 'Netto-Einkommen (€)',
  current_rent_monthly: 'Aktuelle Miete (€)',
  marital_status: 'Familienstand',
  children_count: 'Kinder',
};

type SectionKey = keyof ConsumerLoanFormData;

const SECTIONS: { title: string; fields: SectionKey[] }[] = [
  {
    title: 'Persönliche Daten',
    fields: ['salutation', 'first_name', 'last_name', 'birth_date', 'address_street', 'address_postal_code', 'address_city', 'email', 'phone', 'nationality'],
  },
  {
    title: 'Beschäftigung',
    fields: ['employer_name', 'employed_since', 'contract_type', 'position', 'net_income_monthly'],
  },
  {
    title: 'Haushalt',
    fields: ['current_rent_monthly', 'marital_status', 'children_count'],
  },
];

export function ApplicationPreview({ disabled, formData, onFormDataChange }: ApplicationFormProps) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['applicant-profile-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applicant_profiles')
        .select('*')
        .eq('party_role', 'primary')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleLoadFromProfile = () => {
    if (!profile) {
      toast.error('Keine Selbstauskunft gefunden.');
      return;
    }
    onFormDataChange({
      first_name: profile.first_name ?? '',
      last_name: profile.last_name ?? '',
      birth_date: profile.birth_date ?? '',
      salutation: profile.salutation ?? '',
      address_street: profile.address_street ?? '',
      address_postal_code: profile.address_postal_code ?? '',
      address_city: profile.address_city ?? '',
      email: profile.email ?? '',
      phone: profile.phone ?? '',
      nationality: profile.nationality ?? '',
      employer_name: profile.employer_name ?? '',
      employed_since: profile.employed_since ?? '',
      contract_type: profile.contract_type ?? '',
      position: profile.position ?? '',
      net_income_monthly: profile.net_income_monthly?.toString() ?? '',
      current_rent_monthly: profile.current_rent_monthly?.toString() ?? '',
      marital_status: profile.marital_status ?? '',
      children_count: profile.children_count?.toString() ?? '',
    });
    toast.success('Daten aus Selbstauskunft übernommen');
  };

  const updateField = (key: keyof ConsumerLoanFormData, value: string) => {
    onFormDataChange({ ...formData, [key]: value });
  };

  return (
    <Card className={cn(DESIGN.CARD.BASE, disabled && 'opacity-50 pointer-events-none')}>
      <div className={DESIGN.CARD.SECTION_HEADER}>
        <div className="flex items-center justify-between">
          <h2 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Antragsdaten</h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={handleLoadFromProfile}
            disabled={isLoading}
          >
            <Download className="h-3 w-3" />
            Daten aus Selbstauskunft laden
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className={DESIGN.SPACING.SECTION}>
          {SECTIONS.map(section => (
            <div key={section.title} className="space-y-3">
              <h3 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>{section.title}</h3>
              <div className={cn(DESIGN.FORM_GRID.FULL, 'md:grid-cols-4')}>
                {section.fields.map(field => (
                  <div key={field} className="space-y-1">
                    <Label className={DESIGN.TYPOGRAPHY.LABEL}>{LABELS[field]}</Label>
                    <Input
                      value={formData[field]}
                      placeholder={PLACEHOLDERS[field]}
                      onChange={e => updateField(field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
