/**
 * ManagerVisitenkarte — Reusable business card component for all manager modules
 * Pattern extracted from FM/AM dashboards, uses DESIGN.DASHBOARD_HEADER
 */
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { useAuth } from '@/contexts/AuthContext';
import { getCachedSignedUrl } from '@/lib/imageCache';

interface ManagerVisitenkarteProps {
  role: string;
  gradientFrom: string;
  gradientTo: string;
  badgeText: string;
  extraBadge?: string;
  onEdit?: () => void;
  children?: React.ReactNode;
  overrideName?: string;
  overrideEmail?: string;
  overridePhone?: string;
  overrideAddress?: string;
}

export function ManagerVisitenkarte({
  role,
  gradientFrom,
  gradientTo,
  badgeText,
  extraBadge,
  onEdit,
  children,
  overrideName,
  overrideEmail,
  overridePhone,
  overrideAddress,
}: ManagerVisitenkarteProps) {
  const { profile } = useAuth();
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const avatarPath = profile?.avatar_url;
    if (!avatarPath) return;
    // If already a full URL, use directly
    if (avatarPath.startsWith('http')) {
      setResolvedAvatarUrl(avatarPath);
      return;
    }
    let cancelled = false;
    getCachedSignedUrl(avatarPath, 'tenant-documents').then((url) => {
      if (!cancelled && url) setResolvedAvatarUrl(url);
    });
    return () => { cancelled = true; };
  }, [profile?.avatar_url]);

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Kein Name';
  const fullAddress = [profile?.street, profile?.postal_code, profile?.city]
    .filter(Boolean)
    .join(', ');

  const displayName = overrideName || fullName;
  const displayEmail = overrideEmail || profile?.email;
  const displayPhone = overridePhone || profile?.phone_mobile;
  const displayAddress = overrideAddress || fullAddress;

  return (
    <Card className={cn("overflow-hidden border-0 shadow-card", DESIGN.DASHBOARD_HEADER.CARD_HEIGHT)}>
      <div className="h-2" style={{
        background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`
      }} />
      <CardContent className="p-4">
        <div className="flex items-stretch gap-4">
          <div
            className="w-32 rounded-xl flex items-center justify-center shrink-0 shadow-md overflow-hidden"
            style={{ background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})` }}
          >
            {resolvedAvatarUrl ? (
              <img src={resolvedAvatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{displayName}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{role}</p>
              </div>
              {onEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="space-y-0.5">
              {displayEmail && (
                <div className="flex items-center gap-2 text-[11px]">
                  <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{displayEmail}</span>
                </div>
              )}
              {displayPhone && (
                <div className="flex items-center gap-2 text-[11px]">
                  <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span>{displayPhone}</span>
                </div>
              )}
              {displayAddress && (
                <div className="flex items-center gap-2 text-[11px]">
                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{displayAddress}</span>
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
