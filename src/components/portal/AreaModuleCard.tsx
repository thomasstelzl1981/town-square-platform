/**
 * AREA MODULE CARD — Clean, clickable card with title + description.
 * Fixed height, no buttons, no badges. Entire card is clickable.
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

  return (
    <Card 
      className="glass-card hover:border-primary/30 transition-colors cursor-pointer active:scale-[0.98] flex flex-col h-[200px]"
      onClick={() => navigate(defaultRoute)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold leading-tight">{displayLabel}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        {content.oneLiner && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {content.oneLiner}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
