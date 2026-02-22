/**
 * Kaufy2026Hero — Hero Section with Floating Search
 * 
 * ARCHITECTURE NOTE (AUD-001):
 * Uses inline style objects instead of zone3-theme.css classes.
 * Reason: Tailwind @layer utilities override plain CSS classes regardless of
 * source order. The lightModeVars on the Layout container don't cascade into
 * nested elements reliably. Inline styles guarantee rendering correctness.
 * 
 * The style objects are centralized here for maintainability.
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Kaufy2026SearchBar, type SearchParams, type ClassicSearchParams } from './Kaufy2026SearchBar';
import heroBackground from '@/assets/kaufy2026/hero-background.png';
import { useIsMobile } from '@/hooks/use-mobile';

// Centralized style objects — replaces scattered inline styles
const getHeroStyles = (mobile: boolean) => ({
  section: { padding: 0 } as React.CSSProperties,
  wrapper: {
    position: 'relative',
    width: mobile ? 'calc(100% - 24px)' : 'calc(100% - 120px)',
    height: mobile ? 'auto' : 620,
    minHeight: mobile ? 400 : undefined,
    margin: mobile ? '12px 12px 0' : '60px 60px 0',
    borderRadius: mobile ? 16 : 20,
    overflow: 'hidden',
  } as React.CSSProperties,
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'grayscale(20%) brightness(0.6)',
  } as React.CSSProperties,
  overlay: {
    position: 'absolute',
    zIndex: 2,
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: mobile ? '24px 20px' : '40px 60px',
  } as React.CSSProperties,
  title: {
    fontSize: mobile ? '1.75rem' : '3rem',
    fontWeight: 700,
    color: 'white',
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    maxWidth: 600,
  } as React.CSSProperties,
  subtitle: {
    fontSize: mobile ? '1rem' : '1.25rem',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: '1rem',
  } as React.CSSProperties,
  searchFloat: {
    position: 'sticky',
    top: 16,
    zIndex: 50,
    maxWidth: 900,
    width: mobile ? '95%' : '85%',
    margin: mobile ? '-40px auto 0' : '-60px auto 0',
  } as React.CSSProperties,
});

interface Kaufy2026HeroProps {
  onInvestmentSearch: (params: SearchParams) => void;
  onClassicSearch: (params: ClassicSearchParams) => void;
  isLoading?: boolean;
}

export function Kaufy2026Hero({
  onInvestmentSearch,
  onClassicSearch,
  isLoading = false,
}: Kaufy2026HeroProps) {
  const isMobile = useIsMobile();
  const heroStyles = getHeroStyles(isMobile);

  return (
    <section style={heroStyles.section}>
      {/* Hero Image Container */}
      <div style={heroStyles.wrapper}>
        <img
          src={heroBackground}
          alt="Kapitalanlageimmobilien"
          style={heroStyles.image}
        />
        {/* Overlay Content */}
        <div style={heroStyles.overlay}>
          <h1 style={heroStyles.title}>
            Die KI-Plattform für
            <br />
            Kapitalanlageimmobilien.
          </h1>
          <p style={heroStyles.subtitle}>
            Marktplatz & digitale Mietsonderverwaltung
          </p>
          <Link to="/auth">
            <Button 
              size="lg" 
              className="mt-6 rounded-full bg-white text-[hsl(220,20%,10%)] hover:bg-white/90 px-8"
            >
              Kostenlos registrieren
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Card — negative margin overlap (AUD-003 fix) */}
      <div style={heroStyles.searchFloat}>
        <Kaufy2026SearchBar
          onInvestmentSearch={onInvestmentSearch}
          onClassicSearch={onClassicSearch}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}
