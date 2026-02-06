/**
 * MandatCreateWizard — MOD-08 Mandate Creation Wizard
 * 
 * Multi-step wizard to create a new acquisition mandate
 */
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, ArrowRight, Check, MapPin, Building2, 
  Euro, Target, FileText, Loader2, Send
} from 'lucide-react';
import { useCreateAcqMandate, useSubmitAcqMandate } from '@/hooks/useAcqMandate';
import { ASSET_FOCUS_OPTIONS, type CreateAcqMandateData } from '@/types/acquisition';
import { toast } from 'sonner';

const STEPS = [
  { id: 'region', label: 'Region', icon: MapPin },
  { id: 'asset', label: 'Objektart', icon: Building2 },
  { id: 'price', label: 'Budget', icon: Euro },
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'confirm', label: 'Bestätigen', icon: Check },
];

export default function MandatCreateWizard() {
  const navigate = useNavigate();
  const createMandate = useCreateAcqMandate();
  const submitMandate = useSubmitAcqMandate();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [createdMandateId, setCreatedMandateId] = React.useState<string | null>(null);
  
  const [formData, setFormData] = React.useState<Partial<CreateAcqMandateData>>({
    search_area: { region: '', states: [] },
    asset_focus: [],
    price_min: null,
    price_max: null,
    yield_target: null,
    exclusions: '',
    notes: '',
    client_display_name: '',
  });

  const updateFormData = (updates: Partial<CreateAcqMandateData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateSearchArea = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      search_area: { ...prev.search_area, [key]: value }
    }));
  };

  const toggleAssetFocus = (value: string) => {
    const current = formData.asset_focus || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFormData({ asset_focus: updated });
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Region
        return (formData.search_area as any)?.region?.length > 0;
      case 1: // Asset
        return (formData.asset_focus?.length || 0) > 0;
      case 2: // Price
        return formData.price_min && formData.price_max && formData.price_min < formData.price_max;
      case 3: // Details
        return true;
      case 4: // Confirm
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCreate = async () => {
    try {
      const mandate = await createMandate.mutateAsync(formData as CreateAcqMandateData);
      setCreatedMandateId(mandate.id);
      toast.success('Mandat erstellt');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSubmit = async () => {
    if (!createdMandateId) {
      await handleCreate();
      return;
    }
    
    try {
      await submitMandate.mutateAsync(createdMandateId);
      navigate('/portal/investments/mandat');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSaveDraft = async () => {
    try {
      await createMandate.mutateAsync(formData as CreateAcqMandateData);
      navigate('/portal/investments/mandat');
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/investments/mandat')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Neues Suchmandat</h1>
          <p className="text-muted-foreground">
            Definieren Sie Ihre Suchkriterien für die Objektakquise
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            
            return (
              <div 
                key={step.id} 
                className={`flex items-center gap-1 ${isActive ? 'text-primary font-medium' : isCompleted ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(STEPS[currentStep].icon, { className: 'h-5 w-5' })}
            {STEPS[currentStep].label}
          </CardTitle>
          <CardDescription>
            {currentStep === 0 && 'In welcher Region suchen Sie?'}
            {currentStep === 1 && 'Welche Objektarten kommen in Frage?'}
            {currentStep === 2 && 'Welches Budget steht zur Verfügung?'}
            {currentStep === 3 && 'Weitere Anforderungen und Ausschlüsse'}
            {currentStep === 4 && 'Überprüfen Sie Ihre Angaben'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Step 0: Region */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="region">Region / Stadt</Label>
                <Input
                  id="region"
                  placeholder="z.B. Berlin, München, Rhein-Main"
                  value={(formData.search_area as any)?.region || ''}
                  onChange={(e) => updateSearchArea('region', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="radius">Umkreis (km)</Label>
                <Input
                  id="radius"
                  type="number"
                  placeholder="50"
                  value={(formData.search_area as any)?.radius || ''}
                  onChange={(e) => updateSearchArea('radius', parseInt(e.target.value) || undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="states">Bundesländer (optional)</Label>
                <Input
                  id="states"
                  placeholder="z.B. Bayern, Baden-Württemberg"
                  value={(formData.search_area as any)?.states?.join(', ') || ''}
                  onChange={(e) => updateSearchArea('states', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                />
              </div>
            </div>
          )}

          {/* Step 1: Asset Focus */}
          {currentStep === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {ASSET_FOCUS_OPTIONS.map((option) => {
                const isSelected = formData.asset_focus?.includes(option.value);
                
                return (
                  <div
                    key={option.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleAssetFocus(option.value)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={isSelected} />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 2: Price */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_min">Mindestpreis (€)</Label>
                  <Input
                    id="price_min"
                    type="number"
                    placeholder="500.000"
                    value={formData.price_min || ''}
                    onChange={(e) => updateFormData({ price_min: parseFloat(e.target.value) || null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_max">Maximalpreis (€)</Label>
                  <Input
                    id="price_max"
                    type="number"
                    placeholder="2.000.000"
                    value={formData.price_max || ''}
                    onChange={(e) => updateFormData({ price_max: parseFloat(e.target.value) || null })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yield_target">Zielrendite (%)</Label>
                <Input
                  id="yield_target"
                  type="number"
                  step="0.1"
                  placeholder="4.5"
                  value={formData.yield_target || ''}
                  onChange={(e) => updateFormData({ yield_target: parseFloat(e.target.value) || null })}
                />
                <p className="text-sm text-muted-foreground">
                  Optionale Mindestrendite für Bestandsobjekte
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exclusions">Ausschlüsse</Label>
                <Textarea
                  id="exclusions"
                  placeholder="z.B. Keine Erdgeschosswohnungen, kein Denkmalschutz..."
                  value={formData.exclusions || ''}
                  onChange={(e) => updateFormData({ exclusions: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Weitere Hinweise</Label>
                <Textarea
                  id="notes"
                  placeholder="Besondere Anforderungen, Präferenzen..."
                  value={formData.notes || ''}
                  onChange={(e) => updateFormData({ notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Region:</span>
                  <span className="font-medium">{(formData.search_area as any)?.region || '–'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Objektarten:</span>
                  <span className="font-medium">
                    {formData.asset_focus?.map(f => 
                      ASSET_FOCUS_OPTIONS.find(o => o.value === f)?.label || f
                    ).join(', ') || '–'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">
                    {formData.price_min && formData.price_max 
                      ? `${new Intl.NumberFormat('de-DE').format(formData.price_min)} – ${new Intl.NumberFormat('de-DE').format(formData.price_max)} €`
                      : '–'}
                  </span>
                </div>
                {formData.yield_target && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Zielrendite:</span>
                    <span className="font-medium">{formData.yield_target}%</span>
                  </div>
                )}
                {formData.exclusions && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground">Ausschlüsse:</span>
                    <p className="text-sm mt-1">{formData.exclusions}</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                <p className="text-sm">
                  <strong>Hinweis:</strong> Nach Einreichung wird Ihr Mandat einem professionellen 
                  AkquiseManager zugewiesen. Sie werden über den Fortschritt informiert.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          
          <div className="flex gap-2">
            {currentStep === STEPS.length - 1 ? (
              <>
                <Button variant="outline" onClick={handleSaveDraft} disabled={createMandate.isPending}>
                  Als Entwurf speichern
                </Button>
                <Button onClick={handleSubmit} disabled={createMandate.isPending || submitMandate.isPending}>
                  {(createMandate.isPending || submitMandate.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Mandat einreichen
                </Button>
              </>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
