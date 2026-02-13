/**
 * MOD-18 Finanzanalyse — Reports
 * Generiert Finanzberichte aus aggregierten Daten
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileBarChart, Download, Clock, CheckCircle2, 
  Building2, CreditCard, TrendingUp, FileText 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
}

const reportTemplates: ReportTemplate[] = [
  { id: 'vermoegensuebersicht', title: 'Vermögensübersicht', description: 'Gesamtübersicht aller Vermögenswerte und Verbindlichkeiten', icon: Building2, category: 'Übersicht' },
  { id: 'cashflow', title: 'Cashflow-Analyse', description: 'Monatliche Ein- und Ausgaben aus allen Quellen', icon: TrendingUp, category: 'Analyse' },
  { id: 'finanzierungen', title: 'Finanzierungsreport', description: 'Status und Konditionen aller laufenden Finanzierungen', icon: CreditCard, category: 'Finanzierung' },
  { id: 'steuer-vorbereitung', title: 'Steuer-Vorbereitung', description: 'Zusammenstellung relevanter Daten für die Steuererklärung', icon: FileText, category: 'Steuer' },
];

interface GeneratedReport {
  templateId: string;
  generatedAt: string;
  status: 'ready' | 'generating';
}

export default function ReportsTile() {
  const [reports, setReports] = useState<GeneratedReport[]>([]);

  const handleGenerate = (templateId: string) => {
    const newReport: GeneratedReport = {
      templateId,
      generatedAt: new Date().toISOString(),
      status: 'generating',
    };
    setReports(prev => [newReport, ...prev]);
    
    // Simulate generation
    setTimeout(() => {
      setReports(prev => prev.map(r => 
        r.templateId === templateId && r.status === 'generating' 
          ? { ...r, status: 'ready' } 
          : r
      ));
      toast.success('Report erstellt');
    }, 2000);
  };

  const handleDownload = (report: GeneratedReport) => {
    toast.info('PDF-Export wird vorbereitet…');
  };

  return (
    <PageShell>
      <ModulePageHeader title="Reports" description="Finanzberichte generieren und exportieren" />

      {/* Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTemplates.map((tmpl) => (
          <Card key={tmpl.id} className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <tmpl.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{tmpl.title}</CardTitle>
                </div>
                <Badge variant="outline">{tmpl.category}</Badge>
              </div>
              <CardDescription>{tmpl.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                size="sm" 
                onClick={() => handleGenerate(tmpl.id)}
                disabled={reports.some(r => r.templateId === tmpl.id && r.status === 'generating')}
              >
                <FileBarChart className="h-4 w-4 mr-2" />
                Report erstellen
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generated Reports */}
      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Erstellte Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.map((report, i) => {
              const tmpl = reportTemplates.find(t => t.id === report.templateId);
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {report.status === 'ready' ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{tmpl?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(report.generatedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </p>
                    </div>
                  </div>
                  {report.status === 'ready' && (
                    <Button variant="outline" size="sm" onClick={() => handleDownload(report)}>
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
