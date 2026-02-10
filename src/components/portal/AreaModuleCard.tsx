/**
 * AREA MODULE CARD
 * 
 * Compact module card displaying "How It Works" content for area overview pages.
 * Reads directly from moduleContents.ts (Single Source of Truth).
 * 
 * On mobile: Entire card is clickable for faster navigation.
 * On desktop: Shows detailed benefits and sub-tiles with button.
 */

import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { HowItWorksContent } from '@/components/portal/HowItWorks/moduleContents';
import { getModuleDisplayLabel } from '@/manifests/areaConfig';
import { useIsMobile } from '@/hooks/use-mobile';

interface AreaModuleCardProps {
  moduleCode: string;
  content: HowItWorksContent;
  defaultRoute: string;
}

export function AreaModuleCard({ moduleCode, content, defaultRoute }: AreaModuleCardProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const displayLabel = getModuleDisplayLabel(moduleCode, content.title);
  
  const displayBenefits = content.benefits.slice(0, 3);
  const displayTiles = content.subTiles?.slice(0, 6) || [];

  // === MOBILE ===
  if (isMobile) {
    return (
      <Card 
        className="glass-card hover:border-primary/30 transition-colors cursor-pointer active:scale-[0.98] h-full flex flex-col"
        onClick={() => navigate(defaultRoute)}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base leading-tight">{displayLabel}</CardTitle>
          <CardDescription className="text-xs line-clamp-2">
            {content.oneLiner}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 flex-1">
          {displayTiles.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayTiles.slice(0, 4).map((tile) => (
                <span
                  key={tile.route}
                  className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full"
                >
                  {tile.title}
                </span>
              ))}
              {displayTiles.length > 4 && (
                <span className="text-[10px] text-muted-foreground">
                  +{displayTiles.length - 4}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // === DESKTOP ===
  return (
    <Card className="glass-card hover:border-primary/30 transition-colors h-full flex flex-col group min-h-[280px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-1">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider px-2 py-0.5">
            {moduleCode}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-tight">{displayLabel}</CardTitle>
        <CardDescription className="text-sm line-clamp-2">
          {content.oneLiner}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col">
        {/* Benefits */}
        <div className="space-y-1.5 mb-4">
          {displayBenefits.map((benefit, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span className="line-clamp-1">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Sub-tiles */}
        {displayTiles.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Bereiche:</p>
            <div className="flex flex-wrap gap-1.5">
              {displayTiles.map((tile) => (
                <span
                  key={tile.route}
                  className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                >
                  {tile.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          <Button asChild variant="default" size="sm" className="w-full gap-2">
            <Link to={defaultRoute}>
              Modul öffnen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
