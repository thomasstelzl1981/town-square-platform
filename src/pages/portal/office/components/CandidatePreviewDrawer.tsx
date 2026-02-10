/**
 * CandidatePreviewDrawer — Detail view for a contact candidate
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building2, MapPin, Globe, User } from 'lucide-react';

interface ContactCandidate {
  id: string;
  full_name: string;
  role: string;
  company: string;
  location: string;
  email: string;
  phone: string;
  domain: string;
  confidence: number;
  status: 'new' | 'reviewed' | 'imported' | 'rejected';
}

interface CandidatePreviewDrawerProps {
  candidate: ContactCandidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  new: { label: 'Neu', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  reviewed: { label: 'Geprüft', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  imported: { label: 'Übernommen', className: 'bg-status-success/10 text-status-success border-status-success/20' },
  rejected: { label: 'Abgelehnt', className: 'bg-status-error/10 text-status-error border-status-error/20' },
};

export function CandidatePreviewDrawer({ candidate, open, onOpenChange }: CandidatePreviewDrawerProps) {
  if (!candidate) return null;

  const statusInfo = STATUS_LABELS[candidate.status] || STATUS_LABELS.new;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[360px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-base">{candidate.full_name}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <Badge variant="outline" className={statusInfo.className}>
            {statusInfo.label}
          </Badge>

          <div className="space-y-3">
            <DetailRow icon={User} label="Rolle" value={candidate.role} />
            <DetailRow icon={Building2} label="Firma" value={candidate.company} />
            <DetailRow icon={MapPin} label="Ort" value={candidate.location} />
            <DetailRow icon={Mail} label="E-Mail" value={candidate.email} />
            <DetailRow icon={Phone} label="Telefon" value={candidate.phone || '—'} />
            <DetailRow icon={Globe} label="Domain" value={candidate.domain || '—'} />
          </div>

          <div className="border-t border-border/50 pt-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${candidate.confidence * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium">{Math.round(candidate.confidence * 100)}%</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs">{value}</p>
      </div>
    </div>
  );
}
