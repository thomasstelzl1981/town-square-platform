/**
 * SerienEmailsPage — Living demo for MOD-14 "Serien-E-Mails"
 * Shows example campaigns with real posting images and investment copy.
 * No hardcoded DB data — purely presentational demo content.
 */

import { useState } from 'react';
import { Mail, Plus, Eye, BarChart3, Clock, Send, CheckCircle2, Users, TrendingUp, Copy, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

import imgKiPlattform from '@/assets/social/posting-ki-plattform.jpeg';
import imgVermoegen from '@/assets/social/posting-vermoegen.jpeg';
import imgFragen from '@/assets/social/posting-kapitalanlage-fragen.jpeg';
import imgAnalyse from '@/assets/social/posting-analyse-anfordern.jpeg';
import imgOhneVerkaufsdruck from '@/assets/social/posting-ohne-verkaufsdruck.jpeg';
import imgObjekteZahlen from '@/assets/social/posting-objekte-zahlen.jpeg';
import imgStarteKaufy from '@/assets/social/posting-starte-kaufy.jpeg';
import imgDokumente from '@/assets/social/posting-analyse-dokumente.jpeg';

/* ── Demo campaign data ─────────────────────────────── */

interface DemoCampaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  recipients: number;
  openRate: number;
  clickRate: number;
  sentDate?: string;
  scheduledDate?: string;
  slides: { image: string; caption: string; postText: string }[];
}

const DEMO_CAMPAIGNS: DemoCampaign[] = [
  {
    id: '1',
    name: 'Kapitalanlage Herbst-Kampagne',
    status: 'active',
    recipients: 342,
    openRate: 38.2,
    clickRate: 12.4,
    sentDate: '03.02.2026',
    slides: [
      {
        image: imgKiPlattform,
        caption: 'Die KI-Plattform für Kapitalanlageimmobilien',
        postText: 'Marktanalyse, Objektprüfung und digitale Versicherbarkeit – alles auf einer Plattform. Entdecken Sie, wie KI Ihre Immobilienentscheidungen revolutioniert.',
      },
      {
        image: imgVermoegen,
        caption: 'Vermögen aufbauen. Strukturiert. Transparent.',
        postText: 'Immobilien als Kapitalanlage bieten Ihnen eine der sichersten Möglichkeiten, langfristig Vermögen aufzubauen. Mit der richtigen Strategie und fundierten Analysen.',
      },
      {
        image: imgFragen,
        caption: 'Kapitalanlage beginnt mit den richtigen Fragen.',
        postText: 'Welche Rendite ist realistisch? Welche Lage verspricht Stabilität? Wir liefern die Antworten – ohne Verkaufsdruck, mit fundierten Zahlen.',
      },
      {
        image: imgAnalyse,
        caption: 'Kostenlose Analyse anfordern',
        postText: 'Fordern Sie jetzt Ihre individuelle Investmentanalyse an. Unser Team bewertet Standort, Rendite und Risiken – kostenfrei und unverbindlich.',
      },
    ],
  },
  {
    id: '2',
    name: 'Neujahrsaktion – Immobilien 2026',
    status: 'completed',
    recipients: 518,
    openRate: 42.7,
    clickRate: 15.1,
    sentDate: '15.01.2026',
    slides: [
      {
        image: imgOhneVerkaufsdruck,
        caption: 'Immobilien als Kapitalanlage. Ohne Verkaufsdruck.',
        postText: 'Keine Versprechungen. Nur ehrliche Analysen. So treffen Sie Ihre Investmententscheidung auf Basis von Fakten, nicht Emotionen.',
      },
      {
        image: imgObjekteZahlen,
        caption: 'Objekte – Zahlen – Perspektiven.',
        postText: 'Jede Immobilie hat ihre Geschichte. Wir bereiten die Zahlen so auf, dass Sie auf einen Blick Potenzial und Risiko erkennen.',
      },
      {
        image: imgDokumente,
        caption: 'Kostenlose Analyse anfordern.',
        postText: 'Standortanalyse, Renditeberechnung, Cashflow-Prognose – professionell aufbereitet für Ihre Entscheidung.',
      },
    ],
  },
  {
    id: '3',
    name: 'Partner-Onboarding Serie',
    status: 'scheduled',
    recipients: 127,
    openRate: 0,
    clickRate: 0,
    scheduledDate: '17.02.2026',
    slides: [
      {
        image: imgStarteKaufy,
        caption: 'Starte mit Kaufy.',
        postText: 'Kaufy ist Ihr Partner für Kapitalanlageimmobilien. Strukturiert, transparent und digital – so funktioniert modernes Immobilieninvestment.',
      },
    ],
  },
];

