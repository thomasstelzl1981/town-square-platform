/**
 * SYSTEM BAR — Top-level system controls for Zone 2
 * 
 * Fixed height: 48px
 * Contains: Home button, Logo placeholder, Local time, Armstrong toggle, User avatar
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { Button } from '@/components/ui/button';
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
  MessageCircle,
  KeyRound,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SystemBar() {
  const { profile, signOut, isDevelopmentMode, user } = useAuth();
  const { armstrongVisible, toggleArmstrong, isMobile, armstrongExpanded, toggleArmstrongExpanded } = usePortalLayout();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
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
        {/* Left section: Home + Logo placeholder */}
        <div className="flex items-center gap-3">
          {/* Home button */}
          <Link 
            to="/portal" 
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Home className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline">Portal</span>
          </Link>

          {/* Logo placeholder - neutral, no branding */}
          <div className="hidden md:flex items-center gap-2 text-muted-foreground">
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-xs font-bold">
              S
            </div>
            <span className="text-sm font-medium">System of a Town</span>
          </div>
        </div>

        {/* Center section: Local time */}
        <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-mono">{formattedTime}</span>
        </div>

        {/* Right section: Armstrong toggle + User avatar */}
        <div className="flex items-center gap-2">
          {/* Armstrong toggle - Desktop only */}
          {!isMobile && (
            <Button
              variant={armstrongVisible ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                if (!armstrongVisible) {
                  toggleArmstrong();
                } else {
                  toggleArmstrongExpanded();
                }
              }}
              className="hidden lg:flex items-center gap-2"
              title={armstrongVisible ? (armstrongExpanded ? 'Armstrong minimieren' : 'Armstrong erweitern') : 'Armstrong öffnen'}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">Armstrong</span>
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
