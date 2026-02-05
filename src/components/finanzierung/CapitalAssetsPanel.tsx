 /**
  * CapitalAssetsPanel - Shows MOD-04 properties/units as read-only assets in MOD-07
  * Part of Golden Path integration between MOD-07 and MOD-04
  */
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Building2, TrendingUp, CreditCard, Euro } from 'lucide-react';
 import { Skeleton } from '@/components/ui/skeleton';
 
 interface PropertyAsset {
   id: string;
   code: string | null;
   address: string | null;
   city: string | null;
   market_value: number | null;
   annual_income: number | null;
   units: {
     id: string;
     unit_number: string | null;
     area_sqm: number | null;
     current_monthly_rent: number | null;
   }[];
   loans: {
     id: string;
     outstanding_balance_eur: number | null;
     bank_name: string | null;
   }[];
 }
 
 interface AggregatedAssets {
   totalMarketValue: number;
   totalAnnualIncome: number;
   totalOutstandingDebt: number;
   netEquity: number;
   propertyCount: number;
   unitCount: number;
 }
 
 export function CapitalAssetsPanel() {
   const { activeOrganization } = useAuth();
 
   const { data: properties, isLoading } = useQuery({
     queryKey: ['capital-assets', activeOrganization?.id],
     queryFn: async () => {
       if (!activeOrganization?.id) return [];
       
       const { data, error } = await supabase
         .from('properties')
         .select(`
           id, code, address, city, market_value, annual_income,
           units (id, unit_number, area_sqm, current_monthly_rent),
           loans (id, outstanding_balance_eur, bank_name)
         `)
         .eq('tenant_id', activeOrganization.id)
         .eq('status', 'active');
 
       if (error) throw error;
       return (data || []) as PropertyAsset[];
     },
     enabled: !!activeOrganization?.id,
   });
 
   const aggregated: AggregatedAssets = (properties || []).reduce(
     (acc, prop) => {
       acc.totalMarketValue += prop.market_value || 0;
       acc.totalAnnualIncome += prop.annual_income || 0;
       acc.totalOutstandingDebt += prop.loans.reduce((sum, l) => sum + (l.outstanding_balance_eur || 0), 0);
       acc.propertyCount += 1;
       acc.unitCount += prop.units.length;
       return acc;
     },
     { totalMarketValue: 0, totalAnnualIncome: 0, totalOutstandingDebt: 0, netEquity: 0, propertyCount: 0, unitCount: 0 }
   );
   aggregated.netEquity = aggregated.totalMarketValue - aggregated.totalOutstandingDebt;
 
   const formatCurrency = (val: number) =>
     new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
 
   if (isLoading) {
     return (
       <Card>
         <CardHeader>
           <Skeleton className="h-6 w-48" />
         </CardHeader>
         <CardContent className="space-y-4">
           <Skeleton className="h-20 w-full" />
           <Skeleton className="h-20 w-full" />
         </CardContent>
       </Card>
     );
   }
 
   if (!properties || properties.length === 0) {
     return (
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Building2 className="h-5 w-5" />
             Kapitalanlagen (MOD-04)
           </CardTitle>
           <CardDescription>Vermietete Immobilien aus Ihrem Portfolio</CardDescription>
         </CardHeader>
         <CardContent>
           <p className="text-muted-foreground text-center py-6">
             Keine Kapitalanlage-Immobilien erfasst
           </p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-center justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               <Building2 className="h-5 w-5" />
               Kapitalanlagen (MOD-04)
             </CardTitle>
             <CardDescription>
               Vermietete Immobilien — read-only aus Immobilien-Modul
             </CardDescription>
           </div>
           <Badge variant="outline">{aggregated.propertyCount} Objekte</Badge>
         </div>
       </CardHeader>
       <CardContent className="space-y-6">
         {/* Aggregated Summary */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
           <div className="text-center">
             <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
             <div className="text-lg font-bold">{formatCurrency(aggregated.totalMarketValue)}</div>
             <div className="text-xs text-muted-foreground">Verkehrswert</div>
           </div>
           <div className="text-center">
             <Euro className="h-5 w-5 mx-auto text-primary/80 mb-1" />
             <div className="text-lg font-bold">{formatCurrency(aggregated.totalAnnualIncome)}</div>
             <div className="text-xs text-muted-foreground">Mieteinnahmen/Jahr</div>
           </div>
           <div className="text-center">
             <CreditCard className="h-5 w-5 mx-auto text-destructive mb-1" />
             <div className="text-lg font-bold">{formatCurrency(aggregated.totalOutstandingDebt)}</div>
             <div className="text-xs text-muted-foreground">Restschulden</div>
           </div>
           <div className="text-center">
             <Building2 className="h-5 w-5 mx-auto text-accent-foreground mb-1" />
             <div className="text-lg font-bold">{formatCurrency(aggregated.netEquity)}</div>
             <div className="text-xs text-muted-foreground">Netto-Eigenkapital</div>
           </div>
         </div>
 
         {/* Property List */}
         <div className="space-y-3">
           {properties.map((prop) => {
             const debt = prop.loans.reduce((sum, l) => sum + (l.outstanding_balance_eur || 0), 0);
             const rent = prop.units.reduce((sum, u) => sum + (u.current_monthly_rent || 0), 0) * 12;
             
             return (
               <div key={prop.id} className="p-3 border rounded-lg bg-background">
                 <div className="flex items-start justify-between">
                   <div>
                     <div className="font-medium">
                       {prop.code && `[${prop.code}] `}{prop.address}
                     </div>
                     <div className="text-sm text-muted-foreground">{prop.city}</div>
                   </div>
                   <Badge variant="secondary">{prop.units.length} Einheit(en)</Badge>
                 </div>
                 <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                   <div>
                     <div className="text-muted-foreground">Wert</div>
                     <div className="font-medium">{formatCurrency(prop.market_value || 0)}</div>
                   </div>
                   <div>
                     <div className="text-muted-foreground">Miete/Jahr</div>
                     <div className="font-medium text-primary">{formatCurrency(rent)}</div>
                   </div>
                   <div>
                     <div className="text-muted-foreground">Restschuld</div>
                     <div className="font-medium text-destructive">{formatCurrency(debt)}</div>
                   </div>
                 </div>
               </div>
             );
           })}
         </div>
       </CardContent>
     </Card>
   );
 }
 
 export default CapitalAssetsPanel;