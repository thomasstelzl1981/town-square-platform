import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormSection, FormInput, FormRow } from '@/components/shared';
import { FileUploader } from '@/components/shared/FileUploader';
import { Loader2, Save, User } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileFormData {
  display_name: string;
  email: string;
  avatar_url: string | null;
}

export function ProfilTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = React.useState<ProfileFormData>({
    display_name: '',
    email: '',
    avatar_url: null,
  });

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Update form when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        email: profile.email || '',
        avatar_url: profile.avatar_url,
      });
    }
  }, [profile]);

  // Update mutation
  const updateProfile = useMutation({
    mutationFn: async (data: Partial<ProfileFormData>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: data.display_name,
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
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
    if (files.length === 0 || !user?.id) return;
    
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Persönliche Daten
          </CardTitle>
          <CardDescription>
            Verwalten Sie Ihre persönlichen Informationen und Ihr Profilbild.
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
