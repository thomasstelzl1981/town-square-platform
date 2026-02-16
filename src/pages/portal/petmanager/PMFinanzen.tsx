/**
 * PMFinanzen — Zahlungen & Rechnungen (Pet Manager)
 * 
 * Features:
 * - Rechnung aus abgeschlossener Buchung generieren
 * - Rechnungsliste mit Statusfilter und Status-Workflow
 * - KPI-Cards (Offene Forderungen, Monatsumsatz, Überfällig)
 * - Umsatz-Chart (Recharts)
 * - PDF-Export (jsPDF)
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Receipt, Plus, FileText, Check, Send, AlertTriangle, X, Download, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

interface Invoice {
  id: string;
  invoice_number: string;
  booking_id: string | null;
  provider_id: string | null;
  customer_id: string | null;
  tenant_id: string;
  amount_cents: number;
  tax_rate: number;
  tax_cents: number;
  net_cents: number;
  status: InvoiceStatus;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  sort_order: number;
}

interface CompletedBooking {
  id: string;
  pet: { name: string };
  service: { title: string };
  price_cents: number;
  scheduled_date: string;
  completed_at: string | null;
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  draft: { label: 'Entwurf', variant: 'secondary', icon: <FileText className="h-3 w-3" /> },
  sent: { label: 'Versendet', variant: 'default', icon: <Send className="h-3 w-3" /> },
  paid: { label: 'Bezahlt', variant: 'outline', icon: <Check className="h-3 w-3" /> },
  overdue: { label: 'Überfällig', variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: 'Storniert', variant: 'secondary', icon: <X className="h-3 w-3" /> },
};

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

export default function PMFinanzen() {
  const { activeTenantId } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [completedBookings, setCompletedBookings] = useState<CompletedBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');

  // New invoice form state
  const [newItems, setNewItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price_cents: 0, total_cents: 0, sort_order: 0 },
  ]);
  const [newNotes, setNewNotes] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchInvoices = useCallback(async () => {
    if (!activeTenantId) return;
    setLoading(true);
    let query = supabase
      .from('pet_invoices')
      .select('*')
      .eq('tenant_id', activeTenantId)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      setInvoices((data as unknown as Invoice[]) || []);
    }
    setLoading(false);
  }, [statusFilter, activeTenantId]);

  // Fetch completed bookings without invoice
  const fetchCompletedBookings = useCallback(async () => {
    if (!activeTenantId) return;
    const { data } = await supabase
      .from('pet_bookings')
      .select('id, price_cents, scheduled_date, completed_at, pets!inner(name), pet_services!inner(title)')
      .eq('tenant_id', activeTenantId)
      .eq('status', 'completed' as any)
      .order('completed_at', { ascending: false });
    
    if (data) {
      // Filter out bookings that already have an invoice
      const { data: existingInvoices } = await supabase
        .from('pet_invoices')
        .select('booking_id')
        .eq('tenant_id', activeTenantId)
        .not('booking_id', 'is', null);
      
      const invoicedBookingIds = new Set((existingInvoices || []).map((i: any) => i.booking_id));
      
      setCompletedBookings(
        (data as any[])
          .filter(b => !invoicedBookingIds.has(b.id))
          .map(b => ({
            id: b.id,
            pet: b.pets,
            service: b.pet_services,
            price_cents: b.price_cents,
            scheduled_date: b.scheduled_date,
            completed_at: b.completed_at,
          }))
      );
    }
  }, [activeTenantId]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { if (createOpen) fetchCompletedBookings(); }, [createOpen, fetchCompletedBookings]);

  // Pre-fill from booking
  const handleBookingSelect = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    const booking = completedBookings.find(b => b.id === bookingId);
    if (booking) {
      setNewItems([{
        description: `${booking.service.title} — ${booking.pet.name} (${format(new Date(booking.scheduled_date), 'dd.MM.yyyy', { locale: de })})`,
        quantity: 1,
        unit_price_cents: booking.price_cents,
        total_cents: booking.price_cents,
        sort_order: 0,
      }]);
    }
  };

  const updateItemTotal = (index: number, quantity: number, unitPrice: number) => {
    setNewItems(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity, unit_price_cents: unitPrice, total_cents: quantity * unitPrice } : item
    ));
  };

  const addItem = () => {
    setNewItems(prev => [...prev, { description: '', quantity: 1, unit_price_cents: 0, total_cents: 0, sort_order: prev.length }]);
  };

  const removeItem = (index: number) => {
    if (newItems.length <= 1) return;
    setNewItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateInvoice = async () => {
    if (!activeTenantId) return;
    const validItems = newItems.filter(item => item.description.trim() && item.unit_price_cents > 0);
    if (validItems.length === 0) {
      toast({ title: 'Fehler', description: 'Mindestens eine Position erforderlich.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const netCents = validItems.reduce((sum, item) => sum + item.total_cents, 0);
    const taxCents = Math.round(netCents * 0.19);
    const amountCents = netCents + taxCents;

    const { data: invoice, error: invoiceError } = await supabase
      .from('pet_invoices')
      .insert({
        tenant_id: activeTenantId,
        amount_cents: amountCents,
        tax_rate: 19.0,
        tax_cents: taxCents,
        net_cents: netCents,
        status: 'draft' as string,
        due_date: newDueDate || null,
        notes: newNotes || null,
        booking_id: selectedBookingId || null,
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      toast({ title: 'Fehler', description: invoiceError?.message || 'Rechnung konnte nicht erstellt werden.', variant: 'destructive' });
      setSaving(false);
      return;
    }

    const itemsToInsert = validItems.map((item, i) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      total_cents: item.total_cents,
      sort_order: i,
    }));

    const { error: itemsError } = await supabase.from('pet_invoice_items').insert(itemsToInsert);
    if (itemsError) {
      toast({ title: 'Warnung', description: 'Rechnung erstellt, aber Positionen konnten nicht gespeichert werden.', variant: 'destructive' });
    } else {
      toast({ title: 'Rechnung erstellt', description: `${(invoice as any).invoice_number} wurde als Entwurf angelegt.` });
    }

    setCreateOpen(false);
    setNewItems([{ description: '', quantity: 1, unit_price_cents: 0, total_cents: 0, sort_order: 0 }]);
    setNewNotes('');
    setNewDueDate('');
    setSelectedBookingId('');
    setSaving(false);
    fetchInvoices();
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: InvoiceStatus) => {
    const updateData: Record<string, unknown> = { status: newStatus as string };
    if (newStatus === 'paid') updateData.paid_at = new Date().toISOString();

    const { error } = await supabase.from('pet_invoices').update(updateData).eq('id', invoiceId);

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status aktualisiert', description: `Rechnung auf "${STATUS_CONFIG[newStatus].label}" gesetzt.` });
      fetchInvoices();
    }
  };

  // PDF Export
  const exportInvoicePdf = async (inv: Invoice) => {
    const { data: items } = await supabase
      .from('pet_invoice_items')
      .select('*')
      .eq('invoice_id', inv.id)
      .order('sort_order');

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Rechnung', 20, 25);
    doc.setFontSize(10);
    doc.text(`Rechnungsnr.: ${inv.invoice_number}`, 20, 35);
    doc.text(`Datum: ${format(new Date(inv.created_at), 'dd.MM.yyyy', { locale: de })}`, 20, 41);
    if (inv.due_date) doc.text(`Fällig: ${format(new Date(inv.due_date), 'dd.MM.yyyy', { locale: de })}`, 20, 47);

    let y = 60;
    doc.setFontSize(9);
    doc.text('Pos.', 20, y); doc.text('Beschreibung', 35, y); doc.text('Menge', 130, y); doc.text('Einzelpreis', 150, y); doc.text('Gesamt', 180, y);
    y += 5;
    doc.line(20, y, 195, y);
    y += 5;

    (items || []).forEach((item: any, i: number) => {
      doc.text(`${i + 1}`, 20, y);
      doc.text(item.description.substring(0, 50), 35, y);
      doc.text(`${item.quantity}`, 130, y);
      doc.text(formatCents(item.unit_price_cents), 150, y);
      doc.text(formatCents(item.total_cents), 180, y);
      y += 6;
    });

    y += 5;
    doc.line(140, y, 195, y); y += 6;
    doc.text(`Netto: ${formatCents(inv.net_cents)}`, 150, y); y += 5;
    doc.text(`USt. ${inv.tax_rate}%: ${formatCents(inv.tax_cents)}`, 150, y); y += 5;
    doc.setFontSize(11);
    doc.text(`Gesamt: ${formatCents(inv.amount_cents)}`, 150, y);

    if (inv.notes) {
      y += 15;
      doc.setFontSize(9);
      doc.text(`Anmerkungen: ${inv.notes}`, 20, y);
    }

    doc.save(`Rechnung_${inv.invoice_number}.pdf`);
  };

  // Revenue chart data (last 6 months)
  const revenueData = useMemo(() => {
    const months: { month: string; umsatz: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const total = invoices
        .filter(inv => inv.status === 'paid' && inv.paid_at &&
          new Date(inv.paid_at) >= start && new Date(inv.paid_at) <= end)
        .reduce((s, inv) => s + inv.amount_cents, 0);
      months.push({ month: format(d, 'MMM yy', { locale: de }), umsatz: total / 100 });
    }
    return months;
  }, [invoices]);

  // KPIs
  const openAmount = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.amount_cents, 0);
  const paidThisMonth = invoices.filter(i => {
    if (i.status !== 'paid' || !i.paid_at) return false;
    const d = new Date(i.paid_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, i) => s + i.amount_cents, 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Zahlungen & Rechnungen</h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Neue Rechnung</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue Rechnung erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* From booking */}
              {completedBookings.length > 0 && (
                <div>
                  <Label>Aus Buchung übernehmen (optional)</Label>
                  <Select value={selectedBookingId} onValueChange={handleBookingSelect}>
                    <SelectTrigger><SelectValue placeholder="Buchung wählen…" /></SelectTrigger>
                    <SelectContent>
                      {completedBookings.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.service.title} — {b.pet.name} ({format(new Date(b.scheduled_date), 'dd.MM.', { locale: de })}) · {formatCents(b.price_cents)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3">
                <Label className="font-semibold">Positionen</Label>
                {newItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      {i === 0 && <Label className="text-xs text-muted-foreground">Beschreibung</Label>}
                      <Input
                        placeholder="z.B. Tagesbetreuung Balu"
                        value={item.description}
                        onChange={e => setNewItems(prev => prev.map((it, idx) => idx === i ? { ...it, description: e.target.value } : it))}
                      />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <Label className="text-xs text-muted-foreground">Menge</Label>}
                      <Input type="number" min={1} value={item.quantity} onChange={e => updateItemTotal(i, parseInt(e.target.value) || 1, item.unit_price_cents)} />
                    </div>
                    <div className="col-span-3">
                      {i === 0 && <Label className="text-xs text-muted-foreground">Einzelpreis (€)</Label>}
                      <Input type="number" step="0.01" min={0} value={(item.unit_price_cents / 100).toFixed(2)} onChange={e => updateItemTotal(i, item.quantity, Math.round(parseFloat(e.target.value || '0') * 100))} />
                    </div>
                    <div className="col-span-1 text-right text-sm font-medium text-foreground pt-1">{formatCents(item.total_cents)}</div>
                    <div className="col-span-1">
                      <Button variant="ghost" size="icon" onClick={() => removeItem(i)} disabled={newItems.length <= 1}><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Position hinzufügen</Button>
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Netto</span><span>{formatCents(newItems.reduce((s, i) => s + i.total_cents, 0))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">USt. 19%</span><span>{formatCents(Math.round(newItems.reduce((s, i) => s + i.total_cents, 0) * 0.19))}</span></div>
                <div className="flex justify-between font-bold"><span>Gesamt</span><span>{formatCents(Math.round(newItems.reduce((s, i) => s + i.total_cents, 0) * 1.19))}</span></div>
              </div>

              {/* Due date + notes */}
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Fälligkeitsdatum</Label><Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} /></div>
              </div>
              <div><Label>Notizen</Label><Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Optionale Anmerkungen..." /></div>

              <Button onClick={handleCreateInvoice} disabled={saving} className="w-full">
                {saving ? 'Wird erstellt...' : 'Rechnung erstellen (Entwurf)'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Offene Forderungen</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{formatCents(openAmount)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Umsatz diesen Monat</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{formatCents(paidThisMonth)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Überfällig</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{overdueCount}</p></CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4" />Umsatzentwicklung (6 Monate)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={v => `${v} €`} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(2)} €`, 'Umsatz']} />
              <Bar dataKey="umsatz" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground">Status:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="draft">Entwurf</SelectItem>
            <SelectItem value="sent">Versendet</SelectItem>
            <SelectItem value="paid">Bezahlt</SelectItem>
            <SelectItem value="overdue">Überfällig</SelectItem>
            <SelectItem value="cancelled">Storniert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rechnungsnr.</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Fällig</TableHead>
                <TableHead>Betrag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
              ) : invoices.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Keine Rechnungen vorhanden.</TableCell></TableRow>
              ) : (
                invoices.map(inv => {
                  const cfg = STATUS_CONFIG[inv.status];
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                      <TableCell>{format(new Date(inv.created_at), 'dd.MM.yyyy', { locale: de })}</TableCell>
                      <TableCell>{inv.due_date ? format(new Date(inv.due_date), 'dd.MM.yyyy', { locale: de }) : '—'}</TableCell>
                      <TableCell className="font-medium">{formatCents(inv.amount_cents)}</TableCell>
                      <TableCell><Badge variant={cfg.variant} className="gap-1">{cfg.icon}{cfg.label}</Badge></TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => exportInvoicePdf(inv)} title="PDF herunterladen">
                          <Download className="h-3 w-3" />
                        </Button>
                        {inv.status === 'draft' && (
                          <Button variant="outline" size="sm" onClick={() => updateInvoiceStatus(inv.id, 'sent')}>
                            <Send className="h-3 w-3 mr-1" />Versenden
                          </Button>
                        )}
                        {inv.status === 'sent' && (
                          <Button variant="outline" size="sm" onClick={() => updateInvoiceStatus(inv.id, 'paid')}>
                            <Check className="h-3 w-3 mr-1" />Bezahlt
                          </Button>
                        )}
                        {(inv.status === 'draft' || inv.status === 'sent') && (
                          <Button variant="ghost" size="sm" onClick={() => updateInvoiceStatus(inv.id, 'cancelled')}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
