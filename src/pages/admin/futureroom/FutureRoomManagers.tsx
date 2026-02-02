/**
 * ZONE-1: FutureRoom Finance Manager Pool
 * Lists all users with finance_manager role for delegation
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Briefcase, CheckCircle, Clock, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FinanceManager {
  user_id: string;
  email: string;
  display_name: string | null;
  active_cases: number;
  accepted_cases: number;
}

export default function FutureRoomManagers() {
  // Query finance managers from memberships + profiles
  const { data: managers, isLoading } = useQuery({
    queryKey: ['finance-managers'],
    queryFn: async () => {
      // Get all users with finance_manager role
      const { data: memberships, error: membError } = await supabase
        .from('memberships')
        .select('user_id')
        .eq('role', 'finance_manager');

      if (membError) throw membError;
      if (!memberships || memberships.length === 0) return [];

      const userIds = memberships.map(m => m.user_id);

      // Get profiles for these users (without phone - not in schema)
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('id', userIds);

      if (profError) throw profError;

      // Get active mandate counts per manager (using assigned_manager_id = USER-ID)
      const { data: mandateCounts } = await supabase
        .from('finance_mandates')
        .select('assigned_manager_id, status')
        .in('assigned_manager_id', userIds);

      // Aggregate counts per manager
      const countMap: Record<string, { active: number; accepted: number }> = {};
      mandateCounts?.forEach(m => {
        if (!m.assigned_manager_id) return;
        if (!countMap[m.assigned_manager_id]) {
          countMap[m.assigned_manager_id] = { active: 0, accepted: 0 };
        }
        if (['delegated', 'accepted', 'in_progress'].includes(m.status)) {
          countMap[m.assigned_manager_id].active++;
        }
        if (m.status === 'accepted') {
          countMap[m.assigned_manager_id].accepted++;
        }
      });

      // Combine data
      const result: FinanceManager[] = (profiles || []).map(p => ({
        user_id: p.id,
        email: p.email || '',
        display_name: p.display_name,
        active_cases: countMap[p.id]?.active || 0,
        accepted_cases: countMap[p.id]?.accepted || 0,
      }));

      return result;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Finanzierungsmanager</h2>
        <p className="text-muted-foreground">
          Übersicht aller verfügbaren Manager für Mandatszuweisung
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Manager</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Mit finance_manager Rolle</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offene Fälle</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {managers?.reduce((sum, m) => sum + m.active_cases, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">In Bearbeitung</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Akzeptierte Fälle</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {managers?.reduce((sum, m) => sum + m.accepted_cases, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Gesamt</p>
          </CardContent>
        </Card>
      </div>

      {/* Manager List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Lade Finanzierungsmanager...
        </div>
      ) : !managers || managers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            Keine Finanzierungsmanager gefunden
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Weisen Sie Benutzern die Rolle "finance_manager" zu
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {managers.map(manager => (
            <Card key={manager.user_id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {(manager.display_name || manager.email).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {manager.display_name || manager.email.split('@')[0]}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{manager.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Badge variant="outline" className="gap-1">
                    <Briefcase className="h-3 w-3" />
                    {manager.active_cases} aktiv
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {manager.accepted_cases} akzeptiert
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
