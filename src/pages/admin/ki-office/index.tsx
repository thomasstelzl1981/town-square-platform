/**
 * Admin KI Office — Zone 1 KI Tools Dashboard
 * Landing page with tabs for E-Mail and Kontakte
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Contact, Sparkles, Users, Inbox } from 'lucide-react';
import { AdminEmailTab } from './AdminEmailTab';
import { AdminKontakteTab } from './AdminKontakteTab';

export default function AdminKiOffice() {
  const [activeTab, setActiveTab] = useState<'email' | 'kontakte'>('email');

  // Fetch admin-scoped statistics
  const { data: stats } = useQuery({
    queryKey: ['admin-ki-office-stats'],
    queryFn: async () => {
      // Get admin contacts count (scope = zone1_admin)
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('scope', 'zone1_admin');

      // Get contacts with category "Offen"
      const { count: openCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('scope', 'zone1_admin')
        .eq('category', 'Offen');

      // Get connected mail accounts (for admin)
      const { count: accountsCount } = await supabase
        .from('mail_accounts')
        .select('*', { count: 'exact', head: true });

      return {
        contactsTotal: contactsCount ?? 0,
        contactsOpen: openCount ?? 0,
        mailAccounts: accountsCount ?? 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">KI Office</h1>
          <p className="text-muted-foreground">Platform Admin E-Mail und Kontakte</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">E-Mail-Konten</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.mailAccounts ?? 0}</div>
            <p className="text-xs text-muted-foreground">Verbunden</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kontakte</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.contactsTotal ?? 0}</div>
            <p className="text-xs text-muted-foreground">Gesamt (Zone 1)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategorie "Offen"</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.contactsOpen ?? 0}</div>
            <p className="text-xs text-muted-foreground">Zu prüfen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anreicherung</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Aktiv</div>
            <p className="text-xs text-muted-foreground">Via E-Mail & Post</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'email' | 'kontakte')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            E-Mail
          </TabsTrigger>
          <TabsTrigger value="kontakte" className="gap-2">
            <Contact className="h-4 w-4" />
            Kontakte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6">
          <AdminEmailTab />
        </TabsContent>

        <TabsContent value="kontakte" className="mt-6">
          <AdminKontakteTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
