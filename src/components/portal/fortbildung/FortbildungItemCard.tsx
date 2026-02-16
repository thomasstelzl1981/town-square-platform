/**
 * MOD-15 — CI-Widget Card for Fortbildung items
 * Uses standard WidgetCell dimensions (aspect-square on desktop)
 */

import { ExternalLink, Star, Clock, BookOpen, GraduationCap, Calendar, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FortbildungItem } from '@/services/fortbildung/types';

const PROVIDER_ICONS: Record<string, typeof BookOpen> = {
  amazon: BookOpen,
  udemy: GraduationCap,
  eventbrite: Calendar,
  youtube: Play,
  impact: Star,
};

const PROVIDER_COLORS: Record<string, string> = {
  amazon: 'text-amber-500',
  udemy: 'text-violet-500',
  eventbrite: 'text-orange-500',
  youtube: 'text-rose-500',
  impact: 'text-cyan-500',
};

interface FortbildungItemCardProps {
  item: FortbildungItem;
}

/**
 * For YouTube thumbnails, use the nocookie domain to avoid tracking blockers.
 * For YouTube video links, convert to youtube-nocookie.com embed or just open in new tab.
 */
function getYoutubeThumbnail(url: string): string | null {
  try {
    const parsed = new URL(url);
    let videoId: string | null = null;
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtube-nocookie.com')) {
      videoId = parsed.searchParams.get('v');
      // Handle /embed/ URLs
      if (!videoId && parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1]?.split('?')[0] || null;
      }
    } else if (parsed.hostname === 'youtu.be') {
      videoId = parsed.pathname.slice(1).split('?')[0] || null;
    }
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
  } catch {
    // not a valid URL
  }
  return null;
}

export function FortbildungItemCard({ item }: FortbildungItemCardProps) {
  const Icon = PROVIDER_ICONS[item.provider] || BookOpen;
  const iconColor = PROVIDER_COLORS[item.provider] || 'text-primary';

  // For YouTube items, try to get a thumbnail if none set
  const imageUrl = item.image_url || (item.provider === 'youtube' ? getYoutubeThumbnail(item.affiliate_link) : null);

  return (
    <a
      href={item.affiliate_link}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full"
    >
      <Card className={cn(
        'glass-card rounded-xl h-full flex flex-col overflow-hidden cursor-pointer',
        'transition-all hover:shadow-lg hover:scale-[1.02]',
        'group'
      )}>
        {/* Cover image area */}
        {imageUrl ? (
          <div className="relative h-[45%] min-h-[80px] bg-muted/30 overflow-hidden shrink-0">
            <img
              src={imageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
            {/* Provider badge */}
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="text-[10px] capitalize bg-background/80 backdrop-blur-sm border-border/50">
                <Icon className={cn('h-3 w-3 mr-1', iconColor)} />
                {item.provider}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[35%] min-h-[60px] bg-muted/20 shrink-0">
            <div className={cn('rounded-full bg-background/80 p-3', iconColor)}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col flex-1 p-3 gap-1.5 min-h-0">
          <h4 className="font-semibold text-xs leading-tight line-clamp-2">{item.title}</h4>
          {item.author_or_channel && (
            <p className="text-[10px] text-muted-foreground truncate">{item.author_or_channel}</p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Meta row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.rating_text && (
              <Badge variant="secondary" className="text-[10px] gap-0.5 px-1.5 py-0">
                <Star className="h-2.5 w-2.5" />
                {item.rating_text}
              </Badge>
            )}
            {item.price_text && (
              <span className="text-[10px] font-semibold text-foreground">{item.price_text}</span>
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-1 text-[10px] font-medium text-primary mt-1">
            <span>Ansehen</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </div>
        </div>
      </Card>
    </a>
  );
}
