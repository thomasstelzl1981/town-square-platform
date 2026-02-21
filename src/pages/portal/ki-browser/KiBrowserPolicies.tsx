import { Shield, Lock, Globe, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

function getRuleField(rules: Json | null, field: string, fallback: number): number {
  if (!rules || typeof rules !== 'object' || Array.isArray(rules)) return fallback;
  const val = (rules as Record<string, unknown>)[field];
  return typeof val === 'number' ? val : fallback;
}

const KiBrowserPolicies = () => {
  const { data: policies, isLoading: policiesLoading } = useQuery({
    queryKey: ['ki-browser-policies'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ki_browser_policies')
        .select('*')
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  const { data: domainRules, isLoading: rulesLoading } = useQuery({
    queryKey: ['ki-browser-domain-rules'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ki_browser_domain_rules')
        .select('*')
        .order('pattern', { ascending: true });
      return data || [];
    },
  });

  const activePolicy = policies?.find(p => p.is_active);
  const denyRules = domainRules?.filter(r => r.rule_type === 'deny') || [];
  const allowRules = domainRules?.filter(r => r.rule_type === 'allow') || [];

  const isLoading = policiesLoading || rulesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Policies</h1>
        <p className="text-muted-foreground mt-1">
          Aktive Sicherheitsrichtlinien und Restriktionen. Änderungen nur über Zone 1 (Compliance).
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Laden...
        </div>
      ) : (
        <>
          {/* Active Policy */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  {activePolicy?.name || 'Standard Safe Mode'}
                </CardTitle>
                <Badge className="bg-green-500/10 text-green-700 border-green-200">Aktiv</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-foreground mb-1">Max. Schritte</p>
                  <p className="text-muted-foreground">{getRuleField(activePolicy?.json_rules ?? null, 'max_steps', 50)} pro Session</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Session-TTL</p>
                  <p className="text-muted-foreground">{getRuleField(activePolicy?.json_rules ?? null, 'ttl_minutes', 30)} Minuten</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step Classification */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step-Klassifizierung</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-700 shrink-0 mt-0.5">Auto</Badge>
                <p className="text-muted-foreground">Docs-Seiten öffnen, Scrollen, Screenshots, Session beenden</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 shrink-0 mt-0.5">Bestätigung</Badge>
                <p className="text-muted-foreground">Unbekannte Domains, Klicks, Texteingaben, Extraktionen</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="bg-red-500/10 text-red-700 shrink-0 mt-0.5">Blockiert</Badge>
                <p className="text-muted-foreground">Passwörter, Uploads, Bezahlen, Löschen, Banking-Seiten</p>
              </div>
            </CardContent>
          </Card>

          {/* Domain Rules from DB */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lock className="h-4 w-4 text-destructive" />
                  Gesperrte Domains ({denyRules.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1 text-muted-foreground font-mono">
                {denyRules.length > 0 ? (
                  denyRules.map((r) => <p key={r.id}>{r.pattern}</p>)
                ) : (
                  <>
                    <p>*.bank.de, *.sparkasse.de</p>
                    <p>paypal.com, stripe.com, klarna.com</p>
                    <p>*.binance.*, *.coinbase.*</p>
                    <p>127.0.0.*, 10.*, 192.168.*</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-600" />
                  Vertrauenswürdige Domains ({allowRules.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1 text-muted-foreground font-mono">
                {allowRules.length > 0 ? (
                  allowRules.map((r) => <p key={r.id}>{r.pattern}</p>)
                ) : (
                  <>
                    <p>docs.*, wiki.*, developer.*</p>
                    <p>github.com, stackoverflow.com</p>
                    <p>*.gov.de, *.bund.de</p>
                    <p>immobilienscout24.de, immowelt.de</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Policies */}
          {policies && policies.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Alle Policy-Profile ({policies.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {policies.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{p.name}</span>
                        {p.is_active && <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs">Aktiv</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('de-DE')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <p>Policy-Änderungen sind nur über Zone 1 (Admin &gt; Compliance Desk) möglich.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KiBrowserPolicies;
