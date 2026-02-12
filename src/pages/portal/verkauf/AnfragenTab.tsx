import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  MessageSquare, 
  User, 
  Mail, 
  CheckCircle2,
  XCircle,
  Clock,
  Calendar
} from 'lucide-react';
import { 
  PropertyTable, 
  PropertyAddressCell,
  KPICard,
  type PropertyTableColumn 
} from '@/components/shared';
import { DESIGN } from '@/config/designManifest';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type InquiryStatus = 'new' | 'contacted' | 'qualified' | 'scheduled' | 'won' | 'lost';

interface InquiryRow {
  id: string;
  listing_title: string;
  property_address: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  message: string | null;
  source: string;
  status: InquiryStatus;
  created_at: string;
}

const statusConfig: Record<InquiryStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof Clock }> = {
  new: { label: 'Neu', variant: 'default', icon: Clock },
  contacted: { label: 'Kontaktiert', variant: 'secondary', icon: Mail },
  qualified: { label: 'Qualifiziert', variant: 'default', icon: CheckCircle2 },
  scheduled: { label: 'Termin', variant: 'default', icon: Calendar },
  won: { label: 'Gewonnen', variant: 'default', icon: CheckCircle2 },
  lost: { label: 'Verloren', variant: 'destructive', icon: XCircle }
};

const sourceLabels: Record<string, string> = {
  website: 'Kaufy Website',
  partner: 'Partner-Netzwerk',
  direct: 'Direkt',
  referral: 'Empfehlung'
};

const AnfragenTab = () => {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | null>(null);

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['verkauf-inquiries', activeTenantId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('listing_inquiries')
        .select('*')
        .eq('tenant_id', activeTenantId!)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const listingIds = [...new Set(data?.map(i => i.listing_id) || [])];
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title, properties (address, city)')
        .in('id', listingIds.length > 0 ? listingIds : ['00000000-0000-0000-0000-000000000000']);

      const listingMap = new Map(
        listings?.map(l => [
          l.id, 
          { 
            title: l.title, 
            address: l.properties ? `${(l.properties as any).address}, ${(l.properties as any).city}` : '' 
          }
        ]) || []
      );

      return data?.map(inq => ({
        id: inq.id,
        listing_title: listingMap.get(inq.listing_id)?.title || 'Unbekannt',
        property_address: listingMap.get(inq.listing_id)?.address || '',
        contact_name: inq.contact_name,
        contact_email: inq.contact_email,
        contact_phone: inq.contact_phone,
        message: inq.message,
        source: inq.source || 'direct',
        status: (inq.status || 'new') as InquiryStatus,
        created_at: inq.created_at
      })) || [];
    },
    enabled: !!activeTenantId
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InquiryStatus }) => {
      const { error } = await supabase
        .from('listing_inquiries')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verkauf-inquiries'] });
      toast.success('Status aktualisiert');
    },
    onError: (err: Error) => toast.error(`Fehler: ${err.message}`)
  });

  const newCount = inquiries.filter(i => i.status === 'new').length;
  const qualifiedCount = inquiries.filter(i => i.status === 'qualified').length;
  const wonCount = inquiries.filter(i => i.status === 'won').length;

  const columns: PropertyTableColumn<InquiryRow>[] = [
    {
      key: 'listing_title',
      header: 'Objekt',
      minWidth: '200px',
      render: (_, row) => <PropertyAddressCell address={row.listing_title} subtitle={row.property_address} />
    },
    {
      key: 'contact_name',
      header: 'Interessent',
      minWidth: '150px',
      render: (val, row) => (
        <div className="space-y-1">
          <span className="flex items-center gap-1 font-medium">
            <User className="h-3 w-3 text-muted-foreground" />
            {val || '—'}
          </span>
          {row.contact_email && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {row.contact_email}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'source',
      header: 'Quelle',
      minWidth: '120px',
      render: (val) => (
        <Badge variant="outline" className="text-xs">
          {sourceLabels[val as string] || val}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      minWidth: '120px',
      render: (val, row) => {
        const config = statusConfig[val as InquiryStatus] || statusConfig.new;
        const IconComponent = config.icon;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-1">
                <Badge variant={config.variant} className="gap-1 cursor-pointer">
                  <IconComponent className="h-3 w-3" />
                  {config.label}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(Object.keys(statusConfig) as InquiryStatus[]).map((key) => {
                const cfg = statusConfig[key];
                return (
                  <DropdownMenuItem 
                    key={key} 
                    onClick={() => updateStatusMutation.mutate({ id: row.id, status: key })}
                    disabled={key === val}
                  >
                    <cfg.icon className="h-4 w-4 mr-2" />
                    {cfg.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    },
    {
      key: 'created_at',
      header: 'Datum',
      minWidth: '100px',
      render: (val) => val ? (
        <span className="text-sm text-muted-foreground">
          {format(new Date(val), 'dd.MM.yy HH:mm', { locale: de })}
        </span>
      ) : <span>—</span>
    }
  ];

  return (
    <PageShell>
      <ModulePageHeader title="Anfragen" description="Kaufanfragen verwalten und qualifizieren" />
      <div className={DESIGN.KPI_GRID.FULL}>
        <KPICard
          label="Neue Anfragen"
          value={newCount}
          icon={MessageSquare}
          onClick={() => setStatusFilter(statusFilter === 'new' ? null : 'new')}
          className={statusFilter === 'new' ? 'border-primary' : ''}
        />
        <KPICard
          label="Qualifiziert"
          value={qualifiedCount}
          icon={CheckCircle2}
          onClick={() => setStatusFilter(statusFilter === 'qualified' ? null : 'qualified')}
          className={statusFilter === 'qualified' ? 'border-primary' : ''}
        />
        <KPICard
          label="Gewonnen"
          value={wonCount}
          icon={CheckCircle2}
          onClick={() => setStatusFilter(statusFilter === 'won' ? null : 'won')}
          className={statusFilter === 'won' ? 'border-primary' : ''}
        />
      </div>

      {statusFilter && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            Filter: {statusConfig[statusFilter]?.label || statusFilter}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter(null)}>
            Filter zurücksetzen
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anfragen</CardTitle>
          <CardDescription>Alle Anfragen zu Ihren Inseraten</CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyTable
            data={inquiries}
            columns={columns}
            isLoading={isLoading}
            showSearch
            searchPlaceholder="Anfragen durchsuchen..."
            searchFilter={(row, search) =>
              row.listing_title?.toLowerCase().includes(search) ||
              row.contact_name?.toLowerCase().includes(search) ||
              row.contact_email?.toLowerCase().includes(search) ||
              false
            }
            emptyState={{
              message: statusFilter 
                ? `Keine Anfragen mit Status "${statusConfig[statusFilter]?.label}"`
                : 'Noch keine Anfragen eingegangen',
              actionLabel: '',
              actionRoute: ''
            }}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default AnfragenTab;
