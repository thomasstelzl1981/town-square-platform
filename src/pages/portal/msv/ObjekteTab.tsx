import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  MoreVertical, 
  FileText, 
  TrendingUp, 
  Mail, 
  Plus, 
  Star, 
  Eye, 
  AlertTriangle, 
  ShieldCheck,
  Users,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TemplateWizard } from '@/components/msv/TemplateWizard';
import { LeaseFormDialog } from '@/components/msv/LeaseFormDialog';
import { ReadinessChecklist } from '@/components/msv/ReadinessChecklist';
import { 
  PropertyTable, 
  PropertyCodeCell, 
  PropertyAddressCell, 
  PropertyCurrencyCell,
  type PropertyTableColumn 
} from '@/components/shared';

interface PropertyData {
  id: string;
  address: string;
  code: string | null;
}

interface LeaseData {
  id: string;
  unit_id: string;
  status: string;
  rent_cold_eur: number | null;
  monthly_rent: number | null;
  nk_advance_eur: number | null;
  heating_advance_eur: number | null;
  start_date: string;
  tenant_contact_id: string;
}

interface ContactData {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

interface LandlordContext {
  id: string;
  name: string;
  context_type: string;
}

// Unit with multi-lease aggregation for MSV
interface UnitWithDetails {
  id: string;
  unit_number: string;
  area_sqm: number | null;
  property_id: string;
  tenant_id: string;
  properties: PropertyData | null;
  // Multi-lease support
  leases: (LeaseData & { contact: ContactData | null })[];
  primaryLease: (LeaseData & { contact: ContactData | null }) | null;
  leasesCount: number;
  // Aggregated values (monthly)
  kaltmiete: number; // SUM of all active leases
  nebenkosten: number; // SUM of nk_advance_eur
  heizkosten: number; // SUM of heating_advance_eur
  warmmiete: number; // kalt + nk + heating
}

const ObjekteTab = () => {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const [templateWizardOpen, setTemplateWizardOpen] = useState(false);
  const [leaseFormOpen, setLeaseFormOpen] = useState(false);
  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitWithDetails | null>(null);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>('');
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);

  // Fetch landlord contexts for filtering
  const { data: contexts = [] } = useQuery({
    queryKey: ['landlord-contexts', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landlord_contexts')
        .select('id, name, context_type')
        .eq('tenant_id', activeTenantId!)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as LandlordContext[];
    },
    enabled: !!activeTenantId,
  });

  // Fetch context_property_assignment for filtering
  const { data: contextAssignments = [] } = useQuery({
    queryKey: ['context-property-assignments', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('context_property_assignment')
        .select('context_id, property_id')
        .eq('tenant_id', activeTenantId!);
      
      if (error) throw error;
      return data;
    },
    enabled: !!activeTenantId,
  });

