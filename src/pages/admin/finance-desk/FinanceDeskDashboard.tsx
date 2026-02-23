/**
 * FinanceDeskDashboard — KPI + Beratungsfelder Overview
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Landmark, Shield, HeartHandshake, Building2, TrendingUp, ArrowRight, Video, Inbox, Users } from 'lucide-react';

const BERATUNGSFELDER = [
  { icon: Landmark, label: 'Stiftungen', desc: 'Stiftungsgründung & -verwaltung' },
  { icon: Shield, label: 'Vermögensschutz', desc: 'Asset Protection & Strukturierung' },
  { icon: HeartHandshake, label: 'Generationenvermögen', desc: 'Generationsübergreifender Vermögenserhalt' },
  { icon: Building2, label: 'Gewerbliche Versicherungen', desc: 'Betriebliche Versicherungskonzepte' },
  { icon: TrendingUp, label: 'Finanzierungen', desc: 'Privat- & Investitionsfinanzierungen' },
];

export default function FinanceDeskDashboard() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, newCount: 0, contacted: 0, qualified: 0, converted: 0 });

  useEffect(() => {
    if (!isPlatformAdmin) return;
    (async () => {
      try {
        const { data } = await supabase.from('leads').select('id, status');
        const leads = data || [];
        setStats({
          total: leads.length,
          newCount: leads.filter(l => l.status === 'new').length,
          contacted: leads.filter(l => l.status === 'contacted').length,
          qualified: leads.filter(l => l.status === 'qualified').length,
          converted: leads.filter(l => l.status === 'converted').length,
        });
      } catch (err) {
        console.error('FinanceDeskDashboard fetch:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isPlatformAdmin]);

  if (!isPlatformAdmin) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Nur für Platform Admins</p></div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const kpiCards = [
    { label: 'Offene Anfragen', value: stats.newCount, icon: Inbox, color: 'text-amber-500' },
    { label: 'Kontaktiert', value: stats.contacted, icon: Users, color: 'text-primary' },
    { label: 'Qualifiziert', value: stats.qualified, icon: Video, color: 'text-emerald-500' },
    { label: 'Abgeschlossen', value: stats.converted, icon: Shield, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(k => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5 text-primary" />
            Persönliche Finanzberatung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Nutzer können über das Portal oder die Website eine persönliche Finanzberatung per
            Videotermin anfragen. Eingehende Leads erscheinen im Inbox.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BERATUNGSFELDER.map(feld => (
              <div key={feld.label} className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <feld.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{feld.label}</p>
                  <p className="text-xs text-muted-foreground">{feld.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            <Badge variant="secondary" className="shrink-0">Lead-Flow</Badge>
            <span>Anfrage via Website/Portal</span>
            <ArrowRight className="h-3 w-3 shrink-0" />
            <span>Finance Desk (Triage)</span>
            <ArrowRight className="h-3 w-3 shrink-0" />
            <span>Zuweisung an Berater</span>
            <ArrowRight className="h-3 w-3 shrink-0" />
            <span>Videoberatung</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
