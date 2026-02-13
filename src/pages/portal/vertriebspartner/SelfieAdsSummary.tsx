/**
 * Selfie Ads Zusammenfassung — Mandat (Zone 2)
 * Read-only Mandatsakte + CTA "Beauftragen & bezahlen"
 */
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FileText, Image, CreditCard, ArrowLeft, CheckCircle2,
  MapPin, Calendar, Target, Users, Sparkles, User, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TEMPLATE_NAMES: Record<string, string> = {
  T1: 'Rendite-Highlight',
  T2: 'Berater-Portrait',
  T3: 'Objekt-Showcase',
  T4: 'Testimonial',
  T5: 'Region-Focus',
};

export default function SelfieAdsSummary() {
  const navigate = useNavigate();

  const planData = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('selfieAdsPlanData');
      if (raw) return JSON.parse(raw);
    } catch {}
    // Fallback demo data
    return {
      goal: 'Kapitalanleger-Leads',
      platform: 'Facebook + Instagram (Paid)',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      budget: 2500,
      regions: 'München',
      presets: ['Kapitalanlage', 'Immobilien'],
      selectedSlots: ['T1', 'T3', 'T5'],
      personalization: { name: 'Max Berater', region: 'München & Umgebung', claim: 'Ihr Partner für sichere Rendite', phone: '', email: '' },
      creatives: {
        T1: { slides: ['Headline + Kennzahl', 'Rendite-Beispiel', 'Vergleich Tagesgeld', 'CTA + Berater'], caption: 'Sichere Rendite mit Kaufy', cta: 'Jetzt Rendite-Check starten' },
        T3: { slides: ['Objekt-Außenansicht', 'Lage & Infrastruktur', 'Kennzahlen & Rendite', 'CTA + Kontakt'], caption: 'Exklusive Anlageobjekte', cta: 'Objekte entdecken' },
        T5: { slides: ['Region-Karte', 'Marktdaten', 'Preisentwicklung', 'CTA + Berater'], caption: 'Ihr Standortvorteil', cta: 'Marktanalyse anfordern' },
      },
    };
  }, []);

  const formatBudget = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return dateStr; }
  };

  const handleBeauftragen = () => {
    toast.success('Mandat wird zur Zahlung vorbereitet...', {
      description: 'Weiterleitung zum Checkout (Stub — Phase 4)',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/portal/vertriebspartner/selfie-ads-planen')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Zurück zur Planung
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Mandat Zusammenfassung</h1>
        <p className="text-muted-foreground mt-1">Kaufy Selfie Ads — Prüfen & Beauftragen</p>
      </div>

      {/* Mandatsdaten */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><FileText className="h-4 w-4" /> Mandatsdaten</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div><span className="text-muted-foreground text-xs">Ziel</span><p className="font-medium">{planData.goal}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div><span className="text-muted-foreground text-xs">Budget</span><p className="font-medium">{formatBudget(planData.budget)}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div><span className="text-muted-foreground text-xs">Laufzeit</span><p className="font-medium">{formatDate(planData.startDate)} – {formatDate(planData.endDate)}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div><span className="text-muted-foreground text-xs">Regionen</span><p className="font-medium">{planData.regions || '—'}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div><span className="text-muted-foreground text-xs">Zielgruppe</span><p className="font-medium">{planData.presets?.join(', ') || '—'}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div><span className="text-muted-foreground text-xs">Plattform</span><p className="font-medium">{planData.platform}</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalisierung */}
      {planData.personalization?.name && (
        <Card className="glass-card">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-medium flex items-center gap-2"><User className="h-4 w-4" /> Berater-Personalisierung</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Name</span>
                <p className="font-medium">{planData.personalization.name}</p>
              </div>
              {planData.personalization.region && (
                <div>
                  <span className="text-muted-foreground text-xs">Region</span>
                  <p className="font-medium">{planData.personalization.region}</p>
                </div>
              )}
              {planData.personalization.claim && (
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">Claim</span>
                  <p className="font-medium">„{planData.personalization.claim}"</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><Image className="h-4 w-4" /> Template-Slots</h3>
          <div className="space-y-2">
            {planData.selectedSlots?.map((slotKey: string) => {
              const creative = planData.creatives?.[slotKey];
              return (
                <div key={slotKey} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-sm font-medium">{slotKey}: {TEMPLATE_NAMES[slotKey] || slotKey}</span>
                    <Badge variant="default" className="ml-auto text-[10px]">Generiert</Badge>
                  </div>
                  {creative && (
                    <div className="ml-7 space-y-1">
                      <p className="text-xs text-muted-foreground">Caption: {creative.caption}</p>
                      <p className="text-xs text-muted-foreground">CTA: {creative.cta}</p>
                      <div className="flex gap-1 mt-1">
                        {creative.slides?.map((s: string, i: number) => (
                          <div key={i} className="h-8 flex-1 rounded bg-muted/50 border border-border/30 flex items-center justify-center">
                            <span className="text-[7px] text-muted-foreground">{i + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Kaufy veröffentlicht {planData.selectedSlots?.length || 0} Anzeigenvarianten über Kaufy Social-Media-Accounts
          </p>
        </CardContent>
      </Card>

      {/* Leistungsumfang */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-medium flex items-center gap-2"><Shield className="h-4 w-4" /> Leistungsumfang</h3>
          <ul className="text-sm space-y-1.5 text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" /> {planData.selectedSlots?.length || 0} Slideshow-Anzeigen (je 4 Slides + Caption + CTA)</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" /> Veröffentlichung über Kaufy Facebook + Instagram</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" /> Lead-Erfassung & automatische Zuordnung</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" /> Auto-Responder E-Mail an Leads</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" /> Performance-Dashboard & Lead-Inbox</li>
          </ul>
        </CardContent>
      </Card>

      <Separator />

      {/* CTA */}
      <Button size="lg" className="w-full gap-2 text-base" onClick={handleBeauftragen}>
        <CreditCard className="h-5 w-5" />
        Beauftragen & bezahlen — {formatBudget(planData.budget)}
      </Button>
      <p className="text-xs text-center text-muted-foreground pb-4">
        Prepayment. Nach Zahlung wird das Mandat an Kaufy übergeben.
      </p>
    </div>
  );
}
