/**
 * FutureRoomAkte — Authenticated customer area for managing financing files
 * 
 * Tabs: Übersicht | Selbstauskunft | Dokumente | Status
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Upload, BarChart3, Send, CheckCircle2, 
  LogOut, Shield, Sparkles, Home
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Tab = 'overview' | 'selbstauskunft' | 'dokumente' | 'status';

export default function FutureRoomAkte() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [user, setUser] = useState<any>(null);
  const [intakeData, setIntakeData] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    // Load intake data from localStorage (from Bonitat wizard)
    const stored = localStorage.getItem('futureroom_intake_data');
    if (stored) {
      try { setIntakeData(JSON.parse(stored)); } catch {}
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/website/futureroom');
  };

  const handleSubmitAkte = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sot-futureroom-public-submit', {
        body: {
          contact: {
            firstName: intakeData?.firstName || '',
            lastName: intakeData?.lastName || '',
            email: user?.email || '',
            phone: intakeData?.phone || '',
          },
          object: {
            type: intakeData?.objectType || '',
            address: intakeData?.objectAddress || '',
            livingArea: parseFloat(intakeData?.objectLivingArea) || null,
            constructionYear: parseInt(intakeData?.objectConstructionYear) || null,
          },
          request: {
            purchasePrice: parseFloat(intakeData?.purchasePrice) || 0,
            equityAmount: parseFloat(intakeData?.equityAmount) || 0,
            purpose: intakeData?.purpose || 'kauf',
          },
          household: {
            netIncome: parseFloat(intakeData?.netIncome) || 0,
            employmentType: intakeData?.employmentType || '',
          },
          source: 'zone3_website',
          userId: user?.id,
        },
      });
      if (error) throw error;
      toast.success('Ihre Finanzierungsakte wurde erfolgreich eingereicht!');
      localStorage.removeItem('futureroom_intake_data');
      setActiveTab('status');
    } catch (err: any) {
      toast.error('Fehler beim Einreichen: ' + (err.message || 'Unbekannt'));
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Übersicht', icon: <Home className="h-4 w-4" /> },
    { id: 'selbstauskunft', label: 'Selbstauskunft', icon: <FileText className="h-4 w-4" /> },
    { id: 'dokumente', label: 'Dokumente', icon: <Upload className="h-4 w-4" /> },
    { id: 'status', label: 'Status', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="py-8" style={{ background: 'hsl(210 25% 97%)' }}>
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(210 30% 15%)' }}>Meine Finanzierungsakte</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="fr-btn text-sm" style={{ background: 'transparent', border: '1px solid hsl(210 20% 88%)', color: 'hsl(210 30% 40%)' }}>
            <LogOut className="h-4 w-4" />
            Abmelden
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'hsl(210 20% 93%)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? 'shadow-sm'
                  : 'hover:bg-white/50'
              }`}
              style={activeTab === tab.id ? { background: 'white', color: 'hsl(165 70% 36%)' } : { color: 'hsl(210 30% 40%)' }}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="fr-form-card">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'hsl(210 30% 15%)' }}>Willkommen in Ihrer Finanzierungsakte</h2>
                <p className="text-gray-500 text-sm">
                  Hier können Sie Ihre Selbstauskunft vervollständigen, Dokumente hochladen und den Status Ihrer Anfrage verfolgen.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid gap-4 md:grid-cols-3">
                <button onClick={() => setActiveTab('selbstauskunft')} className="p-4 rounded-xl text-left transition-all hover:shadow-md" style={{ background: 'hsl(165 70% 36% / 0.06)', border: '1px solid hsl(165 70% 36% / 0.2)' }}>
                  <FileText className="h-6 w-6 mb-2" style={{ color: 'hsl(165 70% 36%)' }} />
                  <h3 className="font-semibold text-sm" style={{ color: 'hsl(210 30% 15%)' }}>Selbstauskunft</h3>
                  <p className="text-xs text-gray-500 mt-1">Persönliche Daten vervollständigen</p>
                </button>
                <button onClick={() => setActiveTab('dokumente')} className="p-4 rounded-xl text-left transition-all hover:shadow-md" style={{ background: 'hsl(210 60% 50% / 0.06)', border: '1px solid hsl(210 60% 50% / 0.2)' }}>
                  <Upload className="h-6 w-6 mb-2" style={{ color: 'hsl(210 60% 50%)' }} />
                  <h3 className="font-semibold text-sm" style={{ color: 'hsl(210 30% 15%)' }}>Dokumente</h3>
                  <p className="text-xs text-gray-500 mt-1">Unterlagen hochladen</p>
                </button>
                <button onClick={() => setActiveTab('status')} className="p-4 rounded-xl text-left transition-all hover:shadow-md" style={{ background: 'hsl(45 100% 51% / 0.06)', border: '1px solid hsl(45 100% 51% / 0.2)' }}>
                  <BarChart3 className="h-6 w-6 mb-2" style={{ color: 'hsl(45 100% 40%)' }} />
                  <h3 className="font-semibold text-sm" style={{ color: 'hsl(210 30% 15%)' }}>Status</h3>
                  <p className="text-xs text-gray-500 mt-1">Anfrage verfolgen</p>
                </button>
              </div>

              {/* Intake data summary */}
              {intakeData && (
                <div className="p-4 rounded-xl" style={{ background: 'hsl(165 70% 36% / 0.06)', border: '1px solid hsl(165 70% 36% / 0.2)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5" style={{ color: 'hsl(165 70% 36%)' }} />
                    <span className="font-semibold text-sm" style={{ color: 'hsl(210 30% 15%)' }}>Daten aus Schnellerfassung übernommen</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Ihre Daten aus der Schnellerfassung wurden übernommen. Vervollständigen Sie Ihre Selbstauskunft und reichen Sie dann ein.
                  </p>
                  <button onClick={handleSubmitAkte} className="fr-btn fr-btn-primary">
                    <Send className="h-4 w-4" />
                    Finanzierung einreichen
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'hsl(165 70% 36% / 0.06)' }}>
                <Shield className="h-5 w-5 flex-shrink-0" style={{ color: 'hsl(165 70% 36%)' }} />
                <span className="text-sm" style={{ color: 'hsl(165 70% 36%)' }}>
                  Alle Daten werden verschlüsselt gespeichert und DSGVO-konform verarbeitet.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'selbstauskunft' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold" style={{ color: 'hsl(210 30% 15%)' }}>Selbstauskunft</h2>
              <p className="text-gray-500 text-sm">
                Die vollständige Selbstauskunft wird nach der Verknüpfung mit Ihrem Finanzierungsmanager freigeschaltet.
                Bitte reichen Sie zunächst Ihre Anfrage ein.
              </p>
              <div className="p-8 rounded-xl text-center" style={{ background: 'hsl(210 25% 97%)' }}>
                <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: 'hsl(210 20% 80%)' }} />
                <p className="text-gray-400">Wird nach Einreichung freigeschaltet</p>
              </div>
            </div>
          )}

          {activeTab === 'dokumente' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold" style={{ color: 'hsl(210 30% 15%)' }}>Dokumente</h2>
              <p className="text-gray-500 text-sm">
                Laden Sie Ihre Unterlagen hoch — Gehaltsabrechnungen, Kontoauszüge, Ausweiskopie etc.
              </p>
              <div className="p-8 rounded-xl text-center" style={{ background: 'hsl(210 25% 97%)', border: '2px dashed hsl(210 20% 85%)' }}>
                <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: 'hsl(210 20% 80%)' }} />
                <p className="text-gray-400 mb-2">Der Dokumenten-Upload wird nach Einreichung freigeschaltet.</p>
                <p className="text-xs text-gray-400">Ihr Finanzierungsmanager kann Ihnen dann die benötigten Unterlagen mitteilen.</p>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold" style={{ color: 'hsl(210 30% 15%)' }}>Status Ihrer Anfrage</h2>
              <div className="space-y-3">
                {[
                  { label: 'Daten erfasst', done: true },
                  { label: 'Konto erstellt', done: true },
                  { label: 'Anfrage eingereicht', done: false },
                  { label: 'Manager zugewiesen', done: false },
                  { label: 'Bei Bank eingereicht', done: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: step.done ? 'hsl(165 70% 36% / 0.06)' : 'hsl(210 25% 97%)' }}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center`} style={{ background: step.done ? 'hsl(165 70% 36%)' : 'hsl(210 20% 85%)' }}>
                      {step.done ? <CheckCircle2 className="h-4 w-4 text-white" /> : <span className="text-xs text-white font-bold">{i + 1}</span>}
                    </div>
                    <span className={`text-sm ${step.done ? 'font-medium' : 'text-gray-400'}`} style={step.done ? { color: 'hsl(210 30% 15%)' } : {}}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
