/**
 * AcquiaryMandates — All Mandates Overview
 * 
 * Full list of all acquisition mandates with filtering
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  FileText, Loader2, Search, Building2, MapPin, User,
  Filter, Download, Eye
} from 'lucide-react';
import { useAcqMandates, useAkquiseManagers } from '@/hooks/useAcqMandate';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { MANDATE_STATUS_CONFIG, ASSET_FOCUS_OPTIONS, AcqMandateStatus } from '@/types/acquisition';

export default function AcquiaryMandates() {
  const { data: mandates, isLoading } = useAcqMandates();
  const { data: managers } = useAkquiseManagers();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredMandates = React.useMemo(() => {
    if (!mandates) return [];
    return mandates.filter(m => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesCode = m.code?.toLowerCase().includes(searchLower);
        const matchesName = m.client_display_name?.toLowerCase().includes(searchLower);
        const matchesRegion = (m.search_area as any)?.region?.toLowerCase().includes(searchLower);
        if (!matchesCode && !matchesName && !matchesRegion) return false;
      }
      // Status filter
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      return true;
    });
  }, [mandates, search, statusFilter]);

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return '–';
    const manager = managers?.find(m => m.id === managerId);
    return manager?.display_name || manager?.email || 'Unbekannt';
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '–';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR', 
      maximumFractionDigits: 0 
    }).format(value);
  };

  // Status counts for filter badges
  const statusCounts = React.useMemo(() => {
    if (!mandates) return {};
    return mandates.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [mandates]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Suche nach Code, Mandant, Region..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status ({mandates?.length || 0})</SelectItem>
                {Object.entries(MANDATE_STATUS_CONFIG).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label} ({statusCounts[status] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filteredMandates.length} Mandate gefunden</span>
      </div>

      {/* Mandate Table/Cards */}
      <div className="space-y-3">
        {filteredMandates.map((mandate) => {
          const statusConfig = MANDATE_STATUS_CONFIG[mandate.status] || MANDATE_STATUS_CONFIG.draft;
          
          return (
            <Card key={mandate.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{mandate.code}</span>
                        <Badge variant={statusConfig.variant as any}>
                          {statusConfig.label}
                        </Badge>
                        {mandate.client_display_name && (
                          <span className="text-sm text-muted-foreground">
                            • {mandate.client_display_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {(mandate.search_area as any)?.region || 'Region nicht angegeben'}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {getManagerName(mandate.assigned_manager_user_id)}
                        </span>
                        <span>
                          {format(new Date(mandate.created_at), 'dd.MM.yyyy', { locale: de })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        {formatCurrency(mandate.price_min)} – {formatCurrency(mandate.price_max)}
                      </div>
                      {mandate.yield_target && (
                        <div className="text-muted-foreground">
                          Zielrendite: {mandate.yield_target}%
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMandates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Mandate gefunden</h3>
            <p className="text-muted-foreground">
              {search || statusFilter !== 'all' 
                ? 'Passen Sie Ihre Suchkriterien an.'
                : 'Es wurden noch keine Akquise-Mandate erstellt.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
