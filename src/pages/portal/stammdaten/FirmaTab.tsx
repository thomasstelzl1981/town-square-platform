import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormSection, FormInput, FormRow, DataTable, StatusBadge, EmptyState } from '@/components/shared';
import { Loader2, Save, Building, Users, UserPlus, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FirmaTab() {
  const { user, activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [orgName, setOrgName] = React.useState('');
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteOpen, setInviteOpen] = React.useState(false);

  // Fetch organization
  const { data: org, isLoading: orgLoading } = useQuery({
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

  // Fetch team members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['memberships', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          id,
          role,
          created_at,
          user_id,
          profiles!memberships_user_id_fkey(display_name, email)
        `)
        .eq('tenant_id', activeTenantId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  React.useEffect(() => {
    if (org) {
      setOrgName(org.name || '');
    }
  }, [org]);

  // Update organization
  const updateOrg = useMutation({
    mutationFn: async (name: string) => {
      if (!activeTenantId) throw new Error('No tenant');
      const { error } = await supabase
        .from('organizations')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', activeTenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', activeTenantId] });
      toast.success('Organisation gespeichert');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrg.mutate(orgName);
  };

  const handleInvite = () => {
    // Placeholder for invite logic
    toast.info(`Einladung an ${inviteEmail} gesendet (Demo)`);
    setInviteEmail('');
    setInviteOpen(false);
  };

  const isLoading = orgLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    platform_admin: 'Platform Admin',
    org_admin: 'Admin',
    internal_ops: 'Mitarbeiter',
    sales_partner: 'Vertriebspartner',
    renter_user: 'Mieter',
  };

  return (
    <div className="space-y-6">
      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organisationsdaten
          </CardTitle>
          <CardDescription>
            Verwalten Sie die Grunddaten Ihrer Organisation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOrgSubmit} className="space-y-4">
            <FormSection>
              <FormRow>
                <FormInput
                  label="Organisationsname"
                  name="name"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="Meine Firma GmbH"
                  required
                />
                <FormInput
                  label="Typ"
                  name="type"
                  value={org?.org_type || 'client'}
                  disabled
                  hint="Der Organisationstyp kann nicht geändert werden"
                />
              </FormRow>
              <FormRow>
                <FormInput
                  label="Slug"
                  name="slug"
                  value={org?.slug || ''}
                  disabled
                  hint="Eindeutige Kennung für URLs"
                />
                <FormInput
                  label="Public ID"
                  name="public_id"
                  value={org?.public_id || ''}
                  disabled
                />
              </FormRow>
            </FormSection>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateOrg.isPending}>
                {updateOrg.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Speichern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team-Mitglieder
            </CardTitle>
            <CardDescription>
              Verwalten Sie die Benutzer Ihrer Organisation.
            </CardDescription>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Einladen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mitglied einladen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">E-Mail-Adresse</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="kollege@firma.de"
                  />
                </div>
                <Button onClick={handleInvite} disabled={!inviteEmail} className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Einladung senden
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {members && members.length > 0 ? (
            <DataTable
              data={members.map(m => ({
                id: m.id,
                name: (m.profiles as { display_name?: string })?.display_name || 'Unbekannt',
                email: (m.profiles as { email?: string })?.email || '',
                role: m.role,
                created_at: m.created_at,
                isCurrentUser: m.user_id === user?.id,
              }))}
              columns={[
                { key: 'name', header: 'Name', sortable: true },
                { key: 'email', header: 'E-Mail', sortable: true },
                { 
                  key: 'role', 
                  header: 'Rolle',
                  render: (value) => (
                    <StatusBadge status={roleLabels[value as string] || String(value)} variant="default" />
                  )
                },
                {
                  key: 'isCurrentUser',
                  header: '',
                  render: (value) => value ? (
                    <span className="text-xs text-muted-foreground">(Sie)</span>
                  ) : null
                },
              ]}
              searchKey="name"
              searchPlaceholder="Mitglieder suchen..."
            />
          ) : (
            <EmptyState
              icon={Users}
              title="Keine Mitglieder"
              description="Laden Sie Teammitglieder zu Ihrer Organisation ein."
              action={{ label: 'Mitglied einladen', onClick: () => setInviteOpen(true) }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
