import {
  UserPlus, Database, Globe, Search, MapPin, BookOpen,
  Clock, Loader2, Send, CheckCircle2, MailOpen, AlertCircle, Mail, XCircle,
} from 'lucide-react';

// ── Source configs ──
export const SOURCE_CONFIG: Record<string, { label: string; icon: typeof UserPlus; color: string }> = {
  manual: { label: 'Manuell', icon: UserPlus, color: 'bg-gray-100 text-gray-700' },
  engine: { label: 'KI-Recherche', icon: Database, color: 'bg-blue-100 text-blue-700' },
  apify: { label: 'Apify', icon: Globe, color: 'bg-purple-100 text-purple-700' },
  firecrawl: { label: 'Firecrawl', icon: Search, color: 'bg-orange-100 text-orange-700' },
  valuation: { label: 'SoT Bewertung', icon: MapPin, color: 'bg-green-100 text-green-700' },
  kontaktbuch: { label: 'Kontaktbuch', icon: BookOpen, color: 'bg-emerald-100 text-emerald-700' },
};

export const MSG_STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  queued: { label: 'Warteschlange', icon: Clock, color: 'bg-gray-100 text-gray-700' },
  sending: { label: 'Wird gesendet', icon: Loader2, color: 'bg-blue-100 text-blue-700' },
  sent: { label: 'Gesendet', icon: Send, color: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Zugestellt', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
  opened: { label: 'Geöffnet', icon: MailOpen, color: 'bg-purple-100 text-purple-700' },
  bounced: { label: 'Zurückgewiesen', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
  replied: { label: 'Beantwortet', icon: Mail, color: 'bg-green-100 text-green-700' },
  failed: { label: 'Fehlgeschlagen', icon: XCircle, color: 'bg-red-100 text-red-700' },
};

export const CONTACT_STATUS_CONFIG = {
  pending: { label: 'Ausstehend', variant: 'secondary' as const },
  approved: { label: 'Übernommen', variant: 'default' as const },
  rejected: { label: 'Abgelehnt', variant: 'destructive' as const },
  merged: { label: 'Zusammengeführt', variant: 'outline' as const },
} as const;
