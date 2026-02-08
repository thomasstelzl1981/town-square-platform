/**
 * Armstrong Policies — Zone 1 Admin
 * 
 * Policy-Editor für System-Prompts und Guardrails.
 * Konfiguriert Sicherheitsregeln und Verhaltensrichtlinien für Armstrong.
 */
import { Scale, Plus, Shield, FileText, History, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const POLICY_CATEGORIES = [
  { id: 'system-prompts', label: 'System-Prompts', count: 0, icon: FileText },
  { id: 'guardrails', label: 'Guardrails', count: 0, icon: Shield },
  { id: 'security', label: 'Sicherheitsregeln', count: 0, icon: AlertTriangle },
];

export default function ArmstrongPolicies() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            Policies
          </h1>
          <p className="text-muted-foreground mt-1">
            System-Prompts und Guardrails für Armstrong konfigurieren
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Neue Policy
        </Button>
      </div>

      {/* Policy Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {POLICY_CATEGORIES.map((category) => (
          <Card key={category.id} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <category.icon className="h-5 w-5 text-muted-foreground" />
                <Badge variant="secondary">{category.count} aktiv</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">{category.label}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="prompts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prompts">System-Prompts</TabsTrigger>
          <TabsTrigger value="guardrails">Guardrails</TabsTrigger>
          <TabsTrigger value="security">Sicherheit</TabsTrigger>
          <TabsTrigger value="history">Audit-Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="prompts">
          <Card>
            <CardHeader>
              <CardTitle>System-Prompts</CardTitle>
              <CardDescription>
                Basis-Anweisungen für Armstrong's Verhalten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Keine System-Prompts definiert</h3>
                <p className="text-muted-foreground mt-1 max-w-md">
                  System-Prompts steuern das grundlegende Verhalten von Armstrong.
                  Definieren Sie hier die Basis-Anweisungen.
                </p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Prompt erstellen
                </Button>
              </div>
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Guardrails konfigurieren</h3>
                <p className="text-muted-foreground mt-1 max-w-md">
                  Definieren Sie Grenzen wie max. Token, verbotene Topics,
                  oder eingeschränkte Aktionen.
                </p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Guardrail hinzufügen
                </Button>
              </div>
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Sicherheitsregeln definieren</h3>
                <p className="text-muted-foreground mt-1 max-w-md">
                  Konfigurieren Sie Regeln für Datenzugriff, PII-Handling
                  und Compliance-Anforderungen.
                </p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Regel hinzufügen
                </Button>
              </div>
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
                <h3 className="text-lg font-medium">Keine Änderungen protokolliert</h3>
                <p className="text-muted-foreground mt-1">
                  Hier werden alle Policy-Änderungen mit Zeitstempel und Autor angezeigt.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
