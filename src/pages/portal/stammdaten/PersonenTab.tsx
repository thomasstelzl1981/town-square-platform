import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FormSection, FormInput, FormRow, DataTable, StatusBadge, EmptyState } from '@/components/shared';
import { Loader2, Save, Users, UserPlus, Building, User, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type PersonMode = 'identical' | 'spouse' | 'business';

interface PersonFormData {
  mode: PersonMode;
  // Spouse fields
  spouse_first_name: string;
  spouse_last_name: string;
  spouse_email: string;
  spouse_phone: string;
  spouse_tax_id: string;
  // Business fields
  company_name: string;
  legal_form: string;
  hrb_number: string;
  ust_id: string;
  company_street: string;
  company_postal_code: string;
  company_city: string;
}

export function PersonenTab() {
  const { user, activeTenantId, isDevelopmentMode } = useAuth();
  const queryClient = useQueryClient();
  const [personMode, setPersonMode] = React.useState<PersonMode>('identical');
  const [formData, setFormData] = React.useState<PersonFormData>({
    mode: 'identical',
    spouse_first_name: '',
    spouse_last_name: '',
    spouse_email: '',
    spouse_phone: '',
    spouse_tax_id: '',
    company_name: '',
    legal_form: '',
    hrb_number: '',
    ust_id: '',
    company_street: '',
    company_postal_code: '',
    company_city: '',
  });

  // Fetch profile to check current settings
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id && !isDevelopmentMode) return null;
      
      const userId = user?.id || 'dev-user';
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (!data && isDevelopmentMode) {
        return {
          id: 'dev-user',
          display_name: 'Entwickler',
          person_mode: 'identical',
          is_business: false,
        };
      }
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id || isDevelopmentMode,
  });

  // Fetch organization for business data
  const { data: org } = useQuery({
    queryKey: ['organization', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', activeTenantId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeTenantId,
  });

  React.useEffect(() => {
    if (profile) {
      const mode = (profile as any).person_mode || 'identical';
      setPersonMode(mode);
      setFormData(prev => ({ ...prev, mode }));
    }
  }, [profile]);

  React.useEffect(() => {
    if (org && personMode === 'business') {
      setFormData(prev => ({
        ...prev,
        company_name: org.name || '',
      }));
    }
  }, [org, personMode]);

  const handleModeChange = (mode: PersonMode) => {
    setPersonMode(mode);
    setFormData(prev => ({ ...prev, mode }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Einstellungen gespeichert');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personen-Konfiguration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Personen-Konfiguration
          </CardTitle>
          <CardDescription>
            Wählen Sie, wie Sie als Vertragspartner auftreten möchten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={personMode} onValueChange={(v) => handleModeChange(v as PersonMode)}>
            {/* Option 1: Identical to Profile */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="identical" id="identical" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="identical" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Person 1 ist identisch mit meinem Profil</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Ihre Profildaten werden als Vertragspartner verwendet.
                </p>
              </div>
            </div>

            {/* Option 2: Add Spouse */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="spouse" id="spouse" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="spouse" className="flex items-center gap-2 cursor-pointer">
                  <Heart className="h-4 w-4" />
                  <span className="font-medium">Ehepartner hinzufügen</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Fügen Sie einen Ehepartner als zweite Person hinzu.
                </p>
              </div>
            </div>

            {/* Option 3: Business */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="business" id="business" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="business" className="flex items-center gap-2 cursor-pointer">
                  <Building className="h-4 w-4" />
                  <span className="font-medium">Ich handle gewerblich</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Sie treten als Unternehmen auf.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Spouse Fields - shown when spouse mode is selected */}
      {personMode === 'spouse' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Ehepartner-Daten
            </CardTitle>
            <CardDescription>
              Geben Sie die Daten Ihres Ehepartners ein.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormSection>
              <FormRow>
                <FormInput
                  label="Vorname"
                  name="spouse_first_name"
                  value={formData.spouse_first_name}
                  onChange={e => setFormData(prev => ({ ...prev, spouse_first_name: e.target.value }))}
                  placeholder="Vorname"
                />
                <FormInput
                  label="Nachname"
                  name="spouse_last_name"
                  value={formData.spouse_last_name}
                  onChange={e => setFormData(prev => ({ ...prev, spouse_last_name: e.target.value }))}
                  placeholder="Nachname"
                />
              </FormRow>
              <FormRow>
                <FormInput
                  label="E-Mail"
                  name="spouse_email"
                  type="email"
                  value={formData.spouse_email}
                  onChange={e => setFormData(prev => ({ ...prev, spouse_email: e.target.value }))}
                  placeholder="email@beispiel.de"
                />
                <FormInput
                  label="Telefon"
                  name="spouse_phone"
                  type="tel"
                  value={formData.spouse_phone}
                  onChange={e => setFormData(prev => ({ ...prev, spouse_phone: e.target.value }))}
                  placeholder="+49 170 1234567"
                />
              </FormRow>
              <FormRow>
                <FormInput
                  label="Steuer-ID"
                  name="spouse_tax_id"
                  value={formData.spouse_tax_id}
                  onChange={e => setFormData(prev => ({ ...prev, spouse_tax_id: e.target.value }))}
                  placeholder="Steuer-Identifikationsnummer"
                />
              </FormRow>
            </FormSection>
          </CardContent>
        </Card>
      )}

      {/* Business Fields - shown when business mode is selected */}
      {personMode === 'business' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Firmendaten
            </CardTitle>
            <CardDescription>
              Geben Sie die Daten Ihres Unternehmens ein.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormSection>
              <FormRow>
                <FormInput
                  label="Firmenname"
                  name="company_name"
                  value={formData.company_name}
                  onChange={e => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Muster GmbH"
                  className="flex-[2]"
                />
                <FormInput
                  label="Rechtsform"
                  name="legal_form"
                  value={formData.legal_form}
                  onChange={e => setFormData(prev => ({ ...prev, legal_form: e.target.value }))}
                  placeholder="GmbH"
                  className="flex-1"
                />
              </FormRow>
              <FormRow>
                <FormInput
                  label="HRB-Nummer"
                  name="hrb_number"
                  value={formData.hrb_number}
                  onChange={e => setFormData(prev => ({ ...prev, hrb_number: e.target.value }))}
                  placeholder="HRB 123456"
                  hint="Handelsregisternummer"
                />
                <FormInput
                  label="USt-IdNr."
                  name="ust_id"
                  value={formData.ust_id}
                  onChange={e => setFormData(prev => ({ ...prev, ust_id: e.target.value }))}
                  placeholder="DE123456789"
                  hint="Umsatzsteuer-Identifikationsnummer"
                />
              </FormRow>
              <FormRow>
                <FormInput
                  label="Straße"
                  name="company_street"
                  value={formData.company_street}
                  onChange={e => setFormData(prev => ({ ...prev, company_street: e.target.value }))}
                  placeholder="Firmenstraße 1"
                  className="flex-[2]"
                />
                <FormInput
                  label="PLZ"
                  name="company_postal_code"
                  value={formData.company_postal_code}
                  onChange={e => setFormData(prev => ({ ...prev, company_postal_code: e.target.value }))}
                  placeholder="80331"
                  className="flex-1"
                />
                <FormInput
                  label="Stadt"
                  name="company_city"
                  value={formData.company_city}
                  onChange={e => setFormData(prev => ({ ...prev, company_city: e.target.value }))}
                  placeholder="München"
                  className="flex-1"
                />
              </FormRow>
            </FormSection>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit">
          <Save className="mr-2 h-4 w-4" />
          Speichern
        </Button>
      </div>
    </form>
  );
}
