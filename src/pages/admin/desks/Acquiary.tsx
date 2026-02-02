/**
 * Acquiary — Zone-1 Admin Desk for Acquisition Management
 */
import { Routes, Route, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Inbox, FileCheck, Link2, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/shared';

function AcquiaryDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Acquiary</h1>
        <p className="text-muted-foreground">
          Akquisitions-Desk für Objektankäufe und Mandatsverwaltung
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktive Mandate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">In Bearbeitung</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Neue Objekte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Zur Prüfung</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abgeschlossen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">Dieses Jahr</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Zuordnung
            </CardTitle>
            <CardDescription>Objekte zu Mandaten zuordnen</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/acquiary/zuordnung">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Inbox
            </CardTitle>
            <CardDescription>Eingehende Akquisitionsanfragen</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/acquiary/inbox">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Mandate
            </CardTitle>
            <CardDescription>Akquisitionsmandate verwalten</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/acquiary/mandate">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ZuordnungTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Objekt-Zuordnung</h2>
      <EmptyState icon={Link2} title="Keine Zuordnungen offen" description="Objekte zu Akquisitionsmandaten zuordnen" />
    </div>
  );
}

function InboxTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Acquiary Inbox</h2>
      <EmptyState icon={Inbox} title="Posteingang leer" description="Neue Akquisitionsanfragen erscheinen hier" />
    </div>
  );
}

function MandateTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Mandate</h2>
      <EmptyState icon={FileCheck} title="Keine Mandate" description="Akquisitionsmandate erstellen und verwalten" />
    </div>
  );
}

export default function Acquiary() {
  return (
    <Routes>
      <Route index element={<AcquiaryDashboard />} />
      <Route path="zuordnung" element={<ZuordnungTab />} />
      <Route path="inbox" element={<InboxTab />} />
      <Route path="mandate" element={<MandateTab />} />
    </Routes>
  );
}
