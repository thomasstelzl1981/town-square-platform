/**
 * SoT Hero Section — SpaceX-Inspired Full-Screen Hero
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';

interface SotHeroSectionProps {
  title: string;
  subtitle?: string;
  ctaPrimary?: {
    label: string;
    to: string;
  };
  ctaSecondary?: {
    label: string;
    to: string;
  };
  showDemo?: boolean;
}

export function SotHeroSection({
  title,
  subtitle,
  ctaPrimary = { label: 'Kostenlos starten', to: '/auth?mode=register&source=sot' },
  ctaSecondary,
  showDemo = true,
}: SotHeroSectionProps) {
  const { ref, isVisible } = useSotScrollAnimation({ threshold: 0.1 });

  return (
    <section className="sot-hero-section sot-atmosphere min-h-screen relative">
      {/* Grid overlay */}
      <div className="absolute inset-0 sot-grid-pattern opacity-20" />
      
      {/* Content */}
      <div 
        ref={ref}
        className={`zone3-container relative z-10 text-center px-6 sot-fade-in ${isVisible ? 'visible' : ''}`}
      >
        {/* Tagline */}
        <div className="sot-label mb-6 tracking-widest">
          <span 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{ 
              borderColor: 'hsl(var(--z3-border))',
              backgroundColor: 'hsl(var(--z3-card) / 0.6)'
            }}
          >
            ✦ SYSTEM OF A TOWN
          </span>
        </div>
        
        {/* Main Title */}
        <h1 className="sot-display mb-8 max-w-5xl mx-auto">
          <span className="block">{title.split('.')[0]}.</span>
          {title.split('.')[1] && (
            <span className="block sot-text-glow" style={{ color: 'hsl(var(--z3-accent))' }}>
              {title.split('.')[1].trim()}.
            </span>
          )}
        </h1>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="sot-subheadline max-w-2xl mx-auto mb-12">
            {subtitle}
          </p>
        )}
        
        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link to={ctaPrimary.to} className="sot-btn-primary">
            {ctaPrimary.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          {showDemo && (
            <Link to="/sot/demo" className="sot-btn-secondary">
              <Play className="w-4 h-4" />
              Demo ansehen
            </Link>
          )}
          
          {ctaSecondary && (
            <Link to={ctaSecondary.to} className="sot-btn-secondary">
              {ctaSecondary.label}
            </Link>
          )}
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-current/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-current/50" />
          </div>
        </div>
      </div>
    </section>
  );
}