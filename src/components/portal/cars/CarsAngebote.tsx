/**
 * CarsAngebote — Miete24 Auto-Abos + BMW/MINI Fokusmodelle (Helming & Sohn)
 * Real data scraped from miete24.com and helming-sohn.de
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Car, Star, ShoppingCart, Zap } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

// ── Miete24 Auto-Abo offers (real data from miete24.com) ──────────────────────
interface Miete24Offer {
  id: string;
  title: string;
  image: string;
  priceMonthly: string;
  fuel: string;
  transmission: string;
  link: string;
}

const MIETE24_OFFERS: Miete24Offer[] = [
  { id: 'm1', title: 'MG MG3 1.5 85kW Benzin', image: 'https://www.miete24.com/media/images/thumb/Nk7UWC.png', priceMonthly: '149', fuel: 'Benzin', transmission: 'Manuell', link: 'https://www.miete24.com/mg-mg3-1-5-85kw-frontantrieb-manuell-ice-benzin-grau' },
  { id: 'm2', title: 'Dacia Duster Hybrid 140', image: 'https://www.miete24.com/media/images/thumb/LWXAcJ.png', priceMonthly: '179', fuel: 'Hybrid', transmission: 'Automatik', link: 'https://www.miete24.com/dacia-duster-mild-hybrid-140-benzin-bronze' },
  { id: 'm3', title: 'Opel Corsa 1.2 Turbo 74kW', image: 'https://www.miete24.com/media/images/thumb/71Ofm8.png', priceMonthly: '179', fuel: 'Benzin', transmission: 'Manuell', link: 'https://www.miete24.com/opel-corsa-1-2-direct-injection-turbo-74kw-benzin-grau' },
  { id: 'm4', title: 'MG MG3 1.5 85kW Blau', image: 'https://www.miete24.com/media/images/thumb/lBb0bP.png', priceMonthly: '169', fuel: 'Benzin', transmission: 'Manuell', link: 'https://www.miete24.com/mg-mg3-1-5-85kw-benzin-blau' },
  { id: 'm5', title: 'MG MG3 1.5 85kW Rot', image: 'https://www.miete24.com/media/images/thumb/MPie0W.png', priceMonthly: '169', fuel: 'Benzin', transmission: 'Manuell', link: 'https://www.miete24.com/mg-mg3-1-5-85kw-benzin-rot' },
  { id: 'm6', title: 'MG MG3 1.5 85kW Schwarz', image: 'https://www.miete24.com/media/images/thumb/DHZXGw.png', priceMonthly: '169', fuel: 'Benzin', transmission: 'Manuell', link: 'https://www.miete24.com/mg-mg3-1-5-85kw-benzin-schwarz' },
];

// ── BMW/MINI Fokusmodelle (real data from helming-sohn.de) ────────────────────
interface FokusModell {
  id: string;
  title: string;
  code: string;
  image: string;
  priceMonthly: string;
  upe: string;
  term: string;
  kmPerYear: string;
  power: string;
  fuel: string;
  sonderzahlung?: string;
  configLink: string;
  brand: 'BMW' | 'MINI';
}

const FOKUS_MODELLE: FokusModell[] = [
  {
    id: 'f1', title: 'BMW M135 xDrive', code: 'F70', brand: 'BMW',
    image: 'https://helming-sohn.de/wp-content/uploads/2025/12/Bildschirmfoto-2025-12-17-um-12.36.07.png',
    priceMonthly: '269', upe: '54.700', term: '18 Monate', kmPerYear: '10.000 km', power: '221 kW (300 PS)', fuel: 'Benzin',
    configLink: 'https://configure.bmw.de/de_DE/configure/F70/21GE/',
  },
  {
    id: 'f2', title: 'BMW 330i xDrive Touring', code: 'G21', brand: 'BMW',
    image: 'https://helming-sohn.de/wp-content/uploads/2025/12/Bildschirmfoto-2025-12-17-um-12.36.23.png',
    priceMonthly: '299', upe: '58.400', term: '18 Monate', kmPerYear: '10.000 km', power: '180 kW (245 PS)', fuel: 'Benzin',
    configLink: 'https://configure.bmw.de/de_DE/configure/G21/71FY/',
  },
  {
    id: 'f3', title: 'BMW 540d xDrive Touring', code: 'G61', brand: 'BMW',
    image: 'https://helming-sohn.de/wp-content/uploads/2025/12/Bildschirmfoto-2025-12-17-um-12.36.32.png',
    priceMonthly: '449', upe: '69.200', term: '18 Monate', kmPerYear: '10.000 km', power: '223 kW (303 PS)', fuel: 'Diesel',
    configLink: 'https://configure.bmw.de/de_DE/configure/G61/31GW/',
  },
  {
    id: 'f4', title: 'MINI Cooper E Blackyard', code: 'F65', brand: 'MINI',
    image: 'https://helming-sohn.de/wp-content/uploads/2026/01/Cooper_E_Blackyard.png',
    priceMonthly: '151', upe: '—', term: '36 Monate', kmPerYear: '5.000 km', power: '135 kW (184 PS)', fuel: 'Elektro',
    sonderzahlung: '798,32', configLink: 'https://configure.mini.de/de_DE/configure/J01/11GC/',
  },
  {
    id: 'f5', title: 'MINI Aceman E Blackyard', code: 'J05', brand: 'MINI',
    image: 'https://helming-sohn.de/wp-content/uploads/2026/01/Aceman_E_Blackyard.png',
    priceMonthly: '176', upe: '—', term: '36 Monate', kmPerYear: '5.000 km', power: '135 kW (184 PS)', fuel: 'Elektro',
    sonderzahlung: '798,32', configLink: 'https://configure.mini.de/de_DE/configure/J05/31GC/',
  },
  {
    id: 'f6', title: 'MINI Aceman E', code: 'J05', brand: 'MINI',
    image: 'https://helming-sohn.de/wp-content/uploads/2026/01/MINI_Fokus_Q1.jpeg',
    priceMonthly: '188', upe: '26.008', term: '36 Monate', kmPerYear: '5.000 km', power: '135 kW (184 PS)', fuel: 'Elektro',
    configLink: 'https://configure.mini.de/de_DE/configure/J05/31GC/',
  },
  {
    id: 'f7', title: 'MINI Countryman E Blackyard', code: 'U25', brand: 'MINI',
    image: 'https://helming-sohn.de/wp-content/uploads/2026/01/Countryman_E_Blackyard.png',
    priceMonthly: '196', upe: '—', term: '42 Monate', kmPerYear: '5.000 km', power: '150 kW (204 PS)', fuel: 'Elektro',
    sonderzahlung: '857,14', configLink: 'https://configure.mini.de/de_DE/configure/U25E/41GA/',
  },
];

export default function CarsAngebote() {
  return (
    <PageShell>
      <ModulePageHeader
        title="Angebote"
        description="Auto-Abos und Großkunden-Sonderleasing"
      />

      {/* ── SECTION 1: Miete24 ──────────────────────────────────────────── */}
      <Card className="glass-card border-primary/10 overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-between px-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">miete24</h2>
            <p className="text-sm text-muted-foreground mt-1">Auto Abo Vergleich — die besten & günstigsten Angebote</p>
            <p className="text-xs text-muted-foreground mt-0.5">Versicherung, KFZ-Steuer, Wartung & TÜV inklusive</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="https://www.miete24.com/auto-abos" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> miete24.com
            </a>
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MIETE24_OFFERS.map((offer) => (
          <Card key={offer.id} className="glass-card border-primary/10 hover:border-primary/30 transition-all group overflow-hidden">
            <div className="relative h-36 bg-muted/20 flex items-center justify-center overflow-hidden p-4">
              <img src={offer.image} alt={offer.title} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
            </div>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">{offer.title}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px]">{offer.fuel}</Badge>
                <Badge variant="outline" className="text-[9px]">{offer.transmission}</Badge>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div>
                  <span className="text-[9px] text-muted-foreground">ab </span>
                  <span className="text-lg font-bold">{offer.priceMonthly} €</span>
                  <span className="text-[10px] text-muted-foreground"> /Monat inkl. MwSt.</span>
                </div>
                <Button size="sm" className="gap-1 text-xs" asChild>
                  <a href={offer.link} target="_blank" rel="noopener noreferrer">
                    <ShoppingCart className="h-3 w-3" /> Zum Abo
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-2" />

      {/* ── SECTION 2: BMW & MINI Fokusmodelle ─────────────────────────── */}
      <Card className="glass-card border-primary/10 overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-blue-900/80 to-stone-900/80 flex items-center justify-between px-8">
          <div>
            <Badge className="mb-1 bg-amber-500/20 text-amber-300 border-amber-500/30">Nur für Partner</Badge>
            <h2 className="text-2xl font-bold text-white">BMW & MINI Fokusmodelle</h2>
            <p className="text-sm text-white/70 mt-1">Großkunden-Sonderleasing · Gültig 01.01.2026 – 31.03.2026</p>
          </div>
          <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" size="sm" asChild>
            <a href="https://helming-sohn.de/kundengruppen/grosskunden-fokusmodelle/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Helming & Sohn
            </a>
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {FOKUS_MODELLE.map((model) => (
          <Card key={model.id} className="glass-card border-primary/10 hover:border-primary/30 transition-all group overflow-hidden">
            <div className="relative h-40 bg-muted/20 flex items-center justify-center overflow-hidden p-4">
              <img src={model.image} alt={model.title} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
              <Badge variant="outline" className="absolute top-2 left-3 text-[9px] bg-background/80 backdrop-blur-sm">
                {model.brand}
              </Badge>
              {model.fuel === 'Elektro' && (
                <Badge className="absolute top-2 right-3 text-[9px] gap-0.5 bg-green-500/20 text-green-600 border-green-500/30">
                  <Zap className="h-2.5 w-2.5" /> Elektro
                </Badge>
              )}
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-sm">{model.title}</h3>
                <p className="text-[10px] text-muted-foreground">{model.code} · {model.power}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase">Laufzeit</p>
                  <p className="text-xs font-medium">{model.term}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase">KM/Jahr</p>
                  <p className="text-xs font-medium">{model.kmPerYear}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase">UPE netto</p>
                  <p className="text-xs font-medium">{model.upe !== '—' ? `${model.upe} €` : '—'}</p>
                </div>
              </div>
              {model.sonderzahlung && (
                <p className="text-[9px] text-muted-foreground">Sonderzahlung: {model.sonderzahlung} €</p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div>
                  <span className="text-[9px] text-muted-foreground">ab </span>
                  <span className="text-lg font-bold">{model.priceMonthly},– €</span>
                  <span className="text-[10px] text-muted-foreground"> /Monat zzgl. MwSt.</span>
                </div>
                <Button size="sm" variant="outline" className="gap-1 text-xs" asChild>
                  <a href={model.configLink} target="_blank" rel="noopener noreferrer">
                    <Car className="h-3 w-3" /> Konfigurator
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground max-w-3xl">
        ¹ Unverbindliche Leasingbeispiele. Alle Preise zzgl. MwSt. Kosten für Überführung und Zulassung nicht enthalten. 
        Vollkaskoversicherung erforderlich. Weitere Laufzeiten und Laufleistungen möglich. Stand 01/2026. Helming & Sohn GmbH.
      </p>
    </PageShell>
  );
}
