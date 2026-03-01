/**
 * BrandLinkWidget — Individual brand tile as a system widget
 * Dark-theme glassmorphic design with brand accent glow
 */

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Store, TrendingUp, Cpu, Radar, ExternalLink } from 'lucide-react';

interface BrandConfig {
  name: string;
  nameElement?: React.ReactNode;
  tagline: string;
  description: string;
  badge: string;
  accentHsl: string;        // HSL values for glow/accent
  iconBg: string;           // Tailwind bg class for icon container
  icon: React.ReactNode;
  url: string;
  domain: string;
}

const BRAND_CONFIGS: Record<string, BrandConfig> = {
  'SYS.BRAND.KAUFY': {
    name: 'KAUFY',
    tagline: 'Marktplatz & Investment',
    description: 'Immobilien kaufen, verkaufen und als Kapitalanlage entdecken.',
    badge: 'Marktplatz',
    accentHsl: '220, 85%, 55%',
    iconBg: 'bg-[hsl(220,85%,55%)]',
    icon: <Store className="h-5 w-5 text-white" />,
    url: 'https://kaufy.immo',
    domain: 'kaufy.immo',
  },
  'SYS.BRAND.FUTUREROOM': {
    name: 'FutureRoom',
    nameElement: <>Future<span className="font-light">Room</span></>,
    tagline: 'Finanzierung',
    description: 'KI-gestützte Aufbereitung und digitale Bankeinreichung.',
    badge: '400+ Bankpartner',
    accentHsl: '165, 70%, 36%',
    iconBg: 'bg-[hsl(165,70%,36%)]',
    icon: <TrendingUp className="h-5 w-5 text-white" />,
    url: 'https://futureroom.online',
    domain: 'futureroom.online',
  },
  'SYS.BRAND.SOT': {
    name: 'SystemofaTown',
    nameElement: <>System<span className="font-light">ofaTown</span></>,
    tagline: 'Management Suite',
    description: 'Immobilienverwaltung, KI-Office und operative Steuerung.',
    badge: 'All-in-One',
    accentHsl: '270, 60%, 55%',
    iconBg: 'bg-[hsl(270,60%,55%)]',
    icon: <Cpu className="h-5 w-5 text-white" />,
    url: 'https://systemofatown.com',
    domain: 'systemofatown.com',
  },
  'SYS.BRAND.ACQUIARY': {
    name: 'ACQUIARY',
    tagline: 'Sourcing & Akquisition',
    description: 'Immobilien-Sourcing, Analyse und strategische Akquisition.',
    badge: 'Investment House',
    accentHsl: '32, 90%, 55%',
    iconBg: 'bg-[hsl(32,90%,55%)]',
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
    <Card
      className="h-[260px] md:h-auto md:aspect-square overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm"
      style={{
        boxShadow: `inset 0 2px 0 0 hsla(${config.accentHsl}, 0.5), 0 4px 20px -4px hsla(${config.accentHsl}, 0.15)`,
      }}
    >
      <CardContent className="p-0 h-full">
        <a
          href={config.url}
          target="_blank"
          rel="noopener noreferrer"
          className="h-full p-5 flex flex-col justify-between group transition-all hover:bg-muted/20"
        >
          {/* Header: Icon + Brand Name */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0 shadow-lg`}>
                {config.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold tracking-tight text-foreground">
                  {config.nameElement || config.name}
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {config.tagline}
                </p>
              </div>
            </div>

            {/* Description — full text, no clamp */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Footer: Domain link */}
          <div className="flex items-center justify-between pt-3 mt-auto border-t border-border/40">
            <span className="text-xs text-muted-foreground font-medium">
              {config.domain}
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </a>
      </CardContent>
    </Card>
  );
});
