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
    <section className="kaufy2026-hero">
      <div className="kaufy2026-hero-wrapper">
        {/* Hero Image */}
        <img
          src={heroBackground}
          alt="Kapitalanlageimmobilien"
          className="kaufy2026-hero-image"
        />

        {/* Overlay Content */}
        <div className="kaufy2026-hero-overlay">
          <h1 className="kaufy2026-hero-title">
            Die KI-Plattform für
            <br />
            Kapitalanlageimmobilien.
          </h1>
          <p className="kaufy2026-hero-subtitle">
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

        {/* Floating Search Card */}
        <Kaufy2026SearchBar
          onInvestmentSearch={onInvestmentSearch}
          onClassicSearch={onClassicSearch}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}
