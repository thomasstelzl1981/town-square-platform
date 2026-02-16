/**
 * MOD-15 — Topic Section using CI WidgetGrid
 */

import { Skeleton } from '@/components/ui/skeleton';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { FortbildungItemCard } from './FortbildungItemCard';
import { TOPIC_LABELS, type FortbildungItem, type FortbildungTopic } from '@/services/fortbildung/types';

interface TopicSectionProps {
  topic: FortbildungTopic;
  items: FortbildungItem[];
  isLoading?: boolean;
}

export function TopicSection({ topic, items, isLoading }: TopicSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold tracking-tight">{TOPIC_LABELS[topic]}</h3>
        <WidgetGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <WidgetCell key={i}>
              <Skeleton className="h-full w-full rounded-xl" />
            </WidgetCell>
          ))}
        </WidgetGrid>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold tracking-tight">{TOPIC_LABELS[topic]}</h3>
      <WidgetGrid>
        {items.map(item => (
          <WidgetCell key={item.id}>
            <FortbildungItemCard item={item} />
          </WidgetCell>
        ))}
      </WidgetGrid>
    </div>
  );
}
