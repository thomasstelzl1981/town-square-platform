/**
 * SoT Detail Page — Shared layout for all SoT landing sub-pages
 */
import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Block {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface SotDetailPageProps {
  title: string;
  subtitle: string;
  blocks: Block[];
}

export function SotDetailPage({ title, subtitle, blocks }: SotDetailPageProps) {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            {title}
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </section>

      {/* Blocks */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            'grid gap-6',
            blocks.length === 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'
          )}>
            {blocks.map((b) => (
              <div
                key={b.title}
                className="rounded-xl border border-border/30 bg-card/60 backdrop-blur-sm p-6 hover:border-primary/20 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center mb-4">
                  <b.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold mb-2">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border/20">
        <div className="max-w-lg mx-auto px-4 text-center">
          <h2 className="text-xl font-bold mb-4">Überzeugt?</h2>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Jetzt starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
