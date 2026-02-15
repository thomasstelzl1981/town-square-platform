/**
 * OperativeDeskShell — Standardisierte Shell für alle Zone-1 Operative Desks
 * 
 * Design Manifest V1.0:
 * ┌─────────────────────────────────────────────┐
 * │ HEADER: Title + Subtitle + MOD-Badge        │
 * ├─────────────────────────────────────────────┤
 * │ KPI ROW: 4-Spalten Grid (optional)          │
 * ├─────────────────────────────────────────────┤
 * │ TABS: Router-linked TabsList (optional)     │
 * ├─────────────────────────────────────────────┤
 * │ CONTENT: children                           │
 * └─────────────────────────────────────────────┘
 * 
 * Zone-Flow: Z3 (Surface) ↔ Z1 (Governance) ↔ Z2 (Manager)
 */
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

// ─── KPI Definition ──────────────────────────────────────────────────────────
export interface DeskKPI {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Semantic color token class, e.g. "text-primary" */
  color?: string;
  subtitle?: string;
}

// ─── Shell Props ─────────────────────────────────────────────────────────────
interface OperativeDeskShellProps {
  /** Desk display name (uppercase rendered) */
  title: string;
  /** One-line description of governance responsibilities */
  subtitle: string;
  /** Manager-Module code, e.g. "MOD-13" */
  moduleCode: string;
  /** Optional KPI cards (max 4 recommended) */
  kpis?: DeskKPI[];
  /** Tab bar or custom navigation (rendered between KPIs and content) */
  navigation?: ReactNode;
  /** Main content */
  children: ReactNode;
}

export function OperativeDeskShell({
  title,
  subtitle,
  moduleCode,
  kpis,
  navigation,
  children,
}: OperativeDeskShellProps) {
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase">{title}</h1>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
        <Badge variant="outline" className="text-xs">{moduleCode}</Badge>
      </div>

      {/* KPI ROW */}
      {kpis && kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className={`h-4 w-4 ${kpi.color || 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                {kpi.subtitle && (
                  <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* NAVIGATION (Tabs / Links) */}
      {navigation}

      {/* CONTENT */}
      {children}
    </div>
  );
}
