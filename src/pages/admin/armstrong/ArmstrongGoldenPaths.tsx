/**
 * ArmstrongGoldenPaths — Zone 1 Golden Path Registry
 * 
 * Visualizes ALL golden paths: portal processes + engine workflows.
 * Data sourced directly from manifests — no duplication.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DESIGN } from '@/config/designManifest';
import {
  ArrowLeft, Route, Shield, CheckCircle, Clock, AlertTriangle,
  ExternalLink, BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { GOLDEN_PATH_PROCESSES, type GoldenPathProcess } from '@/manifests/goldenPathProcesses';
import { getAllGoldenPaths } from '@/goldenpath/engine';

// ── Helpers ──

function complianceScore(c: GoldenPathProcess['compliance']): number {
  return Object.values(c).filter(Boolean).length;
}

function phaseLabel(phase: string): string {
  if (phase === 'done') return 'Done';
  return `Phase ${phase}`;
}

type StatusType = 'done' | 'partial' | 'phase1';

function phaseToStatus(phase: string): StatusType {
  if (phase === 'done') return 'done';
  return 'phase1';
}

const STATUS_CONFIG: Record<StatusType, { label: string; cls: string; icon: typeof CheckCircle }> = {
  done: { label: 'Done', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle },
  partial: { label: 'Teilweise', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  phase1: { label: 'Phase 1', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Clock },
};

const ZONE_COLORS: Record<string, string> = {
  Z1: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Z2: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Z3: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
};

// ── Engine Workflow Data ──

interface EngineWorkflow {
  key: string;
  name: string;
  steps: number;
  zones: string;
  zoneList: string[];
  failStates: boolean;
  camundaReady: boolean;
}

const ENGINE_WORKFLOWS: EngineWorkflow[] = [
  { key: 'MOD-04', name: 'Immobilien-Zyklus', steps: 10, zones: 'Z2 → Z1 → Z2', zoneList: ['Z2', 'Z1'], failStates: true, camundaReady: true },
  { key: 'MOD-07', name: 'Finanzierung', steps: 5, zones: 'Z2 → Z1 → Z2', zoneList: ['Z2', 'Z1'], failStates: true, camundaReady: true },
  { key: 'MOD-08', name: 'Investment/Akquise', steps: 7, zones: 'Z2 → Z1 → Z2', zoneList: ['Z2', 'Z1'], failStates: true, camundaReady: true },
  { key: 'MOD-13', name: 'Projekte', steps: 5, zones: 'Z2 → Z1', zoneList: ['Z2', 'Z1'], failStates: true, camundaReady: true },
  { key: 'GP-VERMIETUNG', name: 'Vermietungszyklus', steps: 5, zones: 'Z1 → Z3', zoneList: ['Z1', 'Z3'], failStates: true, camundaReady: true },
  { key: 'GP-LEAD', name: 'Lead-Generierung', steps: 4, zones: 'Z3 → Z1 → Z2', zoneList: ['Z3', 'Z1', 'Z2'], failStates: true, camundaReady: true },
  { key: 'GP-FINANCE-Z3', name: 'Zone-3-Finanzierung', steps: 7, zones: 'Z3 → Z1 → Z2', zoneList: ['Z3', 'Z1', 'Z2'], failStates: true, camundaReady: true },
  { key: 'GP-PET', name: 'Pet Manager Lifecycle', steps: 7, zones: 'Z3 → Z1 → Z2', zoneList: ['Z3', 'Z1', 'Z2'], failStates: true, camundaReady: true },
];

// ── Component ──

const ArmstrongGoldenPaths: React.FC = () => {
  const portalProcesses = GOLDEN_PATH_PROCESSES;
  const doneCount = portalProcesses.filter(p => p.phase === 'done').length;
  const totalCompliance = portalProcesses.filter(p => complianceScore(p.compliance) === 6).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/armstrong">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
            <Route className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Golden Path Registry</h1>
            <p className="text-muted-foreground">Alle registrierten Geschäftsprozesse und Workflow-Definitionen</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={DESIGN.WIDGET_GRID.FULL}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Portal-Prozesse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portalProcesses.length}</div>
            <p className="text-xs text-muted-foreground">{doneCount} Done, {portalProcesses.length - doneCount} In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Engine-Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ENGINE_WORKFLOWS.length}</div>
            <p className="text-xs text-muted-foreground">Alle mit Fail-States</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-500">Compliance 6/6</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{totalCompliance}</div>
            <p className="text-xs text-muted-foreground">Voll konform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portalProcesses.length + ENGINE_WORKFLOWS.length}</div>
            <p className="text-xs text-muted-foreground">Registrierte Pfade</p>
          </CardContent>
        </Card>
      </div>

      {/* Governance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Golden Path Governance</CardTitle>
          </div>
          <CardDescription>Verbindliche Regeln für alle Golden Paths</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <span><strong>GP-GR-1:</strong> Jeder Workflow MUSS Fail-States für Cross-Zone-Steps definieren</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <span><strong>GP-GR-2:</strong> Alle Events MÜSSEN in der LEDGER_EVENT_WHITELIST registriert sein</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span><strong>GP-GR-3:</strong> Demo-Widget an Position 0 in jedem Portal-Prozess</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span><strong>GP-GR-4:</strong> Compliance 6/6 für Done-Status</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="portal">
        <TabsList>
          <TabsTrigger value="portal">Portal-Prozesse ({portalProcesses.length})</TabsTrigger>
          <TabsTrigger value="engine">Engine-Workflows ({ENGINE_WORKFLOWS.length})</TabsTrigger>
        </TabsList>

        {/* Portal Processes */}
        <TabsContent value="portal">
          <div className="grid gap-3">
            {portalProcesses.map((proc) => {
              const score = complianceScore(proc.compliance);
              const status = phaseToStatus(proc.phase);
              const statusCfg = STATUS_CONFIG[status];
              const StatusIcon = statusCfg.icon;

              return (
                <Card key={proc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{proc.processName}</span>
                          <Badge variant="outline" className="text-xs">{proc.moduleCode}</Badge>
                          <Badge variant="outline" className={statusCfg.cls}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{proc.description}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <Badge variant="outline" className={score === 6 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}>
                            <BarChart3 className="h-3 w-3 mr-1" />
                            {score}/6
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">{proc.id}</span>
                        </div>
                      </div>
                      <Link to={proc.tilePath}>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Engine Workflows */}
        <TabsContent value="engine">
          <div className="grid gap-3">
            {ENGINE_WORKFLOWS.map((wf) => (
              <Card key={wf.key} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{wf.name}</span>
                      <Badge variant="outline" className="text-xs font-mono">{wf.key}</Badge>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Camunda-ready
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-muted-foreground">{wf.steps} Schritte</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <div className="flex items-center gap-1">
                        {wf.zoneList.map((z) => (
                          <Badge key={z} variant="outline" className={`text-xs ${ZONE_COLORS[z] || ''}`}>
                            {z}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{wf.zones}</span>
                    </div>
                    {wf.failStates && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <Shield className="h-3 w-3" />
                        Fail-States definiert
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ArmstrongGoldenPaths;
