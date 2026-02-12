/**
 * AdminKiOfficeDashboard — KI-Office Central Overview
 * Shows KPIs, recent activity, and quick actions
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DESIGN } from '@/config/designManifest';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Mail,
  Send,
  MailOpen,
  Reply,
  Users,
  Target,
  TrendingUp,
  Play,
  FileText,
  Search,
  ArrowRight,
  Loader2
} from 'lucide-react';

export default function AdminKiOfficeDashboard() {
  const navigate = useNavigate();

  // Fetch email statistics
  const { data: emailStats, isLoading: emailLoading } = useQuery({
    queryKey: ['admin-email-stats'],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
      
      const [outbound, inbound] = await Promise.all([
        supabase
          .from('admin_outbound_emails')
          .select('id, status, sent_at, opened_at, replied_at')
          .gte('created_at', weekStart)
          .lte('created_at', weekEnd),
        supabase
          .from('admin_inbound_emails')
          .select('id, is_read')
          .gte('created_at', weekStart)
          .lte('created_at', weekEnd),
      ]);

      const outboundData = outbound.data || [];
      const inboundData = inbound.data || [];

      return {
        sent: outboundData.length,
        delivered: outboundData.filter(e => ['delivered', 'opened', 'replied'].includes(e.status)).length,
        opened: outboundData.filter(e => ['opened', 'replied'].includes(e.status)).length,
        replied: outboundData.filter(e => e.status === 'replied').length,
        received: inboundData.length,
        unread: inboundData.filter(e => !e.is_read).length,
        openRate: outboundData.length > 0 
          ? Math.round((outboundData.filter(e => ['opened', 'replied'].includes(e.status)).length / outboundData.length) * 100)
          : 0,
        replyRate: outboundData.length > 0
          ? Math.round((outboundData.filter(e => e.status === 'replied').length / outboundData.length) * 100)
          : 0,
      };
    },
  });

  // Fetch sequence statistics
  const { data: sequenceStats, isLoading: sequenceLoading } = useQuery({
    queryKey: ['admin-sequence-stats'],
    queryFn: async () => {
      const [sequences, enrollments] = await Promise.all([
        supabase.from('admin_email_sequences').select('id, status'),
        supabase.from('admin_email_enrollments').select('id, status'),
      ]);

      const seqData = sequences.data || [];
      const enrollData = enrollments.data || [];

      return {
        total: seqData.length,
        active: seqData.filter(s => s.status === 'active').length,
        enrolled: enrollData.filter(e => e.status === 'active').length,
        completed: enrollData.filter(e => e.status === 'completed').length,
      };
    },
  });

  // Fetch contact statistics
  const { data: contactStats, isLoading: contactLoading } = useQuery({
    queryKey: ['admin-contact-stats'],
    queryFn: async () => {
      const { data: contacts, count } = await supabase
        .from('contacts')
        .select('id, category, created_at', { count: 'exact' })
        .eq('scope', 'zone1_admin');

      const contactData = contacts || [];
      const thisWeek = subDays(new Date(), 7).toISOString();
      const newThisWeek = contactData.filter(c => c.created_at >= thisWeek).length;

      // Group by category
      const byCategory = contactData.reduce((acc, c) => {
        const cat = c.category || 'Sonstige';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: count || 0,
        newThisWeek,
        byCategory,
      };
    },
  });

  // Fetch templates count
  const { data: templateCount } = useQuery({
    queryKey: ['admin-template-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('admin_email_templates')
        .select('id', { count: 'exact' })
        .eq('is_active', true);
      return count || 0;
    },
  });

  const isLoading = emailLoading || sequenceLoading || contactLoading;

  return (
    <div className={`${DESIGN.CONTAINER.PADDING} ${DESIGN.SPACING.SECTION}`}>
      {/* Header */}
      <div>
        <h1 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>KI-Office Dashboard</h1>
        <p className={DESIGN.TYPOGRAPHY.MUTED}>
          Marketing-Automatisierung & Kommunikation
        </p>
      </div>

      {/* KPI Cards */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Send className="h-4 w-4" />
              Gesendet (Woche)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={DESIGN.TYPOGRAPHY.VALUE}>{emailStats?.sent || 0}</div>
            <p className={DESIGN.TYPOGRAPHY.HINT}>
              {emailStats?.openRate || 0}% Öffnungsrate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Reply className="h-4 w-4" />
              Antworten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={DESIGN.TYPOGRAPHY.VALUE}>{emailStats?.replied || 0}</div>
            <p className={DESIGN.TYPOGRAPHY.HINT}>
              {emailStats?.replyRate || 0}% Antwortrate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Play className="h-4 w-4" />
              Aktive Sequenzen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={DESIGN.TYPOGRAPHY.VALUE}>{sequenceStats?.active || 0}</div>
            <p className={DESIGN.TYPOGRAPHY.HINT}>
              {sequenceStats?.enrolled || 0} eingeschrieben
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Kontakte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={DESIGN.TYPOGRAPHY.VALUE}>{contactStats?.total || 0}</div>
            <p className={DESIGN.TYPOGRAPHY.HINT}>
              +{contactStats?.newThisWeek || 0} diese Woche
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin/ki-office-email')}
            >
              <Mail className="h-4 w-4 mr-2" />
              Neue E-Mail
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin/ki-office-sequenzen')}
            >
              <Target className="h-4 w-4 mr-2" />
              Sequenz erstellen
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin/ki-office-recherche')}
            >
              <Search className="h-4 w-4 mr-2" />
              Kontakte recherchieren
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin/ki-office-templates')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Templates verwalten
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </CardContent>
        </Card>

        {/* Contact Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Kontakte nach Kategorie</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(contactStats?.byCategory || {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm">{category}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                {Object.keys(contactStats?.byCategory || {}).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Noch keine Kontakte
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>System-Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Templates aktiv</span>
              <Badge variant="outline">{templateCount || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Sequenzen gesamt</span>
              <Badge variant="outline">{sequenceStats?.total || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Ungelesene E-Mails</span>
              <Badge variant={emailStats?.unread ? 'default' : 'outline'}>
                {emailStats?.unread || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Abgeschlossene Sequenzen</span>
              <Badge variant="outline">{sequenceStats?.completed || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Links */}
      <div className={DESIGN.KPI_GRID.FULL}>
        {[
          { title: 'E-Mail', icon: Mail, path: '/admin/ki-office-email', desc: 'Konversationen' },
          { title: 'Sequenzen', icon: Target, path: '/admin/ki-office-sequenzen', desc: 'Drip-Kampagnen' },
          { title: 'Templates', icon: FileText, path: '/admin/ki-office-templates', desc: 'E-Mail-Vorlagen' },
          { title: 'Kontakte', icon: Users, path: '/admin/ki-office-kontakte', desc: 'CRM-Daten' },
          { title: 'Recherche', icon: Search, path: '/admin/ki-office-recherche', desc: 'Lead-Suche' },
        ].map((item) => (
          <Card 
            key={item.path}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate(item.path)}
          >
            <CardContent className="p-4 text-center">
              <item.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
