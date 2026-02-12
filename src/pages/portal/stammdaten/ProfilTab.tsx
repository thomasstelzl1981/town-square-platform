import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FormSection, FormInput, FormRow } from '@/components/shared';
import { FileUploader } from '@/components/shared/FileUploader';
import { Loader2, Save, User, Phone, MapPin, FileText, PenLine, Sparkles, Building2, MessageSquare, Bot, Mail, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { OutboundIdentityWidget } from '@/components/portal/OutboundIdentityWidget';
import { cn } from '@/lib/utils';
import defaultLetterheadLogo from '@/assets/logos/armstrong_logo_light.jpg';

interface ProfileFormData {
  display_name: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  country: string;
  phone_landline: string;
  phone_mobile: string;
  phone_whatsapp: string;
  tax_number: string;
  tax_id: string;
  email_signature: string;
  letterhead_logo_url: string;
  letterhead_company_line: string;
  letterhead_extra_line: string;
  letterhead_bank_name: string;
  letterhead_iban: string;
  letterhead_bic: string;
  letterhead_website: string;
}

/** Reusable widget wrapper matching glass-card design system */
function ProfileWidget({ icon: Icon, title, description, children, className }: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("glass-card overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function ProfilTab() {
  const { user, isDevelopmentMode, refreshAuth } = useAuth();
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = React.useState(false);
  const [formData, setFormData] = React.useState<ProfileFormData>({
    display_name: '', first_name: '', last_name: '', email: '', avatar_url: null,
    street: '', house_number: '', postal_code: '', city: '', country: 'DE',
    phone_landline: '', phone_mobile: '', phone_whatsapp: '',
    tax_number: '', tax_id: '',
    email_signature: '',
    letterhead_logo_url: '', letterhead_company_line: '', letterhead_extra_line: '',
    letterhead_bank_name: '', letterhead_iban: '', letterhead_bic: '', letterhead_website: '',
  });

  // Track original data for dirty detection
  const originalDataRef = React.useRef<ProfileFormData | null>(null);

  const updateField = (field: keyof ProfileFormData, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

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
          id: 'dev-user', display_name: 'Entwickler', first_name: 'Max', last_name: 'Mustermann',
          email: 'dev@systemofatown.de', avatar_url: null,
          street: 'Musterstraße', house_number: '1', postal_code: '80331', city: 'München', country: 'DE',
          phone_landline: '+49 89 12345678', phone_mobile: '+49 170 1234567', phone_whatsapp: '+49 170 1234567',
          tax_number: '123/456/78901', tax_id: 'DE123456789',
          email_signature: '', letterhead_logo_url: '', letterhead_company_line: '', letterhead_extra_line: '',
          letterhead_bank_name: '', letterhead_iban: '', letterhead_bic: '', letterhead_website: '',
        };
      }
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id || isDevelopmentMode,
  });

  React.useEffect(() => {
    if (profile) {
      const mapped: ProfileFormData = {
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
      };
      setFormData(mapped);
      originalDataRef.current = mapped;
      setHasChanges(false);
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (data: Partial<ProfileFormData>) => {
      if (!user?.id && !isDevelopmentMode) throw new Error('Not authenticated');
      if (isDevelopmentMode && !user?.id) return;
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: data.display_name,
          avatar_url: data.avatar_url,
          first_name: data.first_name,
          last_name: data.last_name,
          street: data.street,
          house_number: data.house_number,
          postal_code: data.postal_code,
          city: data.city,
          country: data.country,
          phone_landline: data.phone_landline,
          phone_mobile: data.phone_mobile,
          phone_whatsapp: data.phone_whatsapp,
          tax_number: data.tax_number,
          tax_id: data.tax_id,
          email_signature: data.email_signature,
          letterhead_logo_url: data.letterhead_logo_url,
          letterhead_company_line: data.letterhead_company_line,
          letterhead_extra_line: data.letterhead_extra_line,
          letterhead_bank_name: data.letterhead_bank_name,
          letterhead_iban: data.letterhead_iban,
          letterhead_bic: data.letterhead_bic,
          letterhead_website: data.letterhead_website,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      await refreshAuth();
      setHasChanges(false);
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
    if (isDevelopmentMode && !user?.id) { toast.info('Avatar-Upload im Entwicklungsmodus nicht verfügbar'); return; }
    if (!user?.id) return;
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    try {
      const { error: uploadError } = await supabase.storage.from('tenant-documents').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { getCachedSignedUrl } = await import('@/lib/imageCache');
      const signedUrl = await getCachedSignedUrl(filePath, 'tenant-documents');
      if (!signedUrl) throw new Error('Signed URL failed');
      updateField('avatar_url', signedUrl);
      toast.success('Avatar hochgeladen');
    } catch { toast.error('Avatar-Upload fehlgeschlagen'); }
  };

  const handleLogoUpload = async (files: File[]) => {
    if (files.length === 0) return;
    if (isDevelopmentMode && !user?.id) { toast.info('Logo-Upload im Entwicklungsmodus nicht verfügbar'); return; }
    if (!user?.id) return;
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/letterhead-logo.${fileExt}`;
    try {
      const { error: uploadError } = await supabase.storage.from('tenant-documents').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { getCachedSignedUrl } = await import('@/lib/imageCache');
      const signedUrl = await getCachedSignedUrl(filePath, 'tenant-documents');
      if (!signedUrl) throw new Error('Signed URL failed');
      updateField('letterhead_logo_url', signedUrl);
      toast.success('Logo hochgeladen');
    } catch { toast.error('Logo-Upload fehlgeschlagen'); }
  };

  const generateSignatureSuggestion = () => {
    const parts: string[] = ['Mit freundlichen Grüßen', ''];
    const fullName = [formData.first_name, formData.last_name].filter(Boolean).join(' ');
    if (fullName) parts.push(fullName);
    else if (formData.display_name) parts.push(formData.display_name);
    const phones: string[] = [];
    if (formData.phone_mobile) phones.push(`Mobil: ${formData.phone_mobile}`);
    if (formData.phone_landline) phones.push(`Tel: ${formData.phone_landline}`);
    if (phones.length > 0) parts.push(phones.join(' | '));
    if (formData.email) parts.push(`E-Mail: ${formData.email}`);
    updateField('email_signature', parts.join('\n'));
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
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 py-6 md:px-6 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight uppercase">STAMMDATEN</h1>
        <p className="text-muted-foreground mt-1">Ihr persönliches Profil und Kontaktdaten</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Persönliche Daten ── */}
        <ProfileWidget icon={User} title="Persönliche Daten" description="Profilbild, Name und E-Mail">
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/10">
              <AvatarImage src={formData.avatar_url || undefined} alt={formData.display_name} />
              <AvatarFallback className="text-lg bg-primary/5">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <FileUploader
                onFilesSelected={handleAvatarUpload}
                accept="image/*"
                label="Foto ändern"
                hint="JPG, PNG (max. 2MB)"
                maxSize={2 * 1024 * 1024}
              />
            </div>
          </div>
          <FormSection>
            <FormRow>
              <FormInput label="Vorname" name="first_name" value={formData.first_name}
                onChange={e => updateField('first_name', e.target.value)} placeholder="Max" />
              <FormInput label="Nachname" name="last_name" value={formData.last_name}
                onChange={e => updateField('last_name', e.target.value)} placeholder="Mustermann" />
            </FormRow>
            <FormRow>
              <FormInput label="Anzeigename" name="display_name" value={formData.display_name}
                onChange={e => updateField('display_name', e.target.value)} placeholder="Max Mustermann" required />
              <FormInput label="E-Mail" name="email" type="email" value={formData.email}
                disabled hint="Login-Identität — nicht änderbar" />
            </FormRow>
          </FormSection>
        </ProfileWidget>

        {/* ── Adresse ── */}
        <ProfileWidget icon={MapPin} title="Adresse" description="Postanschrift für Korrespondenz">
          <FormSection>
            <FormRow>
              <FormInput label="Straße" name="street" value={formData.street}
                onChange={e => updateField('street', e.target.value)} placeholder="Musterstraße" className="flex-[3]" />
              <FormInput label="Nr." name="house_number" value={formData.house_number}
                onChange={e => updateField('house_number', e.target.value)} placeholder="1" className="flex-1" />
            </FormRow>
            <FormRow>
              <FormInput label="PLZ" name="postal_code" value={formData.postal_code}
                onChange={e => updateField('postal_code', e.target.value)} placeholder="80331" className="flex-1" />
              <FormInput label="Stadt" name="city" value={formData.city}
                onChange={e => updateField('city', e.target.value)} placeholder="München" className="flex-[2]" />
              <FormInput label="Land" name="country" value={formData.country}
                onChange={e => updateField('country', e.target.value)} placeholder="DE" className="flex-1" />
            </FormRow>
          </FormSection>
        </ProfileWidget>

        {/* ── Kontaktdaten ── */}
        <ProfileWidget icon={Phone} title="Kontaktdaten" description="Telefonnummern">
          <FormSection>
            <FormRow>
              <FormInput label="Festnetz" name="phone_landline" type="tel" value={formData.phone_landline}
                onChange={e => updateField('phone_landline', e.target.value)} placeholder="+49 89 12345678" />
              <FormInput label="Mobil" name="phone_mobile" type="tel" value={formData.phone_mobile}
                onChange={e => updateField('phone_mobile', e.target.value)} placeholder="+49 170 1234567" />
            </FormRow>
            <FormInput label="WhatsApp" name="phone_whatsapp" type="tel" value={formData.phone_whatsapp}
              onChange={e => updateField('phone_whatsapp', e.target.value)} placeholder="+49 170 1234567" />
          </FormSection>
        </ProfileWidget>

        {/* ── Steuerliche Daten ── */}
        <ProfileWidget icon={FileText} title="Steuerliche Daten" description="Steuernummern für Dokumente">
          <FormSection>
            <FormInput label="Steuernummer" name="tax_number" value={formData.tax_number}
              onChange={e => updateField('tax_number', e.target.value)} placeholder="123/456/78901"
              hint="Finanzamt-Steuernummer" />
            <FormInput label="Steuer-ID" name="tax_id" value={formData.tax_id}
              onChange={e => updateField('tax_id', e.target.value)} placeholder="DE123456789"
              hint="Persönliche Steuer-Identifikationsnummer" />
          </FormSection>
        </ProfileWidget>

        {/* ── E-Mail-Signatur ── */}
        <ProfileWidget icon={PenLine} title="E-Mail-Signatur" description="Automatisch an E-Mails angehängt">
          <Textarea
            value={formData.email_signature}
            onChange={e => updateField('email_signature', e.target.value)}
            placeholder={"Mit freundlichen Grüßen\n\nMax Mustermann\nTel: +49 170 1234567"}
            rows={5}
            className="font-mono text-xs mb-3"
          />
          <Button type="button" variant="outline" size="sm" onClick={generateSignatureSuggestion} className="gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Vorschlag generieren
          </Button>
        </ProfileWidget>

        {/* ── Outbound-Kennung ── */}
        <OutboundIdentityWidget />

        {/* ── Briefkopf ── */}
        <ProfileWidget icon={Building2} title="Briefkopf-Daten" description="Logo, Firma und Bankverbindung">
          <div className="flex items-start gap-4 mb-4">
            <img src={formData.letterhead_logo_url || defaultLetterheadLogo} alt="Logo"
              className="h-12 w-auto object-contain border rounded-lg p-1 bg-background" />
            <div className="flex-1">
              <FileUploader onFilesSelected={handleLogoUpload} accept="image/*"
                label="Logo hochladen" hint="PNG transparent empfohlen" maxSize={2 * 1024 * 1024} />
            </div>
          </div>
          <FormSection>
            <FormRow>
              <FormInput label="Firmenzusatz" name="letterhead_company_line" value={formData.letterhead_company_line}
                onChange={e => updateField('letterhead_company_line', e.target.value)} placeholder="Mustermann GmbH" />
              <FormInput label="Zusatzzeile" name="letterhead_extra_line" value={formData.letterhead_extra_line}
                onChange={e => updateField('letterhead_extra_line', e.target.value)} placeholder="HRB 12345" />
            </FormRow>
            <FormInput label="Webseite" name="letterhead_website" type="url" value={formData.letterhead_website}
              onChange={e => updateField('letterhead_website', e.target.value)} placeholder="https://www.example.de" />
            <div className="border-t border-border/30 pt-3 mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Bankverbindung</p>
              <FormRow>
                <FormInput label="Bank" name="letterhead_bank_name" value={formData.letterhead_bank_name}
                  onChange={e => updateField('letterhead_bank_name', e.target.value)} placeholder="Deutsche Bank" />
                <FormInput label="IBAN" name="letterhead_iban" value={formData.letterhead_iban}
                  onChange={e => updateField('letterhead_iban', e.target.value)} placeholder="DE89 3704 0044 ..." />
                <FormInput label="BIC" name="letterhead_bic" value={formData.letterhead_bic}
                  onChange={e => updateField('letterhead_bic', e.target.value)} placeholder="COBADEFFXXX" />
              </FormRow>
            </div>
          </FormSection>
        </ProfileWidget>

        {/* ── Upload-E-Mail ── */}
        <UploadEmailWidget />

        {/* ── WhatsApp Business ── */}
        <WhatsAppWidget userId={user?.id} isDevelopmentMode={isDevelopmentMode} />
      </div>

      {/* ── Sticky Save Button ── */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t bg-background/80 backdrop-blur-xl transition-all duration-300",
        hasChanges ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      )}>
        <div className="flex items-center justify-between max-w-5xl mx-auto px-6 py-3">
          <p className="text-sm text-muted-foreground">
            Ungespeicherte Änderungen
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => {
              if (originalDataRef.current) {
                setFormData(originalDataRef.current);
                setHasChanges(false);
              }
            }}>
              Verwerfen
            </Button>
            <Button type="submit" size="sm" disabled={updateProfile.isPending} className="gap-2">
              {updateProfile.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Speichern
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

// =============================================================================
// Upload Email Widget
// =============================================================================
function UploadEmailWidget() {
  const { user } = useAuth();
  const { data: mailboxAddress } = useQuery({
    queryKey: ['inbound-mailbox-profil'],
    queryFn: async () => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return null;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-inbound-receive?action=mailbox`,
        { headers: { Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
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
    <ProfileWidget icon={Mail} title="Upload-E-Mail" description="PDFs per Mail ins DMS senden">
      <div className="flex items-center gap-3">
        <code className="flex-1 px-3 py-2 bg-muted/50 rounded-lg font-mono text-xs truncate">
          {mailboxAddress || 'Wird geladen...'}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={copyAddress} disabled={!mailboxAddress} className="gap-1.5">
          <Copy className="h-3.5 w-3.5" />
          Kopieren
        </Button>
      </div>
    </ProfileWidget>
  );
}

// =============================================================================
// WhatsApp Widget
// =============================================================================
function WhatsAppWidget({ userId, isDevelopmentMode }: { userId?: string; isDevelopmentMode: boolean }) {
  const queryClient = useQueryClient();

  const { data: waSettings } = useQuery({
    queryKey: ['whatsapp-user-settings', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.from('whatsapp_user_settings').select('*').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: waAccount } = useQuery({
    queryKey: ['whatsapp-account'],
    queryFn: async () => {
      const { data, error } = await supabase.from('whatsapp_accounts').select('system_phone_e164, status').maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const [ownerControlE164, setOwnerControlE164] = React.useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = React.useState(false);
  const [autoReplyText, setAutoReplyText] = React.useState('Vielen Dank für Ihre Nachricht. Wir melden uns in Kürze.');

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
      const { data: tenantId } = await supabase.rpc('get_user_tenant_id');
      if (!tenantId) throw new Error('No organization found');
      const { error } = await supabase.from('whatsapp_user_settings').upsert({
        tenant_id: tenantId, user_id: userId,
        owner_control_e164: ownerControlE164 || null,
        auto_reply_enabled: autoReplyEnabled, auto_reply_text: autoReplyText,
      }, { onConflict: 'tenant_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['whatsapp-user-settings'] }); toast.success('WhatsApp gespeichert'); },
    onError: (error) => { toast.error('Fehler: ' + (error as Error).message); },
  });

  const statusColor = waAccount?.status === 'connected' ? 'text-green-600' :
    waAccount?.status === 'error' ? 'text-destructive' : 'text-yellow-600';
  const statusLabel = waAccount?.status === 'connected' ? 'Verbunden' :
    waAccount?.status === 'error' ? 'Fehler' : 'Ausstehend';

  return (
    <ProfileWidget icon={MessageSquare} title="WhatsApp Business" description="Verbindung und Armstrong-Steuerung"
      className="lg:col-span-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Connection */}
        <div className="space-y-3">
          {waAccount ? (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusColor}>● {statusLabel}</Badge>
              </div>
              <FormSection>
                <FormInput label="Systemnummer" name="system_phone" value={waAccount.system_phone_e164} disabled
                  hint="WhatsApp Business Nummer" />
              </FormSection>
            </>
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Noch nicht konfiguriert</p>
            </div>
          )}
        </div>

        {/* Right: Settings */}
        <div className="space-y-3">
          <FormSection>
            <FormInput label="Owner-Control Nummer" name="owner_control_e164" type="tel"
              value={ownerControlE164} onChange={e => setOwnerControlE164(e.target.value)}
              placeholder="+49 170 1234567" hint="Für Armstrong-Befehle via WhatsApp" />
          </FormSection>
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <Bot className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Armstrong reagiert <strong>nur</strong> auf diese Nummer.
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div>
              <Label className="text-xs font-medium">Auto-Reply</Label>
              <p className="text-[11px] text-muted-foreground">Automatische Antwort</p>
            </div>
            <Switch checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
          </div>
          {autoReplyEnabled && (
            <Textarea value={autoReplyText} onChange={e => setAutoReplyText(e.target.value)}
              placeholder="Vielen Dank..." rows={2} className="text-xs" />
          )}
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => saveWaSettings.mutate()}
              disabled={saveWaSettings.isPending} className="gap-1.5">
              {saveWaSettings.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Speichern
            </Button>
          </div>
        </div>
      </div>
    </ProfileWidget>
  );
}
