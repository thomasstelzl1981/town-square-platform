/**
 * AdminQuickActions — Quick navigation links for Admin Dashboard
 */
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, ExternalLink, Download, Loader2, FileArchive, Rocket, Globe } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PLATFORM_DOMAINS, PIN_GATE_CODE } from '@/config/financeDeskConfig';
import { useZone3Setting, useUpdateZone3Setting } from '@/hooks/useZone3Settings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

function PinGateCard() {
  const { data: pinGateValue, isLoading } = useZone3Setting('pin_gate_enabled');
  const updateSetting = useUpdateZone3Setting();
  const pinEnabled = pinGateValue === 'true';
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Website-Einstellungen</CardTitle><CardDescription>Zentrale Steuerung für alle Brand-Websites (Zone 3)</CardDescription></CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2"><span className="text-sm font-medium">PIN-Gate</span><Badge variant={pinEnabled ? 'default' : 'secondary'}>{pinEnabled ? 'Aktiv' : 'Deaktiviert'}</Badge></div>
            <p className="text-xs text-muted-foreground">Zugangscode {PIN_GATE_CODE} für alle 5 Brand-Websites</p>
          </div>
          <Switch checked={pinEnabled} disabled={isLoading || updateSetting.isPending} onCheckedChange={c => updateSetting.mutate({ key: 'pin_gate_enabled', value: c ? 'true' : 'false' })} />
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminQuickActions() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportingEng, setExportingEng] = useState(false);
  const [engUrl, setEngUrl] = useState<string | null>(null);

  const handleExport = async (type: 'baseline' | 'engineering') => {
    const fn = type === 'baseline' ? 'sot-docs-export' : 'sot-docs-export-engineering';
    const setLoading = type === 'baseline' ? setExporting : setExportingEng;
    const setUrl = type === 'baseline' ? setExportUrl : setEngUrl;
    setLoading(true); setUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke(fn);
      if (error) throw error;
      if (data?.success && data?.url) { setUrl(data.url); toast.success('Export erstellt', { description: `${data.file_count} Dateien` }); }
      else throw new Error(data?.error || 'Export fehlgeschlagen');
    } catch (e) { toast.error('Export fehlgeschlagen', { description: e instanceof Error ? e.message : 'Fehler' }); }
    finally { setLoading(false); }
  };

  return (
    <>
      <PinGateCard />
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ExternalLink className="h-5 w-5" />Schnellzugriff</CardTitle><CardDescription>Direktzugang zu allen Bereichen</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Zone 2 – Portal</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="default" onClick={() => window.location.href = '/portal'} className="gap-2"><Users className="h-4 w-4" />Portal Super User öffnen</Button>
              <Button variant="outline" onClick={() => window.open('https://systemofatown.lovable.app/portal?mode=demo', '_blank')} className="gap-2"><ExternalLink className="h-4 w-4" />Demo-Account öffnen</Button>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Zone 3 – Websites</p>
            <div className="flex flex-wrap gap-3">
              {[
                { path: '/website/kaufy', label: 'Kaufy', icon: ExternalLink },
                { path: '/website/sot', label: 'System of a Town', icon: ExternalLink },
                { path: '/website/tierservice', label: 'Lennox & Friends', icon: ExternalLink },
                { path: '/website/futureroom', label: 'Future Room', icon: Rocket },
                { path: '/website/acquiary', label: 'Acquiary', icon: Building2 },
                { path: '/website/otto-advisory', label: 'Otto² Advisory', icon: ExternalLink },
                { path: '/website/ncore', label: 'Ncore', icon: ExternalLink },
              ].map(w => (
                <Button key={w.path} variant="outline" onClick={() => navigate(w.path)} className="gap-2"><w.icon className="h-4 w-4" />{w.label}</Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Go-live: {PLATFORM_DOMAINS.join(' | ')}</p>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Dokumentation</p>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="outline" onClick={() => handleExport('baseline')} disabled={exporting} className="gap-2">{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}{exporting ? 'Exportiere...' : 'Baseline-Docs'}</Button>
              <Button variant="outline" onClick={() => handleExport('engineering')} disabled={exportingEng} className="gap-2">{exportingEng ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}{exportingEng ? 'Exportiere...' : 'Engineering + RFP'}</Button>
              {exportUrl && <Button variant="default" onClick={() => window.open(exportUrl, '_blank')} className="gap-2"><Download className="h-4 w-4" />Baseline ZIP</Button>}
              {engUrl && <Button variant="default" onClick={() => window.open(engUrl, '_blank')} className="gap-2"><Download className="h-4 w-4" />Engineering ZIP</Button>}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Baseline = Specs & Module | Engineering = SSOT, Inventories, Gaps, Workbench</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
