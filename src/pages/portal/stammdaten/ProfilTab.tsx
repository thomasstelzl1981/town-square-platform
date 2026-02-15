import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { FormSection, FormInput, FormRow } from '@/components/shared';
import { RecordCard } from '@/components/shared/RecordCard';
import { DESIGN, RECORD_CARD } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { FileUploader } from '@/components/shared/FileUploader';
import { Loader2, Save, User, Phone, MapPin, FileText, PenLine, Sparkles, Building2, Mail, Download, Monitor, Smartphone, Zap, WifiOff, Layout, Globe, Share } from 'lucide-react';
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

/** App Download Widget for PWA installation */
function AppDownloadWidget() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isIOS] = React.useState(() => /iPad|iPhone|iPod/.test(navigator.userAgent));
  const [isDesktop] = React.useState(() => !/Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent));

  React.useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (!deferredPrompt) return;
    (deferredPrompt as unknown as { prompt: () => void }).prompt();
    setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  return (
    <ProfileWidget icon={Download} title="App herunterladen" description="Armstrong als Desktop- oder Mobile-App installieren">
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          {[
            { icon: Zap, label: 'Sofortiger Start ohne Browser' },
            { icon: WifiOff, label: 'Offline-Zugriff auf Kernfunktionen' },
            { icon: Layout, label: 'Eigenes App-Fenster & Shortcuts' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {deferredPrompt ? (
          <Button onClick={handleInstall} size="sm" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Jetzt installieren
          </Button>
        ) : isIOS ? (
          <div className="text-xs text-muted-foreground space-y-1.5 bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2"><Share className="h-3.5 w-3.5 shrink-0" /><span>Safari → <strong>Teilen</strong> → <strong>Zum Home-Bildschirm</strong></span></div>
          </div>
        ) : isDesktop ? (
          <div className="text-xs text-muted-foreground space-y-1.5 bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 shrink-0" /><span><strong>Chrome:</strong> Install-Icon <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">⊕</kbd> in der Adressleiste</span></div>
            <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 shrink-0" /><span><strong>Edge:</strong> Menü → Apps → „Als App installieren"</span></div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            Browser-Menü (⋮) → <strong>„App installieren"</strong>
          </div>
        )}
      </div>
    </ProfileWidget>
  );
}

export function ProfilTab() {
  const { user, isDevelopmentMode, refreshAuth } = useAuth();
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = React.useState(false);
  const [isRecordOpen, setIsRecordOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<ProfileFormData>({
    display_name: '', first_name: '', last_name: '', email: '', avatar_url: null,
    street: '', house_number: '', postal_code: '', city: '', country: 'DE',
    phone_landline: '', phone_mobile: '', phone_whatsapp: '',
    tax_number: '', tax_id: '',
    email_signature: '',
    letterhead_logo_url: '', letterhead_company_line: '', letterhead_extra_line: '',
    letterhead_bank_name: '', letterhead_iban: '', letterhead_bic: '', letterhead_website: '',
  });

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

  const fullName = [formData.first_name, formData.last_name].filter(Boolean).join(' ') || formData.display_name || 'Profil';

  return (
    <PageShell>
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <ModulePageHeader title="Stammdaten" description="Ihr persönliches Profil und Kontaktdaten" />

      <div className={RECORD_CARD.GRID}>
        {/* ── RecordCard: Persönliche Daten (Quadratisch / Vollansicht) ── */}
        <RecordCard
          id={user?.id || 'dev-user'}
          entityType="person"
          isOpen={isRecordOpen}
          onToggle={() => setIsRecordOpen(!isRecordOpen)}
          thumbnailUrl={formData.avatar_url || undefined}
          title={fullName}
          subtitle="Hauptperson"
          summary={[
            ...(formData.street ? [{ label: '', value: `${formData.street} ${formData.house_number || ''}`.trim() }] : []),
            ...(formData.postal_code ? [{ label: '', value: `${formData.postal_code} ${formData.city || ''}`.trim() }] : []),
            ...(formData.phone_landline ? [{ label: '', value: formData.phone_landline }] : []),
            ...(formData.phone_mobile ? [{ label: '', value: formData.phone_mobile }] : []),
            ...(formData.email ? [{ label: '', value: formData.email }] : []),
          ]}
          onSave={() => updateProfile.mutate(formData)}
          saving={updateProfile.isPending}
        >
          {/* ── BASISDATEN ── */}
          <div>
            <p className={RECORD_CARD.SECTION_TITLE}>Persönliche Daten</p>
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary/10">
                <AvatarImage src={formData.avatar_url || undefined} alt={formData.display_name} />
                <AvatarFallback className="text-lg bg-primary/5">
                  {fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </AvatarFallback>
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
            <div className={RECORD_CARD.FIELD_GRID}>
              <FormInput label="Vorname" name="first_name" value={formData.first_name}
                onChange={e => updateField('first_name', e.target.value)} placeholder="Max" />
              <FormInput label="Nachname" name="last_name" value={formData.last_name}
                onChange={e => updateField('last_name', e.target.value)} placeholder="Mustermann" />
              <FormInput label="Anzeigename" name="display_name" value={formData.display_name}
                onChange={e => updateField('display_name', e.target.value)} placeholder="Max Mustermann" required />
              <FormInput label="E-Mail" name="email" type="email" value={formData.email}
                disabled hint="Login-Identität — nicht änderbar" />
            </div>
          </div>

          {/* ── ADRESSE ── */}
          <div>
            <p className={RECORD_CARD.SECTION_TITLE}>Adresse</p>
            <div className={RECORD_CARD.FIELD_GRID}>
              <FormInput label="Straße" name="street" value={formData.street}
                onChange={e => updateField('street', e.target.value)} placeholder="Musterstraße" />
              <FormInput label="Nr." name="house_number" value={formData.house_number}
                onChange={e => updateField('house_number', e.target.value)} placeholder="1" />
              <FormInput label="PLZ" name="postal_code" value={formData.postal_code}
                onChange={e => updateField('postal_code', e.target.value)} placeholder="80331" />
              <FormInput label="Stadt" name="city" value={formData.city}
                onChange={e => updateField('city', e.target.value)} placeholder="München" />
              <FormInput label="Land" name="country" value={formData.country}
                onChange={e => updateField('country', e.target.value)} placeholder="DE" />
            </div>
          </div>

          {/* ── KONTAKTDATEN ── */}
          <div>
            <p className={RECORD_CARD.SECTION_TITLE}>Kontaktdaten</p>
            <div className={RECORD_CARD.FIELD_GRID}>
              <FormInput label="Festnetz" name="phone_landline" type="tel" value={formData.phone_landline}
                onChange={e => updateField('phone_landline', e.target.value)} placeholder="+49 89 12345678" />
              <FormInput label="Mobil" name="phone_mobile" type="tel" value={formData.phone_mobile}
                onChange={e => updateField('phone_mobile', e.target.value)} placeholder="+49 170 1234567" />
              <FormInput label="WhatsApp" name="phone_whatsapp" type="tel" value={formData.phone_whatsapp}
                onChange={e => updateField('phone_whatsapp', e.target.value)} placeholder="+49 170 1234567" />
            </div>
          </div>

          {/* ── STEUERLICHE DATEN ── */}
          <div>
            <p className={RECORD_CARD.SECTION_TITLE}>Steuerliche Daten</p>
            <div className={RECORD_CARD.FIELD_GRID}>
              <FormInput label="Steuernummer" name="tax_number" value={formData.tax_number}
                onChange={e => updateField('tax_number', e.target.value)} placeholder="123/456/78901"
                hint="Finanzamt-Steuernummer" />
              <FormInput label="Steuer-ID" name="tax_id" value={formData.tax_id}
                onChange={e => updateField('tax_id', e.target.value)} placeholder="DE123456789"
                hint="Persönliche Steuer-Identifikationsnummer" />
            </div>
          </div>

          {/* ── E-MAIL-SIGNATUR ── */}
          <div>
            <p className={RECORD_CARD.SECTION_TITLE}>E-Mail-Signatur</p>
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
          </div>

          {/* ── BRIEFKOPF ── */}
          <div>
            <p className={RECORD_CARD.SECTION_TITLE}>Briefkopf-Daten</p>
            <div className="flex items-start gap-4 mb-4">
              <img src={formData.letterhead_logo_url || defaultLetterheadLogo} alt="Logo"
                className="h-12 w-auto object-contain border rounded-lg p-1 bg-background" />
              <div className="flex-1">
                <FileUploader onFilesSelected={handleLogoUpload} accept="image/*"
                  label="Logo hochladen" hint="PNG transparent empfohlen" maxSize={2 * 1024 * 1024} />
              </div>
            </div>
            <div className={RECORD_CARD.FIELD_GRID}>
              <FormInput label="Firmenzusatz" name="letterhead_company_line" value={formData.letterhead_company_line}
                onChange={e => updateField('letterhead_company_line', e.target.value)} placeholder="Mustermann GmbH" />
              <FormInput label="Zusatzzeile" name="letterhead_extra_line" value={formData.letterhead_extra_line}
                onChange={e => updateField('letterhead_extra_line', e.target.value)} placeholder="HRB 12345" />
              <FormInput label="Webseite" name="letterhead_website" type="url" value={formData.letterhead_website}
                onChange={e => updateField('letterhead_website', e.target.value)} placeholder="https://www.example.de" />
            </div>
            <div className="border-t border-border/30 pt-3 mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Bankverbindung</p>
              <div className={RECORD_CARD.FIELD_GRID}>
                <FormInput label="Bank" name="letterhead_bank_name" value={formData.letterhead_bank_name}
                  onChange={e => updateField('letterhead_bank_name', e.target.value)} placeholder="Deutsche Bank" />
                <FormInput label="IBAN" name="letterhead_iban" value={formData.letterhead_iban}
                  onChange={e => updateField('letterhead_iban', e.target.value)} placeholder="DE89 3704 0044 ..." />
                <FormInput label="BIC" name="letterhead_bic" value={formData.letterhead_bic}
                  onChange={e => updateField('letterhead_bic', e.target.value)} placeholder="COBADEFFXXX" />
              </div>
            </div>
          </div>
        </RecordCard>

        {/* ── Outbound-Kennung (rechte Spalte wenn RecordCard geschlossen) ── */}
        {!isRecordOpen && <OutboundIdentityWidget />}

      </div>

      {/* ── App-Download Widget ── */}
      <AppDownloadWidget />

      {/* ── Sticky Save Button ── */}

      {/* ── Sticky Save Button ── */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t bg-background/80 backdrop-blur-xl transition-all duration-300",
        hasChanges && !isRecordOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
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
    </PageShell>
  );
}

