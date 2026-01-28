import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ChevronRight, ChevronLeft, Lock, CheckCircle2, 
  User, Building2, Wallet, FileText 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type Step = 'contact' | 'property' | 'income' | 'summary';

export default function FutureRoomBonitat() {
  const [currentStep, setCurrentStep] = useState<Step>('contact');
  const [formData, setFormData] = useState({
    // Contact
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Property
    purchasePrice: '',
    equityAmount: '',
    propertyType: '',
    location: '',
    // Income
    netIncome: '',
    employmentType: '',
    employer: '',
  });

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'contact', label: 'Kontakt', icon: <User className="h-4 w-4" /> },
    { id: 'property', label: 'Objekt', icon: <Building2 className="h-4 w-4" /> },
    { id: 'income', label: 'Einkommen', icon: <Wallet className="h-4 w-4" /> },
    { id: 'summary', label: 'Zusammenfassung', icon: <FileText className="h-4 w-4" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    const idx = currentStepIndex;
    if (idx < steps.length - 1) {
      setCurrentStep(steps[idx + 1].id);
    }
  };

  const handleBack = () => {
    const idx = currentStepIndex;
    if (idx > 0) {
      setCurrentStep(steps[idx - 1].id);
    }
  };

  const handleSubmit = () => {
    // In a real implementation, this would submit to the backend
    // and redirect to the portal login
    alert('Vielen Dank! Wir melden uns innerhalb von 48 Stunden bei Ihnen.');
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Bonitätscheck</h1>
          <p className="text-white/60">
            Kostenlos und unverbindlich – Ihre Daten sind sicher.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 text-sm ${
                  index <= currentStepIndex ? 'text-amber-400' : 'text-white/40'
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  index <= currentStepIndex 
                    ? 'bg-amber-400 text-slate-900' 
                    : 'bg-white/10 text-white/40'
                }`}>
                  {step.icon}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2 bg-white/10" />
        </div>

        {/* Form Card */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            {/* Step: Contact */}
            {currentStep === 'contact' && (
              <div className="space-y-4">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-white">Ihre Kontaktdaten</CardTitle>
                  <CardDescription className="text-white/60">
                    Wie können wir Sie erreichen?
                  </CardDescription>
                </CardHeader>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white">Vorname</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Nachname</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">E-Mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Telefon</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            )}

            {/* Step: Property */}
            {currentStep === 'property' && (
              <div className="space-y-4">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-white">Das Objekt</CardTitle>
                  <CardDescription className="text-white/60">
                    Welche Immobilie möchten Sie finanzieren?
                  </CardDescription>
                </CardHeader>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white">Kaufpreis (€)</Label>
                    <Input
                      type="number"
                      value={formData.purchasePrice}
                      onChange={(e) => handleChange('purchasePrice', e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Eigenkapital (€)</Label>
                    <Input
                      type="number"
                      value={formData.equityAmount}
                      onChange={(e) => handleChange('equityAmount', e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Objektart</Label>
                  <Input
                    value={formData.propertyType}
                    onChange={(e) => handleChange('propertyType', e.target.value)}
                    placeholder="z.B. Eigentumswohnung, Einfamilienhaus"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Standort</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="PLZ oder Stadt"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
            )}

            {/* Step: Income */}
            {currentStep === 'income' && (
              <div className="space-y-4">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-white">Ihr Einkommen</CardTitle>
                  <CardDescription className="text-white/60">
                    Angaben zu Ihrer beruflichen Situation
                  </CardDescription>
                </CardHeader>
                <div className="space-y-2">
                  <Label className="text-white">Nettoeinkommen monatlich (€)</Label>
                  <Input
                    type="number"
                    value={formData.netIncome}
                    onChange={(e) => handleChange('netIncome', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Beschäftigungsverhältnis</Label>
                  <Input
                    value={formData.employmentType}
                    onChange={(e) => handleChange('employmentType', e.target.value)}
                    placeholder="z.B. Angestellt, Selbstständig, Beamter"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Arbeitgeber</Label>
                  <Input
                    value={formData.employer}
                    onChange={(e) => handleChange('employer', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            )}

            {/* Step: Summary */}
            {currentStep === 'summary' && (
              <div className="space-y-4">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-white">Zusammenfassung</CardTitle>
                  <CardDescription className="text-white/60">
                    Bitte überprüfen Sie Ihre Angaben
                  </CardDescription>
                </CardHeader>
                <div className="space-y-4 p-4 bg-white/5 rounded-lg">
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span className="text-white/60">Name</span>
                      <span className="text-white">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">E-Mail</span>
                      <span className="text-white">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Kaufpreis</span>
                      <span className="text-white">
                        {formData.purchasePrice ? `${parseInt(formData.purchasePrice).toLocaleString('de-DE')} €` : '–'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Eigenkapital</span>
                      <span className="text-white">
                        {formData.equityAmount ? `${parseInt(formData.equityAmount).toLocaleString('de-DE')} €` : '–'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Nettoeinkommen</span>
                      <span className="text-white">
                        {formData.netIncome ? `${parseInt(formData.netIncome).toLocaleString('de-DE')} €` : '–'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Lock className="h-4 w-4" />
                  Ihre Daten werden verschlüsselt übertragen und vertraulich behandelt.
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
              {currentStep === 'summary' ? (
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Absenden
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900"
                >
                  Weiter
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
