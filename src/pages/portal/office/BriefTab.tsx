/**
 * BriefTab Orchestrator (MOD-02) — R-9 Refactored
 * Reduced from 1012 → ~200 lines via Orchestrator + Sub-components Pattern
 */
import { useState, useEffect } from 'react';
import { resolveStorageSignedUrl } from '@/lib/storage-url';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SenderSelector, type SenderOption } from '@/components/shared';
import { generateLetterPdf, type LetterPdfData } from '@/lib/letterPdf';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { isDemoId } from '@/engines/demoData/engine';

import {
  type BriefContact, type BriefProfile, type BriefLandlordContext,
  type ManualRecipientFields, type DeliveryChannel, type LetterFont,
  getEffectiveRecipient,
  BriefRecipientCard, BriefEditorCard, BriefPreviewCard,
  BriefDeliveryCard, BriefDraftsList, BriefPdfDialog,
} from '@/components/office/brief';

export function BriefTab() {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-KONTEN');
  const [searchParams] = useSearchParams();

  // ── State ──
  const [selectedContact, setSelectedContact] = useState<BriefContact | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [manualRecipient, setManualRecipient] = useState(false);
  const [manualFields, setManualFields] = useState<ManualRecipientFields>({ salutation: '', first_name: '', last_name: '', company: '', street: '', postal_code: '', city: '' });
  const [subject, setSubject] = useState('');
  const [prompt, setPrompt] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [channel, setChannel] = useState<DeliveryChannel>('email');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [letterFont, setLetterFont] = useState<LetterFont>('din');
  const [resolvedLogoUrl, setResolvedLogoUrl] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [faxNumber, setFaxNumber] = useState('');
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  // ── Queries ──
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles')
        .select('id, display_name, first_name, last_name, active_tenant_id, street, house_number, postal_code, city, letterhead_logo_url, signature_url')
        .single();
      if (error) throw error;
      return data as BriefProfile;
    },
  });

  const { data: contexts = [] } = useQuery({
    queryKey: ['sender-contexts', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('landlord_contexts')
        .select('id, name, context_type, street, house_number, postal_code, city, legal_form')
        .eq('tenant_id', activeTenantId!).order('is_default', { ascending: false });
      if (error) throw error;
      return data as BriefLandlordContext[];
    },
    enabled: !!activeTenantId,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-letter'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts')
        .select('id, first_name, last_name, email, company, salutation, street, postal_code, city')
        .order('last_name');
      if (error) throw error;
      return data as BriefContact[];
    },
  });

  const { data: recentDrafts = [] } = useQuery({
    queryKey: ['recent-letter-drafts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('letter_drafts')
        .select('id, subject, prompt, body, channel, status, created_at')
        .order('created_at', { ascending: false }).limit(5);
      if (error) throw error;
      return data;
    },
  });

  // ── Sender options ──
  const senderOptions: SenderOption[] = [
    { id: 'private', type: 'PRIVATE', label: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.display_name || 'Privatperson', sublabel: 'Persönlicher Absender', address: profile ? [[profile.street, profile.house_number].filter(Boolean).join(' '), [profile.postal_code, profile.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || undefined : undefined },
    ...(demoEnabled ? contexts : contexts.filter(c => !isDemoId(c.id))).map((ctx): SenderOption => ({ id: ctx.id, type: ctx.context_type as 'PRIVATE' | 'BUSINESS', label: ctx.name, sublabel: ctx.legal_form || (ctx.context_type === 'BUSINESS' ? 'Unternehmen' : 'Privat'), company: ctx.name, address: [[ctx.street, ctx.house_number].filter(Boolean).join(' '), [ctx.postal_code, ctx.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || undefined })),
  ];

  const selectedSender = senderOptions.find(s => s.id === selectedSenderId);

  // ── Effects ──
  useEffect(() => { if (!selectedSenderId && senderOptions.length > 0) setSelectedSenderId(senderOptions[0].id); }, [senderOptions, selectedSenderId]);

  useEffect(() => {
    const resolveLogo = async () => {
      const path = profile?.letterhead_logo_url;
      if (!path) { setResolvedLogoUrl(null); return; }
      if (path.startsWith('http')) { setResolvedLogoUrl(path); return; }
      try { const { data } = await supabase.storage.from('tenant-documents').createSignedUrl(path, 3600); setResolvedLogoUrl(resolveStorageSignedUrl(data?.signedUrl) || null); } catch { setResolvedLogoUrl(null); }
    };
    resolveLogo();
  }, [profile?.letterhead_logo_url]);

  useEffect(() => {
    if (prefillApplied || contacts.length === 0) return;
    const contactId = searchParams.get('contactId');
    const subjectParam = searchParams.get('subject');
    const promptParam = searchParams.get('prompt');
    if (contactId || subjectParam || promptParam) {
      if (subjectParam) setSubject(subjectParam);
      if (promptParam) setPrompt(promptParam);
      if (contactId) { const c = contacts.find(c => c.id === contactId); if (c) setSelectedContact(c); }
      setPrefillApplied(true);
    }
  }, [searchParams, contacts, prefillApplied]);

  // ── Mutations ──
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const { data: profileData } = await supabase.from('profiles').select('active_tenant_id, id').single();
      if (!profileData?.active_tenant_id) throw new Error('Kein aktiver Mandant ausgewählt');
      const { error } = await supabase.from('letter_drafts').insert({ tenant_id: profileData.active_tenant_id, created_by: profileData.id, recipient_contact_id: selectedContact?.id || null, subject, prompt, body: generatedBody, status: 'draft', channel });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Entwurf gespeichert'); queryClient.invalidateQueries({ queryKey: ['recent-letter-drafts'] }); },
    onError: (e) => toast.error('Fehler beim Speichern: ' + e.message),
  });

  // ── Derived ──
  const recipient = getEffectiveRecipient(manualRecipient, manualFields, selectedContact);
  const senderCity = selectedSenderId === 'private' ? profile?.city || undefined : contexts.find(c => c.id === selectedSenderId)?.city || undefined;

  // ── Handlers ──
  const handleGenerate = async () => {
    if (!recipient) { toast.error('Bitte wählen Sie einen Empfänger aus oder geben Sie mindestens einen Nachnamen ein'); return; }
    if (!prompt.trim()) { toast.error('Bitte beschreiben Sie Ihr Anliegen'); return; }
    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('sot-letter-generate', { body: { recipient: { name: `${recipient.first_name} ${recipient.last_name}`, company: recipient.company, salutation: recipient.salutation }, subject, prompt, senderIdentity: selectedSender ? { name: selectedSender.label, company: selectedSender.type === 'BUSINESS' ? selectedSender.company : undefined, address: selectedSender.address } : undefined } });
      if (response.error) throw response.error;
      const bodyText = response.data?.body;
      if (!bodyText) throw new Error('Leere Antwort vom Server');
      setGeneratedBody(bodyText);
      toast.success('Brief wurde generiert');
      setTimeout(() => { document.querySelector('[placeholder="Der generierte Brief erscheint hier..."]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
    } catch (error: any) {
      toast.error('Fehler bei der Generierung: ' + error.message);
      const senderLine = selectedSender?.type === 'BUSINESS' ? `${selectedSender.company}\ni.A. ${[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Ihr Team'}` : [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Ihr Team';
      setGeneratedBody(`Sehr geehrte${recipient.first_name ? 'r' : ''} ${recipient.first_name || ''} ${recipient.last_name},\n\nbezugnehmend auf ${subject || 'Ihr Anliegen'} möchten wir Ihnen folgendes mitteilen:\n\n${prompt}\n\nFür Rückfragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen,\n${senderLine}`);
    } finally { setIsGenerating(false); }
  };

  const buildPdfData = (): LetterPdfData => ({ senderName: selectedSender?.label, senderCompany: selectedSender?.type === 'BUSINESS' ? selectedSender?.company : undefined, senderAddress: selectedSender?.address, senderCity, senderRole: selectedSender?.sublabel !== 'Persönlicher Absender' ? selectedSender?.sublabel : undefined, recipientName: recipient ? `${recipient.first_name} ${recipient.last_name}` : undefined, recipientCompany: recipient?.company || undefined, recipientAddress: recipient ? [recipient.street, [recipient.postal_code, recipient.city].filter(Boolean).join(' ')].filter(Boolean).join('\n') || undefined : undefined, subject, body: generatedBody, font: letterFont, signatureUrl: profile?.signature_url || undefined });

  const handlePdfPreview = async () => { if (!generatedBody) return; const { dataUrl } = await generateLetterPdf(buildPdfData()); setPdfPreviewUrl(dataUrl); setShowPdfPreview(true); };
  const handlePdfDownload = async () => { if (!generatedBody) return; const { blob } = await generateLetterPdf(buildPdfData()); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Brief_${subject?.replace(/[^a-zA-Z0-9äöüÄÖÜ]/g, '_') || 'Entwurf'}_${new Date().toISOString().slice(0, 10)}.pdf`; a.click(); URL.revokeObjectURL(url); toast.success('PDF heruntergeladen'); };

  const handleSend = async () => {
    if (!generatedBody || !recipient) return;
    if (channel === 'fax' && !faxNumber.trim()) { toast.error('Bitte geben Sie eine Faxnummer ein'); return; }
    if (channel === 'email' && !recipient.email) { toast.error('Dieser Empfänger hat keine E-Mail-Adresse'); return; }
    setIsSending(true);
    try {
      const { base64 } = await generateLetterPdf(buildPdfData());
      const pdfFilename = `Brief_${subject?.replace(/[^a-zA-Z0-9]/g, '_') || 'Dokument'}.pdf`;
      const recipientFullName = `${recipient.first_name} ${recipient.last_name}`;
      let mailTo: string, mailSubject: string, mailHtml: string, mailContext: string;
      if (channel === 'email') { mailTo = recipient.email!; mailSubject = subject || 'Schreiben'; mailHtml = `<p>Sehr geehrte${recipient.salutation === 'Frau' ? '' : 'r'} ${recipientFullName},</p><p>anbei erhalten Sie ein Schreiben zum Thema „${subject || 'siehe Anhang'}".</p><p>Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.</p><p>Mit freundlichen Grüßen,<br/>${selectedSender?.label || 'Ihr Ansprechpartner'}</p>`; mailContext = 'letter_email'; }
      else if (channel === 'fax') { mailTo = 'simplefax@systemofatown.com'; mailSubject = faxNumber.trim(); mailHtml = `<p>Fax an: ${faxNumber.trim()}</p><p>Empfänger: ${recipientFullName}</p>`; mailContext = 'letter_fax'; }
      else { mailTo = 'simplebrief@systemofatown.com'; mailSubject = `Brief an ${recipientFullName}`; mailHtml = `<p>Brief-Versand an:</p><p>${recipientFullName}<br/>${recipient.street || ''}<br/>${[recipient.postal_code, recipient.city].filter(Boolean).join(' ')}</p>`; mailContext = 'letter_post'; }
      const { error } = await supabase.functions.invoke('sot-system-mail-send', { body: { to: mailTo, subject: mailSubject, html: mailHtml, context: mailContext, attachments: [{ filename: pdfFilename, content: base64 }] } });
      if (error) throw error;
      const { data: profileData } = await supabase.from('profiles').select('active_tenant_id, id').single();
      if (profileData?.active_tenant_id) { await supabase.from('letter_drafts').insert({ tenant_id: profileData.active_tenant_id, created_by: profileData.id, recipient_contact_id: recipient.id || null, subject, prompt, body: generatedBody, status: 'sent', channel }); queryClient.invalidateQueries({ queryKey: ['recent-letter-drafts'] }); }
      toast.success(`Brief per ${channel === 'email' ? 'E-Mail' : channel === 'fax' ? 'Fax' : 'Post'} versendet`);
    } catch (error: any) { toast.error('Versandfehler: ' + error.message); } finally { setIsSending(false); }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !profile?.id) return;
    setIsUploadingSignature(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${profile.active_tenant_id}/MOD_02/signatures/${profile.id}/signature.${ext}`;
      const { error: uploadError } = await supabase.storage.from('tenant-documents').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: signedData } = await supabase.storage.from('tenant-documents').createSignedUrl(path, 60 * 60 * 24 * 365);
      const signatureUrl = signedData?.signedUrl || null;
      const { error: updateError } = await supabase.from('profiles').update({ signature_url: signatureUrl }).eq('id', profile.id);
      if (updateError) throw updateError;
      queryClient.invalidateQueries({ queryKey: ['user-profile'] }); toast.success('Unterschrift hochgeladen');
    } catch (err: any) { toast.error('Upload fehlgeschlagen: ' + err.message); } finally { setIsUploadingSignature(false); e.target.value = ''; }
  };

  const handleRemoveSignature = async () => {
    if (!profile?.id) return;
    const { error } = await supabase.from('profiles').update({ signature_url: null }).eq('id', profile.id);
    if (error) { toast.error('Fehler: ' + error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['user-profile'] }); toast.success('Unterschrift entfernt');
  };

  const canGenerate = !!(selectedContact || (manualRecipient && manualFields.last_name.trim()));

  // ── Render ──
  return (
    <PageShell>
      <ModulePageHeader title="Briefgenerator" description="KI-gestützte Briefe erstellen und versenden" />
      <div className="space-y-6">
        {/* Step 0: Sender */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-3">
            <Label className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">0</Badge>
              Absender
            </Label>
            <SenderSelector options={senderOptions} selected={selectedSenderId} onSelect={setSelectedSenderId} />
          </CardContent>
        </Card>

        <BriefRecipientCard contacts={contacts} selectedContact={selectedContact} setSelectedContact={setSelectedContact} contactOpen={contactOpen} setContactOpen={setContactOpen} manualRecipient={manualRecipient} setManualRecipient={setManualRecipient} manualFields={manualFields} setManualFields={setManualFields} />
        <BriefEditorCard subject={subject} setSubject={setSubject} prompt={prompt} setPrompt={setPrompt} generatedBody={generatedBody} setGeneratedBody={setGeneratedBody} isGenerating={isGenerating} onGenerate={handleGenerate} canGenerate={canGenerate} />
        <BriefPreviewCard selectedSender={selectedSender} selectedSenderId={selectedSenderId} resolvedLogoUrl={resolvedLogoUrl} recipient={recipient} subject={subject} generatedBody={generatedBody} letterFont={letterFont} setLetterFont={setLetterFont} profile={profile} senderCity={senderCity} onPdfPreview={handlePdfPreview} onPdfDownload={handlePdfDownload} onSignatureUpload={handleSignatureUpload} onRemoveSignature={handleRemoveSignature} isUploadingSignature={isUploadingSignature} />
        <BriefDeliveryCard channel={channel} setChannel={setChannel} faxNumber={faxNumber} setFaxNumber={setFaxNumber} recipient={recipient} generatedBody={generatedBody} isSending={isSending} isSaving={saveDraftMutation.isPending} onSend={handleSend} onSave={() => saveDraftMutation.mutate()} />
        <BriefDraftsList drafts={recentDrafts} onLoadDraft={(d) => { if (d.subject) setSubject(d.subject); if (d.body) setGeneratedBody(d.body); if (d.channel) setChannel(d.channel); if (d.prompt) setPrompt(d.prompt); }} />
      </div>
      <BriefPdfDialog open={showPdfPreview} onOpenChange={setShowPdfPreview} pdfPreviewUrl={pdfPreviewUrl} onDownload={handlePdfDownload} />
    </PageShell>
  );
}
