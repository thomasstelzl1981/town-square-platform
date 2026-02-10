/**
 * Social Media Vertrieb Detail — Mandatsakte (Zone 1)
 * Vollständige Akte mit Publishing-Statusmaschine
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FileText, Image, Send, Pause, CheckCircle2, Users, CreditCard,
  Calendar, MapPin, ArrowLeft, Play, Square, Target, Sparkles, Clock
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const STATUSES = ['submitted', 'review', 'approved', 'scheduled', 'live', 'paused', 'ended', 'failed'] as const;

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; color: string }> = {
  submitted: { label: 'Eingereicht', variant: 'outline', color: 'text-muted-foreground' },
  review: { label: 'In Prüfung', variant: 'secondary', color: 'text-amber-600' },
  approved: { label: 'Genehmigt', variant: 'secondary', color: 'text-blue-600' },
  scheduled: { label: 'Geplant', variant: 'secondary', color: 'text-indigo-600' },
  live: { label: 'Live', variant: 'default', color: 'text-green-600' },
  paused: { label: 'Pausiert', variant: 'outline', color: 'text-amber-600' },
  ended: { label: 'Beendet', variant: 'outline', color: 'text-muted-foreground' },
  failed: { label: 'Fehler', variant: 'destructive', color: 'text-destructive' },
};

const TRANSITIONS: Record<string, string[]> = {
  submitted: ['review'],
  review: ['approved', 'submitted'],
  approved: ['scheduled'],
  scheduled: ['live', 'paused'],
  live: ['paused', 'ended'],
  paused: ['live', 'ended'],
  ended: [],
  failed: ['review'],
};

const ACTION_ICONS: Record<string, any> = {
  review: Clock,
  approved: CheckCircle2,
  scheduled: Calendar,
  live: Play,
  paused: Pause,
  ended: Square,
  submitted: ArrowLeft,
};

// Demo data for mandate detail
const DEMO_MANDATE = {
  partner: 'Max Berater GmbH',
  budget: 2500,
  spend: 1240,
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  regions: 'München',
  presets: ['Kapitalanlage', 'Immobilien'],
  slots: [
    { key: 'T1', name: 'Rendite-Highlight', caption: 'Sichere Rendite mit Kaufy', cta: 'Jetzt Rendite-Check starten' },
    { key: 'T3', name: 'Objekt-Showcase', caption: 'Exklusive Anlageobjekte', cta: 'Objekte entdecken' },
    { key: 'T5', name: 'Region-Focus', caption: 'Ihr Standortvorteil', cta: 'Marktanalyse anfordern' },
  ],
  personalization: { name: 'Max Berater', region: 'München & Umgebung', claim: 'Ihr Partner für sichere Rendite' },
  leads: 12,
  payment: 'paid',
};

export default function SocialMediaVertriebDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('live');

  const possibleTransitions = TRANSITIONS[status] || [];

  const handleTransition = (newStatus: string) => {
    setStatus(newStatus);
    toast.success(`Status geändert: ${statusConfig[newStatus]?.label}`);
  };

  const formatBudget = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

  const sc = statusConfig[status] || statusConfig.submitted;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/social-media/vertrieb')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Zurück
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Mandat #{id?.slice(0, 6) || 'Demo'}</h1>
            <p className="text-sm text-muted-foreground">{DEMO_MANDATE.partner} · Partner-Mandatsakte</p>
          </div>
        </div>
        <Badge variant={sc.variant} className="text-sm px-3 py-1">{sc.label}</Badge>
      </div>

      {/* Status Pipeline */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><Clock className="h-4 w-4" /> Status-Pipeline</h3>
          <div className="flex gap-1 items-center">
            {STATUSES.filter(s => !['failed'].includes(s)).map((s, i) => {
              const isActive = s === status;
              const isPast = STATUSES.indexOf(s) < STATUSES.indexOf(status as any);
              return (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div className={`flex-1 h-2 rounded-full transition-colors ${
                    isActive ? 'bg-primary' : isPast ? 'bg-primary/40' : 'bg-muted/50'
                  }`} />
                  {i < 6 && <div className="w-px h-2" />}
                </div>
              );
            })}
          </div>
          <div className="flex gap-1">
            {STATUSES.filter(s => !['failed'].includes(s)).map((s) => (
              <div key={s} className={`flex-1 text-center text-[9px] ${s === status ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                {statusConfig[s]?.label}
              </div>
            ))}
          </div>
          {possibleTransitions.length > 0 && (
            <>
              <Separator />
              <div className="flex gap-2 flex-wrap">
                {possibleTransitions.map(t => {
                  const Icon = ACTION_ICONS[t] || CheckCircle2;
                  return (
                    <Button key={t} variant="outline" size="sm" className="gap-1" onClick={() => handleTransition(t)}>
                      <Icon className="h-3 w-3" /> {statusConfig[t]?.label}
                    </Button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Mandatsdaten */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium">Mandatsdaten</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2"><Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" /><div><span className="text-xs text-muted-foreground">Partner</span><p className="font-medium">{DEMO_MANDATE.partner}</p></div></div>
            <div className="flex items-start gap-2"><CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" /><div><span className="text-xs text-muted-foreground">Budget</span><p className="font-medium">{formatBudget(DEMO_MANDATE.budget)}</p></div></div>
            <div className="flex items-start gap-2"><Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" /><div><span className="text-xs text-muted-foreground">Laufzeit</span><p className="font-medium">{DEMO_MANDATE.startDate} – {DEMO_MANDATE.endDate}</p></div></div>
            <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" /><div><span className="text-xs text-muted-foreground">Regionen</span><p className="font-medium">{DEMO_MANDATE.regions}</p></div></div>
            <div className="flex items-start gap-2"><Target className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" /><div><span className="text-xs text-muted-foreground">Zielgruppe</span><p className="font-medium">{DEMO_MANDATE.presets.join(', ')}</p></div></div>
            <div className="flex items-start gap-2"><Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" /><div><span className="text-xs text-muted-foreground">Berater</span><p className="font-medium">{DEMO_MANDATE.personalization.name}</p></div></div>
            <div className="flex items-start gap-2"><Sparkles className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" /><div><span className="text-xs text-muted-foreground">Claim</span><p className="font-medium">„{DEMO_MANDATE.personalization.claim}"</p></div></div>
            <div className="flex items-start gap-2"><Target className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" /><div><span className="text-xs text-muted-foreground">Leads</span><p className="font-medium">{DEMO_MANDATE.leads}</p></div></div>
          </div>
        </CardContent>
      </Card>

      {/* Creatives */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><Image className="h-4 w-4" /> Creatives ({DEMO_MANDATE.slots.length} Slots)</h3>
          <div className="space-y-3">
            {DEMO_MANDATE.slots.map((slot) => (
              <div key={slot.key} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{slot.key}: {slot.name}</p>
                  <Badge variant="default" className="text-[10px]">Generiert</Badge>
                </div>
                <div className="flex gap-2 mb-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-14 flex-1 rounded bg-muted/50 border border-border/30 flex items-center justify-center">
                      <span className="text-[8px] text-muted-foreground">Slide {i}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Caption: {slot.caption}</p>
                <p className="text-xs text-muted-foreground">CTA: {slot.cta}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Publishing Plan */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><Send className="h-4 w-4" /> Publishing Plan</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-xs text-muted-foreground">Plattform</span><p className="font-medium">Meta (Facebook + Instagram)</p></div>
            <div><span className="text-xs text-muted-foreground">Kaufy Accounts</span><p className="font-medium">Kaufy Page + Kaufy IG</p></div>
            <div><span className="text-xs text-muted-foreground">Campaign ID</span><p className="font-medium text-muted-foreground">— (wird bei Veröffentlichung gesetzt)</p></div>
            <div><span className="text-xs text-muted-foreground">Form IDs</span><p className="font-medium text-muted-foreground">— (wird bei Veröffentlichung gesetzt)</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Abrechnung */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-medium flex items-center gap-2"><CreditCard className="h-4 w-4" /> Abrechnung</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Prepaid</span>
              <p className="font-medium">{formatBudget(DEMO_MANDATE.budget)}</p>
              <Badge variant={DEMO_MANDATE.payment === 'paid' ? 'secondary' : 'destructive'} className="text-[10px] mt-1">
                {DEMO_MANDATE.payment === 'paid' ? 'Bezahlt' : 'Offen'}
              </Badge>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Spend</span>
              <p className="font-medium">{formatBudget(DEMO_MANDATE.spend)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Verbleibend</span>
              <p className="font-medium">{formatBudget(DEMO_MANDATE.budget - DEMO_MANDATE.spend)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
