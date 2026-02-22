/**
 * KaufySubpageHero — Reusable hero section for Kaufy subpages
 * Matches the visual style of the main Kaufy2026Hero component.
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const heroStyles = {
  section: { padding: 0 } as React.CSSProperties,
  wrapper: {
    position: 'relative',
    width: 'calc(100% - 120px)',
    height: 520,
    margin: '60px 60px 0',
    borderRadius: 20,
    overflow: 'hidden',
  } as React.CSSProperties,
  wrapperMobile: {
    position: 'relative',
    width: 'calc(100% - 32px)',
    height: 420,
    margin: '24px 16px 0',
    borderRadius: 16,
    overflow: 'hidden',
  } as React.CSSProperties,
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'grayscale(20%) brightness(0.55)',
  } as React.CSSProperties,
  overlay: {
    position: 'absolute',
    zIndex: 2,
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 60px',
  } as React.CSSProperties,
  badge: {
    display: 'inline-block',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: '6px 14px',
    borderRadius: 999,
    marginBottom: 16,
    backdropFilter: 'blur(4px)',
  } as React.CSSProperties,
  title: {
    fontSize: '2.75rem',
    fontWeight: 700,
    color: 'white',
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    maxWidth: 560,
  } as React.CSSProperties,
  subtitle: {
    fontSize: '1.15rem',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: '1rem',
    maxWidth: 480,
    lineHeight: 1.5,
  } as React.CSSProperties,
};

interface KaufySubpageHeroProps {
  backgroundImage: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
}

export function KaufySubpageHero({
  backgroundImage,
  badge,
  title,
  subtitle,
  ctaLabel,
  ctaHref = '/auth',
  onCtaClick,
}: KaufySubpageHeroProps) {
  return (
    <section style={heroStyles.section}>
      <div style={heroStyles.wrapper} className="hidden md:block">
        <img src={backgroundImage} alt={badge} style={heroStyles.image} />
        <div style={heroStyles.overlay}>
          <span style={heroStyles.badge}>{badge}</span>
          <h1 style={heroStyles.title}>{title}</h1>
          <p style={heroStyles.subtitle}>{subtitle}</p>
          {ctaLabel && (
            onCtaClick ? (
              <Button
                size="lg"
                onClick={onCtaClick}
                className="mt-6 rounded-full bg-white text-[hsl(220,20%,10%)] hover:bg-white/90 px-8"
              >
                {ctaLabel}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Link to={ctaHref}>
                <Button
                  size="lg"
                  className="mt-6 rounded-full bg-white text-[hsl(220,20%,10%)] hover:bg-white/90 px-8"
                >
                  {ctaLabel}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
      {/* Mobile version */}
      <div style={heroStyles.wrapperMobile} className="block md:hidden">
        <img src={backgroundImage} alt={badge} style={heroStyles.image} />
        <div style={{ ...heroStyles.overlay, padding: '24px 24px' }}>
          <span style={{ ...heroStyles.badge, fontSize: '0.65rem' }}>{badge}</span>
          <h1 style={{ ...heroStyles.title, fontSize: '1.75rem', maxWidth: 320 }}>{title}</h1>
          <p style={{ ...heroStyles.subtitle, fontSize: '0.95rem', maxWidth: 300 }}>{subtitle}</p>
          {ctaLabel && (
            onCtaClick ? (
              <Button size="default" onClick={onCtaClick} className="mt-4 rounded-full bg-white text-[hsl(220,20%,10%)] hover:bg-white/90 px-6 text-sm">
                {ctaLabel}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            ) : (
              <Link to={ctaHref}>
                <Button size="default" className="mt-4 rounded-full bg-white text-[hsl(220,20%,10%)] hover:bg-white/90 px-6 text-sm">
                  {ctaLabel}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </section>
  );
}
