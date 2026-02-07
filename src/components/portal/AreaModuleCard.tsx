/**
 * AREA MODULE CARD
 * 
 * Compact module card displaying "How It Works" content for area overview pages.
 * Reads directly from moduleContents.ts (Single Source of Truth).
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { HowItWorksContent } from '@/components/portal/HowItWorks/ModuleHowItWorks';
import { getModuleDisplayLabel } from '@/manifests/areaConfig';

interface AreaModuleCardProps {
  moduleCode: string;
  content: HowItWorksContent;
  defaultRoute: string;
}

export function AreaModuleCard({ moduleCode, content, defaultRoute }: AreaModuleCardProps) {
  const displayLabel = getModuleDisplayLabel(moduleCode, content.title);
  
  // Take first 3 benefits for compact display
  const displayBenefits = content.benefits.slice(0, 3);
  
  // Get sub-tiles for display (max 6)
  const displayTiles = content.subTiles?.slice(0, 6) || [];

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
