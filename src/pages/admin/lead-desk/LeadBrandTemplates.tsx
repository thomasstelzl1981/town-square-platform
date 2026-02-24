/**
 * LeadBrandTemplates — Tab 3: Brand-Templates (Zone 1)
 * Post-Erstellung und Social-Media-Vorschau für Kaufy, FutureRoom, Acquiary
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Loader2, Info } from 'lucide-react';
import BrandPostCard from './BrandPostCard';
import BrandPostCreator from './BrandPostCreator';

const BRANDS = [
  { key: 'all', label: 'Alle' },
  { key: 'kaufy', label: 'Kaufy' },
  { key: 'futureroom', label: 'FutureRoom' },
  { key: 'acquiary', label: 'Acquiary' },
] as const;

export default function LeadBrandTemplates() {
  const { isPlatformAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [brandFilter, setBrandFilter] = useState('all');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['admin-brand-templates', brandFilter],
    queryFn: async () => {
      let q = supabase
        .from('social_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (brandFilter !== 'all') q = q.eq('brand_context', brandFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!isPlatformAdmin,
  });

  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ['admin-brand-templates'] });

  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nur für Platform Admins</p>
      </div>
    );
  }

  const approvedCount = templates?.filter(t => t.approved).length || 0;
  const draftCount = templates?.filter(t => !t.approved).length || 0;

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0" />
        <span>
          Posts hier erstellen und freigeben. Freigegebene Posts sind in Zone 2 für Partner zur Kampagnenbuchung verfügbar.
        </span>
      </div>

      {/* Filter + Stats */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5">
          {BRANDS.map(b => (
            <Badge
              key={b.key}
              variant={brandFilter === b.key ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setBrandFilter(b.key)}
            >
              {b.label}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{templates?.length || 0} Posts</span>
          <span>·</span>
          <span className="text-emerald-600">{approvedCount} freigegeben</span>
          <span>·</span>
          <span>{draftCount} Entwürfe</span>
        </div>
      </div>

      {/* Post Creator (always visible) */}
      <BrandPostCreator onCreated={handleRefresh} />

      {/* Post Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="space-y-6">
          {templates.map(t => (
            <BrandPostCard key={t.id} template={t} onRefresh={handleRefresh} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Noch keine Posts vorhanden. Erstellen Sie oben den ersten Post.</p>
        </div>
      )}
    </div>
  );
}
