/**
 * SoT Pricing Card — Dark Premium Pricing Display
 */
import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';

export interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  featured?: boolean;
}

interface SotPricingCardProps {
  plan: PricingPlan;
  index?: number;
  isVisible?: boolean;
}

export function SotPricingCard({ plan, index = 0, isVisible = true }: SotPricingCardProps) {
  return (
    <div
      className={`sot-fade-in relative rounded-3xl p-8 transition-all duration-300 ${
        plan.featured 
          ? 'bg-gradient-to-b from-[hsl(var(--z3-accent)/0.15)] to-[hsl(var(--z3-card))] border-2 border-[hsl(var(--z3-accent))] scale-105 z-10'
          : 'bg-[hsl(var(--z3-card))] border border-[hsl(var(--z3-border))] hover:border-[hsl(var(--z3-accent)/0.3)]'
      } ${isVisible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      {/* Featured badge */}
      {plan.featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span 
            className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{ 
              backgroundColor: 'hsl(var(--z3-accent))',
              color: 'hsl(var(--z3-background))'
            }}
          >
            <Sparkles className="w-3 h-3" />
            Empfohlen
          </span>
        </div>
      )}
      
      {/* Plan name */}
      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
      <p className="text-sm mb-6" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
        {plan.description}
      </p>
      
      {/* Price */}
      <div className="mb-8">
        <span className="text-4xl font-bold">{plan.price}</span>
        {plan.period && (
          <span className="text-sm ml-1" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
            {plan.period}
          </span>
        )}
      </div>
      
      {/* Features */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check 
              className="w-5 h-5 mt-0.5 flex-shrink-0" 
              style={{ color: 'hsl(var(--z3-accent))' }} 
            />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      {/* CTA */}
      <Link
        to={plan.ctaLink}
        className={`w-full text-center block py-3.5 px-6 rounded-full font-semibold text-sm transition-all ${
          plan.featured 
            ? 'sot-btn-primary justify-center' 
            : 'bg-[hsl(var(--z3-secondary))] hover:bg-[hsl(var(--z3-muted))] text-[hsl(var(--z3-foreground))]'
        }`}
      >
        {plan.cta}
      </Link>
    </div>
  );
}