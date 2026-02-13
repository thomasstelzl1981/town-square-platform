/**
 * AkquiseMandate — 4-Kachel-Workflow (MOD-12)
 * 
 * Ansicht 1: Erfassung → Profil → Kontakte → E-Mail
 * Sektionen 5-7 (Objekteingang, Analyse, Delivery) leben auf der Workbench-Seite.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { MandateCaseCard, MandateCaseCardPlaceholder, MandateCaseCardNew } from '@/components/akquise/MandateCaseCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, Send, Sparkles, Search, Mail, UserPlus, Database, Globe,
  FileText, Download, Printer, BookOpen, LayoutList, LayoutPanelLeft,
  CheckCircle2, XCircle, Clock, MailOpen, AlertCircle, Wand2, Phone, MapPin, ExternalLink,
  Users
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcqMandatesForManager, useCreateAcqMandate } from '@/hooks/useAcqMandate';
import { ASSET_FOCUS_OPTIONS, type CreateAcqMandateData } from '@/types/acquisition';
import { DESIGN } from '@/config/designManifest';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  useContactStaging, 
  useCreateStagingContact, 
  useApproveContact, 
  useRejectContact,
  useEnrichContact,
  useBulkCreateStagingContacts,
  useOutreachQueue,
  useUserContactLinks,
  type ContactStaging 
} from '@/hooks/useAcqContacts';
import {
  useAcqOutboundMessages,
  useSendOutreach,
  useBulkSendOutreach,
  useEmailTemplates,
  renderTemplate,
  type EmailTemplate
} from '@/hooks/useAcqOutbound';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { AcqProfilePreview } from '@/components/akquise/AcqProfilePreview';
import { ContactBookDialog } from '@/components/akquise/ContactBookDialog';
import logoLight from '@/assets/logos/armstrong_logo_light.png';

// ── Types ──
interface ExtractedProfile {
  client_name?: string;
  region?: string;
  asset_focus: string[];
  price_min?: number | null;
  price_max?: number | null;
  yield_target?: number | null;
  exclusions?: string;
  notes?: string;
  profile_text_long?: string;
}

// ── Source & Status configs ──
const SOURCE_CONFIG: Record<string, { label: string; icon: typeof UserPlus; color: string }> = {
  manual: { label: 'Manuell', icon: UserPlus, color: 'bg-gray-100 text-gray-700' },
  apollo: { label: 'Apollo', icon: Database, color: 'bg-blue-100 text-blue-700' },
  apify: { label: 'Apify', icon: Globe, color: 'bg-purple-100 text-purple-700' },
  firecrawl: { label: 'Firecrawl', icon: Search, color: 'bg-orange-100 text-orange-700' },
  geomap: { label: 'GeoMap', icon: MapPin, color: 'bg-green-100 text-green-700' },
  kontaktbuch: { label: 'Kontaktbuch', icon: BookOpen, color: 'bg-emerald-100 text-emerald-700' },
};

const MSG_STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  queued: { label: 'Warteschlange', icon: Clock, color: 'bg-gray-100 text-gray-700' },
  sending: { label: 'Wird gesendet', icon: Loader2, color: 'bg-blue-100 text-blue-700' },
  sent: { label: 'Gesendet', icon: Send, color: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Zugestellt', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
  opened: { label: 'Geöffnet', icon: MailOpen, color: 'bg-purple-100 text-purple-700' },
  bounced: { label: 'Zurückgewiesen', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
  replied: { label: 'Beantwortet', icon: Mail, color: 'bg-green-100 text-green-700' },
  failed: { label: 'Fehlgeschlagen', icon: XCircle, color: 'bg-red-100 text-red-700' },
};

const CONTACT_STATUS_CONFIG = {
  pending: { label: 'Ausstehend', variant: 'secondary' as const },
  approved: { label: 'Übernommen', variant: 'default' as const },
  rejected: { label: 'Abgelehnt', variant: 'destructive' as const },
  merged: { label: 'Zusammengeführt', variant: 'outline' as const },
} as const;

export default function AkquiseMandate() {
  const navigate = useNavigate();
  const { data: mandates, isLoading } = useAcqMandatesForManager();
  const createMandate = useCreateAcqMandate();

  const [isSplitView, setIsSplitView] = useState(false);

  // Active mandate
  const [activeMandateId, setActiveMandateId] = useState<string | null>(null);
  const [activeMandateCode, setActiveMandateCode] = useState('');

  // Consent state for mandate creation
  const [acqConsentData, setAcqConsentData] = useState(false);
  const [acqConsentResearch, setAcqConsentResearch] = useState(false);
  const [acqConsentDsgvo, setAcqConsentDsgvo] = useState(false);
  const acqAllConsents = acqConsentData && acqConsentResearch && acqConsentDsgvo;

  // ─── Kachel 1: KI-Erfassung ───
  const [freeText, setFreeText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Steuerfelder (Kachel 1 — optional)
  const [steerPriceMin, setSteerPriceMin] = useState('');
  const [steerPriceMax, setSteerPriceMax] = useState('');
  const [steerRegion, setSteerRegion] = useState('');
  const [steerAssetFocus, setSteerAssetFocus] = useState<string[]>([]);
  const [steerYield, setSteerYield] = useState('');
  const [steerExclusions, setSteerExclusions] = useState('');

  // ─── Kunden-Zeile ───
  const [clientName, setClientName] = useState('');

  // ─── Kachel 2: Ankaufsprofil (OUTPUT) ───
  const [profileGenerated, setProfileGenerated] = useState(false);
  const [profileData, setProfileData] = useState<ExtractedProfile | null>(null);
  const [profileTextLong, setProfileTextLong] = useState('');

  // ─── CI-Vorschau (separate Preview-States) ───
  const [previewData, setPreviewData] = useState<ExtractedProfile | null>(null);
  const [previewTextLong, setPreviewTextLong] = useState('');

  // ─── Kachel 3: Kontaktrecherche ───
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showApolloDialog, setShowApolloDialog] = useState(false);
  const [showApifyDialog, setShowApifyDialog] = useState(false);
  const [showContactBookDialog, setShowContactBookDialog] = useState(false);
  const [apolloLoading, setApolloLoading] = useState(false);
  const [apifyLoading, setApifyLoading] = useState(false);
  const [manualForm, setManualForm] = useState({ company_name: '', first_name: '', last_name: '', email: '', phone: '', website_url: '', role_guess: '', service_area: '' });
  const [apolloForm, setApolloForm] = useState({ jobTitles: 'Makler, Immobilienmakler, Geschäftsführer', locations: '', industries: 'Real Estate', limit: 25 });
  const [apifyForm, setApifyForm] = useState({ portalUrl: '', searchType: 'brokers', limit: 50 });

  // ─── Kachel 4: E-Mail ───
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // ── Hooks for Kachel 3+4 ──
  const { data: contacts = [], isLoading: contactsLoading } = useContactStaging(activeMandateId || '');
  const createContact = useCreateStagingContact();
  const approveContact = useApproveContact();
  const rejectContact = useRejectContact();
  const enrichContact = useEnrichContact();
  const bulkCreate = useBulkCreateStagingContacts();
  const { data: sentMessages = [] } = useAcqOutboundMessages(activeMandateId || '');
  const { data: templates = [] } = useEmailTemplates('outreach');
  const sendOutreach = useSendOutreach();
  const bulkSend = useBulkSendOutreach();

  const approvedContacts = contacts.filter(c => c.status === 'approved');
  const pendingContacts = contacts.filter(c => c.status === 'pending');

  const selectedApprovedContacts = approvedContacts.filter(c => selectedContactIds.has(c.id));

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

  // ── PDF Generation ──
  const generatePdf = () => {
    if (!profileData) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 20;
    let y = margin;

    // Logo (top right)
    try {
      doc.addImage(logoLight, 'PNG', 150, margin, 40, 14);
    } catch { /* logo optional */ }

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ANKAUFSPROFIL', margin, y + 4);
    y += 14;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160);
    doc.text(`Erstellt am ${new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, y);
    y += 12;

    doc.setDrawColor(200);
    doc.line(margin, y, 190, y);
    y += 8;

    // Client
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(clientName || 'Investor', margin, y);
    y += 10;

    // Profile table
    const rows: [string, string][] = [
      ['Suchgebiet', profileData.region || '–'],
      ['Asset-Fokus', profileData.asset_focus?.join(', ') || '–'],
      ['Investitionsrahmen', formatPriceRange(profileData.price_min, profileData.price_max)],
      ['Zielrendite', profileData.yield_target ? `${profileData.yield_target}%` : '–'],
      ['Ausschlüsse', profileData.exclusions || '–'],
    ];

    doc.setFontSize(9);
    rows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100);
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      const lines = doc.splitTextToSize(value, 120);
      doc.text(lines, margin + 50, y);
      y += lines.length * 5 + 4;
    });

    y += 6;
    doc.setDrawColor(200);
    doc.line(margin, y, 190, y);
    y += 8;

    // Profile text
    if (profileTextLong) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const textLines = doc.splitTextToSize(profileTextLong, 170);
      doc.text(textLines, margin, y);
    }

    doc.save(`Ankaufsprofil_${clientName?.replace(/\s/g, '_') || 'Profil'}.pdf`);
    toast.success('PDF exportiert');
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

  // ── Sourcing Handlers ──
  const handleManualSubmit = async () => {
    if (!activeMandateId) return;
    await createContact.mutateAsync({ mandate_id: activeMandateId, source: 'manual', ...manualForm });
    setManualForm({ company_name: '', first_name: '', last_name: '', email: '', phone: '', website_url: '', role_guess: '', service_area: '' });
    setShowAddDialog(false);
  };

  const handleApolloSearch = async () => {
    if (!activeMandateId) return;
    setApolloLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-apollo-search', {
        body: { mandateId: activeMandateId, jobTitles: apolloForm.jobTitles.split(',').map(s => s.trim()), locations: apolloForm.locations.split(',').map(s => s.trim()).filter(Boolean), industries: apolloForm.industries.split(',').map(s => s.trim()), limit: apolloForm.limit },
      });
      if (error) throw error;
      if (data?.contacts?.length) {
        await bulkCreate.mutateAsync({ mandateId: activeMandateId, contacts: data.contacts.map((c: any) => ({ source: 'apollo' as const, source_id: c.id, company_name: c.company, first_name: c.firstName, last_name: c.lastName, email: c.email, phone: c.phone, role_guess: c.title, service_area: c.location, quality_score: c.score || 50 })) });
      }
      setShowApolloDialog(false);
    } catch (err) { toast.error('Apollo-Suche fehlgeschlagen'); } 
    finally { setApolloLoading(false); }
  };

  const handleApifySearch = async () => {
    if (!activeMandateId) return;
    setApifyLoading(true);
    try {
      const { error } = await supabase.functions.invoke('sot-apify-portal-job', { body: { mandateId: activeMandateId, portalUrl: apifyForm.portalUrl, searchType: apifyForm.searchType, limit: apifyForm.limit } });
      if (error) throw error;
      toast.success('Apify-Job gestartet');
      setShowApifyDialog(false);
    } catch (err) { toast.error('Apify-Job fehlgeschlagen'); }
    finally { setApifyLoading(false); }
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
    } catch (err) {
      toast.error('Versand fehlgeschlagen');
    }
  };

  // ── "Ankaufsprofil übernehmen" — Orchestration ──
  const handleApplyProfile = async () => {
    if (!profileData) return;

    // 1. CI-Vorschau befüllen
    setPreviewData({ ...profileData });
    setPreviewTextLong(profileTextLong);

    // 2. E-Mail-Entwurf generieren
    const region = profileData.region || 'Deutschland';
    const assets = profileData.asset_focus?.join(', ') || 'Immobilien';
    const priceRange = formatPriceRange(profileData.price_min, profileData.price_max);
    const yieldStr = profileData.yield_target ? `${profileData.yield_target}%` : '–';
    
    setEmailSubject(`Ankaufsprofil — ${clientName || 'Investor'} — ${region}`);
    setEmailBody(
      `Sehr geehrte Damen und Herren,\n\nim Auftrag unseres Mandanten suchen wir Immobilien mit folgendem Profil:\n\n` +
      `Suchgebiet: ${region}\n` +
      `Asset-Fokus: ${assets}\n` +
      `Investitionsrahmen: ${priceRange}\n` +
      `Zielrendite: ${yieldStr}\n\n` +
      `Anbei finden Sie das vollständige Ankaufsprofil als PDF.\n\n` +
      `Wir freuen uns auf Ihre Angebote.\n\n` +
      `Mit freundlichen Grüßen`
    );

    // 3. Auto-Kontaktrecherche starten (Apollo)
    if (activeMandateId) {
      try {
        const searchLocations = profileData.region ? profileData.region.split(',').map(s => s.trim()) : [];
        const { data, error } = await supabase.functions.invoke('sot-apollo-search', {
          body: {
            mandateId: activeMandateId,
            jobTitles: ['Makler', 'Immobilienmakler', 'Geschäftsführer'],
            locations: searchLocations,
            industries: ['Real Estate'],
            limit: 25,
          },
        });
        if (!error && data?.contacts?.length) {
          await bulkCreate.mutateAsync({
            mandateId: activeMandateId,
            contacts: data.contacts.map((c: any) => ({
              source: 'apollo' as const,
              source_id: c.id,
              company_name: c.company,
              first_name: c.firstName,
              last_name: c.lastName,
              email: c.email,
              phone: c.phone,
              role_guess: c.title,
              service_area: c.location,
              quality_score: c.score || 50,
            })),
          });
          toast.success(`Ankaufsprofil übernommen — E-Mail vorbereitet, ${data.contacts.length} Kontakte gefunden`);
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

  if (isLoading) {
    return <PageShell><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;
  }

  const mandateCreated = !!activeMandateId;

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
          <WidgetCell>
            <MandateCaseCardNew onClick={() => {
              setActiveMandateId(null);
              window.scrollTo({ top: document.getElementById('mandate-erfassung')?.offsetTop || 600, behavior: 'smooth' });
            }} />
          </WidgetCell>
          {mandates && mandates.map(m => (
            <WidgetCell key={m.id}>
              <MandateCaseCard mandate={m} onClick={() => navigate(`/portal/akquise-manager/mandate/${m.id}`)} />
            </WidgetCell>
          ))}
        </WidgetGrid>
      </div>


      {/* ═══ KACHEL 1 + 2: KI-Erfassung + Ankaufsprofil ═══ */}
      <div id="mandate-erfassung" className={DESIGN.FORM_GRID.FULL}>
        {/* ── KACHEL 1: KI-Erfassung (INPUT) ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4" />
              KI-gestützte Erfassung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="z.B. Family Office sucht Mehrfamilienhäuser in der Rhein-Main-Region, Investitionsvolumen 2 bis 5 Millionen Euro, mindestens 4% Rendite, kein Denkmalschutz, keine Erbbaurechte."
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              rows={6}
              className="text-sm"
            />

            {/* Optionale Steuerfelder */}
            <div className="space-y-3 border-t pt-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Optionale Steuerparameter</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Preis ab (€)</Label>
                  <Input type="number" placeholder="500.000" value={steerPriceMin} onChange={e => setSteerPriceMin(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Preis bis (€)</Label>
                  <Input type="number" placeholder="5.000.000" value={steerPriceMax} onChange={e => setSteerPriceMax(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Region</Label>
                <Input placeholder="z.B. Rhein-Main, Berlin" value={steerRegion} onChange={e => setSteerRegion(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Zielrendite (%)</Label>
                  <Input type="number" step="0.1" placeholder="5.0" value={steerYield} onChange={e => setSteerYield(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ausschlüsse</Label>
                  <Input placeholder="z.B. kein Denkmalschutz" value={steerExclusions} onChange={e => setSteerExclusions(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Asset-Fokus</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {ASSET_FOCUS_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-border hover:bg-accent/50 cursor-pointer text-xs">
                      <Checkbox checked={steerAssetFocus.includes(opt.value)} onCheckedChange={() => toggleAssetFocus(opt.value)} className="h-3 w-3 shrink-0" />
                      <span className="truncate">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={handleExtract} disabled={!freeText.trim() || isExtracting}>
              {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Ankaufsprofil generieren
            </Button>
          </CardContent>
        </Card>

        {/* ── KACHEL 2: Ankaufsprofil (OUTPUT) ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              Ankaufsprofil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mandanten-Eingabe (immer sichtbar) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Mandant / Kunde</Label>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowContactBookDialog(true)}>
                  <BookOpen className="h-3.5 w-3.5 mr-1" />
                  Kontaktbuch
                </Button>
              </div>
              <Textarea
                placeholder="Name, Firma, Kontaktdaten des Mandanten eingeben oder aus dem Kontaktbuch übernehmen…"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                rows={6}
                className="text-sm"
              />
            </div>

            {!profileGenerated ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">Profil wird nach KI-Analyse hier angezeigt</p>
                <p className="text-xs mt-1">Geben Sie links einen Freitext ein und klicken Sie "Generieren"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Structured read-only data */}
                <div className="divide-y rounded-lg border">
                  <ProfileRow label="Suchgebiet" value={profileData?.region || '–'} />
                  <ProfileRow label="Asset-Fokus" value={profileData?.asset_focus?.join(', ') || '–'} />
                  <ProfileRow label="Investitionsrahmen" value={formatPriceRange(profileData?.price_min, profileData?.price_max)} />
                  <ProfileRow label="Zielrendite" value={profileData?.yield_target ? `${profileData.yield_target}%` : '–'} />
                  <ProfileRow label="Ausschlüsse" value={profileData?.exclusions || '–'} />
                </div>

                {/* Editable summary */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Freitext-Zusammenfassung (editierbar)</Label>
                  <Textarea
                    value={profileTextLong}
                    onChange={e => setProfileTextLong(e.target.value)}
                    rows={4}
                    className="text-sm"
                  />
                </div>

                {/* Apply button */}
                <Button className="w-full" variant="default" onClick={handleApplyProfile}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Ankaufsprofil übernehmen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ CI-VORSCHAU — Vollbreite Kachel (immer sichtbar) ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              CI-Vorschau — Ankaufsprofil
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={generatePdf} disabled={!previewData}>
                <Download className="h-4 w-4 mr-2" />
                PDF exportieren
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!previewData}>
                <Printer className="h-4 w-4 mr-2" />
                Drucken
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AcqProfilePreview
            clientName={clientName}
            profileData={previewData}
            profileTextLong={previewTextLong}
          />
        </CardContent>
      </Card>

      {/* ═══ ANKAUFSPROFIL ANLEGEN BUTTON ═══ */}
      {profileGenerated && !mandateCreated && (
        <Card className="glass-card border-primary/20">
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Einwilligung & Mandatserteilung</h3>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <Checkbox id="acq-consent-data" checked={acqConsentData} onCheckedChange={(v) => setAcqConsentData(v === true)} className="mt-0.5" />
                <Label htmlFor="acq-consent-data" className="text-xs leading-relaxed cursor-pointer">
                  Ich bestätige die Richtigkeit der eingegebenen Daten und des Ankaufsprofils.
                </Label>
              </div>
              <div className="flex items-start gap-2.5">
                <Checkbox id="acq-consent-research" checked={acqConsentResearch} onCheckedChange={(v) => setAcqConsentResearch(v === true)} className="mt-0.5" />
                <Label htmlFor="acq-consent-research" className="text-xs leading-relaxed cursor-pointer">
                  Ich genehmige die automatisierte Kontaktrecherche und Datenverarbeitung im Rahmen dieses Mandats.
                </Label>
              </div>
              <div className="flex items-start gap-2.5">
                <Checkbox id="acq-consent-dsgvo" checked={acqConsentDsgvo} onCheckedChange={(v) => setAcqConsentDsgvo(v === true)} className="mt-0.5" />
                <Label htmlFor="acq-consent-dsgvo" className="text-xs leading-relaxed cursor-pointer">
                  Ich stimme der Verarbeitung personenbezogener Daten gemäß DSGVO zu.
                </Label>
              </div>
            </div>
            <div className="flex justify-center pt-2">
              <Button size="lg" onClick={handleCreateMandate} disabled={createMandate.isPending || !clientName.trim() || !acqAllConsents}>
                {createMandate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Ankaufsprofil anlegen — Mandat erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mandateCreated && (
        <div className="flex items-center gap-2 justify-center">
          <Badge variant="default" className="text-sm py-1 px-3">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mandat {activeMandateCode} erstellt
          </Badge>
        </div>
      )}


      {/* ═══ KACHEL 3 + 4: Kontaktrecherche + E-Mail-Versand ═══ */}
      <div className={`${DESIGN.FORM_GRID.FULL} ${!mandateCreated ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* ── KACHEL 3: Kontaktrecherche ── */}
        <Card className="min-h-[500px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Search className="h-4 w-4" />
                Kontaktrecherche
                {contacts.length > 0 && (
                  <Badge variant="secondary" className="text-xs ml-2">
                    {approvedContacts.length} / {contacts.length}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setShowApolloDialog(true)} title="Apollo">
                  <Database className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowApifyDialog(true)} title="Portal Scraper">
                  <Globe className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAddDialog(true)} title="Manuell">
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowContactBookDialog(true)} title="Kontaktbuch">
                  <BookOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Noch keine Kontakte</p>
                <p className="text-xs mt-1">Nutzen Sie Apollo, Portal Scraper oder manuelle Eingabe</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {/* Pending contacts first */}
                {pendingContacts.map(contact => (
                  <div key={contact.id} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {contact.first_name || contact.last_name ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : contact.company_name || 'Unbekannt'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{contact.email || '–'}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => rejectContact.mutate(contact.id)}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600" onClick={() => approveContact.mutate({ stagingId: contact.id, mandateId: activeMandateId! })}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {/* Approved contacts with checkboxes */}
                {approvedContacts.map(contact => (
                  <div key={contact.id} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 text-sm ${selectedContactIds.has(contact.id) ? 'bg-primary/5 border-primary/30' : ''}`} onClick={() => toggleContactSelection(contact.id)}>
                    <Checkbox checked={selectedContactIds.has(contact.id)} className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {contact.first_name || contact.last_name ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : contact.company_name || 'Unbekannt'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{contact.email || '–'}</div>
                    </div>
                    <Badge variant="default" className="text-[10px]">Übernommen</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── KACHEL 4: E-Mail-Fenster ── */}
        <Card className="min-h-[500px]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              E-Mail-Versand
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipients */}
            <div className="space-y-1">
              <Label className="text-xs">An:</Label>
              <div className="flex flex-wrap gap-1 min-h-[32px] p-2 rounded-md border bg-muted/30">
                {selectedApprovedContacts.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Kontakte links auswählen...</span>
                ) : (
                  selectedApprovedContacts.map(c => (
                    <Badge key={c.id} variant="secondary" className="text-xs">
                      {c.first_name || c.last_name ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : c.email}
                      <button className="ml-1 hover:text-destructive" onClick={() => toggleContactSelection(c.id)}>×</button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <Label className="text-xs">Betreff:</Label>
              <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Betreff eingeben..." className="text-sm" />
            </div>

            {/* Body */}
            <div className="space-y-1">
              <Label className="text-xs">Nachricht:</Label>
              <Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={6} className="text-sm" placeholder="E-Mail Text..." />
            </div>

            {/* Attachment */}
            {profileGenerated && (
              <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-xs flex-1">Ankaufsprofil_{clientName?.replace(/\s/g, '_') || 'Profil'}.pdf</span>
                <Badge variant="outline" className="text-[10px]">Anhang</Badge>
              </div>
            )}

            {/* Send */}
            <Button className="w-full" onClick={handleSendEmails} disabled={selectedApprovedContacts.length === 0 || bulkSend.isPending || !emailSubject.trim()}>
              {bulkSend.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Senden ({selectedApprovedContacts.length})
            </Button>

            {/* Recent sent messages */}
            {sentMessages.length > 0 && (
              <div className="border-t pt-3 space-y-1">
                <Label className="text-xs text-muted-foreground">Letzte Nachrichten</Label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {sentMessages.slice(0, 10).map(msg => {
                    const sc = MSG_STATUS_CONFIG[msg.status] || MSG_STATUS_CONFIG.queued;
                    const StatusIcon = sc.icon;
                    return (
                      <div key={msg.id} className="flex items-center gap-2 p-2 rounded text-xs border">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${sc.color}`}>
                          <StatusIcon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{msg.subject}</div>
                          <div className="text-muted-foreground truncate">{(msg as any).contact?.email || '–'}</div>
                        </div>
                        <Badge variant="outline" className="text-[10px] flex-shrink-0">{sc.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!mandateCreated && (
        <p className="text-sm text-muted-foreground italic text-center">
          Erstellen Sie zuerst ein Ankaufsprofil, um Kontaktrecherche und E-Mail-Versand zu nutzen.
        </p>
      )}

      {/* ═══ DOKUMENTATION — E-Mail-Versand-Liste ═══ */}
      {mandateCreated && sentMessages.length > 0 && (
        <>
          <Separator />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                Dokumentation — E-Mail-Versand
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {sentMessages.map(msg => {
                  const sc = MSG_STATUS_CONFIG[msg.status] || MSG_STATUS_CONFIG.queued;
                  const StatusIcon = sc.icon;
                  return (
                    <div key={msg.id} className="flex items-center gap-4 px-4 py-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${sc.color}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{msg.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          An: {(msg as any).contact?.email || '–'} • {formatDistanceToNow(new Date(msg.created_at), { locale: de, addSuffix: true })}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">{sc.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══ Dialoge (Apollo, Apify, Manuell) ═══ */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kontakt manuell hinzufügen</DialogTitle>
            <DialogDescription>Fügen Sie einen neuen Kontakt hinzu.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Vorname</Label><Input value={manualForm.first_name} onChange={e => setManualForm(f => ({ ...f, first_name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Nachname</Label><Input value={manualForm.last_name} onChange={e => setManualForm(f => ({ ...f, last_name: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Firma</Label><Input value={manualForm.company_name} onChange={e => setManualForm(f => ({ ...f, company_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>E-Mail</Label><Input type="email" value={manualForm.email} onChange={e => setManualForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Telefon</Label><Input type="tel" value={manualForm.phone} onChange={e => setManualForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rolle</Label>
                <Select value={manualForm.role_guess} onValueChange={v => setManualForm(f => ({ ...f, role_guess: v }))}>
                  <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Makler">Makler</SelectItem>
                    <SelectItem value="Eigentümer">Eigentümer</SelectItem>
                    <SelectItem value="Verwalter">Verwalter</SelectItem>
                    <SelectItem value="Bauträger">Bauträger</SelectItem>
                    <SelectItem value="Investor">Investor</SelectItem>
                    <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Region</Label><Input value={manualForm.service_area} onChange={e => setManualForm(f => ({ ...f, service_area: e.target.value }))} placeholder="z.B. Berlin" /></div>
            </div>
            <div className="space-y-2"><Label>Website</Label><Input type="url" value={manualForm.website_url} onChange={e => setManualForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Abbrechen</Button>
            <Button onClick={handleManualSubmit} disabled={createContact.isPending}>
              {createContact.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showApolloDialog} onOpenChange={setShowApolloDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-blue-600" />Apollo Kontaktsuche</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Job-Titel</Label><Input value={apolloForm.jobTitles} onChange={e => setApolloForm(f => ({ ...f, jobTitles: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Standorte</Label><Input value={apolloForm.locations} onChange={e => setApolloForm(f => ({ ...f, locations: e.target.value }))} placeholder="Berlin, Hamburg" /></div>
            <div className="space-y-2"><Label>Branchen</Label><Input value={apolloForm.industries} onChange={e => setApolloForm(f => ({ ...f, industries: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Max. Ergebnisse</Label>
              <Select value={String(apolloForm.limit)} onValueChange={v => setApolloForm(f => ({ ...f, limit: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApolloDialog(false)}>Abbrechen</Button>
            <Button onClick={handleApolloSearch} disabled={apolloLoading}>
              {apolloLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Suchen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showApifyDialog} onOpenChange={setShowApifyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-purple-600" />Portal Scraper (Apify)</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Portal-URL</Label><Input value={apifyForm.portalUrl} onChange={e => setApifyForm(f => ({ ...f, portalUrl: e.target.value }))} placeholder="https://immobilienscout24.de/..." /></div>
            <div className="space-y-2">
              <Label>Such-Typ</Label>
              <Select value={apifyForm.searchType} onValueChange={v => setApifyForm(f => ({ ...f, searchType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brokers">Makler-Kontakte</SelectItem>
                  <SelectItem value="listings">Objekt-Listings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max. Ergebnisse</Label>
              <Select value={String(apifyForm.limit)} onValueChange={v => setApifyForm(f => ({ ...f, limit: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApifyDialog(false)}>Abbrechen</Button>
            <Button onClick={handleApifySearch} disabled={apifyLoading}>
              {apifyLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Job starten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

// ── Helper Components ──
function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] px-3 py-2 text-sm">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PdfPreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-gray-400 font-medium w-36 flex-shrink-0 text-xs">{label}</span>
      <span className="text-gray-700 text-xs">{value}</span>
    </div>
  );
}

function formatPriceRange(min?: number | null, max?: number | null): string {
  if (!min && !max) return '–';
  const parts: string[] = [];
  if (min) parts.push(`ab ${(min / 1000000).toFixed(1)}M €`);
  if (max) parts.push(`bis ${(max / 1000000).toFixed(1)}M €`);
  return parts.join(' – ');
}
