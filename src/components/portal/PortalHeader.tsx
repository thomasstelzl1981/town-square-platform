import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { useOrgContext, getOrgTypeBadgeColor, getOrgTypeLabel } from '@/hooks/useOrgContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ChevronDown, 
  Building2, 
  LogOut, 
  Settings, 
  User,
  LayoutGrid,
  Menu,
  PanelLeftClose,
  PanelLeft,
  MessageCircle,
  Check,
  KeyRound
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortalHeaderProps {
  onMenuClick?: () => void;
}

export function PortalHeader({ onMenuClick }: PortalHeaderProps) {
  const { profile, signOut, isDevelopmentMode, user } = useAuth();
  const { sidebarCollapsed, toggleSidebar, armstrongVisible, toggleArmstrong, isMobile } = usePortalLayout();
  const { 
    activeOrgName, 
    activeOrgType, 
    availableOrgs, 
    canSwitch, 
    switchOrg, 
    isLoading: orgSwitching 
  } = useOrgContext();

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : profile?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left side: Menu toggle + Logo */}
        <div className="flex items-center gap-2">
          {/* Mobile: Hamburger for drawer */}
          {isMobile && (
            <Button 
              variant="glass" 
              size="icon" 
              onClick={onMenuClick}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          {/* Desktop: Sidebar toggle */}
          {!isMobile && (
            <Button 
              variant="glass" 
              size="icon" 
              onClick={toggleSidebar}
              className="hidden md:flex"
              title={sidebarCollapsed ? 'Sidebar erweitern' : 'Sidebar einklappen'}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* Logo / Home */}
          <Link to="/portal" className="flex items-center gap-2 font-semibold">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">Portal</span>
          </Link>

          {/* P0-ID-CTX-INTERNAL-DEFAULT: Context Badge (always visible) */}
          <Badge 
            variant="secondary" 
            className={cn(
              'ml-2 text-xs font-medium hidden sm:inline-flex',
              getOrgTypeBadgeColor(activeOrgType)
            )}
          >
            {getOrgTypeLabel(activeOrgType)} / {activeOrgName}
          </Badge>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Armstrong toggle - Desktop only */}
          {!isMobile && (
            <Button
              variant="glass"
              size="icon"
              onClick={toggleArmstrong}
              className={cn(
                'hidden lg:flex',
                armstrongVisible && 'ring-2 ring-primary/30 bg-white/40 dark:bg-white/15'
              )}
              title={armstrongVisible ? 'Armstrong schließen' : 'Armstrong öffnen'}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          )}

          {/* Org Switcher with Type Badge */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="glass" 
                size="sm" 
                className="gap-2"
                disabled={orgSwitching}
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline max-w-32 truncate">
                  {activeOrgName}
                </span>
                <Badge 
                  variant="glass" 
                  className={cn('hidden md:inline-flex text-xs px-1.5 py-0', getOrgTypeBadgeColor(activeOrgType))}
                >
                  {getOrgTypeLabel(activeOrgType)}
                </Badge>
                {canSwitch && <ChevronDown className="h-3 w-3" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Organisation</span>
                <Badge 
                  variant="outline" 
                  className={cn('text-xs', getOrgTypeBadgeColor(activeOrgType))}
                >
                  {getOrgTypeLabel(activeOrgType)}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableOrgs.map(org => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => !org.isActive && switchOrg(org.id)}
                  className={cn(
                    'flex items-center justify-between',
                    org.isActive && 'bg-accent'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="truncate max-w-36">{org.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs px-1', getOrgTypeBadgeColor(org.type))}
                    >
                      {getOrgTypeLabel(org.type)}
                    </Badge>
                    {org.isActive && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
