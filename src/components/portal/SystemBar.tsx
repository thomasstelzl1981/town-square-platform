/**
 * SYSTEM BAR — Top-level system controls for Zone 2
 * 
 * Fixed height: 48px
 * Contains: Home button, Theme Toggle, Logo placeholder, Local time, Armstrong toggle, User avatar
 * 
 * ORBITAL Design System: Theme toggle is placed left side, after Home button
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
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
  LogOut, 
  Settings, 
  User,
  Rocket,
  KeyRound,
  MapPin,
  Mountain
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SystemBar() {
  const { profile, signOut, isDevelopmentMode, user } = useAuth();
  const { armstrongVisible, toggleArmstrong, isMobile, armstrongExpanded, toggleArmstrongExpanded } = usePortalLayout();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{
    city: string;
    altitude: number | null;
  } | null>(null);
  const [locationError, setLocationError] = useState(false);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, altitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'User-Agent': 'SystemOfATown/1.0' } }
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || 'Unbekannt';
          
          setLocation({
            city,
            altitude: altitude ? Math.round(altitude) : null
          });
        } catch (error) {
          console.error('Geocoding failed:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError(true);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : profile?.email?.charAt(0).toUpperCase() || 'U';

  const formattedTime = currentTime.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center justify-between px-4">
        {/* Left section: Home + Theme Toggle + Logo placeholder */}
        <div className="flex items-center gap-1">
          {/* Home button */}
          <Link 
            to="/portal" 
            className={cn(
              'flex items-center justify-center p-2 rounded-lg transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
            title="Zur Portal-Startseite"
          >
            <Home className="h-5 w-5" />
          </Link>

          {/* Theme Toggle — ORBITAL Design System requirement */}
          <ThemeToggle />
        </div>

{/* Center section: Location + Time (digital only, no icon) */}
        <div className="hidden sm:flex items-center gap-3 text-muted-foreground">
          {location ? (
            <>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{location.city}</span>
              </div>
              {location.altitude !== null && (
                <div className="flex items-center gap-1">
                  <Mountain className="h-3.5 w-3.5" />
                  <span className="text-sm">{location.altitude}m</span>
                </div>
              )}
            </>
          ) : locationError ? (
            <button
              onClick={() => {
                setLocationError(false);
                navigator.geolocation?.getCurrentPosition(
                  async (position) => {
                    const { latitude, longitude, altitude } = position.coords;
                    try {
                      const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                        { headers: { 'User-Agent': 'SystemOfATown/1.0' } }
                      );
                      const data = await response.json();
                      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || 'Unbekannt';
                      setLocation({ city, altitude: altitude ? Math.round(altitude) : null });
                    } catch (error) {
                      console.error('Geocoding failed:', error);
                      setLocationError(true);
                    }
                  },
                  () => setLocationError(true),
                  { enableHighAccuracy: true }
                );
              }}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              title="Standort aktivieren"
            >
              <MapPin className="h-4 w-4" />
              <span className="text-sm">Standort?</span>
            </button>
          ) : null}
          
          {/* Digitale Uhrzeit - ohne Icon */}
          <span className="text-sm font-mono tabular-nums">{formattedTime}</span>
        </div>

{/* Right section: Armstrong + User avatar */}
        <div className="flex items-center gap-1">
          {/* Armstrong toggle - Desktop only */}
          {!isMobile && (
            <Button
              variant={armstrongVisible ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => {
                if (!armstrongVisible) {
                  toggleArmstrong();
                } else {
                  toggleArmstrongExpanded();
                }
              }}
              className="h-9 w-9"
              title={armstrongVisible ? (armstrongExpanded ? 'Armstrong minimieren' : 'Armstrong erweitern') : 'Armstrong öffnen'}
            >
              <Rocket className="h-5 w-5" />
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Button>
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
              {/* Show real login link in dev mode when using bypass */}
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
