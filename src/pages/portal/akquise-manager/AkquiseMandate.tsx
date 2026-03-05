/**
 * AkquiseMandate — 4-Kachel-Workflow (MOD-12)
 * Orchestrator: State + Hooks + Handler, delegates JSX to sub-components.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { MandateCaseCard, MandateCaseCardNew } from '@/components/akquise/MandateCaseCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, LayoutList, LayoutPanelLeft, Search } from 'lucide-react';
import { useAcqMandatesForManager, useCreateAcqMandate } from '@/hooks/useAcqMandate';
import { type CreateAcqMandateData } from '@/types/acquisition';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  useContactStaging,
  useBulkCreateStagingContacts,
} from '@/hooks/useAcqContacts';
import {
  useAcqOutboundMessages,
  useBulkSendOutreach,
  useEmailTemplates,
} from '@/hooks/useAcqOutbound';
import { ContactBookDialog } from '@/components/akquise/ContactBookDialog';
import { SourcingTab } from './components/SourcingTab';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { isDemoId } from '@/engines/demoData/engine';
import { useResearchEngine } from '@/hooks/useResearchEngine';
import { formatPriceRange } from '@/components/akquise/ProfileRow';
import { generateAcqPdf } from '@/components/akquise/acqPdfExport';
import type { ExtractedProfile } from './components/types';

// Sub-components
import { ProfileExtractionCard } from './components/ProfileExtractionCard';
import { ProfileOutputCard } from './components/ProfileOutputCard';
import { ProfilePreviewSection } from './components/ProfilePreviewSection';
import { EmailComposeCard } from './components/EmailComposeCard';
import { SentMessagesLog } from './components/SentMessagesLog';

export default function AkquiseMandate() {
  const navigate = useNavigate();
  const { data: mandates, isLoading } = useAcqMandatesForManager();
  const createMandate = useCreateAcqMandate();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-AKQUISE-MANDAT');
  const researchEngine = useResearchEngine();

  const [isSplitView, setIsSplitView] = useState(false);

  // Active mandate
  const [activeMandateId, setActiveMandateId] = useState<string | null>(null);
  const [activeMandateCode, setActiveMandateCode] = useState('');

  // Consent
  const [acqConsentData, setAcqConsentData] = useState(false);
  const [acqConsentResearch, setAcqConsentResearch] = useState(false);
  const [acqConsentDsgvo, setAcqConsentDsgvo] = useState(false);

  // Kachel 1: KI-Erfassung
  const [freeText, setFreeText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [steerPriceMin, setSteerPriceMin] = useState('');
  const [steerPriceMax, setSteerPriceMax] = useState('');
  const [steerRegion, setSteerRegion] = useState('');
  const [steerAssetFocus, setSteerAssetFocus] = useState<string[]>([]);
  const [steerYield, setSteerYield] = useState('');
  const [steerExclusions, setSteerExclusions] = useState('');

  // Kachel 2: Profil
  const [clientName, setClientName] = useState('');
  const [profileGenerated, setProfileGenerated] = useState(false);
  const [profileData, setProfileData] = useState<ExtractedProfile | null>(null);
  const [profileTextLong, setProfileTextLong] = useState('');

  // CI-Vorschau
  const [previewData, setPreviewData] = useState<ExtractedProfile | null>(null);
  const [previewTextLong, setPreviewTextLong] = useState('');

  // Kachel 3+4
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [showContactBookDialog, setShowContactBookDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Hooks
  const { data: contacts = [] } = useContactStaging(activeMandateId || '');
  const bulkCreate = useBulkCreateStagingContacts();
  const { data: sentMessages = [] } = useOutboundMsgs(activeMandateId || '');
  const { data: templates = [] } = useTemplates2('outreach');
  const bulkSend = useBulkSend2();

  const approvedContacts = contacts.filter(c => c.status === 'approved');
  const selectedApprovedContacts = approvedContacts.filter(c => selectedContactIds.has(c.id));
  const mandateCreated = !!activeMandateId;

  // ── Helpers ──
  const toggleAssetFocus = (value: string) => {
    setSteerAssetFocus(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const toggleContactSelection = (id: string) => {
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Phase 1: KI-Extraction ──
  const handleExtract = async () => {
    if (!freeText.trim()) return;
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-acq-profile-extract', {
        body: {
          freeText: freeText.trim(),
          clientName: clientName.trim() || undefined,
          steeringParams: {
            priceMin: steerPriceMin ? Number(steerPriceMin) : undefined,
            priceMax: steerPriceMax ? Number(steerPriceMax) : undefined,
            region: steerRegion.trim() || undefined,
            assetFocus: steerAssetFocus.length > 0 ? steerAssetFocus : undefined,
            yieldTarget: steerYield ? Number(steerYield) : undefined,
            exclusions: steerExclusions.trim() || undefined,
          },
        },
      });
      if (error) throw error;
      if (data?.profile) {
        const p = data.profile as ExtractedProfile;
        setProfileData(p);
        setProfileTextLong(p.profile_text_long || '');
        if (p.client_name && !clientName) setClientName(p.client_name);
        setProfileGenerated(true);
        toast.success('Ankaufsprofil extrahiert');
      } else {
        throw new Error('Kein Profil extrahiert');
      }
    } catch (err) {
      console.error(err);
      toast.error('KI-Analyse fehlgeschlagen');
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Create Mandate ──
  const handleCreateMandate = async () => {
    if (!clientName.trim()) { toast.error('Bitte Kundennamen eingeben'); return; }
    if (!profileData) { toast.error('Bitte zuerst ein Profil generieren'); return; }

    const data: CreateAcqMandateData = {
      client_display_name: clientName.trim(),
      search_area: { free_text: profileData.region || '', region: profileData.region },
      asset_focus: profileData.asset_focus || [],
      price_min: profileData.price_min || null,
      price_max: profileData.price_max || null,
      yield_target: profileData.yield_target || null,
      exclusions: profileData.exclusions || undefined,
      notes: [profileData.notes, profileTextLong].filter(Boolean).join('\n\n') || undefined,
    };

    const result = await createMandate.mutateAsync(data);
    if (result?.id) {
      setActiveMandateId(result.id);
      setActiveMandateCode(result.code || '');
      setEmailSubject(`${result.code} – Ankaufsprofil`);
      setEmailBody(`Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie unser aktuelles Ankaufsprofil.\n\nWir suchen ${profileData.asset_focus?.join(', ') || 'Immobilien'} in ${profileData.region || 'ganz Deutschland'}.\n\nFür Rückfragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen`);
      toast.success(`Mandat ${result.code} erstellt`);
    }
  };

  // ── Apply Profile ──
  const handleApplyProfile = async () => {
    if (!profileData) return;
    setPreviewData({ ...profileData });
    setPreviewTextLong(profileTextLong);

    const region = profileData.region || 'Deutschland';
    const assets = profileData.asset_focus?.join(', ') || 'Immobilien';
    const priceRange = formatPriceRange(profileData.price_min, profileData.price_max);
    const yieldStr = profileData.yield_target ? `${profileData.yield_target}%` : '–';

    setEmailSubject(`Ankaufsprofil — ${clientName || 'Investor'} — ${region}`);
    setEmailBody(
      `Sehr geehrte Damen und Herren,\n\nim Auftrag unseres Mandanten suchen wir Immobilien mit folgendem Profil:\n\n` +
      `Suchgebiet: ${region}\nAsset-Fokus: ${assets}\nInvestitionsrahmen: ${priceRange}\nZielrendite: ${yieldStr}\n\n` +
      `Anbei finden Sie das vollständige Ankaufsprofil als PDF.\n\nWir freuen uns auf Ihre Angebote.\n\nMit freundlichen Grüßen`
    );

    if (activeMandateId) {
      try {
        const response = await researchEngine.search({
          intent: 'find_brokers',
          query: 'Immobilienmakler Geschäftsführer',
          location: region,
          max_results: 25,
          filters: { must_have_email: true, industry: 'Real Estate' },
          context: { module: 'akquise', reference_id: activeMandateId },
        });
        if (response?.results?.length) {
          await bulkCreate.mutateAsync({
            mandateId: activeMandateId,
            contacts: response.results.map((c) => ({
              source: 'engine' as const,
              source_id: `engine_${Date.now()}_${Math.random()}`,
              company_name: c.name,
              first_name: '',
              last_name: '',
              email: c.email,
              phone: c.phone,
              role_guess: '',
              service_area: c.address,
              quality_score: c.confidence || 50,
            })),
          });
          toast.success(`Ankaufsprofil übernommen — E-Mail vorbereitet, ${response.results.length} Kontakte gefunden`);
        } else {
          toast.success('Ankaufsprofil übernommen — E-Mail vorbereitet');
        }
      } catch {
        toast.success('Ankaufsprofil übernommen — E-Mail vorbereitet, Recherche fehlgeschlagen');
      }
    } else {
      toast.success('Ankaufsprofil in Vorschau übernommen — E-Mail vorbereitet');
    }
  };

  // ── Contact Book Import ──
  const handleContactBookImport = async (importedContacts: { first_name: string; last_name: string; email: string; company_name: string; service_area: string }[]) => {
    if (!activeMandateId || importedContacts.length === 0) return;
    try {
      await bulkCreate.mutateAsync({
        mandateId: activeMandateId,
        contacts: importedContacts.map(c => ({
          source: 'kontaktbuch' as const,
          company_name: c.company_name,
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          service_area: c.service_area,
          quality_score: 80,
        })),
      });
      setShowContactBookDialog(false);
      toast.success(`${importedContacts.length} Kontakte aus dem Kontaktbuch übernommen`);
    } catch {
      toast.error('Import fehlgeschlagen');
    }
  };

  // ── E-Mail Send ──
  const handleSendEmails = async () => {
    if (!activeMandateId || selectedApprovedContacts.length === 0) return;
    const template = templates[0];
    if (!template) { toast.error('Keine E-Mail-Vorlage verfügbar'); return; }
    try {
      await bulkSend.mutateAsync({
        mandateId: activeMandateId,
        contactIds: selectedApprovedContacts.map(c => c.id),
        templateCode: template.code,
        variables: {
          mandate_code: activeMandateCode,
          client_name: clientName,
          search_area: profileData?.region || '',
          asset_focus: profileData?.asset_focus?.join(', ') || '',
          custom_subject: emailSubject,
          custom_body: emailBody,
        },
      });
      setSelectedContactIds(new Set());
      toast.success(`${selectedApprovedContacts.length} E-Mails gesendet`);
    } catch {
      toast.error('Versand fehlgeschlagen');
    }
  };

  if (isLoading) {
    return <PageShell><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;
  }

  return (
    <PageShell fullWidth={isSplitView}>
      <ModulePageHeader
        title="MANDATE"
        description="Ankaufsprofile erstellen und Kontakte akquirieren"
        actions={
          <Button variant="ghost" size="icon" onClick={() => setIsSplitView(v => !v)} title={isSplitView ? 'Normale Ansicht' : 'Split-Ansicht'}>
            {isSplitView ? <LayoutList className="h-4 w-4" /> : <LayoutPanelLeft className="h-4 w-4" />}
          </Button>
        }
      />

      {/* ═══ Mandate Widget Grid ═══ */}
      <div>
        <WidgetGrid>
          {demoEnabled && (
            <WidgetCell>
              <Card className={cn("h-full cursor-pointer transition-colors", DESIGN.DEMO_WIDGET.CARD, DESIGN.DEMO_WIDGET.HOVER)}>
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, "text-[10px]")}>Demo</Badge>
                      <Badge variant="outline" className="text-[10px]">Aktiv</Badge>
                    </div>
                    <h3 className="font-semibold text-sm">Mustermann Projektentwicklung GmbH</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">München / Oberbayern</p>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Asset</span><span className="font-medium">MFH, Aufteiler</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Rendite</span><span className="font-medium">ab 4,5 %</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Budget</span><span className="font-mono">1–5 Mio €</span></div>
                  </div>
                </CardContent>
              </Card>
            </WidgetCell>
          )}
          <WidgetCell>
            <MandateCaseCardNew onClick={() => {
              setActiveMandateId(null);
              window.scrollTo({ top: document.getElementById('mandate-erfassung')?.offsetTop || 600, behavior: 'smooth' });
            }} />
          </WidgetCell>
          {mandates && mandates.filter(m => demoEnabled || !isDemoId(m.id)).map(m => (
            <WidgetCell key={m.id}>
              <MandateCaseCard mandate={m} onClick={() => navigate(`/portal/akquise-manager/mandate/${m.id}`)} />
            </WidgetCell>
          ))}
        </WidgetGrid>
      </div>

      {/* ═══ KACHEL 1 + 2 ═══ */}
      <div id="mandate-erfassung" className={DESIGN.FORM_GRID.FULL}>
        <ProfileExtractionCard
          freeText={freeText} setFreeText={setFreeText}
          steerPriceMin={steerPriceMin} setSteerPriceMin={setSteerPriceMin}
          steerPriceMax={steerPriceMax} setSteerPriceMax={setSteerPriceMax}
          steerRegion={steerRegion} setSteerRegion={setSteerRegion}
          steerAssetFocus={steerAssetFocus} onToggleAsset={toggleAssetFocus}
          steerYield={steerYield} setSteerYield={setSteerYield}
          steerExclusions={steerExclusions} setSteerExclusions={setSteerExclusions}
          onExtract={handleExtract} isExtracting={isExtracting}
        />
        <ProfileOutputCard
          profileGenerated={profileGenerated} profileData={profileData}
          clientName={clientName} setClientName={setClientName}
          profileTextLong={profileTextLong} setProfileTextLong={setProfileTextLong}
          onApplyProfile={handleApplyProfile}
          onOpenContactBook={() => setShowContactBookDialog(true)}
        />
      </div>

      {/* ═══ CI-Vorschau + Consent ═══ */}
      <ProfilePreviewSection
        previewData={previewData} previewTextLong={previewTextLong}
        clientName={clientName}
        onGeneratePdf={() => profileData && generateAcqPdf(profileData, clientName, profileTextLong)}
        profileGenerated={profileGenerated} mandateCreated={mandateCreated} mandateCode={activeMandateCode}
        acqConsentData={acqConsentData} setAcqConsentData={setAcqConsentData}
        acqConsentResearch={acqConsentResearch} setAcqConsentResearch={setAcqConsentResearch}
        acqConsentDsgvo={acqConsentDsgvo} setAcqConsentDsgvo={setAcqConsentDsgvo}
        onCreateMandate={handleCreateMandate} isCreating={createMandate.isPending}
      />

      {/* ═══ KACHEL 3 + 4 ═══ */}
      <div className={`${DESIGN.FORM_GRID.FULL} ${!mandateCreated ? 'opacity-40 pointer-events-none' : ''}`}>
        <Card className="min-h-[500px]">
          {mandateCreated && activeMandateId ? (
            <SourcingTab mandateId={activeMandateId} mandateCode={activeMandateCode} />
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
              <Search className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Erstellen Sie zuerst ein Mandat</p>
            </CardContent>
          )}
        </Card>
        <EmailComposeCard
          mandateCreated={mandateCreated}
          selectedContacts={selectedApprovedContacts}
          onToggleContact={toggleContactSelection}
          emailSubject={emailSubject} setEmailSubject={setEmailSubject}
          emailBody={emailBody} setEmailBody={setEmailBody}
          profileGenerated={profileGenerated} clientName={clientName}
          onSend={handleSendEmails} isSending={bulkSend.isPending}
          sentMessages={sentMessages}
        />
      </div>

      {!mandateCreated && (
        <p className="text-sm text-muted-foreground italic text-center">
          Erstellen Sie zuerst ein Ankaufsprofil, um Kontaktrecherche und E-Mail-Versand zu nutzen.
        </p>
      )}

      {/* ═══ Dokumentation ═══ */}
      {mandateCreated && <SentMessagesLog messages={sentMessages} />}

      {/* ═══ Kontaktbuch Dialog ═══ */}
      <ContactBookDialog
        open={showContactBookDialog}
        onOpenChange={setShowContactBookDialog}
        onImport={handleContactBookImport}
        isImporting={bulkCreate.isPending}
      />
    </PageShell>
  );
}
