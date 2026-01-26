import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DataTable, StatusBadge, EmptyState, type Column } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Mail, ArrowRight, Eye, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface InboundItem {
  id: string;
  source: string;
  status: string;
  file_name: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  sender_info: Record<string, unknown>;
  recipient_info: Record<string, unknown>;
  created_at: string;
  processed_at: string | null;
}

export function PosteingangTab() {
  // Fetch inbound items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inbound-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbound_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as InboundItem[];
    },
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const columns: Column<InboundItem>[] = [
    {
      key: 'source',
      header: 'Quelle',
      render: (_, item) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{item.source}</span>
        </div>
      ),
    },
    {
      key: 'file_name',
      header: 'Datei',
      render: (_, item) => (
        <span className="font-medium">{item.file_name || 'Kein Dateiname'}</span>
      ),
    },
    {
      key: 'file_size_bytes',
      header: 'Größe',
      render: (_, item) => formatFileSize(item.file_size_bytes),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'created_at',
      header: 'Eingegangen',
      render: (_, item) => formatDistanceToNow(new Date(item.created_at), {
        addSuffix: true,
        locale: de,
      }),
    },
    {
      key: 'actions',
      header: '',
      render: (_, item) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          {item.status === 'pending' && (
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const pendingCount = items.filter(i => i.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex items-center gap-4">
        <div className="bg-card border rounded-lg px-4 py-3">
          <div className="text-2xl font-bold">{items.length}</div>
          <div className="text-sm text-muted-foreground">Gesamt</div>
        </div>
        <div className="bg-card border rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-sm text-muted-foreground">Ausstehend</div>
        </div>
        {pendingCount > 0 && (
          <Button className="ml-auto">
            <ArrowRight className="h-4 w-4 mr-2" />
            Sortierung starten
          </Button>
        )}
      </div>

      {/* Items Table */}
      <div className="border rounded-lg bg-card">
        {items.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="Kein Posteingang"
            description="Neue Post wird hier automatisch angezeigt"
          />
        ) : (
          <DataTable
            data={items}
            columns={columns}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
