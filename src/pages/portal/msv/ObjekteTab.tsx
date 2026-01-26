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
import { MoreVertical, FileText, TrendingUp, Mail, Plus, Star, ExternalLink, Search, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TemplateWizard } from '@/components/msv/TemplateWizard';
import { LeaseFormDialog } from '@/components/msv/LeaseFormDialog';

interface PropertyData {
  id: string;
  address: string;
  code: string | null;
}

interface LeaseData {
  id: string;
  unit_id: string;
  status: string;
  monthly_rent: number;
  start_date: string;
  tenant_contact_id: string;
}

interface ContactData {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

interface UnitWithDetails {
  id: string;
  unit_number: string;
  area_sqm: number | null;
  property_id: string;
  tenant_id: string;
  properties: PropertyData | null;
  lease: (LeaseData & { contact: ContactData | null }) | null;
  kaltmiete: number;
  nebenkosten: number;
  vorauszahlung: number;
  warmmiete: number;
}

const ObjekteTab = () => {
  const navigate = useNavigate();
  const [templateWizardOpen, setTemplateWizardOpen] = useState(false);
  const [leaseFormOpen, setLeaseFormOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitWithDetails | null>(null);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: units, isLoading } = useQuery({
    queryKey: ['msv-objekte-list'],
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

      // Fetch active leases
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
        .in('id', contactIds.length > 0 ? contactIds : ['00000000-0000-0000-0000-000000000000']);

      const contactMap = new Map<string, ContactData>();
      contactsData?.forEach(c => contactMap.set(c.id, c));

      // Map leases to units
      const leaseMap = new Map<string, LeaseData & { contact: ContactData | null }>();
      leasesData?.forEach(lease => {
        leaseMap.set(lease.unit_id, {
          ...lease,
          contact: contactMap.get(lease.tenant_contact_id) || null
        });
      });

      // Build unit data with calculated rent components
      return unitsData?.map(unit => {
        const lease = leaseMap.get(unit.id) || null;
        
        // For now, use monthly_rent as Kaltmiete
        // In future: fetch from lease_components table
        const kaltmiete = lease?.monthly_rent || 0;
        const nebenkosten = 0; // TODO: from lease_components (type=utilities)
        const vorauszahlung = 0; // TODO: from lease_components (type=prepayment)
        const warmmiete = kaltmiete + nebenkosten + vorauszahlung;

        return {
          ...unit,
          properties: unit.properties as unknown as PropertyData | null,
          lease,
          kaltmiete,
          nebenkosten,
          vorauszahlung,
          warmmiete
        };
      }) || [];
    }
  });

  const filteredUnits = units?.filter(u => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      u.properties?.address?.toLowerCase().includes(searchLower) ||
      u.properties?.code?.toLowerCase().includes(searchLower) ||
      u.unit_number?.toLowerCase().includes(searchLower) ||
      u.lease?.contact?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const handleAction = (action: string, unit: UnitWithDetails) => {
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
      case 'mahnung':
        setSelectedTemplateCode('MAHNUNG');
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

  const formatCurrency = (value: number) => {
    return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Objekte durchsuchen (Adresse, Code, Mieter)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[80px]">Objekt-ID</TableHead>
              <TableHead className="min-w-[180px]">Objektadresse</TableHead>
              <TableHead className="min-w-[140px]">Mieter</TableHead>
              <TableHead className="min-w-[100px] text-right">Kaltmiete</TableHead>
              <TableHead className="min-w-[100px] text-right">Nebenkosten</TableHead>
              <TableHead className="min-w-[100px] text-right">Vorauszahlung</TableHead>
              <TableHead className="min-w-[100px] text-right">Warmmiete</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredUnits?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Keine Objekte gefunden
                </TableCell>
              </TableRow>
            ) : (
              filteredUnits?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-mono text-xs">
                      {row.properties?.code || row.unit_number}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{row.properties?.address || '—'}</p>
                      <p className="text-xs text-muted-foreground">{row.unit_number} · {row.area_sqm || '—'} m²</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {!row.lease ? (
                      <Badge variant="outline" className="text-status-warning border-status-warning/30">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Leerstand
                      </Badge>
                    ) : (
                      <div>
                        <p className="font-medium">
                          {row.lease.contact?.last_name}, {row.lease.contact?.first_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{row.lease.contact?.email || '—'}</p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.kaltmiete > 0 ? formatCurrency(row.kaltmiete) : '—'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.nebenkosten > 0 ? formatCurrency(row.nebenkosten) : '—'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.vorauszahlung > 0 ? formatCurrency(row.vorauszahlung) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {row.warmmiete > 0 ? formatCurrency(row.warmmiete) : '—'}
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
                            <DropdownMenuItem onClick={() => handleAction('mahnung', row)}>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Mahnung erstellen
                            </DropdownMenuItem>
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

export default ObjekteTab;
