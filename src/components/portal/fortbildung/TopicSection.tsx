/**
 * MOD-15 — Topic Section (e.g. "Immobilien", "Finanzen")
 * Renders a horizontal grid of FortbildungItemCards.
 */

import { Skeleton } from '@/components/ui/skeleton';
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold tracking-tight">{TOPIC_LABELS[topic]}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {items.map(item => (
          <FortbildungItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
