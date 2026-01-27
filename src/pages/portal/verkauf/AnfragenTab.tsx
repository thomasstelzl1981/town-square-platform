import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  MoreVertical, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle,
  Calendar,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared';

interface InquiryWithListing {
  id: string;
  listing_id: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  message: string | null;
  source: string;
  status: string;
  utm_source: string | null;
  created_at: string;
  listing_title?: string;
  property_address?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'Neu', color: 'bg-blue-500' },
  contacted: { label: 'Kontaktiert', color: 'bg-amber-500' },
  qualified: { label: 'Qualifiziert', color: 'bg-green-500' },
  scheduled: { label: 'Termin', color: 'bg-purple-500' },
  won: { label: 'Gewonnen', color: 'bg-emerald-500' },
  lost: { label: 'Verloren', color: 'bg-gray-500' }
};

const sourceLabels: Record<string, string> = {
  website: 'Website',
  partner: 'Partner',
  direct: 'Direkt',
  referral: 'Empfehlung'
};

const AnfragenTab = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['verkauf-inquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listing_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch listing details
      const listingIds = [...new Set(data?.map(i => i.listing_id) || [])];
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title, properties(address)')
        .in('id', listingIds.length > 0 ? listingIds : ['00000000-0000-0000-0000-000000000000']);

      const listingMap = new Map(listings?.map(l => [l.id, { 
        title: l.title, 
        address: (l.properties as { address: string } | null)?.address 
      }]) || []);

      return data?.map(inq => ({
        ...inq,
        listing_title: listingMap.get(inq.listing_id)?.title || 'Unbekannt',
        property_address: listingMap.get(inq.listing_id)?.address || ''
      })) || [];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'new' | 'contacted' | 'qualified' | 'scheduled' | 'won' | 'lost' }) => {
      const { error } = await supabase
        .from('listing_inquiries')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verkauf-inquiries'] });
      toast.success('Status aktualisiert');
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ))}
      </div>
    );
  }

  const columns = ['new', 'contacted', 'qualified', 'scheduled'];
  const groupedInquiries = columns.reduce((acc, status) => {
    acc[status] = inquiries?.filter(i => i.status === status) || [];
    return acc;
  }, {} as Record<string, InquiryWithListing[]>);

  const renderInquiryCard = (inquiry: InquiryWithListing) => (
    <Card key={inquiry.id} className="mb-2 hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{inquiry.contact_name || 'Unbekannt'}</p>
            <p className="text-xs text-muted-foreground truncate">{inquiry.listing_title}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: 'contacted' as const })}>
                <Phone className="h-4 w-4 mr-2" />
                Als kontaktiert markieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: 'qualified' as const })}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Qualifizieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: 'scheduled' as const })}>
                <Calendar className="h-4 w-4 mr-2" />
                Termin vereinbart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: 'lost' as const })} className="text-destructive">
                <XCircle className="h-4 w-4 mr-2" />
                Verloren
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {sourceLabels[inquiry.source] || inquiry.source}
          </Badge>
          {inquiry.utm_source && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {inquiry.utm_source}
            </Badge>
          )}
        </div>

        {inquiry.message && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            "{inquiry.message}"
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{format(new Date(inquiry.created_at), 'dd.MM.', { locale: de })}</span>
          <div className="flex gap-2">
            {inquiry.contact_email && (
              <Button variant="ghost" size="icon" className="h-5 w-5" asChild>
                <a href={`mailto:${inquiry.contact_email}`}>
                  <Mail className="h-3 w-3" />
                </a>
              </Button>
            )}
            {inquiry.contact_phone && (
              <Button variant="ghost" size="icon" className="h-5 w-5" asChild>
                <a href={`tel:${inquiry.contact_phone}`}>
                  <Phone className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!inquiries?.length) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Keine Anfragen"
        description="Sobald Interessenten über Kaufy oder das Partner-Netzwerk anfragen, erscheinen sie hier."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {inquiries.length} Anfrage{inquiries.length !== 1 ? 'n' : ''} insgesamt
        </p>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map(status => (
          <div key={status} className="min-h-[200px]">
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-2 w-2 rounded-full ${statusConfig[status].color}`} />
              <h3 className="font-medium text-sm">{statusConfig[status].label}</h3>
              <Badge variant="secondary" className="ml-auto text-xs">
                {groupedInquiries[status].length}
              </Badge>
            </div>
            <div className="space-y-2 bg-muted/30 rounded-lg p-2 min-h-[150px]">
              {groupedInquiries[status].map(renderInquiryCard)}
              {groupedInquiries[status].length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Keine Anfragen
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Won/Lost summary */}
      <div className="flex gap-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span className="text-sm">
            <strong>{inquiries.filter(i => i.status === 'won').length}</strong> gewonnen
          </span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-gray-500" />
          <span className="text-sm">
            <strong>{inquiries.filter(i => i.status === 'lost').length}</strong> verloren
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnfragenTab;
