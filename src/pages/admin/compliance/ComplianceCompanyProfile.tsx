/**
 * Tab 2: Company Profile — Two company slots with Impressum preview each
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Building2 } from 'lucide-react';
import { useComplianceCompany, type CompanyProfile } from './useComplianceCompany';
import { LoadingState } from '@/components/shared';

const COMPANY_SLOTS = [
  { slug: 'sot', label: 'Firma 1: System of a Town' },
  { slug: 'futureroom', label: 'Firma 2: Future Room', subtitle: 'betreibt Kaufy + Acquiary' },
] as const;


interface CompanyCardProps {
  slug: string;
  label: string;
  subtitle?: string;
  initial: Partial<CompanyProfile>;
  onSave: (data: Partial<CompanyProfile> & { slug: string }) => void;
  isSaving: boolean;
}

function CompanyCard({ slug, label, subtitle, initial, onSave, isSaving }: CompanyCardProps) {
  const [form, setForm] = useState<Partial<CompanyProfile>>({});
  

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const set = useCallback((key: keyof CompanyProfile, val: string) =>
    setForm(prev => ({ ...prev, [key]: val })), []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <span>{label}</span>
              {subtitle && <span className="block text-xs text-muted-foreground font-normal">{subtitle}</span>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Firmenname *</Label><Input value={form.company_name || ''} onChange={e => set('company_name', e.target.value)} /></div>
            <div><Label>Rechtsform</Label><Input value={form.legal_form || ''} onChange={e => set('legal_form', e.target.value)} placeholder="GmbH" /></div>
            <div><Label>Adresse Zeile 1</Label><Input value={form.address_line1 || ''} onChange={e => set('address_line1', e.target.value)} /></div>
            <div><Label>Adresse Zeile 2</Label><Input value={form.address_line2 || ''} onChange={e => set('address_line2', e.target.value)} /></div>
            <div><Label>PLZ</Label><Input value={form.postal_code || ''} onChange={e => set('postal_code', e.target.value)} /></div>
            <div><Label>Stadt</Label><Input value={form.city || ''} onChange={e => set('city', e.target.value)} /></div>
            <div><Label>E-Mail</Label><Input value={form.email || ''} onChange={e => set('email', e.target.value)} type="email" /></div>
            <div><Label>Telefon</Label><Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
            <div><Label>USt-IdNr.</Label><Input value={form.vat_id || ''} onChange={e => set('vat_id', e.target.value)} /></div>
            <div><Label>Website</Label><Input value={form.website_url || ''} onChange={e => set('website_url', e.target.value)} /></div>
          </div>

          <div>
            <Label>Sonstige rechtliche Anmerkungen</Label>
            <Textarea
              value={form.legal_notes || ''}
              onChange={e => set('legal_notes', e.target.value)}
              placeholder="Freies Textfeld für sonstige rechtliche Hinweise, Lizenzen, Markenrechte etc."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => onSave({ ...form, slug })} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" /> Speichern
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export function ComplianceCompanyProfile() {
  const { profiles, isLoading, upsert, getProfileBySlug } = useComplianceCompany();

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8 mt-4">
      {COMPANY_SLOTS.map(slot => (
        <CompanyCard
          key={slot.slug}
          slug={slot.slug}
          label={slot.label}
          subtitle={'subtitle' in slot ? slot.subtitle : undefined}
          initial={getProfileBySlug(slot.slug) || {}}
          onSave={data => upsert.mutate(data)}
          isSaving={upsert.isPending}
        />
      ))}
    </div>
  );
}
