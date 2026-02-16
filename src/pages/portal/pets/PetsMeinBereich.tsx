/**
 * PetsMeinBereich — 4 CI-Widgets: Profil, Bestellungen, Buchungen, Rechnungen
 */
import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, PawPrint, CheckCircle2, XCircle, AlertCircle, Receipt, Download, FileText, Send, Check, AlertTriangle, X as XIcon, User, ShoppingBag, CalendarCheck, CreditCard } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBookings, useUpdateBookingStatus, type PetBooking } from '@/hooks/usePetBookings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import jsPDF from 'jspdf';

// ─── Booking Status ─────────────────────────────────────────
const BOOKING_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
  requested: { label: 'Angefragt', variant: 'outline', icon: AlertCircle },
  confirmed: { label: 'Bestätigt', variant: 'default', icon: CheckCircle2 },
  in_progress: { label: 'Laufend', variant: 'default', icon: Clock },
  completed: { label: 'Abgeschlossen', variant: 'secondary', icon: CheckCircle2 },
  cancelled: { label: 'Storniert', variant: 'destructive', icon: XCircle },
  no_show: { label: 'Nicht erschienen', variant: 'destructive', icon: XCircle },
};

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
const INVOICE_STATUS: Record<InvoiceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  draft: { label: 'Entwurf', variant: 'secondary', icon: <FileText className="h-3 w-3" /> },
  sent: { label: 'Offen', variant: 'default', icon: <Send className="h-3 w-3" /> },
  paid: { label: 'Bezahlt', variant: 'outline', icon: <Check className="h-3 w-3" /> },
  overdue: { label: 'Überfällig', variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: 'Storniert', variant: 'secondary', icon: <XIcon className="h-3 w-3" /> },
};

interface CustomerInvoice {
  id: string; invoice_number: string; amount_cents: number; net_cents: number;
  tax_cents: number; status: InvoiceStatus; due_date: string | null;
  created_at: string; notes: string | null;
}

type MeinBereichWidget = 'profil' | 'bestellungen' | 'buchungen' | 'rechnungen';

