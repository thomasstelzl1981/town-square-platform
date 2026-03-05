/**
 * ProviderProfileCard — Contact info, rating, bio
 */
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Mail, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProviderProfileCardProps {
  provider: {
    company_name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    rating_avg?: number | null;
    bio?: string | null;
  };
}

export function ProviderProfileCard({ provider }: ProviderProfileCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <h1 className="text-xl font-bold">{provider.company_name}</h1>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          {provider.address && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 flex-shrink-0" />{provider.address}</span>}
          {provider.phone && <a href={`tel:${provider.phone}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors"><Phone className="h-4 w-4 flex-shrink-0" />{provider.phone}</a>}
          {provider.email && <a href={`mailto:${provider.email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors"><Mail className="h-4 w-4 flex-shrink-0" />{provider.email}</a>}
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn('h-4 w-4', i < Math.round(provider.rating_avg || 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30')} />
          ))}
          {provider.rating_avg != null && <span className="text-sm text-muted-foreground ml-1">{Number(provider.rating_avg).toFixed(1)}</span>}
        </div>
        {provider.bio && (
          <div>
            <h3 className="text-sm font-semibold mb-1">Über uns</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{provider.bio}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
