/**
 * MOD-15 — Item Card for curated/search results
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
    <Card className="group hover:shadow-md transition-shadow h-full flex flex-col">
      <CardContent className="p-4 flex flex-col h-full gap-3">
        {/* Icon + Provider badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
            {item.provider}
          </Badge>
        </div>

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
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Star className="h-3 w-3" />
              {item.rating_text}
            </Badge>
          )}
          {item.duration_text && (
            <Badge variant="secondary" className="text-[10px] gap-1">
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
