/**
 * SoT Hero Section — SpaceX-Inspired Full-Screen Hero with Image
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';
import heroCityscape from '@/assets/sot/hero-cityscape.jpg';

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
    <section className="sot-hero-section relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroCityscape} 
          alt="" 
          className="w-full h-full object-cover object-center"
        />
        {/* Gradient Overlays */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, hsl(0 0% 4%) 0%, hsl(0 0% 4% / 0.7) 30%, hsl(0 0% 4% / 0.4) 60%, hsl(0 0% 4% / 0.6) 100%)'
          }}
        />
      </div>
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 sot-grid-pattern opacity-10 z-[1]" />
      
      {/* Content */}
      <div 
        ref={ref}
        className={`zone3-container relative z-10 text-center px-6 flex flex-col items-center justify-center min-h-screen sot-fade-in ${isVisible ? 'visible' : ''}`}
      >
        {/* Tagline */}
        <div className="sot-label mb-6 tracking-widest">
          <span 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm"
            style={{ 
              borderColor: 'hsl(0 0% 100% / 0.2)',
              backgroundColor: 'hsl(0 0% 0% / 0.3)'
            }}
          >
            ✦ SYSTEM OF A TOWN
          </span>
        </div>
        
        {/* Main Title */}
        <h1 className="sot-display mb-8 max-w-5xl mx-auto text-white">
          <span className="block">{title.split('.')[0]}.</span>
          {title.split('.')[1] && (
            <span className="block" style={{ color: 'hsl(var(--z3-accent))' }}>
              {title.split('.')[1].trim()}.
            </span>
          )}
        </h1>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-lg max-w-2xl mx-auto mb-12 text-white/70">
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
            <Link 
              to="/sot/demo" 
              className="sot-btn-secondary"
              style={{ 
                borderColor: 'hsl(0 0% 100% / 0.3)',
                color: 'white'
              }}
            >
              <Play className="w-4 h-4" />
              Demo ansehen
            </Link>
          )}
          
          {ctaSecondary && (
            <Link 
              to={ctaSecondary.to} 
              className="sot-btn-secondary"
              style={{ 
                borderColor: 'hsl(0 0% 100% / 0.3)',
                color: 'white'
              }}
            >
              {ctaSecondary.label}
            </Link>
          )}
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-white/50" />
          </div>
        </div>
      </div>
    </section>
  );
}
