import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Sparkles, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HowItWorksContent {
  moduleCode: string;
  title: string;
  oneLiner: string;
  benefits: string[];
  whatYouDo: string[];
  flows: {
    title: string;
    steps: string[];
  }[];
  cta: string;
  hint?: string;
  subTiles: {
    title: string;
    route: string;
    icon?: LucideIcon;
  }[];
}

interface ModuleHowItWorksProps {
  content: HowItWorksContent;
  className?: string;
}

export function ModuleHowItWorks({ content, className }: ModuleHowItWorksProps) {
  return (
    <div className={cn('space-y-8 p-4 md:p-6 max-w-4xl mx-auto', className)}>
      {/* Hero */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">{content.moduleCode}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">{content.title}</h1>
        <p className="text-lg text-muted-foreground">{content.oneLiner}</p>
      </div>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nutzen</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {content.benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{benefit}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* What you do */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Was Sie hier tun</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 md:grid-cols-2">
            {content.whatYouDo.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Flows */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Typische Abläufe</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {content.flows.map((flow, i) => (
            <Card key={i} className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{flow.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  {flow.steps.map((step, j) => (
                    <span key={j} className="flex items-center gap-1">
                      <span className="bg-background px-2 py-1 rounded">{step}</span>
                      {j < flow.steps.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-primary" />
                      )}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Hint */}
      {content.hint && (
        <p className="text-sm text-muted-foreground italic border-l-2 border-primary/50 pl-4">
          {content.hint}
        </p>
      )}

      {/* CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="font-medium">{content.cta}</p>
            {content.subTiles.length > 0 && (
              <Button asChild>
                <Link to={content.subTiles[0].route}>
                  Jetzt starten
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SubTile Links */}
      {content.subTiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Bereiche in diesem Modul</h3>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            {content.subTiles.map((tile) => (
              <Button
                key={tile.route}
                variant="outline"
                className="justify-start h-auto py-3"
                asChild
              >
                <Link to={tile.route}>
                  {tile.icon && <tile.icon className="h-4 w-4 mr-2" />}
                  {tile.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