const WIDGETS: { key: MeinBereichWidget; title: string; icon: typeof User; description: string }[] = [
  { key: 'profil', title: 'Profil & Einstellungen', icon: User, description: 'Kundendaten und Adressen' },
  { key: 'bestellungen', title: 'Meine Bestellungen', icon: ShoppingBag, description: 'Shop-Orders & Affiliate-History' },
  { key: 'buchungen', title: 'Meine Buchungen', icon: CalendarCheck, description: 'Status, Änderungen, Storno' },
  { key: 'rechnungen', title: 'Rechnungen & Zahlungen', icon: CreditCard, description: 'Belege und Rechnungsübersicht' },
];

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function BookingCard({ booking, onCancel }: { booking: PetBooking; onCancel?: (id: string) => void }) {
  const cfg = BOOKING_STATUS[booking.status] || BOOKING_STATUS.requested;
  const StatusIcon = cfg.icon;
  const canCancel = ['requested', 'confirmed'].includes(booking.status);
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
      <StatusIcon className={`h-5 w-5 mt-0.5 shrink-0 ${booking.status === 'completed' ? 'text-emerald-500' : booking.status === 'cancelled' ? 'text-destructive' : 'text-primary'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{booking.service?.title}</p>
          <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{booking.provider?.company_name}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(parseISO(booking.scheduled_date), 'dd.MM.yyyy', { locale: de })}</span>
          {booking.scheduled_time_start && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{booking.scheduled_time_start.slice(0, 5)}</span>}
          <span className="flex items-center gap-1"><PawPrint className="h-3 w-3" />{booking.pet?.name}</span>
          {booking.price_cents > 0 && <span className="font-medium">{formatCents(booking.price_cents)}</span>}
        </div>
      </div>
      {canCancel && onCancel && (
        <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => onCancel(booking.id)}>Stornieren</Button>
      )}
    </div>
  );
}

function InvoiceCard({ invoice, onDownloadPdf }: { invoice: CustomerInvoice; onDownloadPdf: (inv: CustomerInvoice) => void }) {
  const cfg = INVOICE_STATUS[invoice.status] || INVOICE_STATUS.sent;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
      <Receipt className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-mono font-medium">{invoice.invoice_number}</p>
          <Badge variant={cfg.variant} className="text-[10px] gap-1">{cfg.icon}{cfg.label}</Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{format(new Date(invoice.created_at), 'dd.MM.yyyy', { locale: de })}</span>
          {invoice.due_date && <span>Fällig: {format(new Date(invoice.due_date), 'dd.MM.yyyy', { locale: de })}</span>}
          <span className="font-medium text-foreground">{formatCents(invoice.amount_cents)}</span>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onDownloadPdf(invoice)} title="PDF herunterladen">
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function PetsMeinBereich() {
  const { user, activeTenantId } = useAuth();
  const { data: bookings = [], isLoading } = useBookings(user ? { clientUserId: user.id } : undefined);
  const updateStatus = useUpdateBookingStatus();
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [activeWidget, setActiveWidget] = useState<MeinBereichWidget | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!activeTenantId || !user?.id) return;
    setInvoicesLoading(true);
    const { data } = await supabase
      .from('pet_invoices')
      .select('id, invoice_number, amount_cents, net_cents, tax_cents, status, due_date, created_at, notes')
      .eq('tenant_id', activeTenantId)
      .eq('customer_id', user.id)
      .in('status', ['sent', 'paid', 'overdue'] as any)
      .order('created_at', { ascending: false });
    setInvoices((data as unknown as CustomerInvoice[]) || []);
    setInvoicesLoading(false);
  }, [activeTenantId, user?.id]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleCancel = (id: string) => updateStatus.mutate({ id, status: 'cancelled' });

  const downloadInvoicePdf = async (inv: CustomerInvoice) => {
    const { data: items } = await supabase
      .from('pet_invoice_items').select('*').eq('invoice_id', inv.id).order('sort_order');
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text('Rechnung', 20, 25);
    doc.setFontSize(10);
    doc.text(`Rechnungsnr.: ${inv.invoice_number}`, 20, 35);
    doc.text(`Datum: ${format(new Date(inv.created_at), 'dd.MM.yyyy', { locale: de })}`, 20, 41);
    if (inv.due_date) doc.text(`Fällig: ${format(new Date(inv.due_date), 'dd.MM.yyyy', { locale: de })}`, 20, 47);
    let y = 60;
    doc.setFontSize(9);
    doc.text('Pos.', 20, y); doc.text('Beschreibung', 35, y); doc.text('Menge', 130, y); doc.text('Einzelpreis', 150, y); doc.text('Gesamt', 180, y);
    y += 5; doc.line(20, y, 195, y); y += 5;
    (items || []).forEach((item: any, i: number) => {
      doc.text(`${i + 1}`, 20, y); doc.text(item.description.substring(0, 50), 35, y);
      doc.text(`${item.quantity}`, 130, y); doc.text(formatCents(item.unit_price_cents), 150, y);
      doc.text(formatCents(item.total_cents), 180, y); y += 6;
    });
    y += 5; doc.line(140, y, 195, y); y += 6;
    doc.text(`Netto: ${formatCents(inv.net_cents)}`, 150, y); y += 5;
    doc.text(`USt. 19%: ${formatCents(inv.tax_cents)}`, 150, y); y += 5;
    doc.setFontSize(11); doc.text(`Gesamt: ${formatCents(inv.amount_cents)}`, 150, y);
    doc.save(`Rechnung_${inv.invoice_number}.pdf`);
  };

  const active = bookings.filter(b => ['requested', 'confirmed', 'in_progress'].includes(b.status));
  const past = bookings.filter(b => ['completed', 'cancelled', 'no_show'].includes(b.status));
  const openInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
  const paidInvoices = invoices.filter(i => i.status === 'paid');

  const toggleWidget = (key: MeinBereichWidget) => setActiveWidget(prev => prev === key ? null : key);

  return (
    <PageShell>
      <ModulePageHeader title="MEIN BEREICH" description="Profil, Buchungen, Bestellungen und Rechnungen" />

      {/* CI-Widget Navigation */}
      <WidgetGrid variant="widget" className="mb-6">
        {WIDGETS.map(w => {
          const Icon = w.icon;
          const isActive = activeWidget === w.key;
          return (
            <WidgetCell key={w.key}>
              <button
                onClick={() => toggleWidget(w.key)}
                className={`w-full h-full rounded-xl border p-4 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer
                  ${isActive
                    ? 'border-teal-500/50 bg-teal-500/5 shadow-[0_0_20px_-5px_hsl(var(--teal-glow,180_60%_40%)/0.3)]'
                    : 'border-border/40 bg-card hover:border-teal-500/30 hover:bg-teal-500/5'
                  }`}
              >
                <div className={`p-3 rounded-lg ${isActive ? 'bg-teal-500/15 text-teal-600' : 'bg-muted/50 text-muted-foreground'}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">{w.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{w.description}</p>
                </div>
              </button>
            </WidgetCell>
          );
        })}
      </WidgetGrid>

      {/* Inline Content */}
      {activeWidget === 'profil' && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Profil & Einstellungen</h3>
            <p className="text-sm text-muted-foreground">
              Ihre Kundendaten und Einstellungen werden über Ihr zentrales Profil verwaltet.
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/portal/stammdaten/personen'}>
              Zu den Stammdaten
            </Button>
          </CardContent>
        </Card>
      )}

      {activeWidget === 'bestellungen' && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Meine Bestellungen</h3>
            <div className="text-center py-8">
              <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground mt-3">Noch keine Bestellungen vorhanden.</p>
              <p className="text-xs text-muted-foreground mt-1">Bestellungen aus dem Shop und Affiliate-Partner erscheinen hier.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeWidget === 'buchungen' && (
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Meine Buchungen</h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Laden…</p>
          ) : (
            <>
              {active.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Aktiv ({active.length})</p>
                  <div className="space-y-2">
                    {active.map(b => <BookingCard key={b.id} booking={b} onCancel={handleCancel} />)}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Historie ({past.length})</p>
                  <div className="space-y-2">
                    {past.map(b => <BookingCard key={b.id} booking={b} />)}
                  </div>
                </div>
              )}
              {active.length === 0 && past.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Keine Buchungen vorhanden.</p>
              )}
            </>
          )}
        </div>
      )}

      {activeWidget === 'rechnungen' && (
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Rechnungen & Zahlungen</h3>
          {invoicesLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Laden…</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Keine Rechnungen vorhanden.</p>
          ) : (
            <>
              {openInvoices.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Offen</p>
                  <div className="space-y-2">
                    {openInvoices.map(inv => <InvoiceCard key={inv.id} invoice={inv} onDownloadPdf={downloadInvoicePdf} />)}
                  </div>
                </div>
              )}
              {paidInvoices.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Bezahlt</p>
                  <div className="space-y-2">
                    {paidInvoices.map(inv => <InvoiceCard key={inv.id} invoice={inv} onDownloadPdf={downloadInvoicePdf} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </PageShell>
  );
}
