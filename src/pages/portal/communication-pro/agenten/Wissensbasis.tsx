/**
 * Wissensbasis — Knowledge Items aus armstrong_knowledge_items
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { BookOpen, Search, FileText, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const CATEGORY_COLORS: Record<string, string> = {
  system: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  immobilien: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  finance: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  legal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  process: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  glossary: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  faq: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export function Wissensbasis() {
  const [search, setSearch] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['armstrong-knowledge-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('armstrong_knowledge_items')
        .select('*')
        .order('item_code', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = items.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.item_code.toLowerCase().includes(q) ||
      item.title_de.toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      (item.summary_de || '').toLowerCase().includes(q);
  });

  if (isLoading) return <LoadingState />;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Wissensbasis leer"
        description="Knowledge Items erscheinen hier, sobald sie über die KB-Seeds oder manuell erstellt werden."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{items.length} Einträge</span>
        <span>•</span>
        <span>{items.filter(i => i.status === 'published').length} veröffentlicht</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Wissensbasis durchsuchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Items List */}
      <div className="space-y-1.5">
        {filtered.map(item => (
          <Card key={item.id} className="hover:bg-muted/30 transition-colors">
            <CardContent className="p-3 flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-[10px] font-mono text-muted-foreground">
                    {item.item_code}
                  </code>
                  {item.status === 'published' ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Clock className="h-3 w-3 text-amber-500" />
                  )}
                </div>
                <p className="text-sm font-medium truncate">{item.title_de}</p>
                {item.summary_de && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {item.summary_de}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Badge className={`text-[10px] ${CATEGORY_COLORS[item.category] || ''}`}>
                    {item.category}
                  </Badge>
                  {item.content_type && (
                    <Badge variant="outline" className="text-[10px]">
                      {item.content_type}
                    </Badge>
                  )}
                  {item.scope && (
                    <Badge variant="outline" className="text-[10px]">
                      {item.scope}
                    </Badge>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                v{item.version || '1.0'}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Keine Ergebnisse für „{search}"
        </div>
      )}
    </div>
  );
}
