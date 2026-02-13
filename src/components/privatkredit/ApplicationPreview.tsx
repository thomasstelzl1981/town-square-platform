/**
 * ApplicationPreview — Read-only display of Selbstauskunft data
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ApplicationPreviewProps {
  disabled?: boolean;
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? '—'}</p>
    </div>
  );
}

export function ApplicationPreview({ disabled }: ApplicationPreviewProps) {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
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

  return (
    <section className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Ihr Antrag (automatisch ausgefüllt)</h2>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-xs"
          onClick={() => navigate('/portal/finanzierung/selbstauskunft')}
        >
          Selbstauskunft bearbeiten
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {!profile ? (
        <p className="text-sm text-muted-foreground">
          Keine Selbstauskunft gefunden. Bitte füllen Sie zunächst Ihre Selbstauskunft aus.
        </p>
      ) : (
        <div className="space-y-6">
          {/* A) Persönliche Daten */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Persönliche Daten
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border p-3">
              <Field label="Vorname" value={profile.first_name} />
              <Field label="Nachname" value={profile.last_name} />
              <Field label="Geburtsdatum" value={profile.birth_date} />
              <Field label="Anrede" value={profile.salutation} />
              <Field label="Straße" value={profile.address_street} />
              <Field label="PLZ" value={profile.address_postal_code} />
              <Field label="Stadt" value={profile.address_city} />
              <Field label="E-Mail" value={profile.email} />
              <Field label="Telefon" value={profile.phone} />
              <Field label="Nationalität" value={profile.nationality} />
            </div>
          </div>

          {/* B) Beschäftigung */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Beschäftigung
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border p-3">
              <Field label="Arbeitgeber" value={profile.employer_name} />
              <Field label="Beschäftigt seit" value={profile.employed_since} />
              <Field label="Vertragsart" value={profile.contract_type} />
              <Field label="Probezeit bis" value={profile.probation_until} />
              <Field label="Position" value={profile.position} />
              <Field label="Netto-Einkommen" value={profile.net_income_monthly ? `${profile.net_income_monthly} €` : null} />
            </div>
          </div>

          {/* C) Haushalt */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Haushalt
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border p-3">
              <Field label="Aktuelle Miete" value={profile.current_rent_monthly ? `${profile.current_rent_monthly} €` : null} />
              <Field label="Wohnstatus" value={profile.rental_status} />
              <Field label="Familienstand" value={profile.marital_status} />
              <Field label="Kinder" value={profile.children_count} />
              <Field label="Sonstige Kosten" value={profile.other_fixed_costs_monthly ? `${profile.other_fixed_costs_monthly} €` : null} />
              <Field label="Lebenshaltung" value={profile.living_expenses_monthly ? `${profile.living_expenses_monthly} €` : null} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
