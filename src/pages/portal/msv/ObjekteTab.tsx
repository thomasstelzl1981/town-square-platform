import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  MoreVertical, 
  FileText, 
  TrendingUp, 
  Mail, 
  Plus, 
  Star, 
  Eye, 
  AlertTriangle, 
  ShieldCheck 
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
  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitWithDetails | null>(null);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>('');
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);

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
        const kaltmiete = lease?.monthly_rent || 0;
        const nebenkosten = 0;
        const vorauszahlung = 0;
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

  // Column definitions - consistent with MOD-04 pattern
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
      render: (_, row) => {
        if (!row.lease) {
          return (
            <Badge variant="outline" className="text-status-warning border-status-warning/30">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Leerstand
            </Badge>
          );
        }
        return (
          <div>
            <p className="font-medium">
              {row.lease.contact?.last_name}, {row.lease.contact?.first_name}
            </p>
            <p className="text-xs text-muted-foreground">{row.lease.contact?.email || '–'}</p>
          </div>
        );
      }
    },
    {
      key: 'kaltmiete',
      header: 'Kaltmiete',
      minWidth: '100px',
      align: 'right',
      render: (val) => <PropertyCurrencyCell value={val} />
    },
    {
      key: 'nebenkosten',
      header: 'NK',
      minWidth: '80px',
      align: 'right',
      render: (val) => <PropertyCurrencyCell value={val} variant="muted" />
    },
    {
      key: 'vorauszahlung',
      header: 'Voraus.',
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-4">
      <PropertyTable
        data={units || []}
        columns={columns}
        isLoading={isLoading}
        showSearch
        searchPlaceholder="Objekte durchsuchen (Adresse, Code, Mieter)..."
        searchFilter={(row, search) => 
          row.properties?.address?.toLowerCase().includes(search) ||
          row.properties?.code?.toLowerCase().includes(search) ||
          row.unit_number?.toLowerCase().includes(search) ||
          row.lease?.contact?.last_name?.toLowerCase().includes(search) ||
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
