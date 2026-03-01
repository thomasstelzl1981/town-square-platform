/**
 * BrandLinkWidget — Individual brand tile as a system widget
 * Full gradient background with improved layout, icons, and full text
 */

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Store, TrendingUp, Cpu, Radar, ExternalLink } from 'lucide-react';

interface BrandConfig {
  name: string;
  nameElement?: React.ReactNode;
  tagline: string;
  description: string;
  gradient: string;
  icon: React.ReactNode;
  url: string;
  domain: string;
}

const BRAND_CONFIGS: Record<string, BrandConfig> = {
  'SYS.BRAND.KAUFY': {
    name: 'KAUFY',
    tagline: 'Marktplatz & Investment',
    description: 'Immobilien kaufen, verkaufen und als Kapitalanlage entdecken.',
    gradient: 'from-[hsl(220,85%,55%)] to-[hsl(245,75%,60%)]',
    icon: <Store className="h-5 w-5 text-white" />,
    url: 'https://kaufy.immo',
    domain: 'kaufy.immo',
  },
  'SYS.BRAND.FUTUREROOM': {
    name: 'FutureRoom',
    nameElement: <>Future<span className="font-light">Room</span></>,
    tagline: 'Finanzierung',
    description: 'KI-gestützte Aufbereitung und digitale Bankeinreichung.',
    gradient: 'from-[hsl(165,70%,36%)] to-[hsl(158,64%,52%)]',
    icon: <TrendingUp className="h-5 w-5 text-white" />,
    url: 'https://futureroom.online',
    domain: 'futureroom.online',
  },
  'SYS.BRAND.SOT': {
    name: 'SystemofaTown',
    nameElement: <>System<span className="font-light">ofaTown</span></>,
    tagline: 'Management Suite',
    description: 'Immobilienverwaltung, KI-Office und operative Steuerung.',
    gradient: 'from-[hsl(270,50%,45%)] to-[hsl(285,45%,55%)]',
    icon: <Cpu className="h-5 w-5 text-white" />,
    url: 'https://systemofatown.com',
    domain: 'systemofatown.com',
  },
  'SYS.BRAND.ACQUIARY': {
    name: 'ACQUIARY',
    tagline: 'Sourcing & Akquisition',
    description: 'Immobilien-Sourcing, Analyse und strategische Akquisition.',
    gradient: 'from-[hsl(32,90%,50%)] to-[hsl(20,85%,55%)]',
    icon: <Radar className="h-5 w-5 text-white" />,
    url: 'https://acquiary.com',
    domain: 'acquiary.com',
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
          className={`h-full bg-gradient-to-br ${config.gradient} p-5 flex flex-col justify-between text-white group transition-all hover:brightness-110`}
        >
          {/* Header: Icon + Brand Name */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                {config.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold tracking-tight text-white">
                  {config.nameElement || config.name}
                </h3>
                <p className="text-[10px] text-white/70 uppercase tracking-wider">
                  {config.tagline}
                </p>
              </div>
            </div>

            {/* Description — full text, no clamp */}
            <p className="text-sm text-white/85 leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Footer: Domain link */}
          <div className="flex items-center justify-between pt-3 mt-auto border-t border-white/20">
            <span className="text-xs text-white/60 font-medium">
              {config.domain}
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-white/50 group-hover:text-white transition-colors" />
          </div>
        </a>
      </CardContent>
    </Card>
  );
});
