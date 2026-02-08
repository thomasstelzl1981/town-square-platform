/**
 * SoT Stats Section — Key Metrics Display
 */
import { useSotStaggerAnimation } from '@/hooks/useSotScrollAnimation';

interface Stat {
  value: string;
  label: string;
  suffix?: string;
}

const defaultStats: Stat[] = [
  { value: '80', suffix: '%', label: 'weniger Aufwand' },
  { value: '15', suffix: '+', label: 'Module verfügbar' },
  { value: '100', suffix: '%', label: 'digital' },
  { value: '24/7', label: 'KI-Unterstützung' },
];

interface SotStatsProps {
  stats?: Stat[];
  title?: string;
}

export function SotStats({ stats = defaultStats, title }: SotStatsProps) {
  const { containerRef, visibleItems } = useSotStaggerAnimation(stats.length, 150);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--z3-card)/0.3)] to-transparent" />
      
      <div className="zone3-container relative z-10">
        {title && (
          <h2 className="sot-headline text-center mb-16">{title}</h2>
        )}
        
        <div 
          ref={containerRef}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`sot-stat sot-fade-in ${visibleItems[index] ? 'visible' : ''}`}
            >
              <div className="sot-stat-value">
                {stat.value}
                {stat.suffix && <span className="text-[0.6em]">{stat.suffix}</span>}
              </div>
              <div className="sot-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}