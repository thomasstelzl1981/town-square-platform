import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormSection, DataTable, StatusBadge } from '@/components/shared';
import { Shield, Key, Monitor, LogOut, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export function SicherheitTab() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwörter stimmen nicht überein');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Passwort erfolgreich geändert');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Fehler: ' + (error as Error).message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Mock session data (Supabase doesn't expose all sessions easily)
  const sessions = [
    {
      id: '1',
      device: 'Chrome auf Windows',
      ip: '192.168.1.x',
      lastActive: new Date().toISOString(),
      isCurrent: true,
    },
  ];

  // Recent security events (would come from audit_events in production)
  const securityEvents = [
    {
      id: '1',
      event: 'Login',
      timestamp: new Date().toISOString(),
      ip: '192.168.1.x',
      status: 'success',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Passwort ändern
          </CardTitle>
          <CardDescription>
            Aktualisieren Sie Ihr Passwort regelmäßig für mehr Sicherheit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <FormSection>
              <div className="space-y-2">
                <Label htmlFor="new-password">Neues Passwort</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mindestens 8 Zeichen"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Passwort wiederholen"
                />
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </FormSection>
            <Button type="submit" disabled={isChangingPassword || !newPassword || !confirmPassword}>
              {isChangingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Key className="mr-2 h-4 w-4" />
              )}
              Passwort ändern
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Aktive Sitzungen
          </CardTitle>
          <CardDescription>
            Verwalten Sie Ihre aktiven Anmeldungen auf verschiedenen Geräten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={sessions}
            columns={[
              { key: 'device', header: 'Gerät' },
              { key: 'ip', header: 'IP-Adresse' },
              {
                key: 'lastActive',
                header: 'Zuletzt aktiv',
                render: (value) => format(new Date(value as string), "dd.MM.yyyy 'um' HH:mm", { locale: de }),
              },
              {
                key: 'isCurrent',
                header: 'Status',
                render: (value) => value ? (
                  <StatusBadge status="Aktuelle Sitzung" variant="success" />
                ) : (
                  <Button variant="ghost" size="sm">
                    <LogOut className="h-4 w-4 mr-1" />
                    Beenden
                  </Button>
                ),
              },
            ]}
            emptyMessage="Keine aktiven Sitzungen"
          />
        </CardContent>
      </Card>

      {/* Security Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sicherheits-Log
          </CardTitle>
          <CardDescription>
            Übersicht der letzten sicherheitsrelevanten Aktivitäten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={securityEvents}
            columns={[
              { key: 'event', header: 'Ereignis' },
              {
                key: 'timestamp',
                header: 'Zeitpunkt',
                render: (value) => format(new Date(value as string), "dd.MM.yyyy 'um' HH:mm", { locale: de }),
              },
              { key: 'ip', header: 'IP-Adresse' },
              {
                key: 'status',
                header: 'Status',
                render: (value) => (
                  <StatusBadge status={value as string} variant={value === 'success' ? 'success' : 'error'} />
                ),
              },
            ]}
            emptyMessage="Keine Sicherheitsereignisse"
          />
        </CardContent>
      </Card>
    </div>
  );
}
