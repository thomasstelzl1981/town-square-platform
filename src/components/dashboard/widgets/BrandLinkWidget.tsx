/**
 * BrandLinkWidget — Individual brand tile as a system widget
 * Renders as aspect-square with full brand gradient background
 */

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Landmark, Building2, Search } from 'lucide-react';

interface BrandConfig {
  name: string;
  nameElement?: React.ReactNode;
  tagline: string;
  description: string;
  badge: string;
  gradient: string;
  icon: React.ReactNode;
  url: string;
}

const BRAND_CONFIGS: Record<string, BrandConfig> = {
  'SYS.BRAND.KAUFY': {
    name: 'KAUFY',
    tagline: 'Marktplatz & Investment',
    description: 'Immobilien kaufen, verkaufen und als Kapitalanlage entdecken.',
    badge: 'Marktplatz',
    gradient: 'from-[hsl(220,85%,55%)] to-[hsl(245,75%,60%)]',
    icon: <ShoppingBag className="h-6 w-6 text-white" />,
    url: '/website/kaufy',
  },
  'SYS.BRAND.FUTUREROOM': {
    name: 'FutureRoom',
    nameElement: <>Future<span className="font-light">Room</span></>,
    tagline: 'Finanzierung',
    description: 'KI-gestützte Aufbereitung und digitale Bankeinreichung.',
    badge: '400+ Bankpartner',
    gradient: 'from-[hsl(165,70%,36%)] to-[hsl(158,64%,52%)]',
    icon: <Landmark className="h-6 w-6 text-white" />,
    url: '/website/futureroom',
  },
  'SYS.BRAND.SOT': {
    name: 'SystemofaTown',
    nameElement: <>System<span className="font-light">ofaTown</span></>,
    tagline: 'Management Suite',
    description: 'Immobilienverwaltung, KI-Office und operative Steuerung.',
    badge: 'All-in-One',
    gradient: 'from-[hsl(0,0%,15%)] to-[hsl(0,0%,30%)]',
    icon: <Building2 className="h-6 w-6 text-white" />,
    url: '/website/sot',
  },
  'SYS.BRAND.ACQUIARY': {
    name: 'ACQUIARY',
    tagline: 'Sourcing & Akquisition',
    description: 'Immobilien-Sourcing, Analyse und strategische Akquisition.',
    badge: 'Investment House',
    gradient: 'from-[hsl(210,80%,50%)] to-[hsl(200,70%,40%)]',
    icon: <Search className="h-6 w-6 text-white" />,
    url: '/website/acquiary',
  },
};

interface BrandLinkWidgetProps {
  code: string;
}

export const BrandLinkWidget = memo(function BrandLinkWidget({ code }: BrandLinkWidgetProps) {
  const config = BRAND_CONFIGS[code];
  if (!config) return null;

  return (
    <Card className="h-[260px] md:h-auto md:aspect-square overflow-hidden border-0 shadow-card">
      <CardContent className="p-0 h-full">
        <a
          href={config.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`h-full bg-gradient-to-br ${config.gradient} p-5 flex flex-col items-center justify-center text-white text-center gap-3 group transition-all hover:brightness-110`}
        >
          <div className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            {config.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              {config.nameElement || config.name}
            </h3>
            <p className="text-xs text-white/70 uppercase tracking-wider mt-0.5">
              {config.tagline}
            </p>
          </div>
          <p className="text-sm text-white/80 leading-relaxed line-clamp-2 max-w-[180px]">
            {config.description}
          </p>
        </a>
      </CardContent>
    </Card>
  );
});
