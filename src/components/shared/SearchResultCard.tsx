/**
 * SearchResultCard — Shared, reusable card for displaying research results
 * Used across Zone 1 (DeskContactBook) and Zone 2 (FMEinreichung, Akquise).
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Globe, ExternalLink, UserPlus, MapPin, Star } from 'lucide-react';
import type { ResearchContact } from '@/hooks/useResearchEngine';

export interface SearchResultCardProps {
  result: ResearchContact;
  onAdopt?: (result: ResearchContact) => void;
  adoptLabel?: string;
  adoptDisabled?: boolean;
  compact?: boolean;
}

export function SearchResultCard({
  result,
  onAdopt,
  adoptLabel = 'Übernehmen',
  adoptDisabled = false,
  compact = false,
}: SearchResultCardProps) {
  const confidence = Math.round(result.confidence);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 p-3 hover:bg-muted/30 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'}`}>
            {result.name || '–'}
          </span>
          {confidence >= 70 && (
            <Badge variant="outline" className="text-xs text-primary shrink-0">
              ✓ {confidence}%
            </Badge>
          )}
          {result.rating && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {result.rating}
            </span>
          )}
        </div>
        <div className={`flex items-center gap-3 text-muted-foreground mt-1 flex-wrap ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {result.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />{result.email}
            </span>
          )}
          {result.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />{result.phone}
            </span>
          )}
          {result.address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />{result.address}
            </span>
          )}
          {result.website && (
            <a
              href={result.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />Web
            </a>
          )}
        </div>
        {result.sources.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {result.sources.map((s) => (
              <Badge key={s} variant="secondary" className="text-[9px] px-1 py-0">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {onAdopt && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAdopt(result)}
          disabled={adoptDisabled}
          className="shrink-0"
        >
          <UserPlus className="h-3 w-3 mr-1" />
          {adoptLabel}
        </Button>
      )}
    </div>
  );
}
