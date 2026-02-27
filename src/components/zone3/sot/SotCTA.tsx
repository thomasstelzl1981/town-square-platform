/**
 * SoT CTA Section — Call to Action with Nebula Gradient
 */
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';

interface SotCTAProps {
  title?: string;
  subtitle?: string;
  primaryCta?: {
    label: string;
    to: string;
  };
  secondaryCta?: {
    label: string;
    to: string;
  };
  variant?: 'default' | 'gradient' | 'minimal';
}

export function SotCTA({
  title = 'Bereit für den Start?',
  subtitle = 'Keine Grundgebühr. Alle Module kostenfrei.',
  primaryCta = { label: 'Jetzt starten', to: '/auth?mode=register&source=sot' },
  secondaryCta,
  variant = 'default',
}: SotCTAProps) {
  const { ref, isVisible } = useSotScrollAnimation();

  const bgClass = variant === 'gradient' 
    ? 'sot-nebula' 
    : variant === 'minimal'
    ? ''
    : 'bg-[hsl(var(--z3-card))]';

  return (
    <section 
      ref={ref}
      className={`py-24 ${bgClass} ${variant === 'gradient' ? 'text-white' : ''}`}
    >
      <div className={`zone3-container text-center sot-fade-in ${isVisible ? 'visible' : ''}`}>
        <h2 className="sot-headline mb-4">{title}</h2>
        <p className={`sot-subheadline mb-10 max-w-xl mx-auto ${variant === 'gradient' ? 'text-white/80' : ''}`}>
          {subtitle}
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            to={primaryCta.to} 
            className={variant === 'gradient' 
              ? 'sot-btn-primary bg-white text-black hover:bg-white/90'
              : 'sot-btn-primary'
            }
          >
            {primaryCta.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          {secondaryCta && (
            <Link 
              to={secondaryCta.to} 
              className={variant === 'gradient'
                ? 'sot-btn-secondary border-white/30 text-white hover:bg-white/10'
                : 'sot-btn-secondary'
              }
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}