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
  ChevronDown, 
  Building2, 
  LogOut, 
  Settings, 
  User,
  LayoutGrid,
  Menu,
  PanelLeftClose,
  PanelLeft,
  MessageCircle
} from 'lucide-react';
import { useState } from 'react';

interface PortalHeaderProps {
  onMenuClick?: () => void;
}

export function PortalHeader({ onMenuClick }: PortalHeaderProps) {
  const { 
    profile, 
    activeOrganization, 
    memberships, 
    switchTenant, 
    signOut 
  } = useAuth();
  const { sidebarCollapsed, toggleSidebar, armstrongVisible, toggleArmstrong, isMobile } = usePortalLayout();
  const [switching, setSwitching] = useState(false);

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : profile?.email?.charAt(0).toUpperCase() || 'U';

  const handleSwitchTenant = async (tenantId: string) => {
    setSwitching(true);
    try {
      await switchTenant(tenantId);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left side: Menu toggle + Logo */}
        <div className="flex items-center gap-2">
          {/* Mobile: Hamburger for drawer */}
          {isMobile && (
            <Button 
              variant="ghost" 
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
              variant="ghost" 
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
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Armstrong toggle - Desktop only */}
          {!isMobile && (
            <Button
              variant={armstrongVisible ? 'secondary' : 'ghost'}
              size="icon"
              onClick={toggleArmstrong}
              className="hidden lg:flex"
              title={armstrongVisible ? 'Armstrong schließen' : 'Armstrong öffnen'}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          )}

          {/* Tenant Switcher */}
          {memberships.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  disabled={switching}
                >
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-32 truncate">
                    {activeOrganization?.name || 'Organisation'}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Organisation wechseln</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {memberships.map(m => (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => handleSwitchTenant(m.tenant_id)}
                    className={m.tenant_id === activeOrganization?.id ? 'bg-accent' : ''}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    <span className="truncate">
                      {m.tenant_id === activeOrganization?.id 
                        ? activeOrganization.name 
                        : `Org ${m.tenant_id.slice(0, 8)}...`}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
