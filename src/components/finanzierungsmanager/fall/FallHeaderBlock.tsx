/**
 * FallHeaderBlock — Header with stepper, status actions, view toggle
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Clock, MessageSquare, XCircle, LayoutPanelLeft, LayoutList } from 'lucide-react';
import { CaseStepper } from '@/components/finanzierungsmanager/CaseStepper';
import { getStatusLabel, getStatusBadgeVariant } from '@/types/finance';

interface FallHeaderBlockProps {
  publicId: string;
  requestId: string;
  applicantName: string;
  purposeLabel: string;
  currentStatus: string;
  splitView: boolean;
  onSplitViewChange: (v: boolean) => void;
  onStatusChange: (status: string) => void;
  onNavigateBack: () => void;
}

export function FallHeaderBlock({ publicId, requestId, applicantName, purposeLabel, currentStatus, splitView, onSplitViewChange, onStatusChange, onNavigateBack }: FallHeaderBlockProps) {
  return (
    <>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNavigateBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold tracking-tight uppercase truncate">{publicId || requestId.slice(0, 8)}</h2>
          <p className="text-sm text-muted-foreground">{applicantName} · {purposeLabel}</p>
        </div>
        <Badge variant={getStatusBadgeVariant(currentStatus)} className="text-xs shrink-0">{getStatusLabel(currentStatus)}</Badge>
      </div>

      <CaseStepper currentStatus={currentStatus} />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Aktion:</span>
        {(currentStatus === 'delegated' || currentStatus === 'assigned') && <Button size="sm" className="h-7 text-xs" onClick={() => onStatusChange('accepted')}><CheckCircle2 className="h-3 w-3 mr-1" /> Annehmen</Button>}
        {currentStatus === 'accepted' && <Button size="sm" className="h-7 text-xs" onClick={() => onStatusChange('editing')}><Clock className="h-3 w-3 mr-1" /> Bearbeitung starten</Button>}
        {['editing', 'in_processing', 'active'].includes(currentStatus) && (
          <>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange('needs_customer_action')}><MessageSquare className="h-3 w-3 mr-1" /> Rückfrage</Button>
            <Button size="sm" className="h-7 text-xs" onClick={() => onStatusChange('ready_for_submission')}><CheckCircle2 className="h-3 w-3 mr-1" /> Ready</Button>
          </>
        )}
        {currentStatus === 'needs_customer_action' && <Button size="sm" className="h-7 text-xs" onClick={() => onStatusChange('editing')}><ArrowLeft className="h-3 w-3 mr-1" /> Zurück in Bearbeitung</Button>}
        <div className="flex-1" />
        <div className="hidden lg:flex items-center gap-1 border rounded-md p-0.5 bg-muted/30">
          <Button variant={splitView ? 'ghost' : 'secondary'} size="sm" className="h-6 text-xs px-2 gap-1" onClick={() => onSplitViewChange(false)}><LayoutList className="h-3 w-3" /> Standard</Button>
          <Button variant={splitView ? 'secondary' : 'ghost'} size="sm" className="h-6 text-xs px-2 gap-1" onClick={() => onSplitViewChange(true)}><LayoutPanelLeft className="h-3 w-3" /> Split-View</Button>
        </div>
        {!['completed', 'rejected'].includes(currentStatus) && (
          <>
            <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => onStatusChange('completed')}><CheckCircle2 className="h-3 w-3 mr-1" /> Abschließen</Button>
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => onStatusChange('rejected')}><XCircle className="h-3 w-3 mr-1" /> Ablehnen</Button>
          </>
        )}
      </div>
    </>
  );
}
