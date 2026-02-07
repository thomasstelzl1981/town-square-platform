import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormSection, FormInput, FormRow } from '@/components/shared';
import { FileUploader } from '@/components/shared/FileUploader';
import { Loader2, Save, User, Phone, MapPin, FileText } from 'lucide-react';
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
