/**
 * Kaufy2026Hero — Hero Section with Floating Search
 * 
 * Design: Full-width hero image with rounded corners
 * Search card floats inside the hero at the bottom
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Kaufy2026SearchBar, type SearchParams, type ClassicSearchParams } from './Kaufy2026SearchBar';
import heroBackground from '@/assets/kaufy2026/hero-background.png';

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
  return (
    <section style={{ padding: 0 }}>
      {/* Hero Image Container */}
      <div style={{
        position: 'relative',
        width: 'calc(100% - 120px)',
        height: 620,
        margin: '60px 60px 0',
        borderRadius: 20,
        overflow: 'hidden',
      }}>
        {/* Hero Image */}
        <img
          src={heroBackground}
          alt="Kapitalanlageimmobilien"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'grayscale(20%) brightness(0.6)',
          }}
        />

        {/* Overlay Content */}
        <div style={{
          position: 'absolute',
          zIndex: 2,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '40px 60px',
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            maxWidth: 600,
          }}>
            Die KI-Plattform für
            <br />
            Kapitalanlageimmobilien.
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.8)',
            marginTop: '1rem',
          }}>
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

      {/* Search Card — pulled up with negative margin to overlap hero */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: 900,
        width: '85%',
        margin: '-80px auto 0',
      }}>
        <Kaufy2026SearchBar
          onInvestmentSearch={onInvestmentSearch}
          onClassicSearch={onClassicSearch}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}
