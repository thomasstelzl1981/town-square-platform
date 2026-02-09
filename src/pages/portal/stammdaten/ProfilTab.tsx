import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FormSection, FormInput, FormRow } from '@/components/shared';
import { FileUploader } from '@/components/shared/FileUploader';
import { Loader2, Save, User, Phone, MapPin, FileText, PenLine, Sparkles, Building2, MessageSquare, Bot, Info, Mail, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileFormData {
  display_name: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  // Address
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  country: string;
  // Contact
  phone_landline: string;
  phone_mobile: string;
  phone_whatsapp: string;
  // Tax
  tax_number: string;
  tax_id: string;
  // Email Signature
  email_signature: string;
  // Letterhead
  letterhead_logo_url: string;
  letterhead_company_line: string;
  letterhead_extra_line: string;
  letterhead_bank_name: string;
  letterhead_iban: string;
  letterhead_bic: string;
  letterhead_website: string;
}

export function ProfilTab() {
  const { user, isDevelopmentMode, refreshAuth } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = React.useState<ProfileFormData>({
    display_name: '',
    first_name: '',
    last_name: '',
    email: '',
    avatar_url: null,
    street: '',
    house_number: '',
    postal_code: '',
    city: '',
    country: 'DE',
    phone_landline: '',
    phone_mobile: '',
    phone_whatsapp: '',
    tax_number: '',
    tax_id: '',
    email_signature: '',
    letterhead_logo_url: '',
    letterhead_company_line: '',
    letterhead_extra_line: '',
    letterhead_bank_name: '',
    letterhead_iban: '',
    letterhead_bic: '',
    letterhead_website: '',
  });

  // Fetch profile
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
      
      // In development mode, return mock data if no profile exists
      if (!data && isDevelopmentMode) {
        return {
          id: 'dev-user',
          display_name: 'Entwickler',
          first_name: 'Max',
          last_name: 'Mustermann',
          email: 'dev@systemofatown.de',
          avatar_url: null,
          street: 'Musterstraße',
          house_number: '1',
          postal_code: '80331',
          city: 'München',
          country: 'DE',
          phone_landline: '+49 89 12345678',
          phone_mobile: '+49 170 1234567',
          phone_whatsapp: '+49 170 1234567',
          tax_number: '123/456/78901',
          tax_id: 'DE123456789',
          email_signature: '',
          letterhead_logo_url: '',
          letterhead_company_line: '',
          letterhead_extra_line: '',
          letterhead_bank_name: '',
          letterhead_iban: '',
          letterhead_bic: '',
          letterhead_website: '',
        };
      }
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id || isDevelopmentMode,
  });

  // Update form when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        first_name: (profile as any).first_name || '',
        last_name: (profile as any).last_name || '',
        email: profile.email || '',
        avatar_url: profile.avatar_url,
        street: (profile as any).street || '',
        house_number: (profile as any).house_number || '',
        postal_code: (profile as any).postal_code || '',
        city: (profile as any).city || '',
        country: (profile as any).country || 'DE',
        phone_landline: (profile as any).phone_landline || '',
        phone_mobile: (profile as any).phone_mobile || '',
        phone_whatsapp: (profile as any).phone_whatsapp || '',
        tax_number: (profile as any).tax_number || '',
        tax_id: (profile as any).tax_id || '',
        email_signature: (profile as any).email_signature || '',
        letterhead_logo_url: (profile as any).letterhead_logo_url || '',
        letterhead_company_line: (profile as any).letterhead_company_line || '',
        letterhead_extra_line: (profile as any).letterhead_extra_line || '',
        letterhead_bank_name: (profile as any).letterhead_bank_name || '',
        letterhead_iban: (profile as any).letterhead_iban || '',
        letterhead_bic: (profile as any).letterhead_bic || '',
        letterhead_website: (profile as any).letterhead_website || '',
      });
    }
  }, [profile]);

  // Update mutation
  const updateProfile = useMutation({
    mutationFn: async (data: Partial<ProfileFormData>) => {
      if (!user?.id && !isDevelopmentMode) throw new Error('Not authenticated');
      
      if (isDevelopmentMode && !user?.id) {
        // In development mode, just simulate success
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: data.display_name,
          avatar_url: data.avatar_url,
          email_signature: data.email_signature,
          letterhead_logo_url: data.letterhead_logo_url,
          letterhead_company_line: data.letterhead_company_line,
          letterhead_extra_line: data.letterhead_extra_line,
          letterhead_bank_name: data.letterhead_bank_name,
          letterhead_iban: data.letterhead_iban,
          letterhead_bic: data.letterhead_bic,
          letterhead_website: data.letterhead_website,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      await refreshAuth(); // AuthContext synchronisieren für sofortige Dashboard-Aktualisierung
      toast.success('Profil gespeichert');
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern: ' + (error as Error).message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleAvatarUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    if (isDevelopmentMode && !user?.id) {
      toast.info('Avatar-Upload im Entwicklungsmodus nicht verfügbar');
      return;
    }
    
    if (!user?.id) return;
    
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('tenant-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('tenant-documents')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
      toast.success('Avatar hochgeladen');
    } catch (error) {
      toast.error('Avatar-Upload fehlgeschlagen');
    }
  };

  const handleLogoUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    if (isDevelopmentMode && !user?.id) {
      toast.info('Logo-Upload im Entwicklungsmodus nicht verfügbar');
      return;
    }
    
    if (!user?.id) return;
    
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/letterhead-logo.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('tenant-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('tenant-documents')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, letterhead_logo_url: urlData.publicUrl }));
      toast.success('Logo hochgeladen');
    } catch (error) {
      toast.error('Logo-Upload fehlgeschlagen');
    }
  };

  const generateSignatureSuggestion = () => {
    const parts: string[] = ['Mit freundlichen Grüßen', ''];
    
    const fullName = [formData.first_name, formData.last_name].filter(Boolean).join(' ');
    if (fullName) {
      parts.push(fullName);
    } else if (formData.display_name) {
      parts.push(formData.display_name);
    }
    
    const phones: string[] = [];
    if (formData.phone_mobile) phones.push(`Mobil: ${formData.phone_mobile}`);
    if (formData.phone_landline) phones.push(`Tel: ${formData.phone_landline}`);
    if (phones.length > 0) parts.push(phones.join(' | '));
    
    if (formData.email) {
      parts.push(`E-Mail: ${formData.email}`);
    }
    
    setFormData(prev => ({ ...prev, email_signature: parts.join('\n') }));
    toast.success('Signatur-Vorschlag erstellt');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = formData.display_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Persönliche Daten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Persönliche Daten
          </CardTitle>
          <CardDescription>
            Ihre persönlichen Informationen und Ihr Profilbild.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatar_url || undefined} alt={formData.display_name} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <FileUploader
                onFilesSelected={handleAvatarUpload}
                accept="image/*"
                label="Profilbild hochladen"
                hint="JPG, PNG oder GIF (max. 2MB)"
                maxSize={2 * 1024 * 1024}
              />
            </div>
          </div>

          {/* Form Fields */}
          <FormSection>
            <FormRow>
              <FormInput
                label="Vorname"
                name="first_name"
                value={formData.first_name}
                onChange={e => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Max"
              />
              <FormInput
                label="Nachname"
                name="last_name"
                value={formData.last_name}
                onChange={e => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Mustermann"
              />
            </FormRow>
            <FormRow>
              <FormInput
                label="Anzeigename"
                name="display_name"
                value={formData.display_name}
                onChange={e => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Max Mustermann"
                required
              />
              <FormInput
                label="E-Mail-Adresse"
                name="email"
                type="email"
                value={formData.email}
                disabled
                hint="E-Mail kann nicht geändert werden (Login-Identität)"
              />
            </FormRow>
          </FormSection>
        </CardContent>
      </Card>

      {/* Adresse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Adresse
          </CardTitle>
          <CardDescription>
            Ihre Postanschrift für Korrespondenz und Dokumente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormSection>
            <FormRow>
              <FormInput
                label="Straße"
                name="street"
                value={formData.street}
                onChange={e => setFormData(prev => ({ ...prev, street: e.target.value }))}
                placeholder="Musterstraße"
                className="flex-[3]"
              />
              <FormInput
                label="Hausnummer"
                name="house_number"
                value={formData.house_number}
                onChange={e => setFormData(prev => ({ ...prev, house_number: e.target.value }))}
                placeholder="1"
                className="flex-1"
              />
            </FormRow>
            <FormRow>
              <FormInput
                label="Postleitzahl"
                name="postal_code"
                value={formData.postal_code}
                onChange={e => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                placeholder="80331"
                className="flex-1"
              />
              <FormInput
                label="Stadt"
                name="city"
                value={formData.city}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="München"
                className="flex-[2]"
              />
              <FormInput
                label="Land"
                name="country"
                value={formData.country}
                onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="DE"
                className="flex-1"
              />
            </FormRow>
          </FormSection>
        </CardContent>
      </Card>

      {/* Kontaktdaten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Kontaktdaten
          </CardTitle>
          <CardDescription>
            Ihre Telefonnummern für die Erreichbarkeit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormSection>
            <FormRow>
              <FormInput
                label="Telefon (Festnetz)"
                name="phone_landline"
                type="tel"
                value={formData.phone_landline}
                onChange={e => setFormData(prev => ({ ...prev, phone_landline: e.target.value }))}
                placeholder="+49 89 12345678"
              />
              <FormInput
                label="Telefon (Mobil)"
                name="phone_mobile"
                type="tel"
                value={formData.phone_mobile}
                onChange={e => setFormData(prev => ({ ...prev, phone_mobile: e.target.value }))}
                placeholder="+49 170 1234567"
              />
              <FormInput
                label="WhatsApp"
                name="phone_whatsapp"
                type="tel"
                value={formData.phone_whatsapp}
                onChange={e => setFormData(prev => ({ ...prev, phone_whatsapp: e.target.value }))}
                placeholder="+49 170 1234567"
              />
            </FormRow>
          </FormSection>
        </CardContent>
      </Card>

      {/* Steuerliche Daten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Steuerliche Daten
          </CardTitle>
          <CardDescription>
            Ihre Steuernummern für Abrechnungen und Dokumente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormSection>
            <FormRow>
              <FormInput
                label="Steuernummer"
                name="tax_number"
                value={formData.tax_number}
                onChange={e => setFormData(prev => ({ ...prev, tax_number: e.target.value }))}
                placeholder="123/456/78901"
                hint="Ihre Steuernummer vom Finanzamt"
              />
              <FormInput
                label="Steuer-ID"
                name="tax_id"
                value={formData.tax_id}
                onChange={e => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
                placeholder="DE123456789"
                hint="Ihre persönliche Steuer-Identifikationsnummer"
              />
            </FormRow>
          </FormSection>
        </CardContent>
      </Card>

      {/* E-Mail-Signatur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            E-Mail-Signatur
          </CardTitle>
          <CardDescription>
            Ihre persönliche Signatur, die automatisch an E-Mails angehängt wird.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={formData.email_signature}
            onChange={e => setFormData(prev => ({ ...prev, email_signature: e.target.value }))}
            placeholder="Mit freundlichen Grüßen&#10;&#10;Max Mustermann&#10;Tel: +49 170 1234567&#10;E-Mail: max@example.de"
            rows={6}
            className="font-mono text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateSignatureSuggestion}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Vorschlag generieren
          </Button>
        </CardContent>
      </Card>

      {/* Briefkopf-Daten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Briefkopf-Daten
          </CardTitle>
          <CardDescription>
            Daten für den KI-Briefgenerator (Logo, Firma, Bankverbindung).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="flex items-start gap-6">
            {formData.letterhead_logo_url && (
              <img 
                src={formData.letterhead_logo_url} 
                alt="Logo" 
                className="h-16 w-auto object-contain border rounded-md p-1"
              />
            )}
            <div className="flex-1">
              <FileUploader
                onFilesSelected={handleLogoUpload}
                accept="image/*"
                label="Logo hochladen"
                hint="PNG mit transparentem Hintergrund empfohlen"
                maxSize={2 * 1024 * 1024}
              />
            </div>
          </div>

          <FormSection>
            <FormRow>
              <FormInput
                label="Firmenzusatz"
                name="letterhead_company_line"
                value={formData.letterhead_company_line}
                onChange={e => setFormData(prev => ({ ...prev, letterhead_company_line: e.target.value }))}
                placeholder="Mustermann GmbH"
                hint="Optional: Firmenname (falls gewerblich)"
              />
              <FormInput
                label="Zusatzzeile"
                name="letterhead_extra_line"
                value={formData.letterhead_extra_line}
                onChange={e => setFormData(prev => ({ ...prev, letterhead_extra_line: e.target.value }))}
                placeholder="HRB 12345 · Amtsgericht München"
                hint="Optional: Rechtsform, Registernummer"
              />
            </FormRow>
            <FormRow>
              <FormInput
                label="Webseite"
                name="letterhead_website"
                type="url"
                value={formData.letterhead_website}
                onChange={e => setFormData(prev => ({ ...prev, letterhead_website: e.target.value }))}
                placeholder="https://www.example.de"
              />
            </FormRow>
          </FormSection>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-muted-foreground mb-3">Bankverbindung</p>
            <FormSection>
              <FormRow>
                <FormInput
                  label="Bankname"
                  name="letterhead_bank_name"
                  value={formData.letterhead_bank_name}
                  onChange={e => setFormData(prev => ({ ...prev, letterhead_bank_name: e.target.value }))}
                  placeholder="Deutsche Bank"
                />
                <FormInput
                  label="IBAN"
                  name="letterhead_iban"
                  value={formData.letterhead_iban}
                  onChange={e => setFormData(prev => ({ ...prev, letterhead_iban: e.target.value }))}
                  placeholder="DE89 3704 0044 0532 0130 00"
                />
                <FormInput
                  label="BIC"
                  name="letterhead_bic"
                  value={formData.letterhead_bic}
                  onChange={e => setFormData(prev => ({ ...prev, letterhead_bic: e.target.value }))}
                  placeholder="COBADEFFXXX"
                />
              </FormRow>
            </FormSection>
          </div>
        </CardContent>
      </Card>

      {/* Upload-E-Mail (Posteingang) */}
      <UploadEmailSection />

      {/* WhatsApp Business Settings */}
      <WhatsAppSettingsSection userId={user?.id} isDevelopmentMode={isDevelopmentMode} />

      <div className="flex justify-end">
        <Button type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Speichern
        </Button>
      </div>
    </form>
  );
}

// =============================================================================
// Upload Email Section
// =============================================================================

function UploadEmailSection() {
  const { user } = useAuth();

  const { data: mailboxAddress } = useQuery({
    queryKey: ['inbound-mailbox-profil'],
    queryFn: async () => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return null;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-inbound-receive?action=mailbox`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!res.ok) return null;
      const result = await res.json();
      return result.address as string;
    },
    enabled: !!user,
  });

  const copyAddress = () => {
    if (mailboxAddress) {
      navigator.clipboard.writeText(mailboxAddress);
      toast.success('E-Mail-Adresse kopiert');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Deine Upload-E-Mail
        </CardTitle>
        <CardDescription>
          Sende PDFs an diese Adresse. Anhänge landen automatisch im DMS-Posteingang und im Storage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <code className="flex-1 px-3 py-2 bg-muted rounded-lg font-mono text-sm">
            {mailboxAddress || 'Wird geladen...'}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyAddress}
            disabled={!mailboxAddress}
          >
            <Copy className="h-4 w-4 mr-1" />
            Kopieren
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// WhatsApp Settings Section (separate component for clean separation)
// =============================================================================

function WhatsAppSettingsSection({ userId, isDevelopmentMode }: { userId?: string; isDevelopmentMode: boolean }) {
  const queryClient = useQueryClient();

  // Fetch WhatsApp user settings
  const { data: waSettings, isLoading: waLoading } = useQuery({
    queryKey: ['whatsapp-user-settings', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('whatsapp_user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch WhatsApp account (tenant level)
  const { data: waAccount } = useQuery({
    queryKey: ['whatsapp-account'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_accounts')
        .select('system_phone_e164, status')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const [ownerControlE164, setOwnerControlE164] = React.useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = React.useState(false);
  const [autoReplyText, setAutoReplyText] = React.useState(
    'Vielen Dank für Ihre Nachricht. Wir melden uns in Kürze.'
  );

  React.useEffect(() => {
    if (waSettings) {
      setOwnerControlE164(waSettings.owner_control_e164 || '');
      setAutoReplyEnabled(waSettings.auto_reply_enabled || false);
      setAutoReplyText(waSettings.auto_reply_text || 'Vielen Dank für Ihre Nachricht. Wir melden uns in Kürze.');
    }
  }, [waSettings]);

  const saveWaSettings = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');

      // Get tenant_id via RPC
      const { data: tenantId } = await supabase.rpc('get_user_tenant_id');
      if (!tenantId) throw new Error('No organization found');

      const payload = {
        tenant_id: tenantId,
        user_id: userId,
        owner_control_e164: ownerControlE164 || null,
        auto_reply_enabled: autoReplyEnabled,
        auto_reply_text: autoReplyText,
      };

      const { error } = await supabase
        .from('whatsapp_user_settings')
        .upsert(payload, { onConflict: 'tenant_id,user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-user-settings'] });
      toast.success('WhatsApp-Einstellungen gespeichert');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  const statusColor = waAccount?.status === 'connected' ? 'text-green-600' : 
    waAccount?.status === 'error' ? 'text-destructive' : 'text-yellow-600';
  const statusLabel = waAccount?.status === 'connected' ? 'Verbunden' :
    waAccount?.status === 'error' ? 'Fehler' : 'Ausstehend';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          WhatsApp Business
          {waAccount && (
            <Badge variant="outline" className={statusColor}>
              ● {statusLabel}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Verbindungseinstellungen für WhatsApp Business und Armstrong-Steuerung.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Number (read-only) */}
        {waAccount && (
          <FormSection>
            <FormInput
              label="Systemnummer (WhatsApp Business)"
              name="system_phone"
              value={waAccount.system_phone_e164}
              disabled
              hint="Die WhatsApp Business Nummer Ihres Systems"
            />
          </FormSection>
        )}

        {!waAccount && (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>WhatsApp Business ist noch nicht konfiguriert.</p>
            <p className="text-xs mt-1">Kontaktieren Sie den Administrator für die Einrichtung.</p>
          </div>
        )}

        {/* Owner-Control Number */}
        <div className="space-y-2">
          <FormSection>
            <FormInput
              label="Owner-Control Nummer"
              name="owner_control_e164"
              type="tel"
              value={ownerControlE164}
              onChange={(e) => setOwnerControlE164(e.target.value)}
              placeholder="+49 170 1234567"
              hint="Ihre persönliche Nummer für Armstrong-Befehle via WhatsApp"
            />
          </FormSection>
          <div className="flex items-start gap-2 p-3 rounded-md bg-primary/5 border border-primary/10">
            <Bot className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Armstrong reagiert <strong>nur</strong> auf Nachrichten von dieser Nummer.
              Alle anderen WhatsApp-Chats sind normaler Messenger-Verkehr ohne KI-Verarbeitung.
            </p>
          </div>
        </div>

        {/* Auto-Reply */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Auto-Reply</Label>
              <p className="text-xs text-muted-foreground">
                Automatische Antwort auf eingehende Nachrichten (nicht für Owner-Control).
              </p>
            </div>
            <Switch
              checked={autoReplyEnabled}
              onCheckedChange={setAutoReplyEnabled}
            />
          </div>
          {autoReplyEnabled && (
            <Textarea
              value={autoReplyText}
              onChange={(e) => setAutoReplyText(e.target.value)}
              placeholder="Vielen Dank für Ihre Nachricht..."
              rows={3}
              className="text-sm"
            />
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => saveWaSettings.mutate()}
            disabled={saveWaSettings.isPending}
          >
            {saveWaSettings.isPending ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <Save className="mr-2 h-3 w-3" />
            )}
            WhatsApp-Einstellungen speichern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
