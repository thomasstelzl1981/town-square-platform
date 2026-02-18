/**
 * SYSTEM BAR — Top-level system controls for Zone 2
 * 
 * Fixed height: 48px
 * 3-zone layout: Left (Home, Theme, Temp) | Center (ARMSTRONG) | Right (Clock, Chatbot, Profile)
 * All 6 buttons: identical round glass style
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Home,
  ArrowLeft,
  LogOut, 
  Settings, 
  User,
  Rocket,
  KeyRound,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getParentRoute } from '@/hooks/useSwipeBack';

const GLASS_BUTTON = cn(
  'h-10 w-10 rounded-full',
  'bg-white/30 dark:bg-white/10',
  'backdrop-blur-md',
  'border border-white/20 dark:border-white/10',
  'shadow-[inset_0_1px_0_hsla(0,0%,100%,0.15)]',
  'hover:bg-white/45 dark:hover:bg-white/15',
  'flex items-center justify-center transition-all',
  'text-foreground'
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
      {/* Hour hand */}
      <line
        x1="12" y1="12"
        x2={12 + 4.5 * Math.sin((hourAngle * Math.PI) / 180)}
        y2={12 - 4.5 * Math.cos((hourAngle * Math.PI) / 180)}
        strokeWidth="2"
      />
      {/* Minute hand */}
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

export function SystemBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut, isDevelopmentMode, user } = useAuth();
  const { armstrongVisible, showArmstrong, hideArmstrong, resetArmstrong, isMobile, setActiveArea } = usePortalLayout();
  const { theme, setTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState<number | null>(null);

  const isAtPortalRoot = location.pathname.replace(/\/+$/, '') === '/portal';

  const handleHomeClick = () => {
    setActiveArea(null);
    navigate('/portal');
    showArmstrong({ expanded: false });
  };

  const handleBackClick = () => {
    navigate(getParentRoute(location.pathname));
  };

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch temperature via geolocation + OpenMeteo (desktop only)
  useEffect(() => {
    if (isMobile) return; // Skip geolocation on mobile
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
        } catch (e) {
          console.warn('Temperature fetch failed:', e);
        }
      },
      () => { /* silently fail */ },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }, [isMobile]);

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : profile?.email?.charAt(0).toUpperCase() || 'U';

  // Mobile: compact SystemBar (h-10), only Home + ARMSTRONG + Avatar
  if (isMobile) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-card/70 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-10 items-center justify-between px-3">
          {/* LEFT — Home button */}
          <button 
            onClick={isAtPortalRoot ? handleHomeClick : handleBackClick} 
            className={cn(GLASS_BUTTON, 'h-8 w-8')} 
            title={isAtPortalRoot ? 'Startseite' : 'Zurück'}
          >
            {isAtPortalRoot ? <Home className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          </button>

          {/* CENTER — ARMSTRONG */}
          <span className="text-foreground font-sans font-semibold tracking-[0.2em] text-xs select-none">
            ARMSTRONG
          </span>

          {/* RIGHT — Profile only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(GLASS_BUTTON, 'h-8 w-8')} title="Profil">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[9px] font-medium bg-transparent">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.display_name || 'Benutzer'}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/portal/stammdaten/profil">
                  <User className="h-4 w-4 mr-2" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/portal/stammdaten/sicherheit">
                  <Settings className="h-4 w-4 mr-2" />
                  Einstellungen
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isDevelopmentMode && !user && (
                <DropdownMenuItem asChild>
                  <Link to="/auth" className="text-primary">
                    <KeyRound className="h-4 w-4 mr-2" />
                    Mit Account einloggen
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    );
  }

  // Desktop: full SystemBar
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/70 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-12 items-center justify-between px-4">

        {/* LEFT — 3 Glass Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={handleHomeClick} className={GLASS_BUTTON} title="Startseite">
            <Home className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={GLASS_BUTTON}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            <Sun className="h-4.5 w-4.5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </button>
          <button className={GLASS_BUTTON} title="Aktuelle Außentemperatur">
            <span className="text-xs font-medium leading-none">
              {temperature !== null ? `${temperature}°` : '—°'}
            </span>
          </button>
        </div>

        {/* CENTER — SYSTEM OF A TOWN */}
        <span className="text-foreground font-sans font-semibold tracking-[0.2em] text-sm select-none" style={{ fontSize: '14px' }}>
          SYSTEM OF A TOWN
        </span>

        {/* RIGHT — 3 Glass Buttons */}
        <div className="flex items-center gap-2">
          <div className={GLASS_BUTTON}>
            <AnalogClock time={currentTime} />
          </div>
          <button
            onClick={() => {
              if (armstrongVisible) {
                hideArmstrong();
              } else {
                showArmstrong({ resetPosition: true, expanded: false });
              }
            }}
            className={cn(
              GLASS_BUTTON,
              armstrongVisible && 'ring-2 ring-primary/30 bg-white/40 dark:bg-white/15'
            )}
            title={armstrongVisible ? 'Armstrong ausblenden' : 'Armstrong einblenden'}
          >
            <Rocket className="h-4.5 w-4.5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={GLASS_BUTTON} title="Profil">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] font-medium bg-transparent">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.display_name || 'Benutzer'}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/portal/stammdaten/profil">
                  <User className="h-4 w-4 mr-2" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/portal/stammdaten/sicherheit">
                  <Settings className="h-4 w-4 mr-2" />
                  Einstellungen
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetArmstrong}>
                <Rocket className="h-4 w-4 mr-2" />
                Armstrong zurücksetzen
              </DropdownMenuItem>
              {isDevelopmentMode && !user && (
                <DropdownMenuItem asChild>
                  <Link to="/auth" className="text-primary">
                    <KeyRound className="h-4 w-4 mr-2" />
                    Mit Account einloggen
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
