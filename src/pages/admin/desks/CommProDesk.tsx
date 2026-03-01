/**
 * CommPro Desk — Zone-1 Admin Desk for Brand Phone Assistants
 * Sub-Tab Navigation for 7 brands (Kaufy, FutureRoom, Acquiary, SoT, Lennox, Ncore, Otto²)
 */
import { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const BRAND_TABS = [
  { value: 'kaufy', label: 'Kaufy', path: 'kaufy' },
  { value: 'futureroom', label: 'FutureRoom', path: 'futureroom' },
  { value: 'acquiary', label: 'Acquiary', path: 'acquiary' },
  { value: 'sot', label: 'SoT', path: 'sot' },
  { value: 'lennox', label: 'Lennox & Friends', path: 'lennox' },
  { value: 'ncore', label: 'Ncore', path: 'ncore' },
  { value: 'otto', label: 'Otto²', path: 'otto' },
] as const;

function Loading() {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// Lazy-load the Zone 1 brand assistant panel
const BrandAssistantPanel = lazy(() => import('@/components/admin/desks/commpro/BrandAssistantPanel'));

export default function CommProDesk() {
  const location = useLocation();
  const subPath = location.pathname.replace(/^\/admin\/commpro-desk\/?/, '').split('/')[0] || '';
  const activeTab = BRAND_TABS.find(t => t.path === subPath)?.value || 'kaufy';

  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ done: number; total: number; current: string } | null>(null);

  const handleSyncAll = async () => {
    setBulkSyncing(true);
    setSyncProgress({ done: 0, total: BRAND_TABS.length, current: '' });
    let success = 0;
    let failed = 0;

    for (let i = 0; i < BRAND_TABS.length; i++) {
      const brand = BRAND_TABS[i];
      setSyncProgress({ done: i, total: BRAND_TABS.length, current: brand.label });

      try {
        const { data, error } = await supabase.functions.invoke('sot-phone-agent-sync', {
          body: { action: 'sync', brand_key: brand.value },
        });
        if (error || data?.error) {
          failed++;
          console.error(`Sync failed for ${brand.value}:`, error || data?.error);
        } else {
          success++;
        }
      } catch (err) {
        failed++;
        console.error(`Sync error for ${brand.value}:`, err);
      }
    }

    setSyncProgress(null);
    setBulkSyncing(false);
    toast({
      title: 'Bulk-Sync abgeschlossen',
      description: `${success} erfolgreich, ${failed} fehlgeschlagen`,
      variant: failed > 0 ? 'destructive' : 'default',
    });
  };

  const navigation = (
    <div className="flex items-center gap-4 flex-wrap">
      <Tabs value={activeTab} className="flex-1">
        <TabsList className="flex-wrap">
          {BRAND_TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <Link to={`/admin/commpro-desk/${tab.path}`}>{tab.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Button
        variant="outline"
        size="sm"
        onClick={handleSyncAll}
        disabled={bulkSyncing}
        className="shrink-0"
      >
        {bulkSyncing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            {syncProgress ? `${syncProgress.done}/${syncProgress.total} ${syncProgress.current}` : 'Sync…'}
          </>
        ) : (
          <>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Alle synchronisieren
          </>
        )}
      </Button>
    </div>
  );

  return (
    <OperativeDeskShell
      title="Communication Pro Desk"
      subtitle="Telefonassistenten für alle Marken — Premium-Tier mit ElevenLabs"
      moduleCode="MOD-14"
      zoneFlow={{ z3Surface: 'Brand Websites', z1Desk: 'CommPro Desk', z2Manager: 'MOD-14 Communication Pro' }}
      navigation={navigation}
    >
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<Navigate to="kaufy" replace />} />
          {BRAND_TABS.map(tab => (
            <Route
              key={tab.value}
              path={tab.path}
              element={<BrandAssistantPanel brandKey={tab.value} brandLabel={tab.label} />}
            />
          ))}
          <Route path="*" element={<Navigate to="/admin/commpro-desk/kaufy" replace />} />
        </Routes>
      </Suspense>
    </OperativeDeskShell>
  );
}
