/**
 * Zone 1 — Selbstauskunft Mastervorlage (Placeholder)
 * Coming soon — Phase 2
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MasterTemplatesSelbstauskunft() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-muted-foreground">Selbstauskunft — Mastervorlage</h1>
            <p className="text-sm text-muted-foreground">MOD-07 Finanzierungs-Selbstauskunft</p>
          </div>
        </div>
        <Link to="/admin/master-templates">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Master-Vorlagen
          </Button>
        </Link>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-dashed">
        <CardHeader className="text-center py-12">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl text-muted-foreground">Coming Soon</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Die Mastervorlage für MOD-07 Selbstauskunft wird in Phase 2 implementiert. 
            Sie wird die 8-Sektionen-Struktur (Personal, Haushalt, Beschäftigung, Einkommen, 
            Ausgaben, Vermögen, Verbindlichkeiten, Objekt/Finanzierung) abbilden.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <Badge variant="secondary" className="text-sm">
            Phase 2
          </Badge>
        </CardContent>
      </Card>

      {/* Preview of planned structure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Geplante Sektionen</CardTitle>
          <CardDescription>8 Sektionen gemäß MOD-07 Spezifikation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: '1', label: 'Personal / Stammdaten' },
              { id: '2', label: 'Haushalt' },
              { id: '3', label: 'Beschäftigung' },
              { id: '4', label: 'Einkommen' },
              { id: '5', label: 'Ausgaben / Verbindlichkeiten' },
              { id: '6', label: 'Vermögen' },
              { id: '7', label: 'Bestehende Darlehen' },
              { id: '8', label: 'Objekt / Finanzierungswunsch' },
            ].map((section) => (
              <div
                key={section.id}
                className="flex items-center gap-2 p-3 rounded-lg border border-dashed bg-muted/30"
              >
                <Badge variant="outline" className="shrink-0">
                  {section.id}
                </Badge>
                <span className="text-sm text-muted-foreground">{section.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
