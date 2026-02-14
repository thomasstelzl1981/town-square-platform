/**
 * AREA MODULE CARD — Clean, clickable card with title + area chips only.
 * Zero-Clutter: No descriptions, no benefits, no MOD-badges, no buttons.
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HowItWorksContent } from '@/components/portal/HowItWorks/moduleContents';
import { getModuleDisplayLabel } from '@/manifests/areaConfig';

interface AreaModuleCardProps {
  moduleCode: string;
  content: HowItWorksContent;
  defaultRoute: string;
}

export function AreaModuleCard({ moduleCode, content, defaultRoute }: AreaModuleCardProps) {
  const navigate = useNavigate();
  const displayLabel = getModuleDisplayLabel(moduleCode, content.title);
  const displayTiles = content.subTiles?.slice(0, 6) || [];

  return (
    <Card 
      className="glass-card hover:border-primary/30 transition-colors cursor-pointer active:scale-[0.98] h-full flex flex-col min-h-[180px]"
      onClick={() => navigate(defaultRoute)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold leading-tight">{displayLabel}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col justify-end">
        {displayTiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displayTiles.map((tile) => (
              <span
                key={tile.route}
                className="text-sm bg-primary/10 text-primary px-2.5 py-1 rounded-full"
              >
                {tile.title}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
