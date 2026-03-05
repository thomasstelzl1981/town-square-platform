/**
 * KampagnenLeadInbox — Lead listing with status filter
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox, User } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

const LEAD_STATUS_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'new', label: 'Neu', color: 'bg-blue-500/10 text-blue-700' },
  { value: 'contacted', label: 'Kontaktiert', color: 'bg-amber-500/10 text-amber-700' },
  { value: 'qualified', label: 'Qualifiziert', color: 'bg-green-500/10 text-green-700' },
  { value: 'converted', label: 'Konvertiert', color: 'bg-emerald-500/10 text-emerald-700' },
  { value: 'lost', label: 'Verloren', color: 'bg-red-500/10 text-red-700' },
];

interface KampagnenLeadInboxProps {
  leads: any[] | undefined;
  isLoading: boolean;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
}

export function KampagnenLeadInbox({ leads, isLoading, statusFilter, onStatusFilterChange }: KampagnenLeadInboxProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Inbox className="h-4 w-4 text-muted-foreground" /><h2 className="text-sm font-medium">Meine Leads</h2></div>
          <div className="flex flex-wrap gap-1">
            {LEAD_STATUS_OPTIONS.map(s => <Badge key={s.value} variant={statusFilter === s.value ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => onStatusFilterChange(s.value)}>{s.label}</Badge>)}
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : leads && leads.length > 0 ? (
          <div className="space-y-2">
            {leads.map(lead => {
              const statusOpt = LEAD_STATUS_OPTIONS.find(s => s.value === lead.lead_status);
              const isSelected = selectedLeadId === lead.id;
              const ld = (lead.lead_data || {}) as Record<string, any>;
              return (
                <div key={lead.id} className={`rounded-lg border p-3 cursor-pointer transition-all ${isSelected ? 'border-primary shadow-sm' : 'hover:border-primary/30'}`} onClick={() => setSelectedLeadId(isSelected ? null : lead.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{ld.name || ld.first_name || ld.email || 'Unbekannt'}</span></div>
                    <Badge className={`text-[10px] ${statusOpt?.color || ''}`}>{statusOpt?.label || lead.lead_status}</Badge>
                  </div>
                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-border/50 space-y-1 text-xs text-muted-foreground">
                      {ld.email && <p>E-Mail: {ld.email}</p>}
                      {(ld.phone || ld.telefon) && <p>Telefon: {ld.phone || ld.telefon}</p>}
                      <p>Erstellt: {new Date(lead.created_at).toLocaleDateString('de-DE')}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Inbox} title="Noch keine Leads" description="Starten Sie eine Kampagne, um automatisch Leads zu generieren." />
        )}
      </CardContent>
    </Card>
  );
}