const STATUS_MAP: Record<DemoCampaign['status'], { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Entwurf', variant: 'outline' },
  scheduled: { label: 'Geplant', variant: 'secondary' },
  active: { label: 'Aktiv', variant: 'default' },
  completed: { label: 'Abgeschlossen', variant: 'secondary' },
};

/* ── Component ──────────────────────────────────────── */

export function SerienEmailsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<DemoCampaign | null>(null);

  const activeCampaigns = DEMO_CAMPAIGNS.filter(c => c.status === 'active').length;
  const totalRecipients = DEMO_CAMPAIGNS.reduce((s, c) => s + c.recipients, 0);
  const avgOpen = DEMO_CAMPAIGNS.filter(c => c.openRate > 0).reduce((s, c, _, a) => s + c.openRate / a.length, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold uppercase">Serien-E-Mails</h1>
            <p className="text-muted-foreground mt-0.5">Personalisierte E-Mail-Kampagnen mit Immobilien-Content</p>
          </div>
        </div>
        <Button onClick={() => toast.info('Kampagnen-Editor wird vorbereitet…')}>
          <Plus className="h-4 w-4 mr-2" /> Kampagne erstellen
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Kampagnen</p>
              <Send className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{DEMO_CAMPAIGNS.length}</p>
            <p className="text-xs text-muted-foreground">{activeCampaigns} aktiv</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Empfänger</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{totalRecipients.toLocaleString('de-DE')}</p>
            <p className="text-xs text-muted-foreground">Kontakte gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Ø Öffnungsrate</p>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{avgOpen.toFixed(1)}%</p>
            <p className="text-xs text-primary">+3.2% vs. Vormonat</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Ø Klickrate</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">
              {DEMO_CAMPAIGNS.filter(c => c.clickRate > 0).reduce((s, c, _, a) => s + c.clickRate / a.length, 0).toFixed(1)}%
            </p>
            <p className="text-xs text-primary">Über Branchendurchschnitt</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Kampagnen / Vorschau */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Kampagnen</TabsTrigger>
          <TabsTrigger value="content">Content-Bibliothek</TabsTrigger>
        </TabsList>

        {/* ── Tab: Kampagnen ── */}
        <TabsContent value="campaigns" className="space-y-3">
          {DEMO_CAMPAIGNS.map(campaign => {
            const st = STATUS_MAP[campaign.status];
            return (
              <Card
                key={campaign.id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setSelectedCampaign(selectedCampaign?.id === campaign.id ? null : campaign)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Thumbnail strip */}
                      <div className="flex -space-x-2">
                        {campaign.slides.slice(0, 3).map((s, i) => (
                          <img
                            key={i}
                            src={s.image}
                            alt={s.caption}
                            className="w-10 h-10 rounded-md object-cover border-2 border-background"
                          />
                        ))}
                        {campaign.slides.length > 3 && (
                          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                            +{campaign.slides.length - 3}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.slides.length} Slides · {campaign.recipients} Empfänger
                          {campaign.sentDate && ` · Versendet ${campaign.sentDate}`}
                          {campaign.scheduledDate && ` · Geplant für ${campaign.scheduledDate}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {campaign.openRate > 0 && (
                        <div className="text-right hidden md:block">
                          <p className="text-sm font-medium">{campaign.openRate}% geöffnet</p>
                          <Progress value={campaign.openRate} className="w-24 h-1.5 mt-1" />
                        </div>
                      )}
                      <Badge variant={st.variant}>{st.label}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info('Kampagne dupliziert')}>
                            <Copy className="h-4 w-4 mr-2" /> Duplizieren
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('Statistik wird geladen…')}>
                            <BarChart3 className="h-4 w-4 mr-2" /> Statistik
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Expanded slide preview */}
                  {selectedCampaign?.id === campaign.id && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-3">Slide-Vorschau</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {campaign.slides.map((slide, i) => (
                          <div key={i} className="space-y-2">
                            <img
                              src={slide.image}
                              alt={slide.caption}
                              className="w-full aspect-[4/5] object-cover rounded-lg"
                            />
                            <p className="text-xs font-semibold leading-tight">{slide.caption}</p>
                            <p className="text-xs text-muted-foreground leading-snug">{slide.postText}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ── Tab: Content-Bibliothek ── */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Kapitalanlage-Postings</CardTitle>
              <CardDescription>
                Fertige Bild-Text-Kombinationen für Ihre nächste Kampagne. Klicken Sie auf ein Posting, um es in eine Kampagne zu übernehmen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    image: imgKiPlattform,
                    headline: 'Die KI-Plattform für Kapitalanlageimmobilien',
                    text: 'Marktanalyse, Objektprüfung und digitale Versicherbarkeit – alles auf einer Plattform. Investieren Sie smart in Immobilien.',
                  },
                  {
                    image: imgVermoegen,
                    headline: 'Vermögen aufbauen. Strukturiert.',
                    text: 'Mit Immobilien als Kapitalanlage schaffen Sie nachhaltigen Wohlstand. Schritt für Schritt, mit klarer Strategie.',
                  },
                  {
                    image: imgFragen,
                    headline: 'Die richtigen Fragen stellen',
                    text: 'Kapitalanlage beginnt mit den richtigen Fragen. Wir liefern Antworten – fundiert, transparent und ohne Verkaufsdruck.',
                  },
                  {
                    image: imgAnalyse,
                    headline: 'Kostenlose Analyse anfordern',
                    text: 'Erhalten Sie eine professionelle Bewertung Ihres Investmentpotenzials. Kostenfrei und unverbindlich.',
                  },
                  {
                    image: imgOhneVerkaufsdruck,
                    headline: 'Ohne Verkaufsdruck investieren',
                    text: 'Keine Versprechungen – nur ehrliche Analysen. Treffen Sie Ihre Investmententscheidung auf Basis von Fakten.',
                  },
                  {
                    image: imgObjekteZahlen,
                    headline: 'Objekte – Zahlen – Perspektiven',
                    text: 'Jede Immobilie hat ihre Geschichte. Wir bereiten die Zahlen auf, damit Sie Potenzial und Risiko sofort erkennen.',
                  },
                  {
                    image: imgDokumente,
                    headline: 'Professionelle Standortanalyse',
                    text: 'Standortanalyse, Renditeberechnung, Cashflow-Prognose – professionell aufbereitet für Ihre Entscheidung.',
                  },
                  {
                    image: imgStarteKaufy,
                    headline: 'Starte mit Kaufy',
                    text: 'Ihr Partner für Kapitalanlageimmobilien. Strukturiert, transparent und digital – modernes Immobilieninvestment.',
                  },
                ].map((item, i) => (
                  <Card
                    key={i}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                    onClick={() => toast.success(`"${item.headline}" in Kampagne übernommen`)}
                  >
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.headline}
                        className="w-full aspect-[4/5] object-cover group-hover:scale-[1.02] transition-transform"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur text-xs">
                          <Plus className="h-3 w-3 mr-1" /> Verwenden
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="pt-3 pb-3 space-y-1">
                      <p className="text-sm font-semibold leading-tight">{item.headline}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{item.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
