/**
 * Armstrong Policies — Zone 1 Admin
 * 
 * Policy-Editor für System-Prompts und Guardrails.
 * Konfiguriert Sicherheitsregeln und Verhaltensrichtlinien für Armstrong.
 */
import React, { useState } from 'react';
import { Scale, Plus, Shield, FileText, History, AlertTriangle, ArrowLeft, BookOpen, Loader2, CheckCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link } from 'react-router-dom';
import { useArmstrongPolicies, ArmstrongPolicy, PolicyCategory, PolicyStatus } from '@/hooks/useArmstrongPolicies';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const categoryConfig: Record<PolicyCategory, { icon: React.ElementType; label: string; description: string }> = {
  system_prompt: { icon: FileText, label: 'System-Prompts', description: 'Basis-Anweisungen für Armstrong' },
  guardrail: { icon: Shield, label: 'Guardrails', description: 'Grenzen und Einschränkungen' },
  security: { icon: AlertTriangle, label: 'Sicherheitsregeln', description: 'Datenschutz und Compliance' },
};

const statusBadgeConfig: Record<PolicyStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
  draft: { variant: 'secondary', label: 'Entwurf' },
  active: { variant: 'default', label: 'Aktiv' },
  deprecated: { variant: 'destructive', label: 'Veraltet' },
};

export default function ArmstrongPolicies() {
  const [selectedPolicy, setSelectedPolicy] = useState<ArmstrongPolicy | null>(null);
  const { policies, stats, isLoading } = useArmstrongPolicies();

  const policiesByCategory = (category: PolicyCategory) => 
    policies.filter(p => p.category === category);

  const renderPolicyList = (category: PolicyCategory) => {
    const categoryPolicies = policiesByCategory(category);
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    if (categoryPolicies.length === 0) {
      const config = categoryConfig[category];
      const Icon = config.icon;
      
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Keine {config.label} definiert</h3>
          <p className="text-muted-foreground mt-1 max-w-md">
            {config.description}. Erstellen Sie hier die erste Policy.
          </p>
          <Button className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Policy erstellen
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {categoryPolicies.map((policy) => (
          <div 
            key={policy.id}
            className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => setSelectedPolicy(policy)}
          >
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium">{policy.title_de}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {policy.content.substring(0, 150)}...
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={statusBadgeConfig[policy.status].variant}>
                    {statusBadgeConfig[policy.status].label}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="font-mono">{policy.policy_code}</span>
                <span>v{policy.version}</span>
                {policy.approved_at && (
                  <span className="flex items-center gap-1 text-status-success">
                    <CheckCircle className="h-3 w-3" />
                    Freigegeben
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/armstrong">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              Policies
            </h1>
            <p className="text-muted-foreground mt-1">
              System-Prompts und Guardrails für Armstrong konfigurieren
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Neue Policy
        </Button>
      </div>

      {/* Policy Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(categoryConfig) as PolicyCategory[]).map((category) => {
          const config = categoryConfig[category];
          const Icon = config.icon;
          const count = stats.byCategory[category];
          
          return (
            <Card key={category} className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <Badge variant="secondary">{count} aktiv</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">{config.label}</CardTitle>
                <CardDescription className="text-sm mt-1">{config.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="constitution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="constitution">
            <BookOpen className="h-4 w-4 mr-2" />
            Constitution
          </TabsTrigger>
          <TabsTrigger value="prompts">System-Prompts</TabsTrigger>
          <TabsTrigger value="guardrails">Guardrails</TabsTrigger>
          <TabsTrigger value="security">Sicherheit</TabsTrigger>
          <TabsTrigger value="history">Audit-Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="constitution">
          <Card>
            <CardHeader>
              <CardTitle>Armstrong Constitution</CardTitle>
              <CardDescription>
                Unveränderliche Grundprinzipien (Read-Only, definiert in ARMSTRONG_CONSTITUTION.md)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/30 p-6">
                <div className="prose prose-sm max-w-none">
                  <h3>Grundprinzipien</h3>
                  <ul>
                    <li><strong>K1:</strong> Mandantenisolation — Jeder Tenant sieht nur eigene Daten</li>
                    <li><strong>K2:</strong> Read-before-Write — Armstrong MUSS vor jeder Aktion aktuelle Daten lesen</li>
                    <li><strong>K3:</strong> Confirm-before-Execute — Schreibende Aktionen benötigen User-Bestätigung</li>
                    <li><strong>K4:</strong> Draft First — Komplexe Outputs werden als Entwurf erstellt</li>
                    <li><strong>K5:</strong> Server-Only Writes — Kritische Tabellen nur via RPC beschreibbar</li>
                    <li><strong>K6:</strong> PII Awareness — Personenbezogene Daten werden markiert</li>
                    <li><strong>K7:</strong> Scope Respect — Armstrong respektiert Zonen-Grenzen</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-4">
                    Diese Prinzipien sind im Repository unter <code>docs/architecture/ARMSTRONG_CONSTITUTION.md</code> dokumentiert.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts">
          <Card>
            <CardHeader>
              <CardTitle>System-Prompts</CardTitle>
              <CardDescription>
                Basis-Anweisungen für Armstrong's Verhalten
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderPolicyList('system_prompt')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guardrails">
          <Card>
            <CardHeader>
              <CardTitle>Guardrails</CardTitle>
              <CardDescription>
                Grenzen und Einschränkungen für KI-Aktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderPolicyList('guardrail')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Sicherheitsregeln</CardTitle>
              <CardDescription>
                Datenschutz und Compliance-Einstellungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderPolicyList('security')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Audit-Trail</CardTitle>
              <CardDescription>
                Änderungshistorie aller Policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Änderungshistorie</h3>
                <p className="text-muted-foreground mt-1">
                  Alle Policy-Änderungen werden hier mit Zeitstempel und Autor angezeigt.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Policy Detail Dialog */}
      <Dialog open={!!selectedPolicy} onOpenChange={() => setSelectedPolicy(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPolicy && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadgeConfig[selectedPolicy.status].variant}>
                    {statusBadgeConfig[selectedPolicy.status].label}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">{selectedPolicy.policy_code}</span>
                </div>
                <DialogTitle>{selectedPolicy.title_de}</DialogTitle>
                <DialogDescription>
                  {categoryConfig[selectedPolicy.category].label} · v{selectedPolicy.version}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="rounded-lg border p-4 bg-muted/30">
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                    {selectedPolicy.content}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
                  <div>
                    Erstellt: {format(new Date(selectedPolicy.created_at), 'dd.MM.yyyy', { locale: de })}
                    {selectedPolicy.approved_at && (
                      <> · Freigegeben: {format(new Date(selectedPolicy.approved_at), 'dd.MM.yyyy', { locale: de })}</>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Bearbeiten
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
