import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, FileText, TrendingUp, Mail, Plus, Star, ExternalLink, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TemplateWizard } from '@/components/msv/TemplateWizard';
import { LeaseFormDialog } from '@/components/msv/LeaseFormDialog';

const ListenTab = () => {
  const navigate = useNavigate();
  const [templateWizardOpen, setTemplateWizardOpen] = useState(false);
  const [leaseFormOpen, setLeaseFormOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: units, isLoading } = useQuery({
    queryKey: ['msv-units-list'],
    queryFn: async () => {
      const { data: unitsData, error } = await supabase
        .from('units')
        .select(`
          id,
          unit_number,
          area_sqm,
          property_id,
          tenant_id,
          properties (
            id,
            address,
            code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch leases separately
      const { data: leasesData } = await supabase
        .from('leases')
        .select(`
          id,
          unit_id,
          status,
          monthly_rent,
          start_date,
          tenant_contact_id
        `)
        .eq('status', 'active');

      // Fetch contacts for leases
      const contactIds = leasesData?.map(l => l.tenant_contact_id).filter(Boolean) || [];
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .in('id', contactIds);

      const contactMap = new Map();
      contactsData?.forEach(c => contactMap.set(c.id, c));

      // Map leases to units
      const leaseMap = new Map();
      leasesData?.forEach(lease => {
        leaseMap.set(lease.unit_id, {
          ...lease,
          contacts: contactMap.get(lease.tenant_contact_id)
        });
      });

      return unitsData?.map(unit => ({
        ...unit,
        lease: leaseMap.get(unit.id) || null
      })) || [];
    }
  });

  const filteredUnits = units?.filter(u => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      u.properties?.address?.toLowerCase().includes(searchLower) ||
      u.unit_number?.toLowerCase().includes(searchLower) ||
      u.lease?.contacts?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const handleAction = (action: string, unit: any) => {
    setSelectedUnit(unit);
    
    switch (action) {
      case 'kuendigung':
        setSelectedTemplateCode('KUENDIGUNG');
        setTemplateWizardOpen(true);
        break;
      case 'mieterhoehung':
        setSelectedTemplateCode('MIETERHOEHUNG');
        setTemplateWizardOpen(true);
        break;
      case 'datenanforderung':
        setSelectedTemplateCode('DATENANFORDERUNG');
        setTemplateWizardOpen(true);
        break;
      case 'lease':
        setLeaseFormOpen(true);
        break;
      case 'property':
        navigate(`/portfolio/${unit.property_id}`);
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Objekte durchsuchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Objekt</TableHead>
              <TableHead>Einheit</TableHead>
              <TableHead>Mieter</TableHead>
              <TableHead>Miete</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredUnits?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Keine Einheiten gefunden
                </TableCell>
              </TableRow>
            ) : (
              filteredUnits?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{row.properties?.address || '—'}</p>
                      {row.properties?.code && (
                        <p className="text-xs text-muted-foreground">{row.properties.code}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{row.unit_number}</p>
                      <p className="text-xs text-muted-foreground">{row.area_sqm} m²</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {!row.lease ? (
                      <Badge variant="outline" className="text-status-warning">Leerstand</Badge>
                    ) : (
                      <div>
                        <p className="font-medium">
                          {row.lease.contacts?.first_name} {row.lease.contacts?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{row.lease.contacts?.email}</p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {row.lease?.monthly_rent 
                        ? `${row.lease.monthly_rent.toLocaleString('de-DE')} €` 
                        : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {!row.lease ? (
                      <Badge variant="secondary">Leer</Badge>
                    ) : (
                      <Badge variant="default" className="bg-status-success">
                        Aktiv
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {row.lease ? (
                          <>
                            <DropdownMenuItem onClick={() => handleAction('kuendigung', row)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Kündigung schreiben
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('mieterhoehung', row)}>
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Mieterhöhung schreiben
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('datenanforderung', row)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Datenanforderung
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => handleAction('lease', row)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Mietvertrag anlegen
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAction('premium', row)}>
                          <Star className="h-4 w-4 mr-2" />
                          Premium aktivieren
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('property', row)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Objekt öffnen (MOD-04)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TemplateWizard
        open={templateWizardOpen}
        onOpenChange={setTemplateWizardOpen}
        templateCode={selectedTemplateCode}
        unit={selectedUnit}
      />

      <LeaseFormDialog
        open={leaseFormOpen}
        onOpenChange={setLeaseFormOpen}
        unit={selectedUnit}
      />
    </div>
  );
};

export default ListenTab;
