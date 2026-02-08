/**
 * FutureRoomBonitat — Digitaler Finanzierungsantrag
 * 
 * Banking-Style Formular mit klarem, professionellem Design
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, Lock, CheckCircle2, 
  User, Building2, Wallet, FileText, Shield
} from 'lucide-react';

type Step = 'contact' | 'property' | 'income' | 'summary';

export default function FutureRoomBonitat() {
  const [currentStep, setCurrentStep] = useState<Step>('contact');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    purchasePrice: '',
    equityAmount: '',
    propertyType: '',
    location: '',
    netIncome: '',
    employmentType: '',
    employer: '',
  });

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'contact', label: 'Kontakt', icon: <User className="h-4 w-4" /> },
    { id: 'property', label: 'Objekt', icon: <Building2 className="h-4 w-4" /> },
    { id: 'income', label: 'Einkommen', icon: <Wallet className="h-4 w-4" /> },
    { id: 'summary', label: 'Prüfen', icon: <FileText className="h-4 w-4" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

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
    alert('Vielen Dank! Wir melden uns innerhalb von 48 Stunden bei Ihnen.');
  };

  return (
    <div className="py-12" style={{ background: 'hsl(210 25% 97%)' }}>
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(210 30% 15%)' }}>
            Finanzierungsanfrage starten
          </h1>
          <p className="text-gray-500">
            Kostenlos und unverbindlich — Ihre erste Einschätzung in 48 Stunden.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="fr-progress-bar mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="fr-progress-step">
              <div className={`fr-progress-dot ${
                index < currentStepIndex ? 'completed' : 
                index === currentStepIndex ? 'active' : ''
              }`}>
                {index < currentStepIndex ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  step.icon
                )}
              </div>
              <span className={`fr-progress-label ${
                index === currentStepIndex ? 'active' : ''
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="fr-form-card">
          {/* Step: Contact */}
          {currentStep === 'contact' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'hsl(210 30% 15%)' }}>
                  Ihre Kontaktdaten
                </h2>
                <p className="text-gray-500 text-sm">Wie können wir Sie erreichen?</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="fr-label">Vorname</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="fr-input"
                  />
                </div>
                <div>
                  <label className="fr-label">Nachname</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="fr-input"
                  />
                </div>
              </div>
              <div>
                <label className="fr-label">E-Mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="fr-input"
                />
              </div>
              <div>
                <label className="fr-label">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="fr-input"
                />
              </div>
            </div>
          )}

          {/* Step: Property */}
          {currentStep === 'property' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'hsl(210 30% 15%)' }}>
                  Das Objekt
                </h2>
                <p className="text-gray-500 text-sm">Welche Immobilie möchten Sie finanzieren?</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="fr-label">Kaufpreis (€)</label>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => handleChange('purchasePrice', e.target.value)}
                    className="fr-input"
                  />
                </div>
                <div>
                  <label className="fr-label">Eigenkapital (€)</label>
                  <input
                    type="number"
                    value={formData.equityAmount}
                    onChange={(e) => handleChange('equityAmount', e.target.value)}
                    className="fr-input"
                  />
                </div>
              </div>
              <div>
                <label className="fr-label">Objektart</label>
                <input
                  type="text"
                  value={formData.propertyType}
                  onChange={(e) => handleChange('propertyType', e.target.value)}
                  placeholder="z.B. Eigentumswohnung, Einfamilienhaus"
                  className="fr-input"
                />
              </div>
              <div>
                <label className="fr-label">Standort</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="PLZ oder Stadt"
                  className="fr-input"
                />
              </div>
            </div>
          )}

          {/* Step: Income */}
          {currentStep === 'income' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'hsl(210 30% 15%)' }}>
                  Ihr Einkommen
                </h2>
                <p className="text-gray-500 text-sm">Angaben zu Ihrer beruflichen Situation</p>
              </div>
              <div>
                <label className="fr-label">Nettoeinkommen monatlich (€)</label>
                <input
                  type="number"
                  value={formData.netIncome}
                  onChange={(e) => handleChange('netIncome', e.target.value)}
                  className="fr-input"
                />
              </div>
              <div>
                <label className="fr-label">Beschäftigungsverhältnis</label>
                <input
                  type="text"
                  value={formData.employmentType}
                  onChange={(e) => handleChange('employmentType', e.target.value)}
                  placeholder="z.B. Angestellt, Selbstständig, Beamter"
                  className="fr-input"
                />
              </div>
              <div>
                <label className="fr-label">Arbeitgeber</label>
                <input
                  type="text"
                  value={formData.employer}
                  onChange={(e) => handleChange('employer', e.target.value)}
                  className="fr-input"
                />
              </div>
            </div>
          )}

          {/* Step: Summary */}
          {currentStep === 'summary' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'hsl(210 30% 15%)' }}>
                  Zusammenfassung
                </h2>
                <p className="text-gray-500 text-sm">Bitte überprüfen Sie Ihre Angaben</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'hsl(210 25% 97%)' }}>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: 'hsl(210 20% 88%)' }}>
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium" style={{ color: 'hsl(210 30% 15%)' }}>
                      {formData.firstName} {formData.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: 'hsl(210 20% 88%)' }}>
                    <span className="text-gray-500">E-Mail</span>
                    <span className="font-medium" style={{ color: 'hsl(210 30% 15%)' }}>
                      {formData.email || '–'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: 'hsl(210 20% 88%)' }}>
                    <span className="text-gray-500">Kaufpreis</span>
                    <span className="font-medium" style={{ color: 'hsl(210 30% 15%)' }}>
                      {formData.purchasePrice ? `${parseInt(formData.purchasePrice).toLocaleString('de-DE')} €` : '–'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: 'hsl(210 20% 88%)' }}>
                    <span className="text-gray-500">Eigenkapital</span>
                    <span className="font-medium" style={{ color: 'hsl(210 30% 15%)' }}>
                      {formData.equityAmount ? `${parseInt(formData.equityAmount).toLocaleString('de-DE')} €` : '–'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Nettoeinkommen</span>
                    <span className="font-medium" style={{ color: 'hsl(210 30% 15%)' }}>
                      {formData.netIncome ? `${parseInt(formData.netIncome).toLocaleString('de-DE')} €/Monat` : '–'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'hsl(165 70% 36% / 0.08)' }}>
                <Shield className="h-5 w-5 flex-shrink-0" style={{ color: 'hsl(165 70% 36%)' }} />
                <span className="text-sm" style={{ color: 'hsl(165 70% 36%)' }}>
                  Ihre Daten werden verschlüsselt übertragen und vertraulich behandelt.
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t" style={{ borderColor: 'hsl(210 20% 88%)' }}>
            <button
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className={`fr-btn ${currentStepIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ 
                background: 'transparent', 
                border: '2px solid hsl(210 20% 88%)',
                color: 'hsl(210 30% 15%)'
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              Zurück
            </button>
            {currentStep === 'summary' ? (
              <button onClick={handleSubmit} className="fr-btn fr-btn-primary">
                <CheckCircle2 className="h-4 w-4" />
                Absenden
              </button>
            ) : (
              <button onClick={handleNext} className="fr-btn fr-btn-primary">
                Weiter
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
