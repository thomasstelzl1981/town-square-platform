/**
 * AcquiaryDashboard — Combined Inbox + Monitoring Overview for Zone 1
 */
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Inbox, Loader2, Users, Activity, Clock, TrendingUp,
  AlertTriangle, CheckCircle2, ArrowRight, Database, Mail, UserCheck
} from 'lucide-react';
import {
  useAcqMandates, useAcqMandatesInbox, useAcqMandatesAssigned,
} from '@/hooks/useAcqMandate';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInHours, differenceInDays } from 'date-fns';
import { MANDATE_STATUS_CONFIG } from '@/types/acquisition';

export default function AcquiaryDashboard() {
  const { data: allMandates, isLoading } = useAcqMandates();
  const { data: inboxMandates } = useAcqMandatesInbox();
  const { data: assignedMandates } = useAcqMandatesAssigned();

  const { data: needsRoutingCount } = useQuery({
    queryKey: ['acq-needs-routing-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('acq_inbound_messages')
        .select('id', { count: 'exact', head: true })
        .eq('needs_routing', true)
        .is('routed_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: offersCount } = useQuery({
    queryKey: ['acq-offers-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('acq_offers')
        .select('id', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const mandates = allMandates || [];
  const inbox = inboxMandates || [];
  const assigned = assignedMandates || [];
  const now = new Date();

  const activeMandates = mandates.filter(m => m.status === 'active').length;
  const criticalAging = inbox.filter(m => differenceInHours(now, new Date(m.created_at)) > 48);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Inbox className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{inbox.length}</div>
                <div className="text-xs text-muted-foreground">Neue Mandate</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent rounded-lg">
                <Clock className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{assigned.length}</div>
                <div className="text-xs text-muted-foreground">Warten auf Annahme</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-2/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeMandates}</div>
                <div className="text-xs text-muted-foreground">Aktive Mandate</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
                <Mail className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{needsRoutingCount ?? 0}</div>
                <div className="text-xs text-muted-foreground">Routing-Queue</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg">
                <Database className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{offersCount ?? 0}</div>
                <div className="text-xs text-muted-foreground">Objekte gesamt</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert: Critical Aging */}
      {criticalAging.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-destructive">
                {criticalAging.length} Mandate warten seit über 48h
              </h4>
              <p className="text-sm text-muted-foreground">
                Mandate im Inbox seit mehr als 48 Stunden ohne Zuweisung.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/acquiary/inbox">
                Inbox öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Inbox className="h-5 w-5" /> Inbox
            </CardTitle>
            <CardDescription>Neue Mandate zuweisen</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/acquiary/inbox">
                {inbox.length} offen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5" /> Routing
            </CardTitle>
            <CardDescription>Ungeroutete E-Mails zuordnen</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/acquiary/needs-routing">
                {needsRoutingCount ?? 0} offen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-5 w-5" /> Datenbank
            </CardTitle>
            <CardDescription>Alle Objekte durchsuchen</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/acquiary/datenbank">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Mandate nach Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(
            mandates.reduce((acc, m) => {
              acc[m.status] = (acc[m.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([status, count]) => {
            const config = MANDATE_STATUS_CONFIG[status] || { label: status };
            const pct = mandates.length > 0 ? (count / mandates.length) * 100 : 0;
            return (
              <div key={status} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{config.label}</span>
                  <span className="font-medium">{count} ({pct.toFixed(0)}%)</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
