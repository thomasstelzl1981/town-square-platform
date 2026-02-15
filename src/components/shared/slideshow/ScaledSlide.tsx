/**
 * ScaledSlide — 1920×1080 Wrapper mit Auto-Scale
 * 
 * Rendert Kinder bei fester 1920×1080 Auflösung und skaliert
 * per CSS-Transform auf den aktuellen Viewport.
 */
import { useEffect, useState, type ReactNode } from 'react';

interface ScaledSlideProps {
  children: ReactNode;
}

const SLIDE_W = 1920;
const SLIDE_H = 1080;

export function ScaledSlide({ children }: ScaledSlideProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calc = () => {
      setScale(Math.min(window.innerWidth / SLIDE_W, window.innerHeight / SLIDE_H));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="absolute slide-content"
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          left: '50%',
          top: '50%',
          marginLeft: -(SLIDE_W / 2),
          marginTop: -(SLIDE_H / 2),
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
