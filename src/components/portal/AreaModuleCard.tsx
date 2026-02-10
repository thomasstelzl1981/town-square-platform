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
  
  // Take first 3 benefits for compact display
  const displayBenefits = content.benefits.slice(0, 3);
  
  // Get sub-tiles for display (max 6)
  const displayTiles = content.subTiles?.slice(0, 6) || [];

  // === MOBILE: Gesamte Karte klickbar ===
  if (isMobile) {
    return (
      <Card 
        className="hover:border-primary/40 transition-colors cursor-pointer active:scale-[0.98] h-full flex flex-col"
        onClick={() => navigate(defaultRoute)}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base leading-tight">{displayLabel}</CardTitle>
          <CardDescription className="text-xs line-clamp-2">
            {content.oneLiner}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 flex-1">
          {/* Kompakte Sub-Tiles */}
          {displayTiles.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayTiles.slice(0, 4).map((tile) => (
                <span
                  key={tile.route}
                  className="text-[10px] bg-muted px-1.5 py-0.5 rounded"
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

  // === DESKTOP: Detaillierte Variante mit Button ===
  return (
    <Card className="hover:border-primary/40 transition-colors h-full flex flex-col group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground font-mono uppercase">
            {moduleCode}
          </span>
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

        {/* Sub-tiles preview */}
        {displayTiles.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Bereiche:</p>
            <div className="flex flex-wrap gap-1.5">
              {displayTiles.map((tile) => (
                <span
                  key={tile.route}
                  className="text-xs bg-muted px-2 py-0.5 rounded-full"
                >
                  {tile.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          <Button asChild variant="outline" size="sm" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
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
