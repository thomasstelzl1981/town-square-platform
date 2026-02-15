/**
 * SlideshowViewer — Fullscreen-Overlay mit Slide-Navigation
 */
import { useCallback, useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScaledSlide } from './ScaledSlide';
import { PRESENTATIONS, type PresentationKey } from './slideData';

interface SlideshowViewerProps {
  presentationKey: PresentationKey;
  onClose: () => void;
}

export function SlideshowViewer({ presentationKey, onClose }: SlideshowViewerProps) {
  const slides = PRESENTATIONS[presentationKey];
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent((c) => Math.min(slides.length - 1, c + 1)), [slides.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  const SlideComponent = slides[current];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Schließen"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Slide */}
      <div className="flex-1 relative">
        <ScaledSlide>
          <SlideComponent />
        </ScaledSlide>
      </div>

      {/* Navigation arrows */}
      {current > 0 && (
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Zurück"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}
      {current < slides.length - 1 && (
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Weiter"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === current ? 'w-8 bg-primary' : 'w-2.5 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
