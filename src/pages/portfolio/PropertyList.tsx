import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, Building2, Eye, AlertTriangle, Search, Filter } from 'lucide-react';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';

interface PropertyWithFinancing {
  id: string;
  tenant_id: string;
  code: string | null;
  property_type: string;
  city: string;
  address: string;
  total_area_sqm: number | null;
  usage_type: string;
  annual_income: number | null;
  market_value: number | null;
  management_fee: number | null;
  status: string;
  created_at: string;
  current_balance?: number | null;
  monthly_rate?: number | null;
  current_monthly_rent?: number | null;
  tenant_name?: string | null;
  msv_active?: boolean;
  kaufy_active?: boolean;
  website_visible?: boolean;
}

export default function PropertyList() {
  const { activeOrganization } = useAuth();
  const [properties, setProperties] = useState<PropertyWithFinancing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = usePdfContentRef();
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  async function fetchProperties() {
    if (!activeOrganization) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data: propertiesData, error: propError } = await supabase
        .from('properties')
        .select(`
          *,
          property_financing(current_balance, monthly_rate, is_active),
          property_features(feature_code, status),
          units(
            id,
            current_monthly_rent,
            leases(
            id,
            status,
            tenant_contact_id
            )
          )
        `)
        .eq('tenant_id', activeOrganization.id)
        .order('created_at', { ascending: false });

      if (propError) throw propError;

      const enrichedProperties: PropertyWithFinancing[] = (propertiesData || []).map(prop => {
        const activeFinancing = prop.property_financing?.find((f: any) => f.is_active);
        const activeFeatures = prop.property_features?.filter((f: any) => f.status === 'active') || [];
        const msvActive = activeFeatures.some((f: any) => f.feature_code === 'msv');
        const kaufyActive = activeFeatures.some((f: any) => f.feature_code === 'kaufy');
        const websiteVisible = activeFeatures.some((f: any) => f.feature_code === 'website_visibility');
        const mainUnit = prop.units?.[0];
        const activeLease = mainUnit?.leases?.find((l: any) => l.status === 'active' || l.status === 'notice_given');
        
        return {
          id: prop.id,
          tenant_id: prop.tenant_id,
          code: prop.code,
          property_type: prop.property_type,
          city: prop.city,
          address: prop.address,
          total_area_sqm: prop.total_area_sqm,
          usage_type: prop.usage_type,
          annual_income: prop.annual_income,
          market_value: prop.market_value,
          management_fee: prop.management_fee,
          status: prop.status,
          created_at: prop.created_at,
          current_balance: activeFinancing?.current_balance,
          monthly_rate: activeFinancing?.monthly_rate,
          current_monthly_rent: mainUnit?.current_monthly_rent,
          tenant_name: activeLease ? 'Mieter vorhanden' : null,
          msv_active: msvActive,
          kaufy_active: kaufyActive,
          website_visible: websiteVisible,
        };
      });

      setProperties(enrichedProperties);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch properties');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProperties();
  }, [activeOrganization]);

  const cities = [...new Set(properties.map(p => p.city))].sort();
  const types = [...new Set(properties.map(p => p.property_type))].sort();

  const filteredProperties = properties.filter(p => {
    const matchesSearch = searchTerm === '' || 
      p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === 'all' || p.city === cityFilter;
    const matchesType = typeFilter === 'all' || p.property_type === typeFilter;
    return matchesSearch && matchesCity && matchesType;
  });

  const totalArea = filteredProperties.reduce((sum, p) => sum + (p.total_area_sqm || 0), 0);
  const totalIncome = filteredProperties.reduce((sum, p) => sum + (p.annual_income || 0), 0);
  const totalValue = filteredProperties.reduce((sum, p) => sum + (p.market_value || 0), 0);
  const totalDebt = filteredProperties.reduce((sum, p) => sum + (p.current_balance || 0), 0);
  const totalRate = filteredProperties.reduce((sum, p) => sum + (p.monthly_rate || 0), 0);

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatNumber = (value: number | null | undefined, suffix = '') => {
    if (value == null) return '–';
    return `${new Intl.NumberFormat('de-DE').format(value)}${suffix}`;
  };

  const getUsageTypeVariant = (type: string) => {
    switch (type) {
      case 'Vermietung': return 'default';
      case 'Verkauf': return 'secondary';
      case 'Leerstand': return 'destructive';
      default: return 'outline';
    }
  };

  if (!activeOrganization) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Bitte wählen Sie eine Organisation aus.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div ref={contentRef}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Immobilienportfolio</h2>
            <p className="text-muted-foreground">Übersicht aller Immobilien</p>
          </div>
          <Button asChild className="no-print">
            <Link to="/portal/immobilien/neu">
              <Plus className="mr-2 h-4 w-4" />
              Neue Immobilie
            </Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="mb-6 no-print">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suche nach Code, Adresse, Ort..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Ort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Orte</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Objektart" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Arten</SelectItem>
                  {types.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Properties Table */}
        <Card>
          <CardHeader>
            <CardTitle>Immobilien ({filteredProperties.length})</CardTitle>
            <CardDescription>
              Dashboard-Übersicht mit DB-Feldern gemäß Excel-Mapping
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Keine Immobilien gefunden</p>
                <Button asChild className="mt-4 no-print" variant="outline">
                  <Link to="/portal/immobilien/neu">Erste Immobilie anlegen</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Art</TableHead>
                        <TableHead>Ort</TableHead>
                        <TableHead>Adresse</TableHead>
                        <TableHead className="text-right">qm</TableHead>
                        <TableHead>Nutzung</TableHead>
                        <TableHead className="text-right">Einnahmen</TableHead>
                        <TableHead className="text-right">Verkehrswert</TableHead>
                        <TableHead className="text-right">Restschuld</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Warm</TableHead>
                        <TableHead>Mieter</TableHead>
                        <TableHead className="text-right">Hausgeld</TableHead>
                        <TableHead>Features</TableHead>
                        <TableHead className="text-right no-print">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProperties.map((prop) => (
                        <TableRow key={prop.id}>
                          <TableCell className="font-mono text-sm">{prop.code || '–'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{prop.property_type}</Badge>
                          </TableCell>
                          <TableCell>{prop.city}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{prop.address}</TableCell>
                          <TableCell className="text-right">{formatNumber(prop.total_area_sqm, ' qm')}</TableCell>
                          <TableCell>
                            <Badge variant={getUsageTypeVariant(prop.usage_type)}>{prop.usage_type}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(prop.annual_income)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(prop.market_value)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(prop.current_balance)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(prop.monthly_rate)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(prop.current_monthly_rent)}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{prop.tenant_name || '–'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(prop.management_fee)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {prop.msv_active && <Badge variant="default" className="text-xs">MSV</Badge>}
                              {prop.kaufy_active && <Badge variant="secondary" className="text-xs">Kaufy</Badge>}
                              {prop.website_visible && <Badge variant="outline" className="text-xs">Web</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right no-print">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/portal/immobilien/${prop.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Aggregations */}
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Gesamt qm:</span>
                      <span className="ml-2 font-medium">{formatNumber(totalArea, ' qm')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gesamt Einnahmen:</span>
                      <span className="ml-2 font-medium">{formatCurrency(totalIncome)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gesamt Verkehrswert:</span>
                      <span className="ml-2 font-medium">{formatCurrency(totalValue)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gesamt Restschuld:</span>
                      <span className="ml-2 font-medium">{formatCurrency(totalDebt)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gesamt Rate:</span>
                      <span className="ml-2 font-medium">{formatCurrency(totalRate)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <PdfExportFooter 
        contentRef={contentRef} 
        documentTitle="Immobilienportfolio" 
        moduleName="MOD-04 Immobilien" 
      />
    </div>
  );
}
