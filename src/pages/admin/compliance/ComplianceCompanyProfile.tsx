/**
 * Tab 2: Company Profile — Firmendaten SSOT + Impressum-Preview
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Save, Eye, ChevronDown } from 'lucide-react';
import { useComplianceCompany, type CompanyProfile } from './useComplianceCompany';
import { LoadingState } from '@/components/shared';

export function ComplianceCompanyProfile() {
  const { profile, isLoading, upsert } = useComplianceCompany();
  const [form, setForm] = useState<Partial<CompanyProfile>>({});
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const set = (key: keyof CompanyProfile, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  if (isLoading) return <LoadingState />;

  const imprintMd = `**${form.company_name || '—'}**\n${form.legal_form || ''}\n${form.address_line1 || ''}\n${form.address_line2 || ''}\n${form.postal_code || ''} ${form.city || ''}, ${form.country || 'DE'}\n\nE-Mail: ${form.email || '—'}\nTelefon: ${form.phone || '—'}\n\nGeschäftsführer: ${Array.isArray(form.managing_directors) ? (form.managing_directors as string[]).join(', ') : form.managing_directors || '—'}\nHandelsregister: ${form.commercial_register ? `${(form.commercial_register as any).court || ''} ${(form.commercial_register as any).number || ''}` : '—'}\nUSt-IdNr.: ${form.vat_id || '—'}`;

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Firmendaten (SSOT)</CardTitle>
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

          <div className="flex gap-2">
            <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending}>
              <Save className="h-4 w-4 mr-1" /> Speichern
            </Button>
          </div>
        </CardContent>
      </Card>

      <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" /> Impressum-Vorschau
                <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${previewOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-lg font-mono">{imprintMd}</pre>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
