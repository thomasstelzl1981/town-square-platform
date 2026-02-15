/**
 * ManagerVisitenkarte — Reusable business card component for all manager modules
 * Pattern extracted from FM/AM dashboards, uses DESIGN.DASHBOARD_HEADER
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { useAuth } from '@/contexts/AuthContext';

interface ManagerVisitenkarteProps {
  role: string;
  gradientFrom: string;
  gradientTo: string;
  badgeText: string;
  extraBadge?: string;
  onEdit?: () => void;
  children?: React.ReactNode;
}

export function ManagerVisitenkarte({
  role,
  gradientFrom,
  gradientTo,
  badgeText,
  extraBadge,
  onEdit,
  children,
}: ManagerVisitenkarteProps) {
  const { profile } = useAuth();

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Kein Name';
  const fullAddress = [profile?.street, profile?.postal_code, profile?.city]
    .filter(Boolean)
    .join(', ');

  return (
    <Card className={cn("overflow-hidden border-0 shadow-card", DESIGN.DASHBOARD_HEADER.CARD_HEIGHT)}>
      <div className="h-2" style={{
        background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`
      }} />
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 shadow-md"
            style={{ background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})` }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={fullName} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{fullName}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{role}</p>
              </div>
              {onEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="space-y-0.5">
              {profile?.email && (
                <div className="flex items-center gap-2 text-[11px]">
                  <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
              )}
              {profile?.phone_mobile && (
                <div className="flex items-center gap-2 text-[11px]">
                  <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span>{profile.phone_mobile}</span>
                </div>
              )}
              {fullAddress && (
                <div className="flex items-center gap-2 text-[11px]">
                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{fullAddress}</span>
                </div>
              )}
            </div>

            {children}

            <div className="pt-1 flex gap-1.5">
              <Badge variant="outline" className="text-[10px]">{badgeText}</Badge>
              {extraBadge && <Badge variant="secondary" className="text-[10px]">{extraBadge}</Badge>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
