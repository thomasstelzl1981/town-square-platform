/**
 * SoT SystemBar — Portal-Clone for Zone 3 Website
 * 
 * Exact replica of Zone 2 SystemBar design:
 * - h-12, glass background
 * - Left: Home, Theme Toggle, Temperature
 * - Center: "SYSTEM OF A TOWN" wordmark
 * - Right: Analog Clock, Armstrong Toggle, Profile Avatar
 * 
 * No auth context — website is public, so Profile shows generic avatar.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Sun, Moon, Rocket, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const GLASS_BUTTON = cn(
  'h-10 w-10 rounded-full',
  'bg-white/30 dark:bg-white/10',
  'backdrop-blur-md',
  'border border-white/20 dark:border-white/10',
  'shadow-[inset_0_1px_0_hsla(0,0%,100%,0.15)]',
  'hover:bg-white/45 dark:hover:bg-white/15',
  'flex items-center justify-center transition-all',
  'text-foreground',
);

/** Inline analog clock SVG */
function AnalogClock({ time }: { time: Date }) {
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const hourAngle = hours * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6;

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" opacity="0.4" />
      <line
        x1="12" y1="12"
        x2={12 + 4.5 * Math.sin((hourAngle * Math.PI) / 180)}
        y2={12 - 4.5 * Math.cos((hourAngle * Math.PI) / 180)}
        strokeWidth="2"
      />
      <line
        x1="12" y1="12"
        x2={12 + 6.5 * Math.sin((minuteAngle * Math.PI) / 180)}
        y2={12 - 6.5 * Math.cos((minuteAngle * Math.PI) / 180)}
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="1" fill="currentColor" strokeWidth="0" />
    </svg>
  );
}

interface SotSystemBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export function SotSystemBar({ isDark, onToggleTheme }: SotSystemBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState<number | null>(null);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch temperature
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          const data = await res.json();
          if (data.current_weather?.temperature != null) {
            setTemperature(Math.round(data.current_weather.temperature));
          }
        } catch { /* silently fail */ }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/70 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60 border-border/30">
      <div className="flex h-12 items-center justify-between px-4">
        {/* LEFT — 3 Glass Buttons */}
        <div className="flex items-center gap-2">
          {/* 1. Home */}
          <Link to="/website/sot" className={GLASS_BUTTON} title="Startseite">
            <Home className="h-4.5 w-4.5" />
          </Link>

          {/* 2. Theme Toggle */}
          <button onClick={onToggleTheme} className={GLASS_BUTTON} title="Theme wechseln">
            {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* 3. Temperature */}
          <button className={GLASS_BUTTON} title="Außentemperatur">
            <span className="text-xs font-medium leading-none">
              {temperature !== null ? `${temperature}°` : '—°'}
            </span>
          </button>
        </div>

        {/* CENTER — SYSTEM OF A TOWN Wordmark */}
        <span
          className="text-foreground font-sans font-semibold tracking-[0.2em] text-sm select-none"
          style={{ fontSize: '14px' }}
        >
          SYSTEM OF A TOWN
        </span>

        {/* RIGHT — 3 Glass Buttons */}
        <div className="flex items-center gap-2">
          {/* 1. Analog Clock */}
          <div className={GLASS_BUTTON}>
            <AnalogClock time={currentTime} />
          </div>

          {/* 2. Armstrong (placeholder — no portal context) */}
          <button className={GLASS_BUTTON} title="Armstrong">
            <Rocket className="h-4.5 w-4.5" />
          </button>

          {/* 3. Profile (generic — no auth on website) */}
          <button className={GLASS_BUTTON} title="Profil">
            <User className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
