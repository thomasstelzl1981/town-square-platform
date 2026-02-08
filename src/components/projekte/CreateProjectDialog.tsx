/**
 * Dialog for creating a new Developer Project
 * MOD-13 PROJEKTE
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDevProjects } from '@/hooks/useDevProjects';
import { useDeveloperContexts } from '@/hooks/useDeveloperContexts';
import { FolderKanban, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (projectId: string) => void;
  defaultContextId?: string;
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess, defaultContextId }: Props) {
  const { contexts, isLoading: loadingContexts } = useDeveloperContexts();
  const { createProject, generateProjectCode } = useDevProjects();
  const [step, setStep] = useState(1);
  const [projectCode, setProjectCode] = useState('');
  
  const [formData, setFormData] = useState({
    developer_context_id: defaultContextId || '',
    project_code: '',
    name: '',
    description: '',
    address: '',
    city: '',
    postal_code: '',
    purchase_price: '',
    renovation_budget: '',
    total_sale_target: '',
    commission_rate_percent: '3.57',
    holding_period_months: '24',
  });

  // Generate project code on open
  useEffect(() => {
    if (open && !projectCode) {
      generateProjectCode().then(code => {
        setProjectCode(code);
        setFormData(prev => ({ ...prev, project_code: code }));
      });
    }
  }, [open]);

  // Set default context
  useEffect(() => {
    if (defaultContextId) {
      setFormData(prev => ({ ...prev, developer_context_id: defaultContextId }));
    } else if (contexts.length > 0 && !formData.developer_context_id) {
      const defaultCtx = contexts.find(c => c.is_default) || contexts[0];
      setFormData(prev => ({ ...prev, developer_context_id: defaultCtx.id }));
    }
  }, [contexts, defaultContextId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const project = await createProject.mutateAsync({
        developer_context_id: formData.developer_context_id,
        project_code: formData.project_code,
        name: formData.name,
        description: formData.description || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        postal_code: formData.postal_code || undefined,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
        renovation_budget: formData.renovation_budget ? parseFloat(formData.renovation_budget) : undefined,
        total_sale_target: formData.total_sale_target ? parseFloat(formData.total_sale_target) : undefined,
        commission_rate_percent: parseFloat(formData.commission_rate_percent),
        holding_period_months: parseInt(formData.holding_period_months),
      });
      
      onOpenChange(false);
      resetForm();
      onSuccess?.(project.id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const resetForm = () => {
    setStep(1);
    setProjectCode('');
    setFormData({
      developer_context_id: defaultContextId || '',
      project_code: '',
      name: '',
      description: '',
      address: '',
      city: '',
      postal_code: '',
      purchase_price: '',
      renovation_budget: '',
      total_sale_target: '',
      commission_rate_percent: '3.57',
      holding_period_months: '24',
    });
  };

  const canProceedStep1 = formData.developer_context_id && formData.name && formData.project_code;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            Neues Projekt anlegen
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Schritt {step} von 2
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="developer_context_id">Verkäufer-Gesellschaft *</Label>
                <Select
                  value={formData.developer_context_id}
                  onValueChange={(v) => setFormData({ ...formData, developer_context_id: v })}
                  disabled={loadingContexts}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Gesellschaft auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contexts.map((ctx) => (
                      <SelectItem key={ctx.id} value={ctx.id}>
                        {ctx.name}
                        {ctx.is_default && <span className="text-muted-foreground ml-2">(Standard)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {contexts.length === 0 && !loadingContexts && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Bitte legen Sie zuerst eine Verkäufer-Gesellschaft an.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="project_code">Projekt-Code *</Label>
                  <Input
                    id="project_code"
                    value={formData.project_code}
                    onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                    placeholder="BT-2024-001"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="name">Projektname *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. Mehrfamilienhaus Musterstraße"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kurze Beschreibung des Projekts..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Straße und Hausnummer"
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">PLZ</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Geben Sie die Eckdaten für die Kalkulation ein. Diese können später angepasst werden.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchase_price">Kaufpreis (€)</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    placeholder="z.B. 1.500.000"
                  />
                </div>
                <div>
                  <Label htmlFor="renovation_budget">Sanierungsbudget (€)</Label>
                  <Input
                    id="renovation_budget"
                    type="number"
                    value={formData.renovation_budget}
                    onChange={(e) => setFormData({ ...formData, renovation_budget: e.target.value })}
                    placeholder="z.B. 300.000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="total_sale_target">Verkaufsziel gesamt (€)</Label>
                <Input
                  id="total_sale_target"
                  type="number"
                  value={formData.total_sale_target}
                  onChange={(e) => setFormData({ ...formData, total_sale_target: e.target.value })}
                  placeholder="z.B. 2.400.000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commission_rate_percent">Vertriebsprovision (%)</Label>
                  <Input
                    id="commission_rate_percent"
                    type="number"
                    step="0.01"
                    value={formData.commission_rate_percent}
                    onChange={(e) => setFormData({ ...formData, commission_rate_percent: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="holding_period_months">Haltedauer (Monate)</Label>
                  <Input
                    id="holding_period_months"
                    type="number"
                    value={formData.holding_period_months}
                    onChange={(e) => setFormData({ ...formData, holding_period_months: e.target.value })}
                  />
                </div>
              </div>

              {/* Quick calculation preview */}
              {formData.purchase_price && formData.total_sale_target && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">Schnellvorschau</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Investition:</span>
                      <p className="font-medium">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
                          parseFloat(formData.purchase_price) + (parseFloat(formData.renovation_budget) || 0)
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rohgewinn:</span>
                      <p className="font-medium text-green-600">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
                          parseFloat(formData.total_sale_target) - parseFloat(formData.purchase_price) - (parseFloat(formData.renovation_budget) || 0)
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Marge:</span>
                      <p className="font-medium">
                        {Math.round(
                          ((parseFloat(formData.total_sale_target) - parseFloat(formData.purchase_price) - (parseFloat(formData.renovation_budget) || 0)) /
                          (parseFloat(formData.purchase_price) + (parseFloat(formData.renovation_budget) || 0))) * 100
                        )}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {step === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Abbrechen
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                >
                  Weiter
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Button>
                <Button type="submit" disabled={createProject.isPending}>
                  {createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Projekt erstellen
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
