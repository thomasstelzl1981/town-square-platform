/**
 * MOD-15 — Universal tab content (used by all 4 tabs)
 * Shows: Top-Seller sections by topic → Search bar → Search results
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { TopicSection } from './TopicSection';
import { FortbildungItemCard } from './FortbildungItemCard';
import { fetchCuratedItems, searchCuratedItems } from '@/services/fortbildung/curatedProvider';
import { TOPICS, TAB_CONFIG, type FortbildungTab, type FortbildungItem, type FortbildungTopic } from '@/services/fortbildung/types';

interface FortbildungTabContentProps {
  tab: FortbildungTab;
}

export function FortbildungTabContent({ tab }: FortbildungTabContentProps) {
  const config = TAB_CONFIG[tab];
  const [itemsByTopic, setItemsByTopic] = useState<Record<FortbildungTopic, FortbildungItem[]>>({
    immobilien: [],
    finanzen: [],
    erfolg: [],
    persoenlichkeit: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FortbildungItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [apiAvailable] = useState(false); // MVP: always false

  // Load curated items on mount / tab change
  useEffect(() => {
    setIsLoading(true);
    setSearchQuery('');
    setSearchResults(null);

    Promise.all(
      TOPICS.map(topic => fetchCuratedItems(tab, topic).then(items => ({ topic, items })))
    ).then(results => {
      const map = { immobilien: [] as FortbildungItem[], finanzen: [] as FortbildungItem[], erfolg: [] as FortbildungItem[], persoenlichkeit: [] as FortbildungItem[] };
      results.forEach(r => { map[r.topic] = r.items; });
      setItemsByTopic(map);
      setIsLoading(false);
    });
  }, [tab]);

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    const result = await searchCuratedItems(tab, q);
    setSearchResults(result.items);
    setIsSearching(false);
  }, [tab, searchQuery]);

  return (
    <div className="space-y-8">
      {/* API status badge */}
      {!apiAvailable && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1.5">
            <Info className="h-3 w-3" />
            Kuratierte Vorschläge — API noch nicht verbunden
          </Badge>
        </div>
      )}

      {/* TOP-SELLER SECTIONS */}
      <div className="space-y-6">
        <h2 className="text-base font-bold tracking-tight uppercase text-muted-foreground">
          Top-Empfehlungen
        </h2>
        {TOPICS.map(topic => (
          <TopicSection
            key={topic}
            topic={topic}
            items={itemsByTopic[topic]}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* SEARCH */}
      <div className="space-y-4">
        <h2 className="text-base font-bold tracking-tight uppercase text-muted-foreground">
          Suche
        </h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={config.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? 'Suche…' : 'Suchen'}
          </Button>
        </div>

        {/* SEARCH RESULTS */}
        {searchResults !== null && (
          <div className="space-y-3">
            {searchResults.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    Keine Treffer für „{searchQuery}". Versuche einen anderen Suchbegriff oder nutze die Empfehlungen oben.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{searchResults.length} Treffer</p>
                <WidgetGrid>
                  {searchResults.map(item => (
                    <WidgetCell key={item.id}>
                      <FortbildungItemCard item={item} />
                    </WidgetCell>
                  ))}
                </WidgetGrid>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
