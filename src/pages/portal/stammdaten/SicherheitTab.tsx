import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, StatusBadge } from '@/components/shared';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WIDGET_CELL } from '@/config/designManifest';
import { Shield, Monitor, LogOut, Mail, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export function SicherheitTab() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const loginEmail = user?.email || '—';
  const lastSignIn = user?.last_sign_in_at
    ? format(new Date(user.last_sign_in_at), "dd.MM.yyyy 'um' HH:mm", { locale: de })
    : '—';

  // Mock sessions
  const sessions = [
    {
      id: '1',
      device: 'Chrome auf Windows',
      ip: '192.168.1.x',
      lastActive: new Date().toISOString(),
      isCurrent: true,
    },
  ];

  const securityEvents = [
    {
      id: '1',
      event: 'Login',
      timestamp: new Date().toISOString(),
      ip: '192.168.1.x',
      status: 'success',
    },
  ];

  const handleSignOutOthers = async () => {
    // Supabase scope: 'others' signs out all other sessions
    await supabase.auth.signOut({ scope: 'others' });
  };

  if (!isOpen) {
    // ─── CLOSED STATE: Square Widget ───
    return (
      <PageShell>
        <ModulePageHeader title="Sicherheit" description="Portalzugang und Sitzungen verwalten" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card
            className={`${WIDGET_CELL.DIMENSIONS} cursor-pointer transition-all hover:shadow-lg overflow-hidden`}
            onClick={() => setIsOpen(true)}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
              <StatusBadge status="Aktiv" variant="success" />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">Portalzugang</p>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <Mail className="h-3.5 w-3.5" />
                  {loginEmail}
                </p>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-auto">
                <Clock className="h-3 w-3" />
                Letzte Anmeldung: {lastSignIn}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  // ─── OPEN STATE: Full-width Dossier ───
  return (
    <PageShell>
      <ModulePageHeader title="Sicherheit" description="Portalzugang und Sitzungen verwalten" />
      <div className="space-y-4 md:space-y-6">
        {/* Header with close */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Portalzugang</CardTitle>
                  <CardDescription>Login-Methode: 6-stelliger PIN per E-Mail</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Schließen
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Login-E-Mail</p>
                <p className="font-medium">{loginEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Letzte Anmeldung</p>
                <p className="font-medium">{lastSignIn}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Aktive Sitzungen
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleSignOutOthers}>
                <LogOut className="h-4 w-4 mr-1" />
                Andere Sitzungen beenden
              </Button>
            </div>
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
    </PageShell>
  );
}
