/**
 * ARMSTRONG CREDIT PREISLISTE — Reads directly from armstrongManifest (SSOT)
 * Groups actions by cost_model: Free → Metered → Premium
 * Displays credits and EUR prices (1 Credit = 0,25 EUR)
 */

import { useMemo, useState } from 'react';
import { armstrongActions } from '@/manifests/armstrongManifest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Bot, Zap, CreditCard, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const CREDIT_VALUE_EUR = 0.25; // 1 Credit = 0,25 EUR

type CostGroup = 'free' | 'metered' | 'premium';

const groupMeta: Record<CostGroup, { label: string; icon: typeof Bot; color: string; desc: string }> = {
  free: { label: 'Kostenlos', icon: Bot, color: 'text-emerald-500', desc: 'Unbegrenzt nutzbar — keine Credits nötig' },
  metered: { label: 'Pay-per-Use', icon: Zap, color: 'text-amber-500', desc: 'Abrechnung pro Aufruf in Credits' },
  premium: { label: 'Premium', icon: Sparkles, color: 'text-violet-500', desc: 'Erweiterte KI-Aktionen mit höherem Aufwand' },
};

function formatCents(cents: number | null | undefined): string {
  if (!cents) return '—';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function centsToCredits(cents: number | null | undefined): string {
  if (!cents) return '—';
  const credits = cents / 25; // 25 Cent = 1 Credit
  if (credits < 1) return `${cents} Ct`;
  return `${credits} Cr`;
}

export function ArmstrongCreditPreisliste() {
  const [expandedGroup, setExpandedGroup] = useState<CostGroup | null>('free');

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

  const toggleGroup = (group: CostGroup) => {
    setExpandedGroup((prev) => (prev === group ? null : group));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Armstrong Aktionskatalog & Preise
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Alle verfügbaren KI-Aktionen — direkt aus dem Armstrong Manifest.
          1 Credit = 0,25 €.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {(['free', 'metered', 'premium'] as CostGroup[]).map((group) => {
          const meta = groupMeta[group];
          const actions = grouped[group];
          const isExpanded = expandedGroup === group;
          const Icon = meta.icon;

          return (
            <div key={group} className="rounded-lg border">
              <Button
                variant="ghost"
                className="w-full justify-between px-4 py-3 h-auto"
                onClick={() => toggleGroup(group)}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                  <div className="text-left">
                    <span className="font-medium">{meta.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({actions.length} Aktionen)
                    </span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>

              {isExpanded && actions.length > 0 && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-3">{meta.desc}</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aktion</TableHead>
                        <TableHead className="w-[100px]">Modul</TableHead>
                        <TableHead className="w-[100px] text-right">Credits</TableHead>
                        <TableHead className="w-[100px] text-right">EUR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {actions.map((action) => (
                        <TableRow key={action.action_code}>
                          <TableCell>
                            <div>
                              <span className="text-sm font-medium">{action.title_de}</span>
                              <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {action.description_de}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {action.module ? (
                              <Badge variant="outline" className="text-[10px]">
                                {action.module}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Global</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {group === 'free' ? (
                              <Badge variant="secondary" className="text-[10px]">Frei</Badge>
                            ) : (
                              centsToCredits(action.cost_hint_cents)
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {group === 'free' ? '—' : formatCents(action.cost_hint_cents)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground text-center pt-2">
          1 Credit = 0,25 € · Kosten werden immer vorab angezeigt · Sie entscheiden vor jeder Ausführung
        </p>
      </CardContent>
    </Card>
  );
}
