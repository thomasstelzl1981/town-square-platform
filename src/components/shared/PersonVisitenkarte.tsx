/**
 * PersonVisitenkarte — Horizontal business card for household persons
 * Derived from ManagerVisitenkarte, adapted for MOD-18 Finanzanalyse
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_GRADIENTS: Record<string, { from: string; to: string }> = {
  hauptperson: { from: 'hsl(var(--primary))', to: 'hsl(210, 80%, 55%)' },
  partner: { from: 'hsl(215, 20%, 55%)', to: 'hsl(215, 25%, 65%)' },
  kind: { from: 'hsl(45, 90%, 55%)', to: 'hsl(40, 85%, 60%)' },
  weitere: { from: 'hsl(215, 15%, 60%)', to: 'hsl(215, 20%, 70%)' },
};

interface PersonVisitenkarteProps {
  person: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    role?: string;
    email?: string | null;
    phone?: string | null;
    birth_date?: string | null;
    street?: string | null;
    house_number?: string | null;
    zip?: string | null;
    city?: string | null;
    avatar_url?: string | null;
    is_primary?: boolean;
  };
  isSelected?: boolean;
  onClick?: () => void;
  badges?: { label: string; variant?: 'default' | 'secondary' | 'outline' }[];
  className?: string;
}

export function PersonVisitenkarte({ person, isSelected, onClick, badges = [], className }: PersonVisitenkarteProps) {
  const fullName = [person.first_name, person.last_name].filter(Boolean).join(' ') || 'Neue Person';
  const role = person.role || 'weitere';
  const gradient = ROLE_GRADIENTS[role] || ROLE_GRADIENTS.weitere;
  const address = [
    [person.street, person.house_number].filter(Boolean).join(' '),
    [person.zip, person.city].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ');

  return (
    <Card
      className={cn(
        'overflow-hidden border-0 shadow-card cursor-pointer transition-all hover:shadow-lg',
        isSelected && 'ring-2 ring-primary',
        className,
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="h-1.5" style={{
        background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`,
      }} />
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="h-11 w-11 rounded-full flex items-center justify-center shrink-0 shadow-md"
            style={{ background: `linear-gradient(to bottom right, ${gradient.from}, ${gradient.to})` }}
          >
            {person.avatar_url ? (
              <img src={person.avatar_url} alt={fullName} className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div>
              <h3 className="text-sm font-bold truncate">{fullName}</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {role === 'hauptperson' ? 'Hauptperson' : role === 'partner' ? 'Partner/in' : role === 'kind' ? 'Kind' : 'Weitere'}
              </p>
            </div>

            <div className="space-y-0.5">
              {person.birth_date && (
                <div className="flex items-center gap-2 text-[11px]">
                  <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span>{new Date(person.birth_date).toLocaleDateString('de-DE')}</span>
                </div>
              )}
              {person.email && (
                <div className="flex items-center gap-2 text-[11px]">
                  <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{person.email}</span>
                </div>
              )}
              {person.phone && (
                <div className="flex items-center gap-2 text-[11px]">
                  <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span>{person.phone}</span>
                </div>
              )}
              {address && (
                <div className="flex items-center gap-2 text-[11px]">
                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{address}</span>
                </div>
              )}
            </div>

            {badges.length > 0 && (
              <div className="pt-0.5 flex gap-1.5 flex-wrap">
                {badges.map((b, i) => (
                  <Badge key={i} variant={b.variant || 'outline'} className="text-[10px]">{b.label}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
