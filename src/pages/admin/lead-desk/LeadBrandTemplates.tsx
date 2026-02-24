/**
 * LeadBrandTemplates — Tab 3: Brand-Templates (Zone 1)
 * Admin-Übersicht aller social_templates gruppiert nach Brand
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Palette, Info } from 'lucide-react';

const BRANDS = [
  { key: 'kaufy', label: 'Kaufy', color: 'text-orange-500' },
  { key: 'futureroom', label: 'FutureRoom', color: 'text-blue-500' },
  { key: 'acquiary', label: 'Acquiary', color: 'text-purple-500' },
] as const;

export default function LeadBrandTemplates() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('social_templates')
          .select('*')
          .order('brand_context')
          .order('code');
        setTemplates(data || []);
      } catch (err) {
        console.error('LeadBrandTemplates fetch:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isPlatformAdmin]);

  if (!isPlatformAdmin) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Nur für Platform Admins</p></div>;
  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  // Group by brand, count unique tenants per template code
  const grouped = BRANDS.map(brand => {
    const brandTemplates = templates.filter(t => t.brand_context === brand.key);
    // Group by code to count unique tenants
    const byCode = new Map<string, { code: string; name: string; active: boolean; tenantCount: number; formatType: string }>();
    brandTemplates.forEach(t => {
      const existing = byCode.get(t.code);
      if (existing) {
        existing.tenantCount += 1;
        if (t.active) existing.active = true;
      } else {
        byCode.set(t.code, {
          code: t.code,
          name: t.name,
          active: t.active,
          tenantCount: 1,
          formatType: t.format_type,
        });
      }
    });
    return { ...brand, templates: Array.from(byCode.values()), totalInstances: brandTemplates.length };
  });

  const totalTemplates = grouped.reduce((sum, g) => sum + g.templates.length, 0);

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0" />
        <span>Templates werden per Lazy-Seeding beim ersten Zugriff eines Partners erstellt. Diese Übersicht zeigt alle Instanzen aller Tenants.</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {grouped.map(g => (
          <Card key={g.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{g.label}</CardTitle>
              <Palette className={`h-4 w-4 ${g.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{g.templates.length}</div>
              <p className="text-xs text-muted-foreground">{g.totalInstances} Instanzen gesamt</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Brand Sections */}
      {grouped.map(g => (
        <Card key={g.key}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className={`h-5 w-5 ${g.color}`} />
              {g.label}
            </CardTitle>
            <CardDescription>{g.templates.length} Template-Codes · {g.totalInstances} Tenant-Instanzen</CardDescription>
          </CardHeader>
          <CardContent>
            {g.templates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Keine Templates für {g.label}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Tenants</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {g.templates.map(t => (
                    <TableRow key={t.code}>
                      <TableCell className="font-mono text-xs">{t.code}</TableCell>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><Badge variant="outline">{t.formatType}</Badge></TableCell>
                      <TableCell className="font-mono">{t.tenantCount}</TableCell>
                      <TableCell>
                        <Badge variant={t.active ? 'default' : 'secondary'}>
                          {t.active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
