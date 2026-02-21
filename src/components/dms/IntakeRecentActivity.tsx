/**
 * IntakeRecentActivity — Shows recent document upload activity.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface RecentDoc {
  id: string;
  name: string;
  created_at: string;
  source: string | null;
}

export function IntakeRecentActivity() {
  const { activeTenantId } = useAuth();
  const [docs, setDocs] = useState<RecentDoc[]>([]);

  useEffect(() => {
    if (!activeTenantId) return;

    const load = async () => {
      const { data } = await supabase
        .from('documents')
        .select('id, name, created_at, source')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) setDocs(data);
    };

    load();
  }, [activeTenantId]);

  if (docs.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Letzte Uploads
      </h3>
      <Card>
        <CardContent className="p-4 space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 text-sm py-1.5">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate flex-1 font-medium">{doc.name}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: de })}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
