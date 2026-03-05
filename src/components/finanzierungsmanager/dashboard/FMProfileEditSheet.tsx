/**
 * FMProfileEditSheet — Profile editing sheet for FM Dashboard
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { toast } from 'sonner';

interface EditableProfile {
  first_name: string; last_name: string; email: string; phone_mobile: string; phone_landline: string;
  street: string; house_number: string; postal_code: string; city: string;
  letterhead_company_line: string; letterhead_website: string;
  reg_34i_number: string; reg_34i_ihk: string; reg_34i_authority: string;
  reg_vermittler_id: string; insurance_provider: string; insurance_policy_no: string;
}

function EditRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className={cn('flex flex-col gap-0.5 md:grid md:grid-cols-[180px_1fr] md:items-center', DESIGN.TABULAR_FORM.ROW_BORDER, 'py-1.5 px-1')}>
      <Label className={DESIGN.TYPOGRAPHY.LABEL}>{label}</Label>
      <Input className={DESIGN.TABULAR_FORM.INPUT} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export function FMProfileEditSheet({ open, onOpenChange }: Props) {
  const { user, profile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<EditableProfile>({
    first_name: '', last_name: '', email: '', phone_mobile: '', phone_landline: '',
    street: '', house_number: '', postal_code: '', city: '',
    letterhead_company_line: '', letterhead_website: '',
    reg_34i_number: '', reg_34i_ihk: '', reg_34i_authority: '',
    reg_vermittler_id: '', insurance_provider: '', insurance_policy_no: '',
  });

  // Sync on open
  if (open && editData.first_name === '' && profile) {
    setEditData({
      first_name: profile.first_name || '', last_name: profile.last_name || '', email: profile.email || '',
      phone_mobile: profile.phone_mobile || '', phone_landline: profile.phone_landline || '',
      street: profile.street || '', house_number: profile.house_number || '',
      postal_code: profile.postal_code || '', city: profile.city || '',
      letterhead_company_line: profile.letterhead_company_line || '', letterhead_website: profile.letterhead_website || '',
      reg_34i_number: (profile as any).reg_34i_number || '', reg_34i_ihk: (profile as any).reg_34i_ihk || '',
      reg_34i_authority: (profile as any).reg_34i_authority || '', reg_vermittler_id: (profile as any).reg_vermittler_id || '',
      insurance_provider: (profile as any).insurance_provider || '', insurance_policy_no: (profile as any).insurance_policy_no || '',
    });
  }

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        first_name: editData.first_name || null, last_name: editData.last_name || null, email: editData.email || null,
        phone_mobile: editData.phone_mobile || null, phone_landline: editData.phone_landline || null,
        street: editData.street || null, house_number: editData.house_number || null,
        postal_code: editData.postal_code || null, city: editData.city || null,
        letterhead_company_line: editData.letterhead_company_line || null, letterhead_website: editData.letterhead_website || null,
        reg_34i_number: editData.reg_34i_number || null, reg_34i_ihk: editData.reg_34i_ihk || null,
        reg_34i_authority: editData.reg_34i_authority || null, reg_vermittler_id: editData.reg_vermittler_id || null,
        insurance_provider: editData.insurance_provider || null, insurance_policy_no: editData.insurance_policy_no || null,
      } as any).eq('id', user.id);
      if (error) throw error;
      toast.success('Profil gespeichert');
      onOpenChange(false);
      window.location.reload();
    } catch { toast.error('Fehler beim Speichern'); }
    finally { setIsSaving(false); }
  };

  const h = (field: keyof EditableProfile) => (v: string) => setEditData(p => ({ ...p, [field]: v }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader><SheetTitle>Profil bearbeiten</SheetTitle><SheetDescription>Kontaktdaten und §34i-Pflichtangaben</SheetDescription></SheetHeader>
        <div className="py-4 space-y-4">
          <div><h4 className={cn(DESIGN.TYPOGRAPHY.SECTION_TITLE, 'text-muted-foreground mb-2')}>Kontaktdaten</h4>
            <div className="border rounded-lg">
              <EditRow label="Vorname" value={editData.first_name} onChange={h('first_name')} />
              <EditRow label="Nachname" value={editData.last_name} onChange={h('last_name')} />
              <EditRow label="E-Mail" value={editData.email} onChange={h('email')} />
              <EditRow label="Mobil" value={editData.phone_mobile} onChange={h('phone_mobile')} placeholder="+49 ..." />
              <EditRow label="Festnetz" value={editData.phone_landline} onChange={h('phone_landline')} placeholder="+49 ..." />
              <EditRow label="Straße" value={editData.street} onChange={h('street')} />
              <EditRow label="Hausnummer" value={editData.house_number} onChange={h('house_number')} />
              <EditRow label="PLZ" value={editData.postal_code} onChange={h('postal_code')} />
              <EditRow label="Ort" value={editData.city} onChange={h('city')} />
              <EditRow label="Firma" value={editData.letterhead_company_line} onChange={h('letterhead_company_line')} />
              <EditRow label="Website" value={editData.letterhead_website} onChange={h('letterhead_website')} placeholder="https://..." />
            </div></div>
          <div><h4 className={cn(DESIGN.TYPOGRAPHY.SECTION_TITLE, 'text-muted-foreground mb-2')}>§34i Gewerbeerlaubnis</h4>
            <div className="border rounded-lg">
              <EditRow label="Registrierungsnr." value={editData.reg_34i_number} onChange={h('reg_34i_number')} placeholder="D-F-XXX-XXXX-XX" />
              <EditRow label="Zuständige IHK" value={editData.reg_34i_ihk} onChange={h('reg_34i_ihk')} placeholder="z.B. IHK München" />
              <EditRow label="Erlaubnisbehörde" value={editData.reg_34i_authority} onChange={h('reg_34i_authority')} />
              <EditRow label="Vermittlerregister-Nr." value={editData.reg_vermittler_id} onChange={h('reg_vermittler_id')} />
            </div></div>
          <div><h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Berufshaftpflicht</h4>
            <div className="border rounded-lg">
              <EditRow label="Versicherer" value={editData.insurance_provider} onChange={h('insurance_provider')} />
              <EditRow label="Policen-Nr." value={editData.insurance_policy_no} onChange={h('insurance_policy_no')} />
            </div></div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Speichern</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
