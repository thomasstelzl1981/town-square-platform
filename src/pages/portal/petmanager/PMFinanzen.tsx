/**
 * PMZahlungen — Zahlungen & Rechnungen (Pet Manager)
 * 
 * Features:
 * - Offene-Posten-Liste (alle Rechnungen mit Statusfilter)
 * - Rechnung erstellen (aus Buchung)
 * - Status ändern (draft -> sent -> paid)
 * - PDF-Download (jsPDF)
 */
import { useState, useEffect, useCallback } from 'react';
import { Receipt, Plus, FileText, Check, Send, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

interface Invoice {
  id: string;
  invoice_number: string;
  booking_id: string | null;
  provider_id: string | null;
  customer_id: string | null;
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);

  // New invoice form state
  const [newItems, setNewItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price_cents: 0, total_cents: 0, sort_order: 0 },
  ]);
  const [newNotes, setNewNotes] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('pet_invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      setInvoices((data as Invoice[]) || []);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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
    const validItems = newItems.filter(item => item.description.trim() && item.unit_price_cents > 0);
    if (validItems.length === 0) {
      toast({ title: 'Fehler', description: 'Mindestens eine Position mit Beschreibung und Preis erforderlich.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const netCents = validItems.reduce((sum, item) => sum + item.total_cents, 0);
    const taxCents = Math.round(netCents * 0.19);
    const amountCents = netCents + taxCents;

    const { data: invoice, error: invoiceError } = await supabase
      .from('pet_invoices')
      .insert({
        amount_cents: amountCents,
        tax_rate: 19.0,
        tax_cents: taxCents,
        net_cents: netCents,
        status: 'draft' as string,
        due_date: newDueDate || null,
        notes: newNotes || null,
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
      toast({ title: 'Rechnung erstellt', description: `${invoice.invoice_number} wurde als Entwurf angelegt.` });
    }

    setCreateOpen(false);
    setNewItems([{ description: '', quantity: 1, unit_price_cents: 0, total_cents: 0, sort_order: 0 }]);
    setNewNotes('');
    setNewDueDate('');
    setSaving(false);
    fetchInvoices();
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: InvoiceStatus) => {
    const updateData: Record<string, unknown> = { status: newStatus as string };
    if (newStatus === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('pet_invoices')
      .update(updateData)
      .eq('id', invoiceId);

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status aktualisiert', description: `Rechnung auf "${STATUS_CONFIG[newStatus].label}" gesetzt.` });
      fetchInvoices();
    }
  };

  // KPI calculations
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
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => updateItemTotal(i, parseInt(e.target.value) || 1, item.unit_price_cents)}
                      />
                    </div>
                    <div className="col-span-3">
                      {i === 0 && <Label className="text-xs text-muted-foreground">Einzelpreis (€)</Label>}
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={(item.unit_price_cents / 100).toFixed(2)}
                        onChange={e => updateItemTotal(i, item.quantity, Math.round(parseFloat(e.target.value || '0') * 100))}
                      />
                    </div>
                    <div className="col-span-1 text-right text-sm font-medium text-foreground pt-1">
                      {formatCents(item.total_cents)}
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" size="icon" onClick={() => removeItem(i)} disabled={newItems.length <= 1}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" />Position hinzufügen
                </Button>
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Netto</span><span>{formatCents(newItems.reduce((s, i) => s + i.total_cents, 0))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">USt. 19%</span><span>{formatCents(Math.round(newItems.reduce((s, i) => s + i.total_cents, 0) * 0.19))}</span></div>
                <div className="flex justify-between font-bold"><span>Gesamt</span><span>{formatCents(Math.round(newItems.reduce((s, i) => s + i.total_cents, 0) * 1.19))}</span></div>
              </div>

              {/* Due date + notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fälligkeitsdatum</Label>
                  <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Notizen</Label>
                <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Optionale Anmerkungen..." />
              </div>

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
                      <TableCell>
                        <Badge variant={cfg.variant} className="gap-1">
                          {cfg.icon}{cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
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
