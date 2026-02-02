/**
 * Sales Desk — Zone-1 Admin Desk for Sales Operations
 */
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Inbox, Users2, FileText, ArrowRight, Eye, Clock, CheckCircle } from 'lucide-react';
import { EmptyState } from '@/components/shared';

// Dashboard view
function SalesDeskDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sales Desk</h1>
        <p className="text-muted-foreground">
          Zentrale Übersicht für Verkaufsoperationen und Partner-Freigaben
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Offene Freigaben</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+3 seit gestern</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktive Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">Aktuell veröffentlicht</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Partner-Anfragen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Ausstehend</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Erfolgsquote</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">Letzte 30 Tage</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Veröffentlichungen
            </CardTitle>
            <CardDescription>
              Neue und ausstehende Listing-Freigaben verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/sales-desk/veroeffentlichungen">
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
            <CardDescription>
              Eingehende Anfragen und Nachrichten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/sales-desk/inbox">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="h-5 w-5" />
              Partner
            </CardTitle>
            <CardDescription>
              Vertriebspartner-Zuweisungen und -Berechtigungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/sales-desk/partner">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit
            </CardTitle>
            <CardDescription>
              Prüfpfad und Änderungsprotokolle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/sales-desk/audit">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Sub-pages
function VeroeffentlichungenTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Veröffentlichungen</h2>
        <Badge variant="secondary">12 ausstehend</Badge>
      </div>
      <EmptyState
        icon={ShoppingBag}
        title="Keine ausstehenden Freigaben"
        description="Neue Listing-Anfragen werden hier angezeigt"
      />
    </div>
  );
}

function InboxTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Sales Desk Inbox</h2>
      <EmptyState
        icon={Inbox}
        title="Posteingang leer"
        description="Eingehende Nachrichten und Anfragen werden hier angezeigt"
      />
    </div>
  );
}

function PartnerTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Partner-Verwaltung</h2>
      <EmptyState
        icon={Users2}
        title="Keine Partner-Anfragen"
        description="Partner-Zuweisungen und Berechtigungen verwalten"
      />
    </div>
  );
}

function AuditTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Audit Log</h2>
      <EmptyState
        icon={FileText}
        title="Keine Audit-Einträge"
        description="Prüfpfad-Einträge werden hier protokolliert"
      />
    </div>
  );
}

export default function SalesDesk() {
  return (
    <Routes>
      <Route index element={<SalesDeskDashboard />} />
      <Route path="veroeffentlichungen" element={<VeroeffentlichungenTab />} />
      <Route path="inbox" element={<InboxTab />} />
      <Route path="partner" element={<PartnerTab />} />
      <Route path="audit" element={<AuditTab />} />
    </Routes>
  );
}
