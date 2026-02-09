/**
 * Social Overview — Entry point with setup guidance
 */
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, ArrowRight, Mic, BookOpen, PenTool, Calendar } from 'lucide-react';

const setupSteps = [
  { num: 1, label: 'Persönlichkeit erfassen', desc: 'Voice-Audit mit Armstrong', icon: Mic, path: 'audit', done: false },
  { num: 2, label: 'Themen definieren', desc: 'Bis zu 10 Editorial-Focus-Themen', icon: BookOpen, path: 'knowledge', done: false },
  { num: 3, label: 'Content erstellen', desc: 'LinkedIn, Instagram & Facebook Drafts', icon: PenTool, path: 'create', done: false },
  { num: 4, label: 'Planen & posten', desc: 'Kalender nutzen, als gepostet markieren', icon: Calendar, path: 'calendar', done: false },
];

export function OverviewPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Hero */}
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-primary/10 p-3">
          <Share2 className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Social</h1>
          <p className="text-muted-foreground mt-1">
            Baue deine Personal Brand auf — KI-gestützt, authentisch, in deinem Stil.
          </p>
        </div>
      </div>

      {/* Setup CTA */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">Starte dein Social Setup</h2>
              <p className="text-sm text-muted-foreground mt-1">
                In 3–5 Minuten erfasst Armstrong deine Persönlichkeit und du erstellst deinen ersten Content.
              </p>
            </div>
            <Button onClick={() => navigate('audit')} className="gap-2">
              Setup starten
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Dein Weg zum ersten Post
        </h3>
        {setupSteps.map((step) => (
          <Card
            key={step.num}
            className="cursor-pointer hover:bg-accent/30 transition-colors"
            onClick={() => navigate(step.path)}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-full bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
                {step.num}
              </div>
              <step.icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
