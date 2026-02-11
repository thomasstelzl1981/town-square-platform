/**
 * Social Overview — Dashboard with Platform Cards, Live Stats, Setup Progress
 */
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Share2, ArrowRight, Mic, BookOpen, PenTool, Calendar, CheckCircle2,
  Linkedin, Instagram, Facebook, Link2, ExternalLink, Image, BarChart3,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const PLATFORMS = [
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'bg-[#0A66C2]', textColor: 'text-white' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-[#1877F2]', textColor: 'text-white' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]', textColor: 'text-white' },
];

export function OverviewPage() {
  const navigate = useNavigate();
  const { activeOrganization, user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || 'dev-user';
  const [connectDialog, setConnectDialog] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState('');

  // Live data queries
  const { data: auditProfile } = useQuery({
    queryKey: ['social-audit-status', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return null;
      const { data } = await supabase
        .from('social_personality_profiles')
        .select('id')
        .eq('tenant_id', activeOrganization.id)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!activeOrganization?.id,
  });

  const { data: topicCount = 0 } = useQuery({
    queryKey: ['social-topic-count', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return 0;
      const { count } = await supabase
        .from('social_topics')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', activeOrganization.id);
      return count || 0;
    },
    enabled: !!activeOrganization?.id,
  });

  const { data: draftStats } = useQuery({
    queryKey: ['social-draft-stats', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return { total: 0, planned: 0, posted: 0 };
      const { data } = await supabase
        .from('social_drafts')
        .select('status')
        .eq('tenant_id', activeOrganization.id);
      const items = data || [];
      return {
        total: items.length,
        planned: items.filter((d) => d.status === 'planned').length,
        posted: items.filter((d) => d.status === 'posted_manual').length,
      };
    },
    enabled: !!activeOrganization?.id,
  });

  const { data: assetCount = 0 } = useQuery({
    queryKey: ['social-asset-count', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return 0;
      const { count } = await supabase
        .from('social_assets')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', activeOrganization.id);
      return count || 0;
    },
    enabled: !!activeOrganization?.id,
  });

  const { data: connectedPlatforms = [] } = useQuery({
    queryKey: ['social-connected-platforms', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      const { data } = await supabase
        .from('social_inspiration_sources')
        .select('platform, profile_url')
        .eq('tenant_id', activeOrganization.id)
        .in('platform', ['linkedin', 'facebook', 'instagram']);
      return data || [];
    },
    enabled: !!activeOrganization?.id,
  });

  // Setup progress
  const auditDone = !!auditProfile;
  const topicsDone = topicCount > 0;
  const draftsDone = (draftStats?.total || 0) > 0;
  const assetsDone = assetCount > 0;
  const steps = [auditDone, topicsDone, assetsDone, draftsDone];
  const progressPercent = Math.round((steps.filter(Boolean).length / steps.length) * 100);

  const isConnected = (platform: string) =>
    connectedPlatforms.some((p) => p.platform === platform);

  const getProfileUrl = (platform: string) =>
    connectedPlatforms.find((p) => p.platform === platform)?.profile_url;

  const handleConnect = async () => {
    if (!connectDialog || !activeOrganization?.id) return;
    const existing = connectedPlatforms.find((p) => p.platform === connectDialog);
    if (existing) {
      // Update would need the id — for simplicity just inform
      toast({ title: 'Bereits verbunden' });
      setConnectDialog(null);
      setProfileUrl('');
      return;
    }
    const { error } = await supabase.from('social_inspiration_sources').insert({
      tenant_id: activeOrganization.id,
      owner_user_id: userId,
      platform: connectDialog,
      display_name: `Mein ${connectDialog} Profil`,
      profile_url: profileUrl || null,
    });
    if (error) {
      toast({ title: 'Fehler', variant: 'destructive' });
    } else {
      toast({ title: 'Plattform verbunden' });
      queryClient.invalidateQueries({ queryKey: ['social-connected-platforms'] });
    }
    setConnectDialog(null);
    setProfileUrl('');
  };

  const statCards = [
    {
      label: 'Audit',
      value: auditDone ? 'Abgeschlossen' : 'Offen',
      icon: Mic,
      done: auditDone,
      path: 'audit',
    },
    {
      label: 'Themen',
      value: `${topicCount} von 10`,
      icon: BookOpen,
      done: topicsDone,
      path: 'knowledge',
    },
    {
      label: 'Assets',
      value: `${assetCount} Fotos`,
      icon: Image,
      done: assetsDone,
      path: 'assets',
    },
    {
      label: 'Entwürfe',
      value: `${draftStats?.total || 0} gesamt`,
      sub: draftStats?.posted ? `${draftStats.posted} gepostet` : undefined,
      icon: PenTool,
      done: draftsDone,
      path: 'create',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-8">
      {/* Hero */}
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-primary/10 p-3">
          <Share2 className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Social</h1>
          <p className="text-muted-foreground mt-1">
            Baue deine Personal Brand auf — KI-gestützt, authentisch, in deinem Stil.
          </p>
        </div>
      </div>

      {/* Workflow-Erklärung */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5 pb-4 space-y-3">
          <h2 className="font-semibold text-sm">So funktioniert Social</h2>
          <p className="text-xs text-muted-foreground">
            Wir erstellen Content für dich — du postest ihn manuell auf deinen Plattformen und trackst hier deine Ergebnisse.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            {[
              { step: '1', label: 'Profil-Audit', desc: 'Persönlichkeit erfassen' },
              { step: '2', label: 'Themen festlegen', desc: 'Dein Editorial-Focus' },
              { step: '3', label: 'Vorbilder analysieren', desc: 'Patterns extrahieren' },
              { step: '4', label: 'Content erstellen', desc: 'KI-gestützt texten' },
              { step: '5', label: 'Planen & Posten', desc: 'Manuell veröffentlichen' },
              { step: '6', label: 'Performance tracken', desc: 'Kennzahlen erfassen' },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                  {s.step}
                </div>
                <div>
                  <span className="font-medium text-foreground">{s.label}</span>
                  <span className="text-muted-foreground ml-1">— {s.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Setup Progress */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Setup-Fortschritt</h2>
            <span className="text-sm font-medium text-muted-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex gap-4 text-xs text-muted-foreground">
            {[
              { label: 'Audit', done: auditDone },
              { label: 'Themen', done: topicsDone },
              { label: 'Assets', done: assetsDone },
              { label: 'Content', done: draftsDone },
            ].map((s) => (
              <span key={s.label} className="flex items-center gap-1">
                {s.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                )}
                {s.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Profile Cards */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Deine Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLATFORMS.map((p) => {
            const connected = isConnected(p.key);
            const url = getProfileUrl(p.key);
            return (
              <Card
                key={p.key}
                className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  connected ? 'border-green-300/50' : 'border-dashed'
                }`}
                onClick={() => {
                  if (!connected) {
                    setConnectDialog(p.key);
                  }
                }}
              >
                <CardContent className="p-0">
                  <div className={`${p.color} ${p.textColor} px-4 py-3 flex items-center gap-3`}>
                    <p.icon className="h-6 w-6" />
                    <span className="font-semibold">{p.label}</span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    {connected ? (
                      <>
                        <Badge variant="outline" className="text-green-600 border-green-300 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Profil hinterlegt
                        </Badge>
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-muted-foreground">Profil hinterlegen</span>
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Live Stats */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className="cursor-pointer hover:bg-accent/30 transition-colors"
              onClick={() => navigate(stat.path)}
            >
              <CardContent className="pt-4 pb-3 px-4 space-y-2">
                <div className="flex items-center justify-between">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                  {stat.done && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </div>
                <div>
                  <p className="text-lg font-bold">{stat.value}</p>
                  {stat.sub && <p className="text-xs text-muted-foreground">{stat.sub}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Schnellzugriff
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Audit starten', desc: 'Armstrong erfasst deine Persönlichkeit', icon: Mic, path: 'audit', show: !auditDone },
            { label: 'Themen definieren', desc: 'Bis zu 10 Editorial-Focus-Themen', icon: BookOpen, path: 'knowledge', show: true },
            { label: 'Content erstellen', desc: 'Neuen Entwurf mit KI generieren', icon: PenTool, path: 'create', show: true },
            { label: 'Kalender öffnen', desc: 'Planen und als gepostet markieren', icon: Calendar, path: 'calendar', show: true },
            { label: 'Fotos hochladen', desc: 'Bis zu 20 Portraits & Bilder', icon: Image, path: 'assets', show: true },
            { label: 'Performance', desc: 'Metriken erfassen und analysieren', icon: BarChart3, path: 'performance', show: true },
          ]
            .filter((a) => a.show)
            .map((action) => (
              <Card
                key={action.path}
                className="cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                    <action.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Connect Dialog */}
      <Dialog open={!!connectDialog} onOpenChange={(o) => !o && setConnectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {PLATFORMS.find((p) => p.key === connectDialog)?.label} — Profil hinterlegen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Profil-URL</Label>
              <Input
                placeholder="https://linkedin.com/in/dein-profil"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional — hilft der KI, deinen Stil besser einzuordnen.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialog(null)}>Abbrechen</Button>
            <Button onClick={handleConnect}>Verbinden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
