import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Loader2, 
  CreditCard, 
  Receipt, 
  Package,
  AlertTriangle,
  Pencil,
  Building2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: unknown;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
}

interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
}

export default function BillingPage() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Plan dialog
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price_cents: 0,
    currency: 'EUR',
    interval: 'monthly' as 'monthly' | 'yearly',
    is_active: true,
    display_order: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isPlatformAdmin) {
      fetchData();
    }
  }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, subsRes, invoicesRes, orgsRes] = await Promise.all([
        supabase.from('plans').select('*').order('display_order'),
        supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('organizations').select('id, name').order('name'),
      ]);

      if (plansRes.error) throw plansRes.error;
      if (subsRes.error) throw subsRes.error;
      if (invoicesRes.error) throw invoicesRes.error;
      if (orgsRes.error) throw orgsRes.error;

      setPlans(plansRes.data || []);
      setSubscriptions(subsRes.data || []);
      setInvoices(invoicesRes.data || []);
      setOrganizations(orgsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }

  const getOrgName = (tenantId: string) => {
    return organizations.find(o => o.id === tenantId)?.name || tenantId.slice(0, 8) + '...';
  };

  const getPlanName = (planId: string) => {
    return plans.find(p => p.id === planId)?.name || 'Unknown';
  };

  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
      case 'paid':
        return 'default';
      case 'trialing':
      case 'pending':
        return 'secondary';
      case 'cancelled':
      case 'past_due':
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const openPlanDialog = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name,
        description: plan.description || '',
        price_cents: plan.price_cents,
        currency: plan.currency,
        interval: plan.interval,
        is_active: plan.is_active,
        display_order: plan.display_order,
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: '',
        description: '',
        price_cents: 0,
        currency: 'EUR',
        interval: 'monthly',
        is_active: true,
        display_order: plans.length,
      });
    }
    setPlanDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.name) return;
    setSaving(true);
    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('plans')
          .update(planForm)
          .eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('plans')
          .insert(planForm);
        if (error) throw error;
      }
      setPlanDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nur für Platform Admins</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Plans</h1>
        <p className="text-muted-foreground">
          Verwalte Preispläne, Abonnements und Rechnungen
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pläne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{plans.filter(p => p.is_active).length}</span>
              <span className="text-muted-foreground text-sm">aktiv</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abonnements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{subscriptions.filter(s => s.status === 'active').length}</span>
              <span className="text-muted-foreground text-sm">aktiv</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rechnungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{invoices.length}</span>
              <span className="text-muted-foreground text-sm">gesamt</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Pläne</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="invoices">Rechnungen</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openPlanDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Plan
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Preis</TableHead>
                  <TableHead>Intervall</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Keine Pläne vorhanden
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map(plan => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {plan.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(plan.price_cents, plan.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {plan.interval === 'monthly' ? 'Monatlich' : 'Jährlich'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                          {plan.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPlanDialog(plan)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktive Abonnements</CardTitle>
              <CardDescription>{subscriptions.length} Abonnements im System</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Keine Abonnements vorhanden</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Erstellt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {getOrgName(sub.tenant_id)}
                          </div>
                        </TableCell>
                        <TableCell>{getPlanName(sub.plan_id)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(sub.status)}>
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sub.current_period_end 
                            ? `bis ${format(new Date(sub.current_period_end), 'dd.MM.yyyy', { locale: de })}`
                            : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(sub.created_at), 'dd.MM.yyyy', { locale: de })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rechnungen</CardTitle>
              <CardDescription>Letzte 100 Rechnungen</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Keine Rechnungen vorhanden</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nummer</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Betrag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ausgestellt</TableHead>
                      <TableHead>Fällig</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono">{inv.invoice_number}</TableCell>
                        <TableCell>{getOrgName(inv.tenant_id)}</TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(inv.amount_cents, inv.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(inv.status)}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {inv.issued_at 
                            ? format(new Date(inv.issued_at), 'dd.MM.yyyy', { locale: de })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {inv.due_at 
                            ? format(new Date(inv.due_at), 'dd.MM.yyyy', { locale: de })
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Plan bearbeiten' : 'Neuer Plan'}</DialogTitle>
            <DialogDescription>
              Erstelle oder bearbeite einen Preisplan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={planForm.name}
                onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Professional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={planForm.description}
                onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kurze Beschreibung des Plans"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preis (Cent)</Label>
                <Input
                  id="price"
                  type="number"
                  value={planForm.price_cents}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, price_cents: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interval">Intervall</Label>
                <Select
                  value={planForm.interval}
                  onValueChange={(value: 'monthly' | 'yearly') => setPlanForm(prev => ({ ...prev, interval: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                    <SelectItem value="yearly">Jährlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Aktiv</Label>
              <Switch
                id="is_active"
                checked={planForm.is_active}
                onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSavePlan} disabled={saving || !planForm.name}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}