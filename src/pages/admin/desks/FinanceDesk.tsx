/**
 * Finance Desk — Zone-1 Admin Desk for Financing Operations
 */
import { Routes, Route, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Landmark, Inbox, UserCog, Link2, Eye, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/shared';

function FinanceDeskDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold uppercase">Finance Desk</h1>
        <p className="text-muted-foreground">
          Zentrale Steuerung für Finanzierungsanfragen und Berater-Zuweisung
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Neue Anfragen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Heute eingegangen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Bearbeitung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Aktive Fälle</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktive Berater</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Verfügbar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abschlussrate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">64%</div>
            <p className="text-xs text-muted-foreground">Letzte 90 Tage</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Inbox
            </CardTitle>
            <CardDescription>Eingehende Finanzierungsanfragen</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/finance-desk/inbox">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Berater
            </CardTitle>
            <CardDescription>Finanzierungsberater verwalten</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/finance-desk/berater">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Zuweisung
            </CardTitle>
            <CardDescription>Fälle an Berater zuweisen</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/finance-desk/zuweisung">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Monitoring
            </CardTitle>
            <CardDescription>Überwachung und Reporting</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/finance-desk/monitoring">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InboxTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold uppercase">Finance Desk Inbox</h2>
      <EmptyState icon={Inbox} title="Keine neuen Anfragen" description="Neue Finanzierungsanfragen erscheinen hier" />
    </div>
  );
}

function BeraterTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold uppercase">Berater-Verwaltung</h2>
      <EmptyState icon={UserCog} title="Keine Berater konfiguriert" description="Finanzierungsberater hinzufügen und verwalten" />
    </div>
  );
}

function ZuweisungTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold uppercase">Fall-Zuweisung</h2>
      <EmptyState icon={Link2} title="Keine offenen Zuweisungen" description="Fälle an Berater zuweisen" />
    </div>
  );
}

function MonitoringTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold uppercase">Monitoring</h2>
      <EmptyState icon={Eye} title="Keine Daten" description="Berater-Performance und Fall-Statistiken" />
    </div>
  );
}

export default function FinanceDesk() {
  return (
    <Routes>
      <Route index element={<FinanceDeskDashboard />} />
      <Route path="inbox" element={<InboxTab />} />
      <Route path="berater" element={<BeraterTab />} />
      <Route path="zuweisung" element={<ZuweisungTab />} />
      <Route path="monitoring" element={<MonitoringTab />} />
    </Routes>
  );
}