  // Fetch ALL units with multi-lease aggregation - NO FILTER on rental_managed
  const { data: units, isLoading } = useQuery({
    queryKey: ['msv-objekte-list-multi-lease', activeTenantId],
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
        .eq('tenant_id', activeTenantId!)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch ALL active leases (multi-lease per unit)
      const { data: leasesData } = await supabase
        .from('leases')
        .select(`
          id,
          unit_id,
          status,
          rent_cold_eur,
          monthly_rent,
          nk_advance_eur,
          heating_advance_eur,
          start_date,
          tenant_contact_id
        `)
        .eq('tenant_id', activeTenantId!)
        .eq('status', 'active');

      // Fetch contacts for leases
      const contactIds = leasesData?.map(l => l.tenant_contact_id).filter(Boolean) || [];
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .in('id', contactIds.length > 0 ? contactIds : ['00000000-0000-0000-0000-000000000000']);

      const contactMap = new Map<string, ContactData>();
      contactsData?.forEach(c => contactMap.set(c.id, c));

      // Build multi-lease map per unit
      const leasesByUnit = new Map<string, (LeaseData & { contact: ContactData | null })[]>();
      leasesData?.forEach(lease => {
        const leaseWithContact = {
          ...lease,
          contact: contactMap.get(lease.tenant_contact_id) || null
        };
        const existing = leasesByUnit.get(lease.unit_id) || [];
        existing.push(leaseWithContact);
        leasesByUnit.set(lease.unit_id, existing);
      });

      // Build unit data with multi-lease aggregation
      return unitsData?.map(unit => {
        const leases = leasesByUnit.get(unit.id) || [];
        const primaryLease = leases[0] || null;
        
        // Aggregate values across all active leases
        const kaltmiete = leases.reduce((sum, l) => 
          sum + (l.rent_cold_eur || l.monthly_rent || 0), 0);
        const nebenkosten = leases.reduce((sum, l) => 
          sum + (l.nk_advance_eur || 0), 0);
        const heizkosten = leases.reduce((sum, l) => 
          sum + (l.heating_advance_eur || 0), 0);
        const warmmiete = kaltmiete + nebenkosten + heizkosten;

        return {
          ...unit,
          properties: unit.properties as unknown as PropertyData | null,
          leases,
          primaryLease,
          leasesCount: leases.length,
          kaltmiete,
          nebenkosten,
          heizkosten,
          warmmiete
        };
      }) || [];
    },
    enabled: !!activeTenantId,
  });

  // Filter units by selected context
  const filteredUnits = useMemo(() => {
    if (!units) return [];
    if (!selectedContextId) return units;
    
    const assignedPropertyIds = contextAssignments
      .filter(a => a.context_id === selectedContextId)
      .map(a => a.property_id);
    
    return units.filter(u => assignedPropertyIds.includes(u.property_id));
  }, [units, selectedContextId, contextAssignments]);

  const handleAction = async (action: string, unit: UnitWithDetails) => {
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
      case 'premium':
        const { data: enrollment } = await supabase
          .from('msv_enrollments')
          .select('id')
          .eq('property_id', unit.property_id)
          .single();
        
        if (enrollment) {
          setSelectedEnrollmentId(enrollment.id);
        } else {
          const { data: newEnrollment } = await supabase
            .from('msv_enrollments')
            .insert({
              tenant_id: unit.tenant_id,
              property_id: unit.property_id,
              status: 'pending',
              tier: 'premium'
            })
            .select('id')
            .single();
          if (newEnrollment) {
            setSelectedEnrollmentId(newEnrollment.id);
          }
        }
        setPremiumDialogOpen(true);
        break;
      case 'property':
        navigate(`/portal/immobilien/${unit.property_id}`);
        break;
    }
  };

  // Multi-lease tenant display component
  const TenantCell = ({ unit }: { unit: UnitWithDetails }) => {
    if (unit.leasesCount === 0) {
      return (
        <Badge variant="outline" className="text-status-warning border-status-warning/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Leerstand
        </Badge>
      );
    }

    const primary = unit.primaryLease;
    const primaryName = primary?.contact 
      ? `${primary.contact.last_name}, ${primary.contact.first_name}` 
      : 'Unbekannt';

    if (unit.leasesCount === 1) {
      return (
        <div>
          <p className="font-medium">{primaryName}</p>
          <p className="text-xs text-muted-foreground">{primary?.contact?.email || '–'}</p>
        </div>
      );
    }

    // Multi-lease: Show popover with all tenants
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-auto p-0 font-normal text-left">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{unit.leasesCount} Mietverträge</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Aktive Mietverträge
          </div>
          <div className="space-y-2">
            {unit.leases.map((lease, idx) => (
              <div key={lease.id} className="flex items-center justify-between text-sm">
                <span>
                  {lease.contact 
                    ? `${lease.contact.last_name}, ${lease.contact.first_name}` 
                    : `Vertrag ${idx + 1}`}
                </span>
                <span className="text-muted-foreground">
                  {(lease.rent_cold_eur || lease.monthly_rent || 0).toLocaleString('de-DE')} €
                </span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  // Column definitions with multi-lease support
  const columns: PropertyTableColumn<UnitWithDetails>[] = [
    {
      key: 'code',
      header: 'Code',
      minWidth: '80px',
      render: (_, row) => <PropertyCodeCell code={row.properties?.code || null} fallback={row.unit_number} />
    },
    {
      key: 'address',
      header: 'Adresse',
      minWidth: '180px',
      render: (_, row) => (
        <PropertyAddressCell 
          address={row.properties?.address || null}
          subtitle={`${row.unit_number} · ${row.area_sqm || '–'} m²`}
        />
      )
    },
    {
      key: 'tenant',
      header: 'Mieter',
      minWidth: '150px',
      render: (_, row) => <TenantCell unit={row} />
    },
    {
      key: 'kaltmiete',
      header: 'Kaltmiete',
      minWidth: '100px',
      align: 'right',
      render: (val, row) => (
        <div className="flex items-center justify-end gap-1">
          <PropertyCurrencyCell value={val} />
          {row.leasesCount > 1 && (
            <Badge variant="outline" className="text-xs ml-1">Σ</Badge>
          )}
        </div>
      )
    },
    {
      key: 'nebenkosten',
      header: 'NK-VZ',
      minWidth: '80px',
      align: 'right',
      render: (val) => <PropertyCurrencyCell value={val} variant="muted" />
    },
    {
      key: 'heizkosten',
      header: 'HK-VZ',
      minWidth: '80px',
      align: 'right',
      render: (val) => <PropertyCurrencyCell value={val} variant="muted" />
    },
    {
      key: 'warmmiete',
      header: 'Warmmiete',
      minWidth: '100px',
      align: 'right',
      render: (val) => <PropertyCurrencyCell value={val} variant="bold" />
    }
  ];

  const renderRowActions = (row: UnitWithDetails) => (
    <div className="flex gap-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={() => navigate(`/portal/immobilien/${row.property_id}`)}
        title="Objekt öffnen"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {row.leasesCount > 0 ? (
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">MIETVERWALTUNG</h1>
        <p className="text-muted-foreground mt-1">Alle Objekte und Mietverträge im Überblick</p>
      </div>
      {/* Header with Context Dropdown */}
      {contexts.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Vermietereinheit:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Building2 className="h-4 w-4" />
                {selectedContextId 
                  ? contexts.find(c => c.id === selectedContextId)?.name || 'Alle'
                  : 'Alle Vermietereinheiten'}
                <span className="ml-1 text-xs">▼</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedContextId(null)}>
                Alle Vermietereinheiten
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {contexts.map(ctx => (
                <DropdownMenuItem 
                  key={ctx.id} 
                  onClick={() => setSelectedContextId(ctx.id)}
                >
                  {ctx.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <PropertyTable
        data={filteredUnits}
        columns={columns}
        isLoading={isLoading}
        showSearch
        searchPlaceholder="Objekte durchsuchen (Adresse, Code, Mieter)..."
        searchFilter={(row, search) => 
          row.properties?.address?.toLowerCase().includes(search) ||
          row.properties?.code?.toLowerCase().includes(search) ||
          row.unit_number?.toLowerCase().includes(search) ||
          row.leases?.some(l => l.contact?.last_name?.toLowerCase().includes(search)) ||
          false
        }
        emptyState={{
          message: 'Keine Immobilien vorhanden — zuerst in MOD-04 anlegen',
          actionLabel: 'Objekte anlegen (MOD-04)',
          actionRoute: '/portal/immobilien/portfolio'
        }}
        onRowClick={(row) => navigate(`/portal/immobilien/${row.property_id}`)}
        rowActions={renderRowActions}
      />

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

      <Dialog open={premiumDialogOpen} onOpenChange={setPremiumDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Premium für {selectedUnit?.properties?.address}
            </DialogTitle>
          </DialogHeader>
          {selectedEnrollmentId && (
            <ReadinessChecklist
              enrollmentId={selectedEnrollmentId}
              onComplete={() => setPremiumDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ObjekteTab;
