/**
 * SYSTEM-PREISLISTE — Konsolidierte Preisliste aller System-Services
 * Sektion A: KI-Aktionen (aus ArmstrongCreditPreisliste)
 * Sektion B: Infrastruktur-Services (aus billingConstants.ts)
 */
import { useMemo, useState } from 'react';
import { armstrongActions } from '@/manifests/armstrongManifest';
import {
  SYSTEM_PRICES,
  BILLING_CATEGORIES,
  CREDIT_VALUE_EUR,
  formatEurCents,
  type BillingCategory,
} from '@/config/billingConstants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Bot, Zap, Sparkles, ChevronDown, ChevronUp, CreditCard, Server } from 'lucide-react';

type CostGroup = 'free' | 'metered' | 'premium';

const groupMeta: Record<CostGroup, { label: string; icon: typeof Bot; color: string; desc: string }> = {
  free: { label: 'Kostenlos', icon: Bot, color: 'text-emerald-500', desc: 'Unbegrenzt nutzbar — keine Credits nötig' },
  metered: { label: 'Pay-per-Use', icon: Zap, color: 'text-amber-500', desc: 'Abrechnung pro Aufruf in Credits' },
  premium: { label: 'Premium', icon: Sparkles, color: 'text-violet-500', desc: 'Erweiterte KI-Aktionen mit höherem Aufwand' },
};

function centsToCredits(cents: number | null | undefined): string {
  if (!cents) return '—';
  const credits = cents / 25;
  if (credits < 1) return `${cents} Ct`;
  return `${credits} Cr`;
}

function formatCents(cents: number | null | undefined): string {
  if (!cents) return '—';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function SystemPreisliste() {
  const [expandedSection, setExpandedSection] = useState<string | null>('ki');

  const grouped = useMemo(() => {
    const active = armstrongActions.filter(
      (a) => a.status === 'active' && a.zones.includes('Z2')
    );
    const groups: Record<CostGroup, typeof active> = { free: [], metered: [], premium: [] };
    for (const action of active) {
      if (action.cost_model === 'free') groups.free.push(action);
      else if (action.cost_model === 'metered') groups.metered.push(action);
      else if (action.cost_model === 'premium') groups.premium.push(action);
    }
    return groups;
  }, []);

  const infraByCategory = useMemo(() => {
    const map: Record<BillingCategory, typeof SYSTEM_PRICES> = {
      documents: [], communication: [], banking: [], storage: [],
    };
    for (const p of SYSTEM_PRICES) {
      map[p.category].push(p);
    }
    return map;
  }, []);

  const toggle = (key: string) => setExpandedSection(prev => prev === key ? null : key);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Preisliste
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Alle Kosten im Überblick — KI-Aktionen und System-Services. 1 Credit = 0,25 €.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* SEKTION A: KI-Aktionen */}
        <div className="rounded-lg border">
          <Button
            variant="ghost"
            className="w-full justify-between px-4 py-3 h-auto"
            onClick={() => toggle('ki')}
          >
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-primary" />
              <div className="text-left">
                <span className="font-medium">KI-Aktionen</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({grouped.free.length + grouped.metered.length + grouped.premium.length} Aktionen)
                </span>
              </div>
            </div>
            {expandedSection === 'ki' ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </Button>

          {expandedSection === 'ki' && (
            <div className="px-4 pb-4 space-y-3">
              {(['free', 'metered', 'premium'] as CostGroup[]).map(group => {
                const meta = groupMeta[group];
                const actions = grouped[group];
                if (actions.length === 0) return null;
                const Icon = meta.icon;

                return (
                  <div key={group}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-4 w-4 ${meta.color}`} />
                      <span className="text-sm font-medium">{meta.label}</span>
                      <span className="text-xs text-muted-foreground">({actions.length})</span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aktion</TableHead>
                          <TableHead className="w-[80px] text-right">Credits</TableHead>
                          <TableHead className="w-[80px] text-right">EUR</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {actions.map(action => (
                          <TableRow key={action.action_code}>
                            <TableCell>
                              <span className="text-sm">{action.title_de}</span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {group === 'free' ? <Badge variant="secondary" className="text-[10px]">Frei</Badge> : centsToCredits(action.cost_hint_cents)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {group === 'free' ? '—' : formatCents(action.cost_hint_cents)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SEKTION B: Infrastruktur-Services */}
        <div className="rounded-lg border">
          <Button
            variant="ghost"
            className="w-full justify-between px-4 py-3 h-auto"
            onClick={() => toggle('infra')}
          >
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-primary" />
              <div className="text-left">
                <span className="font-medium">System-Services</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({SYSTEM_PRICES.length} Services)
                </span>
              </div>
            </div>
            {expandedSection === 'infra' ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </Button>

          {expandedSection === 'infra' && (
            <div className="px-4 pb-4 space-y-3">
              {(Object.keys(infraByCategory) as BillingCategory[]).map(cat => {
                const items = infraByCategory[cat];
                if (items.length === 0) return null;
                const catMeta = BILLING_CATEGORIES[cat];

                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2">
                      <span>{catMeta.icon}</span>
                      <span className="text-sm font-medium">{catMeta.label}</span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead className="w-[80px] text-right">Credits</TableHead>
                          <TableHead className="w-[100px] text-right">Preis</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map(item => (
                          <TableRow key={item.code}>
                            <TableCell>
                              <span className="text-sm">{item.label}</span>
                              {item.interval === 'monthly' && (
                                <span className="text-xs text-muted-foreground ml-1">/Monat</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {item.credits !== null ? `${item.credits} Cr` : '—'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatEurCents(item.eur_cents)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          1 Credit = 0,25 € · Kosten werden immer vorab angezeigt · Sie entscheiden vor jeder Ausführung
        </p>
      </CardContent>
    </Card>
  );
}
