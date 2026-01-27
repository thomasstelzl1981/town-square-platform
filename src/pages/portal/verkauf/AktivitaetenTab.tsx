import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  FileText, 
  Globe, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  Calendar,
  TrendingUp,
  Building2
} from 'lucide-react';
import { EmptyState } from '@/components/shared';

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string | null;
  created_at: string;
  listing_id: string;
  metadata: Record<string, unknown>;
  performed_by: string | null;
  listing_title?: string;
}

const activityIcons: Record<string, React.ReactNode> = {
  'listing.created': <FileText className="h-4 w-4 text-blue-500" />,
  'listing.published': <Globe className="h-4 w-4 text-green-500" />,
  'listing.unpublished': <XCircle className="h-4 w-4 text-orange-500" />,
  'inquiry.created': <MessageSquare className="h-4 w-4 text-purple-500" />,
  'inquiry.qualified': <CheckCircle className="h-4 w-4 text-green-500" />,
  'reservation.created': <Calendar className="h-4 w-4 text-amber-500" />,
  'transaction.created': <TrendingUp className="h-4 w-4 text-emerald-500" />,
  'partner.released': <Users className="h-4 w-4 text-indigo-500" />,
  'default': <Building2 className="h-4 w-4 text-muted-foreground" />
};

const activityLabels: Record<string, string> = {
  'listing.created': 'Inserat erstellt',
  'listing.published': 'Veröffentlicht',
  'listing.unpublished': 'Deaktiviert',
  'inquiry.created': 'Neue Anfrage',
  'inquiry.qualified': 'Anfrage qualifiziert',
  'reservation.created': 'Reservierung angelegt',
  'transaction.created': 'Transaktion gestartet',
  'partner.released': 'Partner-Freigabe'
};

const AktivitaetenTab = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['verkauf-activities'],
    queryFn: async () => {
      // Fetch activities
      const { data: actData, error } = await supabase
        .from('listing_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch listing titles
      const listingIds = [...new Set(actData?.map(a => a.listing_id) || [])];
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title')
        .in('id', listingIds.length > 0 ? listingIds : ['00000000-0000-0000-0000-000000000000']);

      const listingMap = new Map(listings?.map(l => [l.id, l.title]) || []);

      return actData?.map(act => ({
        ...act,
        metadata: (act.metadata || {}) as Record<string, unknown>,
        listing_title: listingMap.get(act.listing_id) || 'Unbekanntes Inserat'
      })) || [];
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <EmptyState
        icon={FileText}
        title="Keine Aktivitäten"
        description="Sobald Sie Inserate erstellen und verwalten, erscheinen hier alle Aktivitäten."
      />
    );
  }

  // Group by date
  const groupedByDate = activities.reduce((acc, activity) => {
    const date = format(new Date(activity.created_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, ActivityItem[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, items]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {format(new Date(date), 'EEEE, d. MMMM yyyy', { locale: de })}
          </h3>
          <div className="space-y-2">
            {items.map(activity => (
              <Card key={activity.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {activityIcons[activity.activity_type] || activityIcons.default}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {activityLabels[activity.activity_type] || activity.activity_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.created_at), 'HH:mm')} Uhr
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {activity.listing_title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AktivitaetenTab;
