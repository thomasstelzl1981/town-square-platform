/**
 * MOD-15 — Item Card for curated/search results (with cover image)
 */

import { ExternalLink, Star, Clock, BookOpen, GraduationCap, Calendar, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FortbildungItem } from '@/services/fortbildung/types';

const PROVIDER_ICONS: Record<string, typeof BookOpen> = {
  amazon: BookOpen,
  udemy: GraduationCap,
  eventbrite: Calendar,
  youtube: Play,
  impact: Star,
};

interface FortbildungItemCardProps {
  item: FortbildungItem;
}

export function FortbildungItemCard({ item }: FortbildungItemCardProps) {
  const Icon = PROVIDER_ICONS[item.provider] || BookOpen;

  return (
    <Card className="group hover:shadow-md transition-shadow h-full flex flex-col overflow-hidden">
      {/* Cover image */}
      {item.image_url ? (
        <div className="relative h-36 bg-muted/30 overflow-hidden shrink-0">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Hide broken images gracefully
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-xs shrink-0 capitalize bg-background/80 backdrop-blur-sm">
              {item.provider}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 pt-4 gap-2">
          <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <Badge variant="outline" className="text-xs shrink-0 capitalize">
            {item.provider}
          </Badge>
        </div>
      )}

      <CardContent className="p-4 flex flex-col flex-1 gap-3">
        {/* Title + Author */}
        <div className="flex-1 min-h-0">
          <h4 className="font-semibold text-sm leading-tight line-clamp-2">{item.title}</h4>
          {item.author_or_channel && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{item.author_or_channel}</p>
          )}
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          {item.rating_text && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Star className="h-3 w-3" />
              {item.rating_text}
            </Badge>
          )}
          {item.duration_text && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              {item.duration_text}
            </Badge>
          )}
          {item.price_text && (
            <span className="text-xs font-medium text-foreground">{item.price_text}</span>
          )}
        </div>

        {/* CTA */}
        <Button
          variant="default"
          size="sm"
          className="w-full mt-auto"
          asChild
        >
          <a href={item.affiliate_link} target="_blank" rel="noopener noreferrer">
            Ansehen
            <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
